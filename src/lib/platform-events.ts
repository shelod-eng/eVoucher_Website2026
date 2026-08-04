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
import { randomUUID, createHmac } from 'crypto';
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

// POPIA compliance: List of keys containing PII that must be redacted
const PII_KEYS = new Set([
  'email', 'user_email', 'customer_email',
  'phone', 'phone_number', 'contact_number', 'cell_number',
  'name', 'full_name', 'contact_name', 'first_name', 'last_name',
  'account_number', 'bank_account', 'account_number_enc',
  'address', 'physical_address', 'street_address'
]);

/**
 * Scrub PII from the event payload recursively to comply with POPIA.
 */
export function scrubPII(val: any): any {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) {
    return val.map(scrubPII);
  }
  if (typeof val === 'object') {
    const clean: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      const lowerKey = key.toLowerCase();
      if (
        PII_KEYS.has(lowerKey) || 
        lowerKey.includes('email') || 
        lowerKey.includes('phone') || 
        lowerKey.includes('address') || 
        lowerKey.includes('account')
      ) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = scrubPII(val[key]);
      }
    }
    return clean;
  }
  return val;
}

/**
 * HMAC-SHA256 of (event_id + occurred_at + amount), signed with shared secret
 */
export function generateHMACSignature(eventId: string, occurredAt: string, amount: number | null): string {
  const secret = process.env.BILLING_ENCRYPTION_KEY ?? 'dev-billing-key';
  const data = `${eventId}:${occurredAt}:${amount ?? 0}`;
  return createHmac('sha256', secret).update(data).digest('hex');
}

function base64UrlEncode(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data) : data;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generates signed service JWT for service-to-service calls
 */
export function generateServiceJWT(): string {
  const secret = process.env.BILLING_ENCRYPTION_KEY ?? 'dev-billing-key';
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 5; // 5 min expiry
  const payload = base64UrlEncode(JSON.stringify({ iss: 'ws1', iat, exp }));
  const signature = base64UrlEncode(
    createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest()
  );
  return `${header}.${payload}.${signature}`;
}

export function validateServiceJWT(token: string): boolean {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return false;

    const secret = process.env.BILLING_ENCRYPTION_KEY ?? 'dev-billing-key';
    const computedSignature = base64UrlEncode(
      createHmac('sha256', secret)
        .update(`${headerB64}.${payloadB64}`)
        .digest()
    );

    if (computedSignature !== signatureB64) return false;

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64').toString('utf8')
    );
    
    if (payload.iss !== 'ws1') return false;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false;

    return true;
  } catch (err) {
    return false;
  }
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
    const amountVal = input.amount != null ? round2(input.amount) : null;
    const signature = generateHMACSignature(eventId, occurredAt, amountVal);

    // Scrub PII from payload to ensure POPIA compliance
    const rawPayload = input.payload ?? {};
    const cleanPayload = scrubPII(rawPayload);

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
        amount: amountVal,
        face_value: input.faceValue != null ? round2(input.faceValue) : null,
        discount_pct: input.discountPct ?? null,
        payload: {
          ...cleanPayload,
          signature,
        },
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

    // ── 2. Write to Outbox table for guaranteed delivery ─────────────────────
    const { error: outboxError } = await admin
      .from('platform_event_outbox')
      .insert({
        event_id: eventId,
        payload: {
          event_id: eventId,
          event_type: input.eventType,
          source_system: 'ws1',
          correlation_id: input.correlationId ?? input.transactionRef ?? null,
          merchant_id: input.merchantId ?? null,
          customer_id: input.customerId ?? null,
          voucher_id: input.voucherId ?? null,
          transaction_ref: input.transactionRef ?? null,
          amount: amountVal,
          face_value: input.faceValue != null ? round2(input.faceValue) : null,
          discount_pct: input.discountPct ?? null,
          occurred_at: occurredAt,
          signature,
          data: cleanPayload
        },
        status: 'pending'
      });

    if (outboxError) {
      console.error('[PlatformEvents] outbox insert failed:', outboxError.message);
    }

    // ── 3. Route to billing ledger handler immediately ───────────────────────
    try {
      let isProcessed = false;
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
            ...cleanPayload,
          },
        });
        isProcessed = true;
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
            ...cleanPayload,
          },
        });
        isProcessed = true;
      }

      if (isProcessed) {
        // Mark processed in event log
        await admin
          .from('platform_events')
          .update({ status: 'processed', processed_at: new Date().toISOString() })
          .eq('id', platformEventRowId);

        // Mark sent in outbox
        await admin
          .from('platform_event_outbox')
          .update({ status: 'sent', updated_at: new Date().toISOString() })
          .eq('event_id', eventId);
      }

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

