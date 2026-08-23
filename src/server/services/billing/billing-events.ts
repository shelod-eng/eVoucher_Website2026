import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateRevenue } from '@/lib/billing/revenue-calculator';
import { computeRedemptionBreakdown } from '@/lib/billing/redemption-breakdown';
import { writeAuditEvent } from '@/server/utils/audit';

export type BillingEventType = 'voucher_redemption' | 'payment_transaction' | 'manual_adjustment';

export type RecordVoucherRedemptionBillingEventInput = {
  eventKey: string;
  merchantId: string;
  customerId?: string | null;
  voucherId?: string | null;
  grossAmount: number;
  totalDiscountPct: number;
  occurredAt: string; // ISO
  metadata?: Record<string, unknown>;
};

export type RecordVoucherPurchaseBillingEventInput = {
  eventKey: string;
  merchantId: string;
  customerId: string;
  voucherId?: string | null;
  consumerPrice: number;
  faceValue: number;
  totalDiscountPct: number;
  occurredAt: string; // ISO
  metadata?: Record<string, unknown>;
};

function round2(value: number) {
  return Number(value.toFixed(2));
}

function safeNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function isoDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function isDuplicateKeyError(error: any) {
  const message = String(error?.message ?? '').toLowerCase();
  return message.includes('duplicate key value') || message.includes('unique constraint');
}

/**
 * True when PostgREST rejected the payload because a column does not exist on
 * the deployed table (PGRST204 / "column ... does not exist"). Used to retry
 * inserts with a reduced payload when the live schema lags behind the code.
 */
function isMissingColumnError(error: any, column: string) {
  // Case-insensitive: PostgREST returns "Could not find the 'x' column ..."
  // with a leading capital.
  const message = String(error?.message ?? '').toLowerCase();
  return (
    message.includes(`column "${column}" does not exist`) ||
    message.includes(`column ${column} does not exist`) ||
    message.includes(`could not find the '${column}' column`)
  );
}

/**
 * Records an idempotent billing event + posts double-entry ledger entries.
 * This is called from the voucher redemption flow.
 */
