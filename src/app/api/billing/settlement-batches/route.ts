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
    const status = String(searchParams.get('status') ?? '').trim();
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') ?? 50)));
    const offset = Math.max(0, Number(searchParams.get('offset') ?? 0));

    const admin = createAdminClient();
    let query = admin
      .from('billing_settlement_batches')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    return jsonNoStore({
      success: true,
      data: data ?? [],
      meta: { limit, offset, total: Number(count ?? 0) },
    });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to list settlement batches.' },
      { status: 500 }
    );
  }
}

