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
    const { data: batch, error: batchError } = await admin
      .from('billing_settlement_batches')
      .select('*')
      .eq('id', batchId)
      .single();
    if (batchError || !batch) return jsonNoStore({ error: 'Batch not found.' }, { status: 404 });

    const { data: settlements, error: settlementsError } = await admin
      .from('billing_settlements')
      .select('id,settlement_reference,amount,merchant_id,invoice_id')
      .eq('batch_id', batchId)
      .limit(5000);
    if (settlementsError) throw settlementsError;

    const now = new Date().toISOString();
    await admin
      .from('billing_settlement_batches')
      .update({ status: 'confirmed', confirmed_by: user?.id ?? null, confirmed_at: now })
      .eq('id', batchId);

    await admin
      .from('billing_settlements')
      .update({ status: 'confirmed', confirmed_at: now, reconciliation_status: 'matched' })
      .eq('batch_id', batchId);

    // Link billing events to their settlement (per-invoice).
    for (const s of settlements ?? []) {
      const invoiceId = String((s as any).invoice_id ?? '').trim();
      if (!invoiceId) continue;
      await admin
        .from('billing_events')
        .update({ settlement_id: (s as any).id, updated_at: now })
        .eq('invoice_id', invoiceId);
    }

    // Mark invoices paid (per spec: settlement confirmation implies paid).
    await admin
      .from('billing_invoices')
      .update({
        status: 'paid',
        paid_at: now,
        payment_reference: String(batch.batch_number ?? '').slice(0, 120) || null,
      })
      .eq('settlement_batch_id', batchId);

    // Post payout ledger entries (idempotent by source_id).
    const settlementRefs = (settlements ?? [])
      .map((s: any) => String(s.settlement_reference ?? '').trim())
      .filter(Boolean);
    if (settlementRefs.length > 0) {
      const { data: existingLedger } = await admin
        .from('billing_ledger_entries')
        .select('source_id')
        .in(
          'source_id',
          settlementRefs.map((r) => `settlement:${r}`)
        )
        .limit(5000);

      const existing = new Set((existingLedger ?? []).map((r: any) => String(r.source_id)));
      const toInsert = (settlements ?? [])
        .filter((s: any) => {
          const ref = String(s.settlement_reference ?? '').trim();
          return ref && !existing.has(`settlement:${ref}`);
        })
        .map((s: any) => {
          const ref = String(s.settlement_reference ?? '').trim();
          return {
            entry_group_id: s.id,
            source_type: 'settlement',
            source_id: `settlement:${ref}`,
            merchant_id: s.merchant_id,
            debit_account: 'liability:merchant_payable',
            credit_account: 'asset:sponsor_cash',
            amount: Number(s.amount ?? 0),
            currency: 'ZAR',
            metadata: { batchId, settlementReference: ref },
            created_at: now,
          };
        });

      if (toInsert.length > 0) {
        await admin.from('billing_ledger_entries').insert(toInsert);
      }
    }

    return jsonNoStore({ success: true, data: { batchId, confirmedAt: now } });
  } catch (error: any) {
    return jsonNoStore({ error: error?.message || 'Failed to confirm batch.' }, { status: 500 });
  }
}
