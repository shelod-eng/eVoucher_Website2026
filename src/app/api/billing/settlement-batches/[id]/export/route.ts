import { createAdminClient } from '@/lib/supabase/admin';
import { formatBankServBatch, serialiseBatchToFlatFile } from '@/lib/billing/bankserv-formatter';
import { jsonNoStore, noStoreHeaders } from '@/server/services/billing/no-store';
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
    const { data: batch, error: batchError } = await admin
      .from('billing_settlement_batches')
      .select('*')
      .eq('id', batchId)
      .single();
    if (batchError || !batch) return jsonNoStore({ error: 'Batch not found.' }, { status: 404 });

    const { data: settlements, error: settlementsError } = await admin
      .from('billing_settlements')
      .select('id,merchant_id,amount,invoice_id,bank_linkage_id,settlement_reference')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true })
      .limit(5000);
    if (settlementsError) throw settlementsError;
    if (!settlements || settlements.length === 0) {
      return jsonNoStore({ error: 'No settlements found for this batch.' }, { status: 422 });
    }

    const invoiceIds = Array.from(new Set(settlements.map((s: any) => String(s.invoice_id)).filter(Boolean)));
    const linkageIds = Array.from(
      new Set(settlements.map((s: any) => String(s.bank_linkage_id)).filter(Boolean))
    );

    const { data: invoices } = await admin
      .from('billing_invoices')
      .select('id,invoice_number')
      .in('id', invoiceIds);
    const invoiceMap = new Map((invoices ?? []).map((i: any) => [String(i.id), i]));

    const { data: linkages } = await admin
      .from('billing_bank_linkages')
      .select('id,branch_code,account_type,account_holder_name,account_number_enc')
      .in('id', linkageIds);
    const linkageMap = new Map((linkages ?? []).map((l: any) => [String(l.id), l]));

    const rows = settlements.map((s: any) => {
      const inv = invoiceMap.get(String(s.invoice_id));
      const linkage = linkageMap.get(String(s.bank_linkage_id));
      if (!inv || !linkage) return null;
      return {
        settlementId: String(s.id),
        settlementReference: String(s.settlement_reference ?? '').trim(),
        amount: Number(s.amount ?? 0),
        invoiceId: String(s.invoice_id),
        invoiceNumber: String(inv.invoice_number ?? inv.id),
        merchantId: String(s.merchant_id),
        linkage: {
          branchCode: String(linkage.branch_code ?? ''),
          accountType: String(linkage.account_type ?? ''),
          accountHolderName: String(linkage.account_holder_name ?? ''),
          accountNumberEnc: String(linkage.account_number_enc ?? ''),
        },
      };
    }).filter(Boolean) as any[];

    if (rows.length === 0) {
      return jsonNoStore({ error: 'Settlements missing invoice or bank linkage.' }, { status: 422 });
    }

    const instructions = formatBankServBatch(rows);
    const flatFile = serialiseBatchToFlatFile(instructions);

    const now = new Date().toISOString();
    await admin
      .from('billing_settlement_batches')
      .update({ status: 'exported', exported_by: user?.id ?? null, exported_at: now })
      .eq('id', batchId);
    await admin.from('billing_settlements').update({ status: 'exported' }).eq('batch_id', batchId);

    const filename = `${String(batch.batch_number ?? 'bankserv-batch')}.txt`;
    return new Response(flatFile, {
      status: 200,
      headers: {
        ...noStoreHeaders(),
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to export BankServ batch.' },
      { status: 500 }
    );
  }
}

