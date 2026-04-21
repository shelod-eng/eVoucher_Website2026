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
    const { data: batch, error: batchError } = await admin
      .from('billing_settlement_batches')
      .select('*')
      .eq('id', batchId)
      .single();
    if (batchError || !batch) {
      return jsonNoStore({ error: 'Batch not found.' }, { status: 404 });
    }

    const { data: settlements, error: settlementsError } = await admin
      .from('billing_settlements')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true })
      .limit(5000);
    if (settlementsError) throw settlementsError;

    return jsonNoStore({ success: true, data: { batch, settlements: settlements ?? [] } });
  } catch (error: any) {
    return jsonNoStore({ error: error?.message || 'Failed to fetch batch.' }, { status: 500 });
  }
}