export async function recordVoucherRedemptionBillingEvent(
  admin: SupabaseClient,
  input: RecordVoucherRedemptionBillingEventInput
) {
  const eventKey = String(input.eventKey ?? '').trim();
  if (!eventKey) throw new Error('eventKey is required.');

  const merchantId = String(input.merchantId ?? '').trim();
  if (!merchantId) throw new Error('merchantId is required.');

  const breakdown = computeRedemptionBreakdown({
    grossAmount: safeNumber(input.grossAmount),
    totalDiscountPct: safeNumber(input.totalDiscountPct),
  });

  // First: idempotent event record.
  const { data: existing } = await admin
    .from('billing_events')
    .select('*')
    .eq('event_key', eventKey)
    .maybeSingle();

  const event =
    existing ??
    (await (async () => {
      const { data, error } = await admin
        .from('billing_events')
        .insert({
          event_key: eventKey,
          event_type: 'voucher_redemption',
          merchant_id: merchantId,
          customer_id: input.customerId ?? null,
          voucher_id: input.voucherId ?? null,
          gross_amount: breakdown.grossAmount,
          merchant_payout_amount: breakdown.merchantPayoutAmount,
          total_discount_pct: breakdown.totalDiscountPct,
          total_discount_amount: breakdown.totalDiscountAmount,
          occurred_at: input.occurredAt,
          metadata: {
            ...(input.metadata ?? {}),
            splitModel: '70_30',
            consumerBenefitAmount: breakdown.consumerBenefitAmount,
            platformBenefitAmount: breakdown.platformBenefitAmount,
          },
        })
        .select('*')
        .single();

      if (error) {
        if (isDuplicateKeyError(error)) {
          const { data: dupe } = await admin
            .from('billing_events')
            .select('*')
            .eq('event_key', eventKey)
            .maybeSingle();
          if (dupe) return dupe;
        }
        throw error;
      }
      return data;
    })());

  // Second: ledger posting (idempotent by source_id).
  const { data: existingLedger } = await admin
    .from('billing_ledger_entries')
    .select('id')
    .eq('source_id', eventKey)
    .limit(1);

  if (!existingLedger || existingLedger.length === 0) {
    const entries = [
      {
        entry_group_id: event.id,
        source_type: 'transaction',
        source_id: eventKey,
        merchant_id: merchantId,
        customer_id: input.customerId ?? null,
        debit_account: 'liability:voucher_outstanding',
        credit_account: 'liability:merchant_payable',
        amount: breakdown.merchantPayoutAmount,
        currency: 'ZAR',
        metadata: {
          eventType: 'voucher_redemption',
          kind: 'merchant_payout',
        },
      },
      ...(breakdown.platformBenefitAmount > 0
        ? [
            {
              entry_group_id: event.id,
              source_type: 'transaction',
              source_id: eventKey,
              merchant_id: merchantId,
              customer_id: input.customerId ?? null,
              debit_account: 'liability:voucher_outstanding',
              credit_account: 'revenue:platform_benefit',
              amount: breakdown.platformBenefitAmount,
              currency: 'ZAR',
              metadata: {
                eventType: 'voucher_redemption',
                kind: 'platform_benefit',
              },
            },
          ]
        : []),
      ...(breakdown.consumerBenefitAmount > 0
        ? [
            {
              entry_group_id: event.id,
              source_type: 'transaction',
              source_id: eventKey,
              merchant_id: merchantId,
              customer_id: input.customerId ?? null,
              debit_account: 'liability:voucher_outstanding',
              credit_account: 'contra:consumer_benefit',
              amount: breakdown.consumerBenefitAmount,
              currency: 'ZAR',
              metadata: {
                eventType: 'voucher_redemption',
                kind: 'consumer_benefit',
              },
            },
          ]
        : []),
    ].filter((row) => Number(row.amount) > 0);

    const { error: ledgerError } = await admin.from('billing_ledger_entries').insert(entries);
    if (ledgerError) throw ledgerError;
  }

  return {
    event,
    breakdown: {
      grossAmount: breakdown.grossAmount,
      merchantPayoutAmount: breakdown.merchantPayoutAmount,
      totalDiscountAmount: breakdown.totalDiscountAmount,
      consumerBenefitAmount: breakdown.consumerBenefitAmount,
      platformBenefitAmount: breakdown.platformBenefitAmount,
      trdV2: (() => {
        try {
          return calculateRevenue(breakdown.grossAmount);
        } catch {
          return null;
        }
      })(),
    },
  };
}

/**
 * Records an idempotent billing event for voucher purchases + posts ledger entries.
 * When a voucher is purchased, a liability is created (voucher_outstanding).
 * Also creates merchant_payouts, billing_settlements, billing_invoices, and audit_events.
 */
