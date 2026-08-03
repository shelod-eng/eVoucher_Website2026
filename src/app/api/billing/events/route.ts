import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import { recordVoucherPurchaseBillingEvent, recordVoucherRedemptionBillingEvent } from '@/server/services/billing/billing-events';
import { DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, X-Portal-Passcode, X-Portal-User, X-Portal-Role, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/billing/events
 * Lists billing_events for the Billing Engine portal dashboard.
 */
export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });

  try {
    const { searchParams } = new URL(request.url);
    const merchantId = String(searchParams.get('merchantId') ?? '').trim();
    const limit = Math.min(1000, Math.max(1, Number(searchParams.get('limit') ?? 100)));

    const admin = createAdminClient();
    let query = admin
      .from('billing_events')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (merchantId) query = query.eq('merchant_id', merchantId);

    const { data, error } = await query;
    if (error) throw error;

    return jsonNoStore({ success: true, data: data ?? [] }, { headers: CORS_HEADERS });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to list billing events.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /api/billing/events
 * Inbound event gateway — receives platform events from WS1 or external systems.
 * Validates, deduplicates on event_id, routes to correct billing handler,
 * posts double-entry ledger, queues BankServ settlement.
 * Returns 202 Accepted (new) or 200 Duplicate.
 */
export async function POST(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ error: 'Invalid JSON body.' }, { status: 400, headers: CORS_HEADERS });
  }

  const eventId = String(body?.event_id ?? body?.eventId ?? '').trim();
  const eventType = String(body?.event_type ?? body?.eventType ?? '').trim().toUpperCase();
  const merchantId = String(body?.merchant_id ?? body?.merchantId ?? '').trim();
  const customerId = String(body?.customer_id ?? body?.customerId ?? '').trim();
  const voucherId = String(body?.voucher_id ?? body?.voucherId ?? '').trim() || null;
  const amount = Number(body?.amount ?? 0);
  const faceValue = Number(body?.face_value ?? body?.faceValue ?? amount);
  const discountPct = Number(body?.discount_pct ?? body?.discountPct ?? DEFAULT_TOTAL_DISCOUNT_PCT);
  const occurredAt = String(body?.occurred_at ?? body?.occurredAt ?? new Date().toISOString());
  const correlationId = String(body?.correlation_id ?? body?.correlationId ?? eventId);

  if (!eventId) return jsonNoStore({ error: 'event_id is required.' }, { status: 400, headers: CORS_HEADERS });
  if (!eventType) return jsonNoStore({ error: 'event_type is required.' }, { status: 400, headers: CORS_HEADERS });

  const admin = createAdminClient();

  // ── Idempotency check on platform_events ──────────────────────────────────
  const { data: existing } = await admin
    .from('platform_events')
    .select('id, status')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing) {
    return jsonNoStore(
      { received: true, duplicate: true, event_id: eventId },
      { status: 200, headers: CORS_HEADERS }
    );
  }

  // ── Write to platform_events (immutable log) ──────────────────────────────
  await admin.from('platform_events').insert({
    event_id: eventId,
    event_type: eventType,
    source_system: String(body?.source_system ?? 'ws1'),
    correlation_id: correlationId,
    merchant_id: merchantId || null,
    customer_id: customerId || null,
    voucher_id: voucherId,
    transaction_ref: String(body?.transaction_ref ?? body?.transactionRef ?? correlationId),
    amount: amount || null,
    face_value: faceValue || null,
    discount_pct: discountPct || null,
    payload: body?.data ?? body?.payload ?? {},
    status: 'processing',
    occurred_at: occurredAt,
  });

  // ── Route to billing handler ──────────────────────────────────────────────
  try {
    if (eventType === 'VOUCHER_PURCHASED' && merchantId && customerId) {
      await recordVoucherPurchaseBillingEvent(admin, {
        eventKey: eventId,
        merchantId,
        customerId,
        voucherId: voucherId || undefined,
        consumerPrice: amount,
        faceValue,
        totalDiscountPct: discountPct,
        occurredAt,
        metadata: { source: 'event_gateway', correlationId, ...(body?.data ?? {}) },
      });
    } else if (eventType === 'VOUCHER_REDEEMED' && merchantId) {
      await recordVoucherRedemptionBillingEvent(admin, {
        eventKey: eventId,
        merchantId,
        customerId: customerId || null,
        voucherId: voucherId || null,
        grossAmount: amount,
        totalDiscountPct: discountPct,
        occurredAt,
        metadata: { source: 'event_gateway', correlationId, ...(body?.data ?? {}) },
      });
    }
    // All other event types (PAYMENT_CAPTURED, SETTLEMENT_*, WALLET_*, etc.)
    // are logged to platform_events and billing_events for audit — no ledger action needed.
    else if (merchantId) {
      await admin.from('billing_events').insert({
        event_key: eventId,
        event_type: eventType.toLowerCase(),
        merchant_id: merchantId,
        customer_id: customerId || null,
        voucher_id: voucherId,
        gross_amount: amount || 0,
        merchant_payout_amount: 0,
        total_discount_pct: discountPct,
        total_discount_amount: 0,
        occurred_at: occurredAt,
        metadata: { source: 'event_gateway', correlationId, ...(body?.data ?? {}) },
      }).select('id').maybeSingle();
    }

    // Mark platform_event as processed
    await admin
      .from('platform_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('event_id', eventId);

    return jsonNoStore(
      { received: true, event_id: eventId },
      { status: 202, headers: CORS_HEADERS }
    );
  } catch (error: any) {
    // Mark failed but never block the caller
    await admin
      .from('platform_events')
      .update({ status: 'failed', error_message: String(error?.message ?? 'unknown') })
      .eq('event_id', eventId);

    return jsonNoStore(
      { error: error?.message || 'Event processing failed.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
