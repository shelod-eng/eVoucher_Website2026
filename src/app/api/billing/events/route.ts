import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const merchantId = String(searchParams.get('merchantId') ?? '').trim();
    const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit') ?? 100)));

    const admin = createAdminClient();
    let query = admin
      .from('billing_events')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (merchantId) query = query.eq('merchant_id', merchantId);

    const { data, error } = await query;
    if (error) throw error;

    return jsonNoStore({ success: true, data: data ?? [] });
  } catch (error: any) {
    return jsonNoStore({ error: error?.message || 'Failed to list billing events.' }, { status: 500 });
  }
}

