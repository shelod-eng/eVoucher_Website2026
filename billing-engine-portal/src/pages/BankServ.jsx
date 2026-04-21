import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import GoldButton from '@/components/ui/GoldButton';
import { useAdminAuth } from '@/auth/admin-auth';
import { logAuditEvent } from '@/audit/audit-log';
import {
  buildSettlementCsv,
  downloadTextFile,
  listBatches,
  markConfirmed,
  markExported,
  markSubmitted,
} from '@/settlements/mock-settlement-store';
import { FileDown, RefreshCw } from 'lucide-react';
import {
  approveBillingSettlementBatch,
  confirmBillingSettlementBatch,
  exportBillingSettlementBatchBankServ,
  getBankServStatus,
  listBillingSettlementBatches,
  submitBillingSettlementBatch,
} from '@/api/portal-api';

export default function BankServ() {
  const { session, isFinanceApprover, role } = useAdminAuth();
  const [batches, setBatches] = useState([]);
  const [bankServStatus, setBankServStatus] = useState(null);
  const dataMode = (import.meta.env.VITE_BILLING_DATA_MODE || 'mock').toLowerCase();
  const usePortalApi = dataMode === 'portal';

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function refresh() {
    if (!usePortalApi) {
      setBatches(listBatches());
      return;
    }

    if (!session?.email) {
      setBatches([]);
      return;
    }

    const response = await listBillingSettlementBatches(session, role, { limit: 200, offset: 0 });
    const raw = response?.data ?? [];
    const normalised = raw.map((b) => ({
      ...b,
      batchNumber: b.batchNumber ?? b.batch_number,
      createdAt: b.createdAt ?? b.created_at,
      createdByEmail: b.createdByEmail ?? b.created_by_email ?? session?.email,
      merchantCount: b.merchantCount ?? b.merchant_count,
      totalAmount: b.totalAmount ?? b.total_amount,
    }));
    setBatches(normalised);
  }

  useEffect(() => {
    refresh().catch(() => setBatches([]));
  }, []);

  useEffect(() => {
    if (!usePortalApi || !session?.email) return;
    getBankServStatus(session, role)
      .then((res) => setBankServStatus(res?.data ?? null))
      .catch(() => setBankServStatus(null));
  }, [usePortalApi, session?.email, role]);

  const counts = useMemo(() => {
    const c = {
      pending_approval: 0,
      approved: 0,
      exported: 0,
      submitted_to_bank: 0,
      confirmed: 0,
      total: batches.length,
    };
    for (const b of batches) {
      if (b.status in c) c[b.status] += 1;
    }
    return c;
  }, [batches]);

  function statusBadgeClass(status) {
    switch (status) {
      case 'pending_approval':
        return 'bg-yellow-500/15 text-yellow-200 border border-yellow-500/30';
      case 'approved':
        return 'bg-blue-500/15 text-blue-200 border border-blue-500/30';
      case 'exported':
        return 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30';
      case 'submitted_to_bank':
        return 'bg-purple-500/15 text-purple-200 border border-purple-500/30';
      case 'confirmed':
        return 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30';
      default:
        return 'bg-white/10 border-white/10 text-white';
    }
  }

  function canExport(status) {
    return (isFinanceApprover || role === 'admin') && (status === 'approved' || status === 'exported');
  }

  function canSubmit(status) {
    return (isFinanceApprover || role === 'admin') && status === 'exported';
  }

  function canConfirm(status) {
    return (isFinanceApprover || role === 'admin') && status === 'submitted_to_bank';
  }

  function exportBatch(batch) {
    const exportedByEmail = session?.email || 'unknown';

    if (!usePortalApi) {
      const updated = markExported({ batchId: batch.id, exportedByEmail });
      const csv = buildSettlementCsv(updated);
      downloadTextFile(`${updated.batchNumber}.csv`, csv);
      logAuditEvent('bankserv.export_csv', { batchNumber: updated.batchNumber, exportedByEmail });
      refresh();
      return;
    }

    exportBillingSettlementBatchBankServ(batch.id, session, role)
      .then(({ blob, filename }) => {
        downloadBlob(filename, blob);
        logAuditEvent('bankserv.export_bankserv', { batchNumber: batch.batchNumber, exportedByEmail });
        refresh();
      })
      .catch((err) => {
        console.error(err);
      });
  }

  function submitBatch(batch) {
    const submittedByEmail = session?.email || 'unknown';
    if (!usePortalApi) {
      const updated = markSubmitted({ batchId: batch.id, submittedByEmail });
      logAuditEvent('bankserv.submit_to_bank', { batchNumber: updated.batchNumber, submittedByEmail });
      refresh();
      return updated;
    }

    submitBillingSettlementBatch(batch.id, session, role)
      .then(() => {
        logAuditEvent('bankserv.submit_to_bank', { batchNumber: batch.batchNumber, submittedByEmail });
        refresh();
      })
      .catch((err) => console.error(err));
    return batch;
  }

  function confirmBatch(batch) {
    const confirmedByEmail = session?.email || 'unknown';
    if (!usePortalApi) {
      const updated = markConfirmed({ batchId: batch.id, confirmedByEmail });
      logAuditEvent('bankserv.confirm_paid', { batchNumber: updated.batchNumber, confirmedByEmail });
      refresh();
      return updated;
    }

    confirmBillingSettlementBatch(batch.id, session, role)
      .then(() => {
        logAuditEvent('bankserv.confirm_paid', { batchNumber: batch.batchNumber, confirmedByEmail });
        refresh();
      })
      .catch((err) => console.error(err));
    return batch;
  }

  const latestExportable = useMemo(
    () => batches.find((b) => b.status === 'approved' || b.status === 'exported') || null,
    [batches]
  );

  const csvPreview = useMemo(() => {
    if (!latestExportable) return null;
    try {
      const csv = buildSettlementCsv(latestExportable);
      return csv.split('\n').slice(0, 6).join('\n');
    } catch {
      return null;
    }
  }, [latestExportable]);

  function approveBatch(batch) {
    const approvedByEmail = session?.email || 'unknown';
    if (!usePortalApi) {
      // This screen’s mock store already enforces 2-person control for demo.
      return;
    }
    approveBillingSettlementBatch(batch.id, session, role)
      .then(() => {
        logAuditEvent('bankserv.approve_batch', { batchNumber: batch.batchNumber, approvedByEmail });
        refresh();
      })
      .catch((err) => console.error(err));
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
            <FileDown className="w-5 h-5 text-[#00A89D]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">BankServ Africa Adaptor</h1>
            <p className="text-sm text-white/70">
              Bridge layer: eVoucher Platform → FNB Sponsor → PCH/SAMOS → BankServ → Merchant
            </p>
            {bankServStatus?.partner ? (
              <p className="text-xs text-white/50 mt-1">Settlement partner: {bankServStatus.partner}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-white/10 border-white/10 text-white">Demo</Badge>
          {bankServStatus?.connected ? (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">LIVE</Badge>
          ) : (
            <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-500/30">Mock</Badge>
          )}
          <Badge
            className={
              bankServStatus?.connected
                ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20'
                : 'bg-white/10 border-white/10 text-white/70'
            }
          >
            {bankServStatus?.connected ? 'BankServ Connected' : 'BankServ Not Connected'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10 text-white p-4 lg:col-span-2">
          <div className="font-semibold mb-3">Payment Flow Architecture</div>
          <div className="space-y-3">
            {[
              { step: 'Step 1', title: 'Consumer Payment', sub: 'Card / EFT / Wallet' },
              { step: 'Step 2', title: 'eVoucher Platform', sub: 'Business logic layer' },
              { step: 'Step 3', title: 'Sponsor Bank (FNB)', sub: 'Originating bank • RMB/FNB CIB' },
              { step: 'Step 4', title: 'PCH / SAMOS', sub: 'Clearing house' },
              { step: 'Step 5', title: 'BankServ Africa', sub: 'ACH operator (ISO 20022)' },
              { step: 'Step 6', title: "Merchant's Bank", sub: 'Destination account' },
            ].map((row) => (
              <div
                key={row.step}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <div>
                  <div className="text-sm font-semibold">{row.title}</div>
                  <div className="text-xs text-white/60">{row.sub}</div>
                </div>
                <Badge className="bg-white/10 border-white/10 text-white">{row.step}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10 text-white p-4">
            <div className="font-semibold mb-3">Money Split (Per Transaction)</div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
              <div className="h-full bg-emerald-400" style={{ width: '96%' }} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>96% Merchant Payout</span>
                </div>
                <span className="text-white/70">Settled via BankServ</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>2.8% Consumer Benefit</span>
                </div>
                <span className="text-white/70">Credited to wallet</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00A89D]" />
                  <span>1.2% Platform Revenue</span>
                </div>
                <span className="text-white/70">Retained</span>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white p-4">
            <div className="font-semibold mb-3">Technical Specifications</div>
            <div className="text-sm text-white/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/60">File format</span>
                <span>ISO 20022 / BankServ</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">EFT credit code</span>
                <span>Transaction Code 40</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Originating bank</span>
                <span>FNB (Branch: 250655)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Clearing network</span>
                <span>PCH / SAMOS (SARB)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Settlement timing</span>
                <span>T+0 (FNB→FNB) / T+1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Encryption</span>
                <span>AES‑256 + TLS 1.3</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 text-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">EFT Export Requirements</div>
          <div className="flex items-center gap-2">
            <GoldButton
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              onClick={refresh}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </GoldButton>
          </div>
        </div>

        <ul className="text-sm text-white/70 list-disc pl-5 space-y-1">
          <li>Transaction code (EFT credit)</li>
          <li>Source bank (FNB sponsor account)</li>
          <li>Destination merchant bank details</li>
          <li>Reference: invoice / batch reference</li>
          <li>Action date: settlement date</li>
        </ul>

        <div className="text-xs text-white/60">
          Status flow: <span className="font-mono">pending_approval</span> → <span className="font-mono">approved</span> →{' '}
          <span className="font-mono">exported</span> → <span className="font-mono">submitted_to_bank</span> →{' '}
          <span className="font-mono">confirmed</span>.
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Card className="bg-white/5 border-white/10 text-white p-3">
          <div className="text-xs text-white/60">Pending approval</div>
          <div className="text-xl font-bold">{counts.pending_approval}</div>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white p-3">
          <div className="text-xs text-white/60">Approved</div>
          <div className="text-xl font-bold">{counts.approved}</div>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white p-3">
          <div className="text-xs text-white/60">Exported</div>
          <div className="text-xl font-bold">{counts.exported}</div>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white p-3">
          <div className="text-xs text-white/60">Submitted</div>
          <div className="text-xl font-bold">{counts.submitted_to_bank}</div>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white p-3">
          <div className="text-xs text-white/60">Confirmed</div>
          <div className="text-xl font-bold">{counts.confirmed}</div>
        </Card>
      </div>

      <Card className="bg-white/5 border-white/10 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Settlement Batches</div>
          <Badge className="bg-white/10 border-white/10 text-white">{counts.total}</Badge>
        </div>

        {batches.length === 0 ? (
          <div className="text-sm text-white/60">
            No batches yet. Create one under <span className="font-mono">Settlements</span>.
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((b) => (
              <div key={b.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{b.batchNumber}</div>
                    <div className="text-xs text-white/60">Created: {b.createdAt}</div>
                    <div className="text-xs text-white/60">By: {b.createdByEmail}</div>
                    {b.approvedByEmail ? <div className="text-xs text-white/60">Approved: {b.approvedByEmail}</div> : null}
                  </div>
                  <div className="text-right">
                    <Badge className={statusBadgeClass(b.status)}>{b.status}</Badge>
                    <div className="text-sm font-bold mt-2">R{Number(b.totalAmount || 0).toLocaleString()}</div>
                    <div className="text-xs text-white/60">{b.merchantCount} merchants</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {b.status === 'pending_approval' && (isFinanceApprover || role === 'admin') ? (
                    <GoldButton
                      size="sm"
                      onClick={() => approveBatch(b)}
                      className="bg-blue-600 hover:bg-blue-600/90 text-white"
                    >
                      Approve Batch
                    </GoldButton>
                  ) : null}

                  {canExport(b.status) ? (
                    <GoldButton
                      size="sm"
                      onClick={() => exportBatch(b)}
                      className="bg-[#00A89D] hover:bg-[#00A89D]/90 text-white"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export CSV
                    </GoldButton>
                  ) : null}

                  {canSubmit(b.status) ? (
                    <GoldButton
                      size="sm"
                      onClick={() => submitBatch(b)}
                      className="bg-purple-600 hover:bg-purple-600/90 text-white"
                    >
                      Submit to Bank
                    </GoldButton>
                  ) : null}

                  {canConfirm(b.status) ? (
                    <GoldButton
                      size="sm"
                      onClick={() => confirmBatch(b)}
                      className="bg-emerald-600 hover:bg-emerald-600/90 text-white"
                    >
                      Confirm Paid
                    </GoldButton>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-white/60">
          Data mode: <span className="font-mono">{usePortalApi ? 'portal' : 'mock'}</span>. Role permissions:{' '}
          <span className="font-mono">finance_approver</span> can approve/export/submit/confirm. Current: {role}.
        </div>
      </Card>

      <Card className="bg-white/5 border-white/10 text-white p-4">
        <div className="font-semibold mb-2">File format preview (CSV)</div>
        {csvPreview ? (
          <pre className="text-xs text-white/70 whitespace-pre-wrap bg-black/30 border border-white/10 rounded-lg p-3 overflow-auto">
            {csvPreview}
          </pre>
        ) : (
          <div className="text-sm text-white/60">No approved/exportable batch yet.</div>
        )}
      </Card>
    </div>
  );
}
