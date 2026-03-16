import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { getPortalUserFromHeaders, requirePortalRole } from '@/server/utils/portal-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const { user: sessionUser } = await getAuthenticatedUser();
    const user = sessionUser ?? (await getPortalUserFromHeaders(request));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allowed } = await requirePortalRole(user, ['admin', 'finance_approver', 'auditor']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const batchId = String(context.params?.id ?? '').trim();
    if (!batchId) {
      return NextResponse.json({ error: 'Batch id is required.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: batch, error: batchError } = await admin
      .from('billing_settlement_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found.' }, { status: 404 });
    }

    const { data: settlements, error: settlementError } = await admin
      .from('billing_settlements')
      .select(
        'id,merchant_id,amount,bank_name,branch_code,account_number,account_holder,reference,status,created_at,updated_at'
      )
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (settlementError) throw settlementError;

    return NextResponse.json({
      batch,
      settlements: settlements ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch settlement batch.' },
      { status: 500 }
    );
  }
}
