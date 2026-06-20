import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request, context: { params: { id: string } }) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const batchId = String(context.params?.id ?? '').trim();
    if (!batchId) return jsonNoStore({ error: 'Batch id is required.' }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('bankserv_ack_nck_tracking')
      .select('*')
      .eq('entity_type', 'batch')
      .eq('entity_id', batchId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return jsonNoStore({
      success: true,
      data: data ?? [],
      meta: {
        batchId,
        latestStatus: data?.[0]?.status ?? 'not_tracked',
      },
    });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to load ACK/NCK status.' },
      { status: 500 }
    );
  }
}