export async function recordVoucherPurchaseBillingEvent(
  admin: SupabaseClient,
  input: RecordVoucherPurchaseBillingEventInput
) {
  const eventKey = String(input.eventKey ?? '').trim();
  if (!eventKey) throw new Error('eventKey is required.');

  const merchantId = String(input.merchantId ?? '').trim();
  if (!merchantId) throw new Error('merchantId is required.');

  const customerId = String(input.customerId ?? '').trim();
  if (!customerId) throw new Error('customerId is required.');

  const consumerPrice = safeNumber(input.consumerPrice);
  const faceValue = safeNumber(input.faceValue);
  const totalDiscountPct = safeNumber(input.totalDiscountPct);
  const totalDiscountAmount = round2(faceValue - consumerPrice);

  // Use the canonical TRD v2.0 revenue model for consumer benefit and platform
  // revenue so merchant_payouts, billing_settlements, billing_invoices, and the
  // dashboard all agree with the ledger contra entries.
  //   - consumerBenefit = 2.8% of face value
  //   - platformRevenue = 1.2% of face value
  let trdRevenue: ReturnType<typeof calculateRevenue> | null = null;
  try {
    trdRevenue = calculateRevenue(faceValue);
  } catch {
    trdRevenue = null;
  }
  const platformRevenue = trdRevenue?.platformRevenue ?? round2(faceValue * 0.012);
  const consumerBenefit = trdRevenue?.consumerBenefit ?? round2(faceValue * 0.028);

  // First: idempotent event record.
  const { data: existing } = await admin
    .from('billing_events')
    .select('*')
    .eq('event_key', eventKey)
    .maybeSingle();

  const event =
    existing ??
    (await (async () => {
      const { data, error } = await admin
        .from('billing_events')
        .insert({
          event_key: eventKey,
          event_type: 'payment_transaction',
          merchant_id: merchantId,
          customer_id: customerId,
          voucher_id: input.voucherId ?? null,
          gross_amount: faceValue,
          merchant_payout_amount: 0,
          total_discount_pct: totalDiscountPct,
          total_discount_amount: totalDiscountAmount,
          occurred_at: input.occurredAt,
          metadata: {
            ...(input.metadata ?? {}),
            transactionType: 'purchase',
            consumerPrice,
            faceValue,
            consumerBenefit,
            platformRevenue,
          },
        })
        .select('*')
        .single();

      if (error) {
        if (isDuplicateKeyError(error)) {
          const { data: dupe } = await admin
            .from('billing_events')
            .select('*')
            .eq('event_key', eventKey)
            .maybeSingle();
          if (dupe) return dupe;
        }
        throw error;
      }
      return data;
    })());

  // Second: ledger posting (idempotent by source_id).
  const { data: existingLedger } = await admin
    .from('billing_ledger_entries')
    .select('id')
    .eq('source_id', eventKey)
    .limit(1);

  if (!existingLedger || existingLedger.length === 0) {
    const entries = [
      {
        entry_group_id: event.id,
        source_type: 'transaction',
        source_id: eventKey,
        merchant_id: merchantId,
        customer_id: customerId,
        debit_account: 'asset:cash',
        credit_account: 'liability:voucher_outstanding',
        amount: faceValue,
        currency: 'ZAR',
        metadata: {
          eventType: 'payment_transaction',
          kind: 'voucher_liability',
        },
      },
      ...(consumerBenefit > 0
        ? [
            {
              entry_group_id: event.id,
              source_type: 'transaction',
              source_id: eventKey,
              merchant_id: merchantId,
              customer_id: customerId,
              debit_account: 'contra:consumer_benefit',
              credit_account: 'asset:cash',
              amount: consumerBenefit,
              currency: 'ZAR',
              metadata: {
                eventType: 'payment_transaction',
                kind: 'consumer_benefit',
              },
            },
          ]
        : []),
      ...(platformRevenue > 0
        ? [
            {
              entry_group_id: event.id,
              source_type: 'transaction',
              source_id: eventKey,
              merchant_id: merchantId,
              customer_id: customerId,
              debit_account: 'revenue:platform_benefit',
              credit_account: 'asset:cash',
              amount: platformRevenue,
              currency: 'ZAR',
              metadata: {
                eventType: 'payment_transaction',
                kind: 'platform_revenue',
              },
            },
          ]
        : []),
    ].filter((row) => Number(row.amount) > 0);

    const { error: ledgerError } = await admin.from('billing_ledger_entries').insert(entries);
    if (ledgerError) throw ledgerError;
  }

  // ── 3. Create merchant_payouts record (idempotent by source_id) ────────────
  const merchantGrossPayout = trdRevenue?.merchantGrossPayout ?? round2(faceValue * 0.96);
  const bankFee = trdRevenue?.bankFee ?? round2(merchantGrossPayout * 0.005);
  const merchantNetPayout = trdRevenue?.merchantNetPayout ?? round2(merchantGrossPayout - bankFee);

  const { data: existingPayout } = await admin
    .from('merchant_payouts')
    .select('id')
    .eq('source_id', eventKey)
    .maybeSingle();

  if (!existingPayout) {
    try {
      await admin.from('merchant_payouts').insert({
        merchant_id: merchantId,
        amount: merchantNetPayout,
        gross_amount: merchantGrossPayout,
        bank_fee_amount: bankFee,
        consumer_benefit_amount: consumerBenefit,
        platform_revenue_amount: platformRevenue,
        status: 'pending',
        source_id: eventKey,
        source_type: 'payment_transaction',
        settlement_target: process.env.SETTLEMENT_TARGET ?? 'sponsor_bank',
        created_at: input.occurredAt,
      });
    } catch (payoutError: any) {
      if (!isDuplicateKeyError(payoutError)) {
        console.error('[BillingEvents] merchant_payouts insert failed:', payoutError?.message);
      }
    }
  }

  // ── 4. Create billing_settlements record (idempotent by source_id) ─────────
  const { data: existingSettlement } = await admin
    .from('billing_settlements')
    .select('id')
    .eq('source_id', eventKey)
    .maybeSingle();

  if (!existingSettlement) {
    try {
      await admin.from('billing_settlements').insert({
        merchant_id: merchantId,
        amount: merchantNetPayout,
        gross_amount: merchantGrossPayout,
        bank_fee_amount: bankFee,
        consumer_benefit_amount: consumerBenefit,
        platform_revenue_amount: platformRevenue,
        settlement_target: process.env.SETTLEMENT_TARGET ?? 'sponsor_bank',
        status: 'pending',
        source_id: eventKey,
        source_type: 'payment_transaction',
        created_at: input.occurredAt,
      });
    } catch (settlementError: any) {
      if (!isDuplicateKeyError(settlementError)) {
        console.error(
          '[BillingEvents] billing_settlements insert failed:',
          settlementError?.message
        );
      }
    }
  }

  // ── 5. Create billing_invoices record (idempotent by source_id) ────────────
  const { data: existingInvoice } = await admin
    .from('billing_invoices')
    .select('id')
    .eq('source_id', eventKey)
    .maybeSingle();

  if (!existingInvoice) {
    // Per-transaction spine invoice. The full payload includes customer_id;
    // if the deployed table predates the customer_id migration we retry
    // without it instead of silently losing the invoice record.
    const invoicePayload = {
      merchant_id: merchantId,
      customer_id: customerId,
      invoice_number: `INV-${eventKey.slice(0, 12).toUpperCase()}`,
      period_start: isoDate(input.occurredAt),
      period_end: isoDate(input.occurredAt),
      face_value: faceValue,
      consumer_price: consumerPrice,
      total_face_value: faceValue,
      total_consumer_paid: consumerPrice,
      total_discount_amount: totalDiscountAmount,
      merchant_payout_amount: merchantGrossPayout,
      net_payable_to_merchant: merchantNetPayout,
      bank_fee_amount: bankFee,
      consumer_benefit_amount: consumerBenefit,
      platform_revenue_amount: platformRevenue,
      status: 'approved',
      source_id: eventKey,
      source_type: 'payment_transaction',
      created_at: input.occurredAt,
    };

    try {
      let { error: invoiceInsertError } = await admin
        .from('billing_invoices')
        .insert(invoicePayload);

      if (invoiceInsertError && isMissingColumnError(invoiceInsertError, 'customer_id')) {
        const { customer_id: _omittedCustomerId, ...legacyInvoicePayload } = invoicePayload as any;
        ({ error: invoiceInsertError } = await admin
          .from('billing_invoices')
          .insert(legacyInvoicePayload));
      }

      if (invoiceInsertError && !isDuplicateKeyError(invoiceInsertError)) {
        console.error(
          '[BillingEvents] billing_invoices insert failed:',
          invoiceInsertError?.message
        );
      }
    } catch (invoiceError: any) {
      if (!isDuplicateKeyError(invoiceError)) {
        console.error('[BillingEvents] billing_invoices insert failed:', invoiceError?.message);
      }
    }
  }

  // ── 6. Create audit_events record ─────────────────────────────────────────
  try {
    await writeAuditEvent(admin, {
      actorId: customerId,
      actorRole: 'customer',
      entityType: 'billing_event',
      entityId: event.id,
      action: 'billing_event_created',
      metadata: {
        eventKey,
        eventType: 'payment_transaction',
        merchantId,
        faceValue,
        consumerPrice,
        merchantNetPayout,
        platformRevenue,
        consumerBenefit,
        bankFee,
        source: 'billing_event_recorder',
      },
      requestId: eventKey,
    });
  } catch (auditError: any) {
    console.error('[BillingEvents] audit_events insert failed:', auditError?.message);
  }

  return {
    event,
    breakdown: {
      consumerPrice,
      faceValue,
      totalDiscountAmount,
      consumerBenefit,
      platformRevenue,
      merchantGrossPayout,
      bankFee,
      merchantNetPayout,
    },
  };
}
