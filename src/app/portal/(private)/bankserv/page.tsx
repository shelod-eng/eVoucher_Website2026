'use client';

import { useEffect, useMemo, useState } from 'react';

type RailSummary = {
  rail: string;
  transactionCount: number;
  totalAmount: number;
  queuedCount: number;
  queuedAmount: number;
};

type PendingTransaction = {
  id: string;
  transaction_reference: string;
  payment_method: string;
  payment_rail: string;
  settlement_amount: number;
  gross_amount: number;
  status: string;
  status_reason?: string | null;
  created_at: string;
  merchant_bank_linkage_id?: string | null;
};

type RecentBatch = {
  id: string;
  batch_number: string;
  status: string;
  total_amount: number;
  merchant_count: number;
  transaction_count: number;
  settlement_rail?: string | null;
  created_at: string;
};

type OverviewPayload = {
  cutOffs: Record<string, string>;
  summary: {
    queuedCount: number;
    batchedCount: number;
    submittedCount: number;
    clearingCount: number;
    settledCount: number;
    rejectedCount: number;
    ignoredCount: number;
    queuedAmount: number;
    settledAmount: number;
  };
  rails: RailSummary[];
  pendingTransactions: PendingTransaction[];
  recentBatches: RecentBatch[];
};

type SettlementRecord = {
  id: string;
  amount: number;
  status: string;
  settlement_reference?: string | null;
  reconciliation_status?: string | null;
  confirmed_at?: string | null;
  created_at?: string | null;
};

type EftProcessingRow = {
  fileType: string;
  fileCode: string;
  fileName: string;
  status: string;
  cutOffTime: string;
  transactionCount: number;
  totalValue: number;
  ackReference: string;
  timestamp: string;
  opsLabel: string;
  controlSum: number;
  fileHash: string;
  rail: string;
};

type LiveFeedEntry = {
  id: string;
  transactionReference: string;
  amount: number;
  status: string;
  createdAt: string;
};

type LiveFeedRail = {
  rail: string;
  label: string;
  transactionCount: number;
  totalValue: number;
  recentEntries: LiveFeedEntry[];
};

type AuditEntry = {
  id: string;
  timestamp: string;
  fileCode: string;
  fileName: string;
  ackReference: string;
  status: string;
  fileHash: string;
  detail: string;
};

type EftProcessingPayload = {
  summary: {
    sodStatus: string;
    eodStatus: string;
    liveQueueCount: number;
    inFlightFiles: number;
    ackedFiles: number;
    nackFiles: number;
  };
  rows: EftProcessingRow[];
  liveFeed: LiveFeedRail[];
  auditLog: AuditEntry[];
};

type BankservTab = 'batch-engine' | 'reconciliation' | 'eft-batch-processing' | 'settlement-dashboard';

