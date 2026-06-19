import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request, context: { params: { id: string } }) {
  const { allowed, user } = await requirePortalUser(request, ['admin', 'finance_approver']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const batchId = String(context.params?.id ?? '').trim();
    if (!batchId) return jsonNoStore({ error: 'Batch id is required.' }, { status: 400 });

    const admin = createAdminClient();
    const now = new Date().toISOString();

    const { data: batch, error } = await admin
      .from('billing_settlement_batches')
      .update({ status: 'approved', approved_by: user?.id ?? null, approved_at: now })
      .eq('id', batchId)
      .select('*')
      .single();
    if (error) throw error;

    await admin.from('billing_settlements').update({ status: 'approved' }).eq('batch_id', batchId);

    return jsonNoStore({ success: true, data: batch });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to approve settlement batch.' },
      { status: 500 }
    );
  }
}
