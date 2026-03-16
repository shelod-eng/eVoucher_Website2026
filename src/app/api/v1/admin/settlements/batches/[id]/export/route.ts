import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { requirePortalRole } from '@/server/utils/portal-auth';
import { writeAuditEvent } from '@/server/utils/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function toCsv(rows: Array<Record<string, any>>) {
  const headers = [
    'merchant_id',
    'merchant_name',
    'amount',
    'bank_name',
    'branch_code',
    'account_number',
    'account_holder',
    'reference',
    'status',
  ];

  const lines = [headers.join(',')];
  rows.forEach((row) => {
    const line = headers
      .map((header) => {
        const value = row[header] ?? '';
        const safe = String(value).replace(/\"/g, '""');
        return `"${safe}"`;
      })
      .join(',');
    lines.push(line);
  });
  return lines.join('\n');
}

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
        'id,merchant_id,amount,bank_name,branch_code,account_number,account_holder,reference,status'
      )
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });
    if (settlementError) throw settlementError;

    const merchantIds = (settlements ?? []).map((row) => row.merchant_id);
    const { data: merchants } = await admin
      .from('merchants')
      .select('id,business_name')
      .in('id', merchantIds.length ? merchantIds : ['00000000-0000-0000-0000-000000000000']);
    const merchantMap = new Map((merchants ?? []).map((m) => [m.id, m.business_name]));

    const exportRows =
      settlements?.map((row) => ({
        merchant_id: row.merchant_id,
        merchant_name: merchantMap.get(row.merchant_id) ?? '',
        amount: row.amount,
        bank_name: row.bank_name,
        branch_code: row.branch_code,
        account_number: row.account_number,
        account_holder: row.account_holder,
        reference: row.reference,
        status: row.status,
      })) ?? [];

    const csv = toCsv(exportRows);
    const exportedAt = new Date().toISOString();

    const { error: batchUpdateError } = await admin
      .from('billing_settlement_batches')
      .update({ status: 'exported', exported_by: user.id, exported_at: exportedAt })
      .eq('id', batchId);
    if (batchUpdateError) throw batchUpdateError;

    const { error: settlementUpdateError } = await admin
      .from('billing_settlements')
      .update({ status: 'exported' })
      .eq('batch_id', batchId)
      .in('status', ['approved', 'pending']);
    if (settlementUpdateError) throw settlementUpdateError;

    try {
      await writeAuditEvent(admin, {
        actorId: user.id,
        actorRole: role ?? 'finance_approver',
        entityType: 'billing_settlement_batch',
        entityId: batchId,
        action: 'settlement_batch_exported',
        metadata: {
          batchNumber: batch.batch_number,
          rowCount: exportRows.length,
        },
        requestId: batch.batch_number,
      });
    } catch (auditError: any) {
      console.warn('[settlement][audit][warn]', auditError?.message || auditError);
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=\"${batch.batch_number}.csv\"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to export settlement batch.' },
      { status: 500 }
    );
  }
}
