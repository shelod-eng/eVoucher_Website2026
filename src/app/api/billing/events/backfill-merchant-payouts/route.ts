import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import { recordVoucherRedemptionBillingEvent } from '@/server/services/billing/billing-events';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * One-time migration helper:
 * Backfill billing_events + ledger entries from existing merchant_payouts so the
 * new billing engine can operate on historical data.
 *
 * NOTE: These backfilled events have no voucher/customer linkage.
 */
export async function POST(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const status = body?.status ? String(body.status).trim() : 'pending';
    const limit = Math.min(5000, Math.max(1, Number(body?.limit ?? 1000)));

    const admin = createAdminClient();
    const { data: payouts, error } = await admin
      .from('merchant_payouts')
      .select('id,merchant_id,amount,created_at,status')
      .eq('status', status)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    let created = 0;
    for (const payout of payouts ?? []) {
      const eventKey = `merchant_payout:${payout.id}`;
      await recordVoucherRedemptionBillingEvent(admin, {
        eventKey,
        merchantId: String(payout.merchant_id),
        customerId: null,
        voucherId: null,
        grossAmount: Number(payout.amount ?? 0),
        totalDiscountPct: 0,
        occurredAt: String(payout.created_at ?? new Date().toISOString()),
        metadata: { backfill: true, source: 'merchant_payouts', payoutStatus: payout.status },
      });
      created += 1;
    }

    return jsonNoStore({
      success: true,
      data: { status, scanned: (payouts ?? []).length, created },
    });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to backfill from merchant_payouts.' },
      { status: 500 }
    );
  }
}
