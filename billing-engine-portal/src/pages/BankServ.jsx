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

export default function BankServ() {
  const { session, isFinanceApprover, role } = useAdminAuth();
  const [batches, setBatches] = useState([]);

  function refresh() {
    setBatches(listBatches());
  }

  useEffect(() => {
    refresh();
  }, []);

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
    const updated = markExported({ batchId: batch.id, exportedByEmail });
    const csv = buildSettlementCsv(updated);
    downloadTextFile(`${updated.batchNumber}.csv`, csv);
    logAuditEvent('bankserv.export_csv', { batchNumber: updated.batchNumber, exportedByEmail });
    refresh();
  }

  function submitBatch(batch) {
    const submittedByEmail = session?.email || 'unknown';
    const updated = markSubmitted({ batchId: batch.id, submittedByEmail });
    logAuditEvent('bankserv.submit_to_bank', { batchNumber: updated.batchNumber, submittedByEmail });
    refresh();
    return updated;
  }

  function confirmBatch(batch) {
    const confirmedByEmail = session?.email || 'unknown';
    const updated = markConfirmed({ batchId: batch.id, confirmedByEmail });
    logAuditEvent('bankserv.confirm_paid', { batchNumber: updated.batchNumber, confirmedByEmail });
    refresh();
    return updated;
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

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
          <FileDown className="w-5 h-5 text-[#00A89D]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">BankServ</h1>
          <p className="text-sm text-white/70">Settlement file export + submission workflow (Phase 2 demo).</p>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 text-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">EFT Export Requirements</div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/10 border-white/10 text-white">Demo</Badge>
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
          Role permissions: <span className="font-mono">finance_approver</span> can export/submit/confirm. Current: {role}.
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
