/**
 * Platform Event Publisher — WS1
 *
 * Single entry point for all financial events. Called after every completed
 * action. Writes to platform_events table which Supabase Realtime broadcasts
 * to the Billing Engine portal instantly.
 *
 * Rules:
 * - Never throws — failures are logged but never block the user flow
 * - Always idempotent — duplicate event_id is silently ignored
 * - Amount always in ZAR, always 2 decimal places
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';

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
 * Publish a platform event. Never throws — safe to fire-and-forget.
 * Returns the inserted row id on success, null on failure.
 */
export async function publishPlatformEvent(input: PublishEventInput): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const eventId = randomUUID();
    const occurredAt = input.occurredAt ?? new Date().toISOString();

    const { data, error } = await admin
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
        status: 'received',
        occurred_at: occurredAt,
      })
      .select('id')
      .single();

    if (error) {
      // Duplicate event_id — already published, not an error
      if (
        error.message?.includes('duplicate key') ||
        error.message?.includes('unique constraint')
      ) {
        return null;
      }
      console.error('[PlatformEvents] publish failed:', error.message);
      return null;
    }

    return data?.id ?? null;
  } catch (err: any) {
    console.error('[PlatformEvents] unexpected error:', err?.message);
    return null;
  }
}