function money(value: number) {
  return `R${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function compactDate(value: string | null | undefined) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'N/A';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortDate(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function statusTone(status: string) {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'settled' || normalized === 'confirmed' || normalized === 'acked' || normalized === 'ack received') {
    return 'border-emerald-400/30 bg-emerald-400/14 text-emerald-100';
  }
  if (normalized === 'queued' || normalized === 'batched' || normalized === 'pending_approval' || normalized === 'pending' || normalized === 'ack pending') {
    return 'border-sky-400/30 bg-sky-400/14 text-sky-100';
  }
  if (
    normalized === 'submitted' ||
    normalized === 'submitted_to_bank' ||
    normalized === 'clearing' ||
    normalized === 'approved' ||
    normalized === 'exported'
  ) {
    return 'border-amber-400/30 bg-amber-400/14 text-amber-100';
  }
  if (normalized === 'rejected' || normalized === 'ignored' || normalized === 'failed' || normalized === 'nacked' || normalized === 'ack failed' || normalized === 'nck') {
    return 'border-rose-400/30 bg-rose-400/14 text-rose-100';
  }
  return 'border-slate-400/30 bg-slate-400/10 text-slate-100';
}

function buildCalendar() {
  const base = new Date();
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = first.getDay();
  const cells: Array<{ label: string; isCurrentMonth: boolean; iso: string | null }> = [];

  for (let i = 0; i < offset; i += 1) {
    cells.push({ label: '', isCurrentMonth: false, iso: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({
      label: String(day),
      isCurrentMonth: true,
      iso: date.toISOString(),
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ label: '', isCurrentMonth: false, iso: null });
  }
  return {
    monthLabel: base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    cells,
  };
}

const fallbackData: OverviewPayload = {
  cutOffs: {
    EFT: '14:00 SAST',
    CARD: '23:59 SAST',
    RTC: '23:59 SAST',
    NAEDO: '10:00 SAST',
    SAMOS: '17:00 SAST',
  },
  summary: {
    queuedCount: 0,
    batchedCount: 0,
    submittedCount: 0,
    clearingCount: 0,
    settledCount: 0,
    rejectedCount: 0,
    ignoredCount: 0,
    queuedAmount: 0,
    settledAmount: 0,
  },
  rails: [
    { rail: 'EFT', transactionCount: 0, totalAmount: 0, queuedCount: 0, queuedAmount: 0 },
    { rail: 'CARD', transactionCount: 0, totalAmount: 0, queuedCount: 0, queuedAmount: 0 },
    { rail: 'PAYFAST', transactionCount: 0, totalAmount: 0, queuedCount: 0, queuedAmount: 0 },
    { rail: 'WALLET', transactionCount: 0, totalAmount: 0, queuedCount: 0, queuedAmount: 0 },
  ],
  pendingTransactions: [],
  recentBatches: [],
};

const fallbackEftProcessingData: EftProcessingPayload = {
  summary: {
    sodStatus: 'ACKED',
    eodStatus: 'PENDING',
    liveQueueCount: 0,
    inFlightFiles: 1,
    ackedFiles: 2,
    nackFiles: 0,
  },
  rows: [
    {
      fileType: 'SOD',
      fileCode: 'ESGBZ1C',
      fileName: 'ESGBZ1C_260519.txt',
      status: 'ACKED',
      cutOffTime: '08:00 SAST',
      transactionCount: 0,
      totalValue: 0,
      ackReference: 'ESGBZ1C_ACK_260519_001',
      timestamp: '2026-05-19T08:00:00.000Z',
      opsLabel: 'Auto-generated at start of day',
      controlSum: 0,
      fileHash: 'A1B2C3D4E5F6',
      rail: 'SYSTEM',
    },
    {
      fileType: 'EFT Batch',
      fileCode: 'ESGB001D',
      fileName: 'ESGB001D_260519_0001.txt',
      status: 'PENDING',
      cutOffTime: '14:00 SAST',
      transactionCount: 0,
      totalValue: 0,
      ackReference: 'Pending',
      timestamp: '2026-05-19T10:30:00.000Z',
      opsLabel: 'Awaiting live EFT settlement traffic',
      controlSum: 0,
      fileHash: 'B2C3D4E5F6A7',
      rail: 'EFT',
    },
    {
      fileType: 'Card Batch',
      fileCode: 'ESGC001D',
      fileName: 'ESGC001D_260519_0001.txt',
      status: 'PENDING',
      cutOffTime: '23:59 SAST',
      transactionCount: 0,
      totalValue: 0,
      ackReference: 'Pending',
      timestamp: '2026-05-19T15:45:00.000Z',
      opsLabel: 'Waiting for card-funded merchant settlement entries',
      controlSum: 0,
      fileHash: 'C3D4E5F6A7B8',
      rail: 'CARD',
    },
    {
      fileType: 'EOD',
      fileCode: 'ESGBZ9C',
      fileName: 'ESGBZ9C_260519.txt',
      status: 'PENDING',
      cutOffTime: '18:00 SAST',
      transactionCount: 0,
      totalValue: 0,
      ackReference: 'Pending',
      timestamp: '2026-05-19T18:00:00.000Z',
      opsLabel: 'Will auto-generate after cut-off processing',
      controlSum: 0,
      fileHash: 'D4E5F6A7B8C9',
      rail: 'SYSTEM',
    },
  ],
  liveFeed: [
    { rail: 'EFT', label: 'EFT Payments', transactionCount: 0, totalValue: 0, recentEntries: [] },
    { rail: 'CARD', label: 'Card Payments', transactionCount: 0, totalValue: 0, recentEntries: [] },
    { rail: 'WALLET', label: 'Wallet Payments', transactionCount: 0, totalValue: 0, recentEntries: [] },
  ],
  auditLog: [],
};

export default function BankservPortalPage() {
  const [activeTab, setActiveTab] = useState<BankservTab>('eft-batch-processing');
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [eftProcessing, setEftProcessing] = useState<EftProcessingPayload | null>(null);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadBankservWorkspace = async () => {
    const [overviewResult, settlementsResult, eftResult] = await Promise.allSettled([
      fetch('/api/billing/bankserv/overview', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      }),
      fetch('/api/billing/settlements', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      }),
      fetch('/api/billing/bankserv/eft-processing', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      }),
    ]);

    const warnings: string[] = [];

    if (overviewResult.status === 'fulfilled') {
      const overviewPayload = await overviewResult.value.json().catch(() => ({}));
      if (overviewResult.value.ok) {
        setData(overviewPayload.data as OverviewPayload);
      } else {
        warnings.push(String(overviewPayload?.error || 'BankServ overview unavailable.'));
      }
    } else {
      warnings.push('BankServ overview unavailable.');
    }

    if (settlementsResult.status === 'fulfilled') {
      const settlementsPayload = await settlementsResult.value.json().catch(() => ({}));
      if (settlementsResult.value.ok) {
        setSettlements(Array.isArray(settlementsPayload?.data) ? settlementsPayload.data : []);
      } else {
        warnings.push(String(settlementsPayload?.error || 'Settlements feed unavailable.'));
        setSettlements([]);
      }
    } else {
      warnings.push('Settlements feed unavailable.');
      setSettlements([]);
    }

    if (eftResult.status === 'fulfilled') {
      const eftPayload = await eftResult.value.json().catch(() => ({}));
      if (eftResult.value.ok) {
        setEftProcessing(eftPayload.data as EftProcessingPayload);
      } else {
        warnings.push(String(eftPayload?.error || 'EFT batch processing feed unavailable.'));
      }
    } else {
      warnings.push('EFT batch processing feed unavailable.');
    }

    setError(warnings.join(' '));
  };

  useEffect(() => {
    let cancelled = false;

    const run = async (showLoading = false) => {
      try {
        if (showLoading) setLoading(true);
        await loadBankservWorkspace();
      } catch (err: any) {
        if (!cancelled) {
          setError(String(err?.message || 'Failed to load BankServ workspace.'));
        }
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    };

    void run(true);
    const intervalId = window.setInterval(() => {
      void run(false);
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const viewData = data ?? fallbackData;
  const eftView = eftProcessing ?? fallbackEftProcessingData;
  const schemaMissing = error.toLowerCase().includes('schema');
  const isEftFocus = activeTab === 'eft-batch-processing';
  const selectedBatch = useMemo(() => {
    if (!viewData.recentBatches.length) return null;
    if (!selectedBatchId) return viewData.recentBatches[0];
    return viewData.recentBatches.find((batch) => batch.id === selectedBatchId) ?? viewData.recentBatches[0];
  }, [selectedBatchId, viewData.recentBatches]);

  useEffect(() => {
    if (!selectedBatchId && viewData.recentBatches[0]?.id) {
      setSelectedBatchId(viewData.recentBatches[0].id);
    }
  }, [selectedBatchId, viewData.recentBatches]);

  const tiles = useMemo(
    () => [
      { label: 'Queued Transactions', value: String(viewData.summary.queuedCount), accent: 'text-sky-100' },
      { label: 'Queued Amount', value: money(viewData.summary.queuedAmount), accent: 'text-cyan-100' },
      { label: 'Settled Amount', value: money(viewData.summary.settledAmount), accent: 'text-emerald-100' },
      {
        label: 'In-Flight Batches',
        value: String(viewData.summary.submittedCount + viewData.summary.clearingCount),
        accent: 'text-amber-100',
      },
    ],
    [viewData.summary]
  );

  const calendar = useMemo(() => buildCalendar(), []);

  const projectedSettlements = useMemo(() => {
    const totalsByDay = new Map<string, number>();
    settlements.forEach((row) => {
      const key = shortDate(row.confirmed_at ?? row.created_at ?? null);
      if (!key) return;
      totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + Number(row.amount ?? 0));
    });
    return totalsByDay;
  }, [settlements]);

  const handleCreateBatch = async () => {
    try {
      setActionLoading('create');
      setActionMessage('');
      const response = await fetch('/api/billing/run-engine', {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to create settlement batch.');
      await loadBankservWorkspace();
      setActionMessage(`Batch engine ran successfully. Batch ID: ${payload?.data?.batchId ?? 'created'}`);
    } catch (err: any) {
      setActionMessage(String(err?.message || 'Failed to create settlement batch.'));
    } finally {
      setActionLoading(null);
    }
  };

  const runBatchAction = async (action: 'export' | 'submit' | 'confirm') => {
    if (!selectedBatch?.id) {
      setActionMessage('Select a batch first.');
      return;
    }
    try {
      setActionLoading(action);
      setActionMessage('');
      const response = await fetch(`/api/billing/settlement-batches/${selectedBatch.id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || `Failed to ${action} batch.`);
      await loadBankservWorkspace();
      setActionMessage(`${action[0].toUpperCase()}${action.slice(1)} action completed for ${selectedBatch.batch_number}.`);
    } catch (err: any) {
      setActionMessage(String(err?.message || `Failed to ${action} batch.`));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunReconciliation = async () => {
    try {
      setActionLoading('reconcile');
      setActionMessage('');
      const response = await fetch('/api/billing/reconcile', {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to run reconciliation.');
      await loadBankservWorkspace();
      setActionMessage(`Reconciliation complete. Updated ${payload?.data?.updated ?? 0} settlement rows.`);
    } catch (err: any) {
      setActionMessage(String(err?.message || 'Failed to run reconciliation.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefreshWorkspace = async () => {
    try {
      setActionLoading('refresh');
      setActionMessage('');
      await loadBankservWorkspace();
      setActionMessage('BankServ EFT processing view refreshed.');
    } catch (err: any) {
      setActionMessage(String(err?.message || 'Failed to refresh BankServ workspace.'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {!isEftFocus ? (
        <section className="overflow-hidden rounded-[2rem] border border-cyan-300/26 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(10,28,53,0.96),rgba(8,51,68,0.85))] p-6 shadow-[0_26px_90px_rgba(2,8,23,0.55)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.38em] text-cyan-200">
                Settlement Portal
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-white">BankServ Adaptor Control Tower</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
                Dedicated payout operations workspace for batch creation, submission control,
                reconciliation, and merchant settlement visibility behind the eVoucher checkout flow.
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-amber-300/35 bg-amber-300/12 px-5 py-4 text-sm text-amber-50">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-100">Mode</p>
              <p className="mt-1 font-semibold">Operational prototype with live repo integrations</p>
            </div>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="rounded-[1.6rem] border border-cyan-300/18 bg-[#0b1d3a]/95 p-8 text-lg font-medium text-white">
          Loading BankServ workspace...
        </div>
      ) : (
        <>
          {error && !isEftFocus ? (
            <div
              className={`rounded-[1.5rem] border p-5 ${
                schemaMissing
                  ? 'border-amber-400/24 bg-amber-400/12 text-amber-50'
                  : 'border-rose-400/24 bg-rose-500/12 text-rose-50'
              }`}
            >
              <p className="text-base font-semibold">
                {schemaMissing ? 'BankServ adaptor schema is not deployed yet.' : error}
              </p>
              {schemaMissing ? (
                <p className="mt-2 text-sm text-amber-100/90">
                  The full UI below is now visible. Apply the new migration to unlock live adaptor
                  queue and batch data.
                </p>
              ) : null}
            </div>
          ) : null}

          <section className="rounded-[1.7rem] border border-cyan-300/22 bg-[#091b35]/96 p-4 shadow-[0_18px_56px_rgba(2,8,23,0.38)]">
            <div className="flex flex-wrap gap-3">
            {([
              { key: 'batch-engine', label: 'Batch Engine' },
              { key: 'reconciliation', label: 'Reconciliation' },
              { key: 'eft-batch-processing', label: 'EFT Batch Processing' },
              { key: 'settlement-dashboard', label: 'Settlement Dashboard' },
            ] as Array<{ key: BankservTab; label: string }>).map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`min-w-[220px] rounded-[1.2rem] border px-5 py-4 text-left text-sm font-semibold tracking-[0.04em] transition ${
                    active
                      ? 'border-cyan-200 bg-[linear-gradient(135deg,#67e8f9,#22d3ee)] text-slate-950 shadow-[0_12px_36px_rgba(34,211,238,0.28)]'
                      : 'border-sky-300/26 bg-[#10284b] text-white hover:border-cyan-300/70 hover:bg-[#153766]'
                  }`}
                >
                  <span className="block text-[11px] font-bold uppercase tracking-[0.24em] opacity-75">
                    Workspace
                  </span>
                  <span className="mt-1 block text-base font-semibold">{tab.label}</span>
                </button>
              );
            })}
            </div>
          </section>

          {!isEftFocus ? (
            <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {tiles.map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-[1.45rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-5 shadow-[0_18px_48px_rgba(2,8,23,0.38)]"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
                    {tile.label}
                  </p>
                  <p className={`mt-3 text-3xl font-semibold ${tile.accent}`}>{tile.value}</p>
                </div>
              ))}
            </section>
          ) : null}

          {actionMessage ? (
            <div className="rounded-[1.3rem] border border-cyan-300/24 bg-cyan-300/10 px-5 py-4 text-sm font-medium text-cyan-50">
              {actionMessage}
            </div>
          ) : null}

          {activeTab === 'batch-engine' ? (
            <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
              <section className="rounded-[1.7rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-6 shadow-[0_18px_56px_rgba(2,8,23,0.38)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
                      Batch Engine
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Create and operate settlement batches</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleCreateBatch}
                      className="rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                    >
                      {actionLoading === 'create' ? 'Creating...' : 'Create Batch'}
                    </button>
                    <button
                      type="button"
                      onClick={() => runBatchAction('export')}
                      disabled={!selectedBatch}
                      className="rounded-full border border-sky-300/30 bg-[#12315d] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-300/55 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === 'export' ? 'Exporting...' : 'Export'}
                    </button>
                    <button
                      type="button"
                      onClick={() => runBatchAction('submit')}
                      disabled={!selectedBatch}
                      className="rounded-full border border-sky-300/30 bg-[#12315d] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-300/55 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === 'submit' ? 'Submitting...' : 'Submit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => runBatchAction('confirm')}
                      disabled={!selectedBatch}
                      className="rounded-full border border-emerald-300/35 bg-emerald-400/14 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:border-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === 'confirm' ? 'Confirming...' : 'Confirm'}
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-sky-300/12 bg-slate-950/22 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      Rail Summary
                    </p>
                    <div className="mt-4 space-y-3">
                      {viewData.rails.map((rail) => (
                        <div key={rail.rail} className="rounded-xl border border-sky-300/10 bg-[#112544] px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-white">{rail.rail}</p>
                              <p className="mt-1 text-xs text-slate-300">
                                Cut-off {viewData.cutOffs[rail.rail] ?? 'TBD'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-cyan-100">{money(rail.totalAmount)}</p>
                              <p className="mt-1 text-xs text-slate-300">{rail.transactionCount} transactions</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.2rem] border border-sky-300/12 bg-slate-950/22 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      Batch Detail View
                    </p>
                    {selectedBatch ? (
                      <div className="mt-4 space-y-4">
                        <div className="rounded-xl border border-sky-300/10 bg-[#112544] p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold text-white">{selectedBatch.batch_number}</p>
                              <p className="mt-1 text-sm text-slate-300">
                                {selectedBatch.settlement_rail || 'Mixed rail'} batch
                              </p>
                            </div>
                            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${statusTone(selectedBatch.status)}`}>
                              {selectedBatch.status}
                            </span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Amount</p>
                              <p className="mt-1 font-semibold text-emerald-100">{money(selectedBatch.total_amount)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Transactions</p>
                              <p className="mt-1 font-semibold text-white">{selectedBatch.transaction_count}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Merchants</p>
                              <p className="mt-1 font-semibold text-white">{selectedBatch.merchant_count}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Created</p>
                              <p className="mt-1 font-semibold text-white">{formatDate(selectedBatch.created_at)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-sky-300/10 bg-[#112544] p-4">
                          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                            State Machine Reference
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {['CREATED', 'VALIDATED', 'SUBMITTED', 'CLEARING', 'SETTLED'].map((step) => (
                              <span
                                key={step}
                                className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs font-semibold text-sky-100"
                              >
                                {step}
                              </span>
                            ))}
                            <span className="rounded-full border border-rose-300/25 bg-rose-300/12 px-3 py-2 text-xs font-semibold text-rose-100">
                              ANY -&gt; REJECTED
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-sky-300/10 bg-[#112544] px-4 py-5 text-slate-300">
                        No batch selected yet. Create a batch to begin.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-[1.7rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-6 shadow-[0_18px_56px_rgba(2,8,23,0.38)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
                  Recent Batches
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Batch queue and transaction intake</h2>

                <div className="mt-5 space-y-3">
                  {viewData.recentBatches.length === 0 ? (
                    <div className="rounded-xl border border-sky-300/10 bg-slate-950/22 px-4 py-5 text-slate-300">
                      {schemaMissing
                        ? 'Schema not deployed yet. Once migrated, created batches will appear here.'
                        : 'No settlement batches created yet.'}
                    </div>
                  ) : (
                    viewData.recentBatches.map((batch) => {
                      const selected = selectedBatch?.id === batch.id;
                      return (
                        <button
                          key={batch.id}
                          type="button"
                          onClick={() => setSelectedBatchId(batch.id)}
                          className={`w-full rounded-[1.1rem] border px-4 py-4 text-left transition ${
                            selected
                              ? 'border-cyan-300/55 bg-cyan-300/12'
                              : 'border-sky-300/10 bg-slate-950/22 hover:border-cyan-300/28 hover:bg-[#112544]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-white">{batch.batch_number}</p>
                              <p className="mt-1 text-sm text-slate-300">
                                {batch.transaction_count} txns | {batch.settlement_rail || 'Mixed'}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">{formatDate(batch.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-emerald-100">{money(batch.total_amount)}</p>
                              <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${statusTone(batch.status)}`}>
                                {batch.status}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="mt-6 rounded-[1.2rem] border border-sky-300/12 bg-slate-950/22 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                    Pending Settlement Transactions
                  </p>
                  <div className="mt-4 space-y-3">
                    {viewData.pendingTransactions.length === 0 ? (
                      <div className="rounded-xl border border-sky-300/10 bg-[#112544] px-4 py-4 text-slate-300">
                        {schemaMissing
                          ? 'Schema not deployed yet. Queued settlement transactions will appear here after migration.'
                          : 'No queued settlement transactions yet.'}
                      </div>
                    ) : (
                      viewData.pendingTransactions.slice(0, 6).map((transaction) => (
                        <div key={transaction.id} className="rounded-xl border border-sky-300/10 bg-[#112544] p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-white">{transaction.transaction_reference}</p>
                              <p className="mt-1 text-sm text-slate-300">
                                {transaction.payment_rail} via {transaction.payment_method}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">{formatDate(transaction.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-emerald-100">{money(transaction.settlement_amount)}</p>
                              <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${statusTone(transaction.status)}`}>
                                {transaction.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === 'eft-batch-processing' ? (
            <div className="space-y-6">
              <section className="rounded-[1.7rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-6 shadow-[0_18px_56px_rgba(2,8,23,0.38)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
                      EFT Batch Processing
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">Real-time file lifecycle overview</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-200">
                      Sponsor-facing command view for Start-of-Day, dynamic EFT and card batch creation,
                      ACK/NCK posture, and End-of-Day file readiness as transactions flow in from
                      eVoucher checkout.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshWorkspace}
                    className="rounded-full border border-cyan-300/35 bg-cyan-300/12 px-4 py-2.5 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200"
                  >
                    {actionLoading === 'refresh' ? 'Refreshing...' : 'Refresh Log'}
                  </button>
                </div>

                {error ? (
                  <div className="mt-5 rounded-[1.2rem] border border-amber-400/24 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
                    {schemaMissing
                      ? 'BankServ schema is not deployed yet. Showing stable demo/fallback lifecycle data until the migration is applied.'
                      : error}
                  </div>
                ) : null}

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.2rem] border border-sky-300/10 bg-slate-950/22 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      Start-of-Day
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${statusTone(eftView.summary.sodStatus)}`}>
                        {eftView.summary.sodStatus}
                      </span>
                      <span className="text-sm font-semibold text-cyan-100">ESGBZ1C</span>
                    </div>
                  </div>
                  <div className="rounded-[1.2rem] border border-sky-300/10 bg-slate-950/22 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      Live Queue
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-white">{eftView.summary.liveQueueCount}</p>
                    <p className="mt-1 text-sm text-slate-300">Queued adaptor transactions awaiting file assignment</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-sky-300/10 bg-slate-950/22 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      ACKED Files
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-emerald-100">{eftView.summary.ackedFiles}</p>
                    <p className="mt-1 text-sm text-slate-300">Files already acknowledged by BankServ/FNB flow</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-sky-300/10 bg-slate-950/22 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      End-of-Day
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${statusTone(eftView.summary.eodStatus)}`}>
                        {eftView.summary.eodStatus}
                      </span>
                      <span className="text-sm font-semibold text-cyan-100">ESGBZ9C</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-[1.7rem] border border-sky-300/18 bg-[#0b1d3a]/95 shadow-[0_18px_56px_rgba(2,8,23,0.38)]">
                <div className="border-b border-sky-300/10 px-6 py-5">
                  <h3 className="text-xl font-semibold text-white">Unified BankServ batch file table</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    SOD, EFT, Card, and EOD files tracked together with cut-off guidance, ACK/NCK status,
                    control sums, and operations context.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-sky-300/10 text-sm">
                    <thead className="bg-slate-950/25 text-slate-300">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Batch File</th>
                        <th className="px-4 py-3 text-left font-semibold">Type</th>
                        <th className="px-4 py-3 text-left font-semibold">Transactions</th>
                        <th className="px-4 py-3 text-left font-semibold">Total Value</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Cut-off</th>
                        <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                        <th className="px-4 py-3 text-left font-semibold">ACK/NCK Ref</th>
                        <th className="px-4 py-3 text-left font-semibold">Ops</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-300/10">
                      {eftView.rows.map((row) => (
                        <tr key={`${row.fileCode}-${row.fileName}`} className="text-slate-100">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-white">{row.fileCode}</p>
                              <p className="mt-1 text-xs text-slate-400">{row.fileName}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-white">{row.fileType}</p>
                              <p className="mt-1 text-xs text-slate-400">{row.rail}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-semibold text-white">{row.transactionCount}</td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-emerald-100">{money(row.totalValue)}</p>
                              <p className="mt-1 text-xs text-slate-400">Control sum {money(row.controlSum)}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${statusTone(row.status)}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-200">{row.cutOffTime}</td>
                          <td className="px-4 py-4 text-slate-200">{compactDate(row.timestamp)}</td>
                          <td className="px-4 py-4">
                            <p className="font-medium text-cyan-100">{row.ackReference}</p>
                            <p className="mt-1 text-xs text-slate-400">Hash {row.fileHash}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-2">
                              <span className="text-xs text-slate-300">{row.opsLabel}</span>
                              <button
                                type="button"
                                className="rounded-full border border-sky-300/30 bg-[#12315d] px-3 py-2 text-xs font-semibold text-white transition hover:border-cyan-300/55"
                              >
                                {row.fileType === 'SOD' || row.fileType === 'EOD'
                                  ? 'Auto-generated'
                                  : row.status === 'PENDING'
                                    ? 'Send to BankServ'
                                    : row.status === 'NACKED'
                                      ? 'Review NCK'
                                      : 'Generate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
                <div className="rounded-[1.7rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-6 shadow-[0_18px_56px_rgba(2,8,23,0.38)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
                    Live Transaction Feed
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Rail intake before cut-off</h3>

                  <div className="mt-5 grid gap-4 xl:grid-cols-3">
                    {eftView.liveFeed.map((rail) => (
                      <div key={rail.rail} className="rounded-[1.2rem] border border-sky-300/10 bg-slate-950/22 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{rail.label}</p>
                            <p className="mt-1 text-sm text-slate-300">
                              {rail.transactionCount} transactions | {money(rail.totalValue)} total
                            </p>
                          </div>
                          <span className="rounded-full border border-cyan-300/24 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-50">
                            {rail.rail}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2">
                          {rail.recentEntries.length === 0 ? (
                            <div className="rounded-xl border border-sky-300/10 bg-[#112544] px-3 py-3 text-sm text-slate-300">
                              No live entries yet.
                            </div>
                          ) : (
                            rail.recentEntries.map((entry) => (
                              <div key={entry.id} className="rounded-xl border border-sky-300/10 bg-[#112544] px-3 py-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-white">{entry.transactionReference}</p>
                                    <p className="mt-1 text-xs text-slate-400">{compactDate(entry.createdAt)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-emerald-100">{money(entry.amount)}</p>
                                    <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${statusTone(entry.status)}`}>
                                      {entry.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.7rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-6 shadow-[0_18px_56px_rgba(2,8,23,0.38)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
                    OPS Audit Log
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">ACK/NCK and file metadata trail</h3>

                  <div className="mt-5 space-y-3">
                    {eftView.auditLog.length === 0 ? (
                      <div className="rounded-[1.1rem] border border-sky-300/10 bg-slate-950/22 p-4 text-slate-300">
                        Audit rows will appear here as files are generated and acknowledged.
                      </div>
                    ) : (
                      eftView.auditLog.map((entry) => (
                        <div key={entry.id} className="rounded-[1.1rem] border border-sky-300/10 bg-slate-950/22 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-white">{entry.fileCode}</p>
                              <p className="mt-1 text-sm text-slate-300">{entry.fileName}</p>
                              <p className="mt-1 text-xs text-slate-400">{compactDate(entry.timestamp)}</p>
                            </div>
                            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${statusTone(entry.status)}`}>
                              {entry.status}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-slate-300">
                            <p>ACK/NCK Ref: <span className="font-semibold text-cyan-100">{entry.ackReference}</span></p>
                            <p>File Hash: <span className="font-semibold text-cyan-100">{entry.fileHash}</span></p>
                            <p>{entry.detail}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === 'reconciliation' ? (
            <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
              <section className="rounded-[1.7rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-6 shadow-[0_18px_56px_rgba(2,8,23,0.38)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
                      Reconciliation Screen
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">CSV matching and statement review</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunReconciliation}
                    className="rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                  >
                    {actionLoading === 'reconcile' ? 'Running...' : 'Run Reconciliation'}
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.2rem] border border-sky-300/10 bg-slate-950/22 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Matched</p>
                    <p className="mt-3 text-3xl font-semibold text-emerald-100">
                      {settlements.filter((row) => String(row.reconciliation_status).toLowerCase() === 'matched').length}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] border border-sky-300/10 bg-slate-950/22 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Pending</p>
                    <p className="mt-3 text-3xl font-semibold text-amber-100">
                      {settlements.filter((row) => String(row.reconciliation_status).toLowerCase() === 'pending').length}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] border border-sky-300/10 bg-slate-950/22 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Disputed</p>
                    <p className="mt-3 text-3xl font-semibold text-rose-100">
                      {settlements.filter((row) => String(row.reconciliation_status).toLowerCase() === 'disputed').length}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[1.2rem] border border-sky-300/10 bg-slate-950/22 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                    Reconciliation Actions
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-sky-300/30 bg-[#12315d] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-300/55"
                    >
                      Generate Mock CSV
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-sky-300/30 bg-[#12315d] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-300/55"
                    >
                      Upload CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleRunReconciliation}
                      className="rounded-full border border-emerald-300/35 bg-emerald-400/14 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:border-emerald-200"
                    >
                      Run Reconciliation
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.7rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-6 shadow-[0_18px_56px_rgba(2,8,23,0.38)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
                  Reconciliation Result Grid
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Settlement statement comparison</h2>

                <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-sky-300/10">
                  <table className="min-w-full divide-y divide-sky-300/10 text-sm">
                    <thead className="bg-slate-950/25 text-slate-300">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Reference</th>
                        <th className="px-4 py-3 text-left font-semibold">Amount</th>
                        <th className="px-4 py-3 text-left font-semibold">Batch Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Recon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-300/10">
                      {settlements.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-slate-300">
                            No settlement rows available yet.
                          </td>
                        </tr>
                      ) : (
                        settlements.slice(0, 10).map((row) => (
                          <tr key={row.id} className="text-slate-100">
                            <td className="px-4 py-3">{row.settlement_reference || row.id.slice(0, 8)}</td>
                            <td className="px-4 py-3">{money(row.amount)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${statusTone(row.status)}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${statusTone(row.reconciliation_status || 'pending')}`}>
                                {row.reconciliation_status || 'pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === 'settlement-dashboard' ? (
            <div className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
              <section className="rounded-[1.7rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-6 shadow-[0_18px_56px_rgba(2,8,23,0.38)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
                      Settlement Dashboard / Calendar
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{calendar.monthLabel}</h2>
                  </div>
                  <div className="rounded-full border border-cyan-300/28 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-50">
                    Sponsor calendar view
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendar.cells.map((cell, index) => {
                    const amount = cell.iso ? projectedSettlements.get(shortDate(cell.iso)) ?? 0 : 0;
                    return (
                      <div
                        key={`${cell.label}-${index}`}
                        className={`min-h-[104px] rounded-[1rem] border p-3 ${
                          cell.isCurrentMonth
                            ? 'border-sky-300/12 bg-slate-950/22'
                            : 'border-slate-700/30 bg-slate-950/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cell.isCurrentMonth ? 'text-sm font-semibold text-white' : 'text-sm text-slate-600'}>
                            {cell.label}
                          </span>
                          {amount > 0 ? (
                            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/12 px-2 py-1 text-[10px] font-bold text-emerald-50">
                              {money(amount)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-6">
                <div className="rounded-[1.7rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-6 shadow-[0_18px_56px_rgba(2,8,23,0.38)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
                    Upcoming Settlements
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Next expected payouts</h2>

                  <div className="mt-5 space-y-3">
                    {settlements.slice(0, 6).map((row) => (
                      <div key={row.id} className="rounded-[1.1rem] border border-sky-300/10 bg-slate-950/22 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-white">{row.settlement_reference || row.id.slice(0, 8)}</p>
                            <p className="mt-1 text-sm text-slate-300">{formatDate(row.confirmed_at ?? row.created_at ?? null)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-100">{money(row.amount)}</p>
                            <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${statusTone(row.status)}`}>
                              {row.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {settlements.length === 0 ? (
                      <div className="rounded-[1.1rem] border border-sky-300/10 bg-slate-950/22 p-4 text-slate-300">
                        No settlement schedule available yet.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[1.7rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-6 shadow-[0_18px_56px_rgba(2,8,23,0.38)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-300">
                    Rail Cut-Off Reference
                  </p>
                  <div className="mt-5 space-y-3">
                    {Object.entries(viewData.cutOffs).map(([rail, cutOff]) => (
                      <div key={rail} className="flex items-center justify-between rounded-[1rem] border border-sky-300/10 bg-slate-950/22 px-4 py-3">
                        <span className="font-semibold text-white">{rail}</span>
                        <span className="text-sm font-semibold text-cyan-100">{cutOff}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
