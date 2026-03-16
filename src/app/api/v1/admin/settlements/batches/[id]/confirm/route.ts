import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { requirePortalRole } from '@/server/utils/portal-auth';
import { writeAuditEvent } from '@/server/utils/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(_request: Request, context: { params: { id: string } }) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { allowed, role } = await requirePortalRole(user, ['admin', 'finance_approver']);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const batchId = String(context.params?.id ?? '').trim();
    if (!batchId) {
      return NextResponse.json({ error: 'Batch id is required.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const confirmedAt = new Date().toISOString();
    const { data: batch, error } = await admin
      .from('billing_settlement_batches')
      .update({ status: 'confirmed', confirmed_by: user.id, confirmed_at: confirmedAt })
      .eq('id', batchId)
      .select('*')
      .single();

    if (error || !batch) {
      return NextResponse.json({ error: 'Unable to confirm batch.' }, { status: 400 });
    }

    const { error: settlementError } = await admin
      .from('billing_settlements')
      .update({ status: 'confirmed' })
      .eq('batch_id', batchId);
    if (settlementError) throw settlementError;

    try {
      await writeAuditEvent(admin, {
        actorId: user.id,
        actorRole: role ?? 'finance_approver',
        entityType: 'billing_settlement_batch',
        entityId: batchId,
        action: 'settlement_batch_confirmed',
        metadata: { batchNumber: batch.batch_number },
        requestId: batch.batch_number,
      });
    } catch (auditError: any) {
      console.warn('[settlement][audit][warn]', auditError?.message || auditError);
    }

    return NextResponse.json({ message: 'Batch confirmed.', batch });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to confirm settlement batch.' },
      { status: 500 }
    );
  }
}
