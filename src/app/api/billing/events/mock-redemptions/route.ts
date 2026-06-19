import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import { recordVoucherRedemptionBillingEvent } from '@/server/services/billing/billing-events';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isMockEnabled() {
  const flag = String(process.env.BILLING_ENABLE_MOCK_ENDPOINTS ?? '')
    .trim()
    .toLowerCase();
  if (flag === 'true' || flag === '1' || flag === 'yes') return true;
  return process.env.NODE_ENV !== 'production';
}

export async function POST(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });
  if (!isMockEnabled()) {
    return jsonNoStore({ error: 'Mock endpoints are disabled.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const merchantId = String(body?.merchantId ?? '').trim();
    const count = Math.min(50, Math.max(1, Number(body?.count ?? 5)));
    const grossAmount = Math.max(1, Number(body?.grossAmount ?? 100));
    const totalDiscountPct = Math.max(0, Number(body?.totalDiscountPct ?? 5));

    if (!merchantId) return jsonNoStore({ error: 'merchantId is required.' }, { status: 400 });

    const admin = createAdminClient();
    const created: any[] = [];
    for (let i = 0; i < count; i += 1) {
      const eventKey = `mock-${randomUUID()}`;
      const res = await recordVoucherRedemptionBillingEvent(admin, {
        eventKey,
        merchantId,
        customerId: null,
        voucherId: null,
        grossAmount,
        totalDiscountPct,
        occurredAt: new Date().toISOString(),
        metadata: { mock: true },
      });
      created.push({ eventKey, eventId: res.event.id });
    }

    return jsonNoStore({ success: true, data: { createdCount: created.length, events: created } });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to create mock redemption events.' },
      { status: 500 }
    );
  }
}
