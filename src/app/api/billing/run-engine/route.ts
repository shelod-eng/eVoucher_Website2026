import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function buildBatchNumber() {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BATCH-${stamp}-${suffix}`;
}

function buildSettlementReference(invoiceNumber: string) {
  const safeInvoice = String(invoiceNumber ?? 'INV')
    .replace(/[^A-Za-z0-9-]/g, '')
    .slice(0, 12);
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase(); // 6 chars
  const raw = `EVS-${safeInvoice}-${suffix}`;
  return raw.slice(0, 20); // BankServ max 20 chars
}

export async function POST(request: Request) {
  const { allowed, user } = await requirePortalUser(request, ['admin']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();

  // Create a run record first (job-like tracking).
  const { data: runRow, error: runError } = await admin
    .from('billing_engine_runs')
    .insert({
      started_by: user?.id ?? null,
      status: 'running',
      step: 1,
      started_at: new Date().toISOString(),
      log: [
        { step: 1, status: 'running', message: 'Fetching approved invoices pending settlement...' },
      ],
      stats: {},
    })
    .select('*')
    .single();

  if (runError || !runRow) {
    return jsonNoStore(
      { error: runError?.message || 'Failed to start billing engine run.' },
      { status: 500 }
    );
  }

  try {
    // Finance-grade settlement engine:
    // build settlement batches from APPROVED invoices that are not yet linked to a settlement batch.
    const { data: invoices, error: invoiceError } = await admin
      .from('billing_invoices')
      .select('id,invoice_number,merchant_id,net_payable_to_merchant,status')
      .eq('status', 'approved')
      .is('settlement_batch_id', null)
      .limit(2000);

    if (invoiceError) throw invoiceError;
    if (!invoices || invoices.length === 0) {
      await admin
        .from('billing_engine_runs')
        .update({
          status: 'completed',
          step: 10,
          finished_at: new Date().toISOString(),
          stats: { invoicesQueued: 0, totalAmount: 0, invoicesFound: 0 },
          log: [
            ...(Array.isArray(runRow.log) ? (runRow.log as any[]) : []),
            { step: 10, status: 'complete', message: 'No approved invoices to settle.' },
          ],
        })
        .eq('id', runRow.id);

      return jsonNoStore(
        {
          success: true,
          data: {
            jobId: runRow.id,
            status: 'completed',
            estimatedCompletion: new Date().toISOString(),
            invoicesQueued: 0,
            totalAmount: 0,
          },
        },
        { status: 202 }
      );
    }

    const merchantIds = Array.from(new Set(invoices.map((row: any) => String(row.merchant_id))));
    const totalAmount = invoices.reduce(
      (sum: number, row: any) => sum + Number(row.net_payable_to_merchant ?? 0),
      0
    );

    const { data: merchants, error: merchantsError } = await admin
      .from('merchants')
      .select('id,business_name,bank_name,branch_code,account_number,contact_name')
      .in('id', merchantIds);
    if (merchantsError) throw merchantsError;
    const merchantMap = new Map((merchants ?? []).map((m: any) => [String(m.id), m]));

    // Prefer active verified bank linkages when present.
    const { data: linkages } = await admin
      .from('billing_bank_linkages')
      .select(
        'id,merchant_id,merchant_bank_name,branch_code,account_number_last4,account_holder_name,verification_status,is_active'
      )
      .in('merchant_id', merchantIds)
      .eq('is_active', true)
      .eq('verification_status', 'verified');
    const linkageMap = new Map((linkages ?? []).map((l: any) => [String(l.merchant_id), l]));

    const batchNumber = buildBatchNumber();
    const { data: batch, error: batchError } = await admin
      .from('billing_settlement_batches')
      .insert({
        batch_number: batchNumber,
        status: 'pending_approval',
        total_amount: Number(totalAmount.toFixed(2)),
        merchant_count: merchantIds.length,
        created_by: user?.id ?? null,
        notes: `Created via /api/billing/run-engine at ${new Date().toISOString()}`,
      })
      .select('*')
      .single();
    if (batchError || !batch) throw batchError ?? new Error('Failed to create batch.');

    const settlementRows = invoices.map((invoice: any) => {
      const merchantId = String(invoice.merchant_id);
      const amount = Number(Number(invoice.net_payable_to_merchant ?? 0).toFixed(2));
      const invoiceNumber = String(invoice.invoice_number ?? invoice.id).trim();
      const merchant = merchantMap.get(merchantId);
      const linkage = linkageMap.get(merchantId);

      // IMPORTANT: Never store full account numbers in settlements; keep last4 only.
      const last4 = linkage?.account_number_last4
        ? String(linkage.account_number_last4)
        : String(merchant?.account_number ?? '').slice(-4);

      const settlementReference = buildSettlementReference(invoiceNumber);
      return {
        batch_id: batch.id,
        merchant_id: merchantId,
        amount,
        bank_name: linkage?.merchant_bank_name ?? merchant?.bank_name ?? null,
        branch_code: linkage?.branch_code ?? merchant?.branch_code ?? null,
        account_number: last4 ? `****${last4}` : null,
        account_holder:
          linkage?.account_holder_name ?? merchant?.contact_name ?? merchant?.business_name ?? null,
        reference: settlementReference,
        status: 'pending',
        settlement_reference: settlementReference,
        invoice_id: invoice.id,
        currency: 'ZAR',
        reconciliation_status: 'pending',
        bank_linkage_id: linkage?.id ?? null,
        initiated_at: new Date().toISOString(),
        instruction_json: {},
        status_history_json: [
          {
            at: new Date().toISOString(),
            status: 'initiated',
            note: 'Created by billing engine run.',
          },
        ],
      };
    });

    const { error: settlementError } = await admin
      .from('billing_settlements')
      .insert(settlementRows);
    if (settlementError) throw settlementError;

    // Link invoices to the created settlement batch so we don't settle twice.
    const invoiceIds = invoices.map((row: any) => row.id);
    if (invoiceIds.length > 0) {
      const { error: invoiceUpdateError } = await admin
        .from('billing_invoices')
        .update({
          settlement_batch_id: batch.id,
          settled_at: new Date().toISOString(),
          status: 'exported',
        })
        .in('id', invoiceIds);
      if (invoiceUpdateError) throw invoiceUpdateError;
    }

    await admin
      .from('billing_engine_runs')
      .update({
        status: 'completed',
        step: 10,
        finished_at: new Date().toISOString(),
        stats: {
          invoicesFound: invoices.length,
          settlementsCreated: settlementRows.length,
          merchantCount: merchantIds.length,
          totalAmount: Number(totalAmount.toFixed(2)),
          batchId: batch.id,
        },
        log: [
          ...(Array.isArray(runRow.log) ? (runRow.log as any[]) : []),
          { step: 4, status: 'running', message: 'Formatting settlement instructions...' },
          { step: 7, status: 'running', message: 'Persisting settlement records...' },
          { step: 10, status: 'complete', message: 'Settlement run complete.' },
        ],
      })
      .eq('id', runRow.id);

    return jsonNoStore(
      {
        success: true,
        data: {
          jobId: runRow.id,
          status: 'completed',
          estimatedCompletion: new Date().toISOString(),
          invoicesQueued: settlementRows.length,
          totalAmount: Number(totalAmount.toFixed(2)),
          batchId: batch.id,
        },
      },
      { status: 202 }
    );
  } catch (error: any) {
    await admin
      .from('billing_engine_runs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_message: String(error?.message ?? 'Engine failed.').slice(0, 500),
        log: [
          ...(Array.isArray(runRow.log) ? (runRow.log as any[]) : []),
          { step: runRow.step ?? 1, status: 'failed', message: String(error?.message ?? error) },
        ],
      })
      .eq('id', runRow.id);

    return jsonNoStore(
      { error: error?.message || 'Failed to run billing engine.' },
      { status: 500 }
    );
  }
}
