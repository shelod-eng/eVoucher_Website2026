import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Play,
  RefreshCw,
  AlertCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';
import moment from 'moment';
import PayoutBatchProcessor from '@/components/admin/PayoutBatchProcessor';
import ReconciliationTool from '@/components/admin/ReconciliationTool';
import { mockInvoices, mockMerchants, mockSettlements } from '@/api/billing-mock-data';
import { logAuditEvent } from '@/audit/audit-log';
import { useAdminAuth } from '@/auth/admin-auth';
import {
  approveSettlementBatch,
  confirmSettlementBatch,
  createSettlementBatch,
  exportSettlementBatchCsv,
  getSettlementBatch,
  listSettlementBatches,
  submitSettlementBatch,
} from '@/api/portal-api';
import {
  approveBatch,
  buildSettlementCsv,
  createBatch,
  downloadTextFile,
  listBatches,
  markConfirmed,
  markExported,
  markSubmitted,
} from '@/settlements/mock-settlement-store';

export default function SettlementPayouts() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const dataMode = (import.meta.env.VITE_BILLING_DATA_MODE || 'mock').toLowerCase();
  const useMock = dataMode === 'mock';
  const usePortalApi = dataMode === 'portal';
  const useDemoFlow = useMock || usePortalApi;
  const { session, isFinanceApprover, role } = useAdminAuth();

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => Promise.resolve([]),
    enabled: false,
  });

  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ['allLedger'],
    queryFn: () => Promise.resolve([]),
    enabled: false,
  });

  const { data: payoutBatches = [] } = useQuery({
    queryKey: ['payoutBatches'],
    queryFn: () => Promise.resolve([]),
    enabled: false,
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ['settlements'],
    queryFn: () => Promise.resolve([]),
    enabled: false,
  });

  const {
    data: portalBatchResponse,
    isFetching: portalBatchLoading,
    error: portalBatchError,
  } = useQuery({
    queryKey: ['portalBatches'],
    queryFn: () => listSettlementBatches(session, role),
    enabled: usePortalApi && Boolean(session?.email),
  });

  const portalBatches = portalBatchResponse?.data ?? [];

  // ---- MOCK MODE: local settlement batch flow (2-person control) ----
  const [mockBatches, setMockBatches] = useState([]);
  const [portalDetails, setPortalDetails] = useState({});
  const [portalError, setPortalError] = useState('');
  const [portalNotice, setPortalNotice] = useState('');
  const [portalBatchLoadingId, setPortalBatchLoadingId] = useState(null);

  useEffect(() => {
    if (useMock) setMockBatches(listBatches());
  }, [useMock]);

  const mockPendingSettlements = useMemo(() => {
    if (!useMock) return [];

    const pendingInvoices = mockInvoices.filter((i) => i.status === 'pending');
    const byMerchant = new Map();
    for (const inv of pendingInvoices) {
      const current = byMerchant.get(inv.merchantId) || { amount: 0, invoiceNumbers: [] };
      current.amount += inv.netPayable || 0;
      current.invoiceNumbers.push(inv.invoiceNumber);
      byMerchant.set(inv.merchantId, current);
    }

    const merchantById = new Map(mockMerchants.map((m) => [m.id, m]));
    return Array.from(byMerchant.entries()).map(([merchantId, agg]) => {
      const merchant = merchantById.get(merchantId);
      return {
        merchantId,
        merchantName: merchant?.name || merchantId,
        bankName: merchant?.bankName || 'FNB',
        branchCode: merchant?.branchCode || '',
        accountNumber: merchant?.accountNumber || '',
        accountHolder: merchant?.accountHolder || merchant?.name || '',
        amount: Number(agg.amount.toFixed(2)),
        reference: agg.invoiceNumbers.slice(0, 2).join('|') || 'INV',
      };
    });
  }, [useMock]);

  const mockTotalPending = useMemo(
    () => mockPendingSettlements.reduce((sum, s) => sum + (s.amount || 0), 0),
    [mockPendingSettlements]
  );

  const portalPendingAmount = useMemo(() => {
    if (!usePortalApi) return 0;
    return portalBatches
      .filter((batch) => batch.status === 'pending_approval')
      .reduce((sum, batch) => sum + Number(batch.total_amount || 0), 0);
  }, [portalBatches, usePortalApi]);

  const portalPendingCount = useMemo(() => {
    if (!usePortalApi) return 0;
    return portalBatches.filter((batch) => batch.status === 'pending_approval').length;
  }, [portalBatches, usePortalApi]);

  function refreshMockBatches() {
    setMockBatches(listBatches());
  }

  function handleCreateMockBatch() {
    const createdByEmail = session?.email || 'unknown';
    const batch = createBatch({ createdByEmail, settlements: mockPendingSettlements });
    logAuditEvent('settlement.create_batch', {
      mode: 'mock',
      batchNumber: batch.batchNumber,
      totalAmount: batch.totalAmount,
    });
    refreshMockBatches();
  }

  function handleApproveMockBatch(batchId) {
    const approvedByEmail = session?.email || 'unknown';
    const batch = approveBatch({ batchId, approvedByEmail });
    logAuditEvent('settlement.approve_batch', {
      mode: 'mock',
      batchNumber: batch.batchNumber,
      approvedByEmail,
    });
    refreshMockBatches();
  }

  function handleExportMockBatch(batch) {
    const exportedByEmail = session?.email || 'unknown';
    const updated = markExported({ batchId: batch.id, exportedByEmail });
    const csv = buildSettlementCsv(updated);
    downloadTextFile(`${updated.batchNumber}.csv`, csv);
    logAuditEvent('settlement.export_csv', {
      mode: 'mock',
      batchNumber: updated.batchNumber,
      exportedByEmail,
    });
    refreshMockBatches();
  }

  function handleSubmitMockBatch(batch) {
    const submittedByEmail = session?.email || 'unknown';
    const updated = markSubmitted({ batchId: batch.id, submittedByEmail });
    logAuditEvent('settlement.submit_to_bank', {
      mode: 'mock',
      batchNumber: updated.batchNumber,
      submittedByEmail,
    });
    refreshMockBatches();
  }

  function handleConfirmMockBatch(batch) {
    const confirmedByEmail = session?.email || 'unknown';
    const updated = markConfirmed({ batchId: batch.id, confirmedByEmail });
    logAuditEvent('settlement.confirmed', {
      mode: 'mock',
      batchNumber: updated.batchNumber,
      confirmedByEmail,
    });
    refreshMockBatches();
  }

  async function handleCreatePortalBatch() {
    setPortalError('');
    setPortalNotice('');
    try {
      const notes = session?.email
        ? `Created via portal by ${session.email}`
        : 'Created via portal';
      await createSettlementBatch({ notes }, session, role);
      setPortalNotice('Settlement batch created.');
      queryClient.invalidateQueries(['portalBatches']);
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Unable to create batch.');
    }
  }

  async function handleApprovePortalBatch(batchId) {
    setPortalError('');
    setPortalNotice('');
    try {
      await approveSettlementBatch(batchId, session, role);
      setPortalNotice('Batch approved.');
      queryClient.invalidateQueries(['portalBatches']);
      setPortalDetails((prev) => {
        const next = { ...prev };
        delete next[batchId];
        return next;
      });
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Unable to approve batch.');
    }
  }

  async function handleExportPortalBatch(batch) {
    setPortalError('');
    setPortalNotice('');
    try {
      const { blob, filename } = await exportSettlementBatchCsv(batch.id, session, role);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setPortalNotice('Settlement CSV exported.');
      queryClient.invalidateQueries(['portalBatches']);
      setPortalDetails((prev) => {
        const next = { ...prev };
        delete next[batch.id];
        return next;
      });
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Unable to export batch.');
    }
  }

  async function handleSubmitPortalBatch(batchId) {
    setPortalError('');
    setPortalNotice('');
    try {
      await submitSettlementBatch(batchId, session, role);
      setPortalNotice('Batch submitted to bank.');
      queryClient.invalidateQueries(['portalBatches']);
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Unable to submit batch.');
    }
  }

  async function handleConfirmPortalBatch(batchId) {
    setPortalError('');
    setPortalNotice('');
    try {
      await confirmSettlementBatch(batchId, session, role);
      setPortalNotice('Batch confirmed as paid.');
      queryClient.invalidateQueries(['portalBatches']);
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Unable to confirm batch.');
    }
  }

  async function ensurePortalBatchDetails(batchId) {
    if (!usePortalApi || portalDetails[batchId]) return;
    setPortalBatchLoadingId(batchId);
    setPortalError('');
    try {
      const data = await getSettlementBatch(batchId, session, role);
      setPortalDetails((prev) => ({ ...prev, [batchId]: data }));
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Unable to load batch details.');
    } finally {
      setPortalBatchLoadingId(null);
    }
  }

  if (useDemoFlow) {
    const batches = usePortalApi ? portalBatches : mockBatches;
    const pendingAmount = usePortalApi ? portalPendingAmount : mockTotalPending;
    const pendingCount = usePortalApi ? portalPendingCount : mockPendingSettlements.length;

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('BillingEngine')}>
              <GoldButton
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </GoldButton>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Settlement Payouts</h1>
              <p className="text-sm text-white/60">Batch processing + 2-person approval</p>
            </div>
          </div>
          <Badge className="bg-white/10 border-white/10 text-white">Role: {role}</Badge>
        </div>

        {usePortalApi && portalBatchError ? (
          <Card className="bg-red-500/10 border border-red-500/30 text-red-100 p-3 text-sm">
            {portalBatchError instanceof Error
              ? portalBatchError.message
              : 'Failed to load batches.'}
          </Card>
        ) : null}

        {portalError ? (
          <Card className="bg-red-500/10 border border-red-500/30 text-red-100 p-3 text-sm">
            {portalError}
          </Card>
        ) : null}

        {portalNotice ? (
          <Card className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 p-3 text-sm">
            {portalNotice}
          </Card>
        ) : null}

        <Card className="bg-white/5 border-white/10 text-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-white/60">Pending amount (from invoices)</div>
              <div className="text-2xl font-bold">
                R{Number(pendingAmount || 0).toLocaleString()}
              </div>
              <div className="text-xs text-white/60 mt-1">
                {pendingCount} merchants ready for batch
              </div>
            </div>
            <div className="flex gap-2">
              <GoldButton
                onClick={usePortalApi ? handleCreatePortalBatch : handleCreateMockBatch}
                disabled={usePortalApi ? portalBatchLoading : mockPendingSettlements.length === 0}
                className="bg-[#00A89D] hover:bg-[#00A89D]/90 text-white"
              >
                Create Batch
              </GoldButton>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white/5 border-white/10 text-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Batches</div>
              <Badge className="bg-white/10 border-white/10 text-white">{batches.length}</Badge>
            </div>

            {batches.length === 0 ? (
              <div className="text-sm text-white/60">No batches yet. Create a batch to start.</div>
            ) : (
              <div className="space-y-3">
                {batches.map((b) => {
                  const batchId = usePortalApi ? b.id : b.id;
                  const batchNumber = usePortalApi ? b.batch_number : b.batchNumber;
                  const createdAt = usePortalApi ? b.created_at : b.createdAt;
                  const createdBy = usePortalApi ? b.created_by || 'system' : b.createdByEmail;
                  const status = usePortalApi ? b.status : b.status;
                  const totalAmount = usePortalApi ? b.total_amount : b.totalAmount;
                  const merchantCount = usePortalApi ? b.merchant_count : b.merchantCount;
                  const batchSettlements = usePortalApi
                    ? portalDetails[batchId]?.settlements || []
                    : b.settlements || [];

                  const canApprove = isFinanceApprover && status === 'pending_approval';
                  const canExport =
                    (isFinanceApprover || role === 'admin') &&
                    (status === 'approved' || status === 'exported');
                  const canSubmit =
                    (isFinanceApprover || role === 'admin') && status === 'exported';
                  const canConfirm =
                    (isFinanceApprover || role === 'admin') && status === 'submitted_to_bank';

                  const statusBadge =
                    status === 'pending_approval'
                      ? 'bg-yellow-500/15 text-yellow-200 border border-yellow-500/30'
                      : status === 'approved'
                        ? 'bg-blue-500/15 text-blue-200 border border-blue-500/30'
                        : status === 'exported'
                          ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
                          : status === 'submitted_to_bank'
                            ? 'bg-purple-500/15 text-purple-200 border border-purple-500/30'
                            : 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30';

                  return (
                    <div key={batchId} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{batchNumber}</div>
                          <div className="text-xs text-white/60">Created: {createdAt}</div>
                          <div className="text-xs text-white/60">By: {createdBy}</div>
                        </div>
                        <div className="text-right">
                          <Badge className={statusBadge}>{status}</Badge>
                          <div className="text-sm font-bold mt-2">
                            R{Number(totalAmount || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-white/60">{merchantCount} merchants</div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {canApprove ? (
                          <GoldButton
                            size="sm"
                            onClick={() =>
                              usePortalApi
                                ? handleApprovePortalBatch(batchId)
                                : handleApproveMockBatch(batchId)
                            }
                            className="bg-blue-600 hover:bg-blue-600/90 text-white"
                          >
                            Approve
                          </GoldButton>
                        ) : null}

                        {canExport ? (
                          <GoldButton
                            size="sm"
                            onClick={() =>
                              usePortalApi ? handleExportPortalBatch(b) : handleExportMockBatch(b)
                            }
                            className="bg-[#00A89D] hover:bg-[#00A89D]/90 text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </GoldButton>
                        ) : null}

                        {canSubmit ? (
                          <GoldButton
                            size="sm"
                            onClick={() =>
                              usePortalApi
                                ? handleSubmitPortalBatch(batchId)
                                : handleSubmitMockBatch(b)
                            }
                            className="bg-purple-600 hover:bg-purple-600/90 text-white"
                          >
                            Submit to Bank
                          </GoldButton>
                        ) : null}

                        {canConfirm ? (
                          <GoldButton
                            size="sm"
                            onClick={() =>
                              usePortalApi
                                ? handleConfirmPortalBatch(batchId)
                                : handleConfirmMockBatch(b)
                            }
                            className="bg-emerald-600 hover:bg-emerald-600/90 text-white"
                          >
                            Confirm Paid
                          </GoldButton>
                        ) : null}
                      </div>

                      <details className="mt-3">
                        <summary
                          className="text-xs text-white/70 cursor-pointer hover:text-white"
                          onClick={() => ensurePortalBatchDetails(batchId)}
                        >
                          View settlements
                        </summary>
                        <div className="mt-2 space-y-2">
                          {usePortalApi && portalBatchLoadingId === batchId ? (
                            <div className="text-xs text-white/60">Loading settlements…</div>
                          ) : null}
                          {batchSettlements.map((s) => (
                            <div
                              key={`${batchId}_${s.merchant_id || s.merchantId}`}
                              className="flex items-center justify-between text-xs border border-white/10 bg-white/5 rounded-lg px-2 py-2"
                            >
                              <div className="text-white/80">
                                {s.merchant_name || s.merchantName}
                              </div>
                              <div className="font-semibold text-white">
                                R{Number(s.amount || 0).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="bg-white/5 border-white/10 text-white p-4">
            <div className="font-semibold mb-3">Reconciliation (demo)</div>
            <div className="text-sm text-white/60 space-y-2">
              <div>
                Next: match settlement confirmations to live ledger entries and flag variances.
              </div>
              <div className="text-xs text-white/50">
                Portal mode already reads the shared eVoucher settlement and billing tables used by
                the website sandbox backbone.
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate pending payouts per merchant
  const merchantPayouts = merchants
    .map((merchant) => {
      const liabilities = ledgerEntries
        .filter((e) => e.entryType === 'merchant_payout_liability' && e.merchantId === merchant.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const paid = ledgerEntries
        .filter((e) => e.entryType === 'merchant_payout_posted' && e.merchantId === merchant.id)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        ...merchant,
        pendingAmount: liabilities - paid,
      };
    })
    .filter((m) => m.pendingAmount > 0);

  const totalPending = merchantPayouts.reduce((sum, m) => sum + m.pendingAmount, 0);

  // Create Settlement Batch
  const createBatchMutation = useMutation({
    mutationFn: async () => {
      if (useMock) {
        logAuditEvent('settlement.create_batch', { mode: 'mock', totalAmount: totalPending });
        return { id: `batch_mock_${Date.now()}`, status: 'pending', totalAmount: totalPending };
      }
      const batchNumber = `BATCH-${Date.now()}`;
      const batch = await base44.entities.PayoutBatch.create({
        batchNumber,
        batchDate: new Date().toISOString(),
        status: 'pending',
        totalAmount: totalPending,
        merchantCount: merchantPayouts.length,
        notes: `Settlement batch for ${merchantPayouts.length} merchants`,
      });

      // Create individual settlements
      for (const merchant of merchantPayouts) {
        await base44.entities.Settlement.create({
          merchantId: merchant.id,
          merchantName: merchant.name,
          batchId: batch.id,
          settlementDate: new Date().toISOString(),
          amount: merchant.pendingAmount,
          bankName: merchant.bankName,
          accountNumber: merchant.accountNumber,
          branchCode: merchant.branchCode,
          status: 'pending',
        });
      }

      return batch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payoutBatches']);
      queryClient.invalidateQueries(['settlements']);
    },
  });

  // Approve Batch
  const approveBatchMutation = useMutation({
    mutationFn: async (batchId) => {
      const user = await base44.auth.me();
      await base44.entities.PayoutBatch.update(batchId, {
        status: 'approved',
        approvedBy: user.email,
        approvedDate: new Date().toISOString(),
      });

      const batchSettlements = settlements.filter((s) => s.batchId === batchId);
      for (const settlement of batchSettlements) {
        await base44.entities.Settlement.update(settlement.id, { status: 'approved' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payoutBatches']);
      queryClient.invalidateQueries(['settlements']);
    },
  });

  // Process Batch (simulate bank payment)
  const processBatchMutation = useMutation({
    mutationFn: async (batch) => {
      await base44.entities.PayoutBatch.update(batch.id, {
        status: 'processing',
        processedDate: new Date().toISOString(),
      });

      const batchSettlements = settlements.filter((s) => s.batchId === batch.id);

      // Simulate EFT file generation
      const eftContent = generateEFTFile(batchSettlements);
      const blob = new Blob([eftContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      // Update settlements and ledger
      for (const settlement of batchSettlements) {
        await base44.entities.Settlement.update(settlement.id, {
          status: 'paid',
          transactionReference: `TXN-${Date.now()}-${settlement.merchantId.slice(0, 6)}`,
        });

        await base44.entities.LedgerEntry.create({
          entryType: 'merchant_payout_posted',
          amount: settlement.amount,
          merchantId: settlement.merchantId,
          merchantName: settlement.merchantName,
          reference: `Settlement ${batch.batchNumber}`,
          description: `Payout to ${settlement.merchantName}`,
        });
      }

      await base44.entities.PayoutBatch.update(batch.id, {
        status: 'completed',
        eftFileUrl: url,
      });

      return url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payoutBatches']);
      queryClient.invalidateQueries(['settlements']);
      queryClient.invalidateQueries(['allLedger']);
    },
  });

  const generateEFTFile = (settlements) => {
    let content = '# EFT Payment File\n';
    content += `# Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n`;
    content += `# Total Records: ${settlements.length}\n\n`;

    settlements.forEach((settlement, idx) => {
      content += `Record ${idx + 1}\n`;
      content += `Merchant: ${settlement.merchantName}\n`;
      content += `Bank: ${settlement.bankName}\n`;
      content += `Account: ${settlement.accountNumber}\n`;
      content += `Branch Code: ${settlement.branchCode}\n`;
      content += `Amount: R${settlement.amount.toFixed(2)}\n`;
      content += `Reference: ${settlement.transactionReference || 'PENDING'}\n\n`;
    });

    return content;
  };

  const downloadEFT = (url, batchNumber) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `EFT_${batchNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="pb-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00A89D] to-teal-600 pt-6 pb-12 px-4 rounded-b-[32px]">
        <div className="flex items-center gap-4 mb-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Settlement & Payouts</h1>
            <p className="text-sm text-white/80">Batch Processing & Reconciliation</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Card className="bg-white/10 backdrop-blur-sm border-0 p-3">
            <DollarSign className="w-5 h-5 text-yellow-300 mb-1" />
            <p className="text-white/80 text-xs">Pending Payouts</p>
            <p className="text-white text-lg font-bold">R{totalPending.toLocaleString()}</p>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-0 p-3">
            <TrendingUp className="w-5 h-5 text-green-300 mb-1" />
            <p className="text-white/80 text-xs">Merchants Ready</p>
            <p className="text-white text-lg font-bold">{merchantPayouts.length}</p>
          </Card>
        </div>
      </div>

      <div className="px-4 -mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-white shadow-lg p-1 rounded-xl">
            <TabsTrigger
              value="pending"
              className="flex-1 data-[state=active]:bg-[#00A89D] data-[state=active]:text-white rounded-lg"
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="batches"
              className="flex-1 data-[state=active]:bg-[#00A89D] data-[state=active]:text-white rounded-lg"
            >
              Batches
            </TabsTrigger>
            <TabsTrigger
              value="reconcile"
              className="flex-1 data-[state=active]:bg-[#00A89D] data-[state=active]:text-white rounded-lg"
            >
              Reconcile
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="mt-4 space-y-4">
            <PayoutBatchProcessor
              merchantPayouts={merchantPayouts}
              onCreateBatch={() => createBatchMutation.mutate()}
              isCreating={createBatchMutation.isPending}
            />
          </TabsContent>

          {/* Batches Tab */}
          <TabsContent value="batches" className="mt-4 space-y-4">
            <div className="space-y-3">
              {payoutBatches.map((batch) => {
                const batchSettlements = settlements.filter((s) => s.batchId === batch.id);

                return (
                  <Card key={batch.id} className="bg-white border-0 shadow-md p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{batch.batchNumber}</h3>
                        <p className="text-xs text-gray-500">
                          {moment(batch.batchDate).format('DD MMM YYYY HH:mm')}
                        </p>
                      </div>
                      <Badge
                        className={
                          batch.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : batch.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : batch.status === 'processing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {batch.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {batch.status === 'processing' && (
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        )}
                        {batch.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {batch.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-semibold text-gray-900">
                          R{batch.totalAmount?.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-500">Merchants</p>
                        <p className="text-sm font-semibold text-gray-900">{batch.merchantCount}</p>
                      </div>
                    </div>

                    {batch.status === 'pending' && (
                      <GoldButton
                        className="w-full"
                        size="sm"
                        onClick={() => approveBatchMutation.mutate(batch.id)}
                        disabled={approveBatchMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve Batch
                      </GoldButton>
                    )}

                    {batch.status === 'approved' && (
                      <GoldButton
                        className="w-full"
                        size="sm"
                        onClick={() => processBatchMutation.mutate(batch)}
                        disabled={processBatchMutation.isPending}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Process Payment
                      </GoldButton>
                    )}

                    {batch.status === 'completed' && batch.eftFileUrl && (
                      <GoldButton
                        variant="outline"
                        className="w-full"
                        size="sm"
                        onClick={() => downloadEFT(batch.eftFileUrl, batch.batchNumber)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download EFT File
                      </GoldButton>
                    )}

                    {/* Settlement Details */}
                    <details className="mt-3">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-[#00A89D]">
                        View {batchSettlements.length} settlements
                      </summary>
                      <div className="mt-2 space-y-2">
                        {batchSettlements.map((settlement) => (
                          <div
                            key={settlement.id}
                            className="flex justify-between text-xs bg-gray-50 p-2 rounded"
                          >
                            <span className="text-gray-700">{settlement.merchantName}</span>
                            <span className="font-medium text-gray-900">
                              R{settlement.amount?.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </Card>
                );
              })}

              {payoutBatches.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No payout batches created yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reconciliation Tab */}
          <TabsContent value="reconcile" className="mt-4">
            <ReconciliationTool ledgerEntries={ledgerEntries} settlements={settlements} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
