/**
 * Platform Event Publisher — WS1
 *
 * Single entry point for all financial events. Called after every completed
 * action. Writes to platform_events AND immediately processes into
 * billing_events + billing_ledger_entries in the same server-side call.
 *
 * Rules:
 * - Never throws — failures are logged but never block the user flow
 * - Always idempotent — duplicate event_id is silently ignored
 * - Amount always in ZAR, always 2 decimal places
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';
import {
  recordVoucherPurchaseBillingEvent,
  recordVoucherRedemptionBillingEvent,
} from '@/server/services/billing/billing-events';
import { DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';

export type PlatformEventType =
  | 'CONSUMER_REGISTERED'
  | 'CONSUMER_VERIFIED'
  | 'MERCHANT_REGISTERED'
  | 'MERCHANT_APPROVED'
  | 'MERCHANT_SUSPENDED'
  | 'VOUCHER_CREATED'
  | 'VOUCHER_PURCHASED'
  | 'VOUCHER_REDEEMED'
  | 'VOUCHER_CANCELLED'
  | 'VOUCHER_EXPIRED'
  | 'PAYMENT_AUTHORISED'
  | 'PAYMENT_CAPTURED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'WALLET_CREDITED'
  | 'WALLET_DEBITED'
  | 'CASHBACK_CREDITED'
  | 'SETTLEMENT_QUEUED'
  | 'SETTLEMENT_SUBMITTED'
  | 'SETTLEMENT_CONFIRMED'
  | 'SETTLEMENT_FAILED'
  | 'INVOICE_GENERATED';

export interface PublishEventInput {
  eventType: PlatformEventType;
  correlationId?: string;
  merchantId?: string;
  customerId?: string;
  voucherId?: string;
  transactionRef?: string;
  amount?: number;
  faceValue?: number;
  discountPct?: number;
  occurredAt?: string;
  payload?: Record<string, unknown>;
}

function round2(v: number) {
  return Number(Number(v).toFixed(2));
}

/**
 * Publish a platform event AND immediately process it into the billing ledger.
 * Never throws — safe to fire-and-forget.
 * Returns the inserted platform_events row id on success, null on failure.
 */
export async function publishPlatformEvent(input: PublishEventInput): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const eventId = randomUUID();
    const occurredAt = input.occurredAt ?? new Date().toISOString();

    // ── 1. Write immutable event log ─────────────────────────────────────────
    const { data, error: insertError } = await admin
      .from('platform_events')
      .insert({
        event_id: eventId,
        event_type: input.eventType,
        source_system: 'ws1',
        correlation_id: input.correlationId ?? input.transactionRef ?? null,
        merchant_id: input.merchantId ?? null,
        customer_id: input.customerId ?? null,
        voucher_id: input.voucherId ?? null,
        transaction_ref: input.transactionRef ?? null,
        amount: input.amount != null ? round2(input.amount) : null,
        face_value: input.faceValue != null ? round2(input.faceValue) : null,
        discount_pct: input.discountPct ?? null,
        payload: input.payload ?? {},
        status: 'processing',
        occurred_at: occurredAt,
      })
      .select('id')
      .single();

    if (insertError) {
      if (
        insertError.message?.includes('duplicate key') ||
        insertError.message?.includes('unique constraint')
      ) {
        return null; // already published — idempotent
      }
      console.error('[PlatformEvents] insert failed:', insertError.message);
      return null;
    }

    const platformEventRowId = data?.id ?? null;
    const eventKey = input.transactionRef ?? input.correlationId ?? eventId;
    const discountPct = input.discountPct ?? DEFAULT_TOTAL_DISCOUNT_PCT;

    // ── 2. Route to billing ledger handler ───────────────────────────────────
    try {
      if (
        input.eventType === 'VOUCHER_PURCHASED' &&
        input.merchantId &&
        input.customerId &&
        (input.amount ?? 0) > 0
      ) {
        await recordVoucherPurchaseBillingEvent(admin, {
          eventKey,
          merchantId: input.merchantId,
          customerId: input.customerId,
          voucherId: input.voucherId ?? null,
          consumerPrice: round2(input.amount ?? 0),
          faceValue: round2(input.faceValue ?? input.amount ?? 0),
          totalDiscountPct: discountPct,
          occurredAt,
          metadata: {
            source: 'platform_event_publisher',
            eventId,
            ...(input.payload ?? {}),
          },
        });
      } else if (
        input.eventType === 'VOUCHER_REDEEMED' &&
        input.merchantId &&
        (input.amount ?? 0) > 0
      ) {
        await recordVoucherRedemptionBillingEvent(admin, {
          eventKey,
          merchantId: input.merchantId,
          customerId: input.customerId ?? null,
          voucherId: input.voucherId ?? null,
          grossAmount: round2(input.amount ?? 0),
          totalDiscountPct: discountPct,
          occurredAt,
          metadata: {
            source: 'platform_event_publisher',
            eventId,
            ...(input.payload ?? {}),
          },
        });
      }

      // Mark processed
      await admin
        .from('platform_events')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', platformEventRowId);

    } catch (billingErr: any) {
      // Billing failure must not block the user — log and mark failed
      console.error('[PlatformEvents] billing handler failed:', billingErr?.message);
      await admin
        .from('platform_events')
        .update({ status: 'failed', error_message: String(billingErr?.message ?? 'unknown') })
        .eq('id', platformEventRowId);
    }

    return platformEventRowId;
  } catch (err: any) {
    console.error('[PlatformEvents] unexpected error:', err?.message);
    return null;
  }
}
