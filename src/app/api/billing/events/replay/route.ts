import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import {
  recordVoucherPurchaseBillingEvent,
  recordVoucherRedemptionBillingEvent,
} from '@/server/services/billing/billing-events';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, X-Portal-Passcode, X-Portal-User, X-Portal-Role, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const passcode = request.headers.get('X-Portal-Passcode') ?? '';
  const envPasscode = process.env.PORTAL_ADMIN_PASSCODE ?? process.env.VITE_ADMIN_PASSCODE ?? '';
  const passcodeValid = envPasscode && passcode === envPasscode;

  let auditorUserId: string | null = null;
  if (!passcodeValid) {
    const { allowed, user } = await requirePortalUser(request, ['admin', 'auditor']);
    if (!allowed) {
      return jsonNoStore({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });
    }
    auditorUserId = user?.id ?? null;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const eventIds = body?.eventIds as string[] | undefined;
    const fromDate = body?.fromDate as string | undefined;
    const toDate = body?.toDate as string | undefined;
    const eventType = body?.eventType as string | undefined;
    const forceLedgerRepost = Boolean(body?.forceLedgerRepost);

    const admin = createAdminClient();

    // 1. Build platform_events query
    let query = admin.from('platform_events').select('*');

    if (eventIds && eventIds.length > 0) {
      query = query.in('event_id', eventIds);
    } else {
      if (fromDate) query = query.gte('occurred_at', fromDate);
      if (toDate) query = query.lte('occurred_at', toDate);
      if (eventType) query = query.eq('event_type', eventType.toUpperCase());
    }

    const { data: events, error: fetchError } = await query.limit(100);
    if (fetchError) throw fetchError;

    if (!events || events.length === 0) {
      return jsonNoStore({ success: true, replayed: 0, message: 'No matching events found to replay.' }, { headers: CORS_HEADERS });
    }

    const replayRunId = randomUUID();
    const results = [];

    for (const event of events) {
      const eventKey = event.transaction_ref ?? event.correlation_id ?? event.event_id;
      const amount = Number(event.amount ?? 0);
      const discountPct = Number(event.discount_pct ?? 0);
      const occurredAt = event.occurred_at;

      // Create initial replay log entry
      const { data: replayLog, error: logError } = await admin
        .from('event_replay_log')
        .insert({
          replay_run_id: replayRunId,
          event_id: event.event_id,
          event_type: event.event_type,
          status: 'pending',
          replayed_by: auditorUserId
        })
        .select('*')
        .single();

      if (logError) {
        console.error('Failed to create replay log entry:', logError.message);
        continue;
      }

      try {
        if (forceLedgerRepost) {
          // Void or delete existing entries for this eventKey to allow fresh posting
          await admin
            .from('billing_ledger_entries')
            .delete()
            .eq('source_id', eventKey);

          await admin
            .from('billing_events')
            .delete()
            .eq('event_key', eventKey);
        }

        let replayed = false;

        // Route to billing ledger handlers
        if (event.event_type === 'VOUCHER_PURCHASED' && event.merchant_id && event.customer_id) {
          await recordVoucherPurchaseBillingEvent(admin, {
            eventKey,
            merchantId: event.merchant_id,
            customerId: event.customer_id,
            voucherId: event.voucher_id ?? null,
            consumerPrice: amount,
            faceValue: Number(event.face_value ?? amount),
            totalDiscountPct: discountPct,
            occurredAt,
            metadata: {
              source: 'event_replay_engine',
              replayRunId,
              ...(event.payload ?? {})
            }
          });
          replayed = true;
        } else if (event.event_type === 'VOUCHER_REDEEMED' && event.merchant_id) {
          await recordVoucherRedemptionBillingEvent(admin, {
            eventKey,
            merchantId: event.merchant_id,
            customerId: event.customer_id ?? null,
            voucherId: event.voucher_id ?? null,
            grossAmount: amount,
            totalDiscountPct: discountPct,
            occurredAt,
            metadata: {
              source: 'event_replay_engine',
              replayRunId,
              ...(event.payload ?? {})
            }
          });
          replayed = true;
        }

        // If other event type, just insert it into billing_events if it fits
        if (!replayed && event.merchant_id) {
          await admin.from('billing_events').insert({
            event_key: eventKey,
            event_type: event.event_type.toLowerCase(),
            merchant_id: event.merchant_id,
            customer_id: event.customer_id ?? null,
            voucher_id: event.voucher_id ?? null,
            gross_amount: amount,
            merchant_payout_amount: 0,
            total_discount_pct: discountPct,
            total_discount_amount: 0,
            occurred_at: occurredAt,
            metadata: {
              source: 'event_replay_engine',
              replayRunId,
              ...(event.payload ?? {})
            }
          });
        }

        // Update replay log to success
        await admin
          .from('event_replay_log')
          .update({ status: 'success' })
          .eq('id', replayLog.id);

        results.push({ eventId: event.event_id, status: 'success' });
      } catch (err: any) {
        console.error(`Error replaying event ${event.event_id}:`, err.message);
        
        await admin
          .from('event_replay_log')
          .update({ status: 'failed', error_message: err.message })
          .eq('id', replayLog.id);

        results.push({ eventId: event.event_id, status: 'failed', error: err.message });
      }
    }

    return jsonNoStore({
      success: true,
      replayRunId,
      replayedCount: results.length,
      results
    }, { headers: CORS_HEADERS });

  } catch (error: any) {
    console.error('[Event Replay] Failed:', error);
    return jsonNoStore({ error: error.message || 'Event replay failed.' }, { status: 500, headers: CORS_HEADERS });
  }
}
