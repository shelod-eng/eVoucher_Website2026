import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateRevenue } from '@/lib/billing/revenue-calculator';
import { computeRedemptionBreakdown } from '@/lib/billing/redemption-breakdown';

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

function isDuplicateKeyError(error: any) {
  const message = String(error?.message ?? '').toLowerCase();
  return message.includes('duplicate key value') || message.includes('unique constraint');
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
      // Voucher liability reduced as it is redeemed; merchant payable increases.
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
      // Remaining portion captured as platform benefit/fee (model can be refined later).
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
      // Keep TRD v2.0 breakdown available for future alignment.
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
  const platformRevenue = round2(totalDiscountAmount * (Number(input.metadata?.platformRevenuePct ?? 0.012)));
  const consumerBenefit = round2(totalDiscountAmount - platformRevenue);

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
          merchant_payout_amount: 0, // No immediate payout on purchase
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
      // Voucher liability recorded when customer receives it.
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
      // Consumer benefit captured.
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
      // Platform revenue captured.
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

  return {
    event,
    breakdown: {
      consumerPrice,
      faceValue,
      totalDiscountAmount,
      consumerBenefit,
      platformRevenue,
    },
  };
}
