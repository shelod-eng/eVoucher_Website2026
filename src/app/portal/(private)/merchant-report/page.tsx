'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Layers, 
  Search, 
  Calendar, 
  Coins, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Inbox
} from 'lucide-react';

type ProductCatalogItem = {
  name: string;
  value: number;
  active: boolean;
};

type PayoutTelemetry = {
  status: string;
  lastSettlement: string | null;
  batchRef: string;
};

type MerchantReportItem = {
  merchantName: string;
  email: string;
  onboardingStatus: string;
  productCount: number;
  productCatalogue: ProductCatalogItem[];
  payoutTelemetry: PayoutTelemetry;
  isSponsorReady: boolean;
};

type ReportResponse = {
  timestamp: string;
  refreshIntervalSeconds: number;
  report: MerchantReportItem[];
};

function formatCurrency(value: number) {
  return `R ${Number(value ?? 0).toFixed(2)}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Awaiting activity';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Awaiting activity';
  return date.toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function onboardingStatusTone(status: string) {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'active' || normalized === 'approved') {
    return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300';
  }
  if (normalized === 'pending') {
    return 'border-sky-400/30 bg-sky-400/10 text-sky-300';
  }
  return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
}

function telemetryStatusTone(status: string) {
  const normalized = String(status ?? '').toUpperCase();
  if (normalized === 'SETTLED' || normalized === 'ACKED') {
    return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300';
  }
  if (['CREATED', 'VALIDATED', 'SUBMITTED', 'PENDING'].includes(normalized)) {
    return 'border-amber-400/30 bg-amber-400/10 text-amber-300';
  }
  if (normalized === 'NOT_READY') {
    return 'border-slate-500/30 bg-slate-500/10 text-slate-400';
  }
  return 'border-rose-400/30 bg-rose-400/10 text-rose-300';
}

export default function MerchantReportPage() {
  const [reportData, setReportData] = useState<MerchantReportItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SPONSOR_READY'>('ALL');
  const [expandedMerchant, setExpandedMerchant] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  const fetchReport = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/admin/merchant-report', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`Failed to load report: status ${res.status}`);
      }
      const data: ReportResponse = await res.json();
      setReportData(data.report || []);
      setLastUpdated(data.timestamp || new Date().toISOString());
      setCountdown(data.refreshIntervalSeconds || 60);
    } catch (err: any) {
      setError(err?.message || 'Error occurred while retrieving report.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Set up the countdown and polling logic
  useEffect(() => {
    fetchReport();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          void fetchReport(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchReport]);

  const handleManualRefresh = () => {
    void fetchReport(false);
  };

  // Filter report entries
  const filteredReport = reportData.filter((item) => {
    const matchesSearch = 
      item.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase());

    const onboarding = String(item.onboardingStatus).toUpperCase();
    if (statusFilter === 'ACTIVE') return matchesSearch && onboarding === 'ACTIVE';
    if (statusFilter === 'PENDING') return matchesSearch && onboarding === 'PENDING';
    if (statusFilter === 'SPONSOR_READY') return matchesSearch && item.isSponsorReady;
    return matchesSearch;
  });

  // KPI calculations
  const totalMerchants = reportData.length;
  const activeMerchants = reportData.filter(m => String(m.onboardingStatus).toLowerCase() === 'active').length;
  const sponsorReadyMerchants = reportData.filter(m => m.isSponsorReady).length;
  const pendingVerification = reportData.filter(m => String(m.onboardingStatus).toLowerCase() === 'pending').length;

  const toggleExpandMerchant = (merchantName: string) => {
    if (expandedMerchant === merchantName) {
      setExpandedMerchant(null);
    } else {
      setExpandedMerchant(merchantName);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Title Header Block */}
      <section className="overflow-hidden rounded-[2rem] border border-cyan-300/26 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(10,28,53,0.96),rgba(8,51,68,0.85))] p-6 shadow-[0_26px_90px_rgba(2,8,23,0.55)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-300">
                Sponsor Command Centre
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-[#0d223f] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300"></span>
                </span>
                Refreshes in {countdown}s
              </span>
            </div>
            <h1 className="text-4xl font-semibold text-white">Merchant Product Report</h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-200">
              Provides real-time visibility of onboarded merchants, active product catalogs, and BankServ Adaptor payout readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center gap-2.5 rounded-full border border-cyan-300/30 bg-[#122e57] px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-200 hover:bg-[#183d73] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="rounded-[1.4rem] border border-cyan-400/24 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-50">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/80">Telemetry Source</p>
              <p className="mt-1 font-semibold">BankServ Live Ingestion</p>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-5 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Total Portfolio</p>
          <p className="mt-3 text-4xl font-semibold text-white">{loading && totalMerchants === 0 ? '...' : totalMerchants}</p>
          <p className="mt-2 text-xs text-slate-300">Merchants onboarded in system</p>
        </div>
        <div className="rounded-[1.5rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-5 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Active Merchants</p>
          <p className="mt-3 text-4xl font-semibold text-cyan-300">{loading && activeMerchants === 0 ? '...' : activeMerchants}</p>
          <p className="mt-2 text-xs text-slate-300">Active status merchants</p>
        </div>
        <div className="rounded-[1.5rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-5 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Sponsor Ready</p>
          <p className="mt-3 text-4xl font-semibold text-emerald-300">{loading && sponsorReadyMerchants === 0 ? '...' : sponsorReadyMerchants}</p>
          <p className="mt-2 text-xs text-slate-300">Active & catalog loaded</p>
        </div>
        <div className="rounded-[1.5rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-5 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Pending Verification</p>
          <p className="mt-3 text-4xl font-semibold text-amber-300">{loading && pendingVerification === 0 ? '...' : pendingVerification}</p>
          <p className="mt-2 text-xs text-slate-300">Awaiting compliance review</p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="rounded-[1.6rem] border border-sky-300/18 bg-[#0b1d3a]/95 p-4 shadow-lg flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search merchant business name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-sky-300/12 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white focus:border-cyan-300 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            { key: 'ALL', label: 'All Portfolio' },
            { key: 'ACTIVE', label: 'Active Only' },
            { key: 'PENDING', label: 'Pending Verification' },
            { key: 'SPONSOR_READY', label: 'Sponsor Ready ✨' }
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wider transition ${
                statusFilter === tab.key
                  ? 'bg-cyan-400 text-slate-950 shadow-md'
                  : 'border border-sky-300/16 bg-slate-950/20 text-slate-300 hover:bg-[#122e57]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Error message */}
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Main Report Table */}
      <section className="overflow-hidden rounded-[1.8rem] border border-sky-300/16 bg-[#0b1d3a]/92 shadow-2xl">
        {loading && reportData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-300 mb-4" />
            <p className="text-base font-semibold">Generating live telemetry report...</p>
            <p className="text-sm text-slate-400">Performing joins across merchants, products, and settlements</p>
          </div>
        ) : filteredReport.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Inbox className="h-12 w-12 text-slate-500 mb-4" />
            <p className="text-base font-semibold">No records match the current filters.</p>
            <p className="text-sm">Try modifying your search query or filter selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sky-300/12 bg-slate-950/30 text-xs font-semibold uppercase tracking-widest text-slate-300">
                  <th className="px-6 py-4">Merchant Business</th>
                  <th className="px-6 py-4">Onboarding Status</th>
                  <th className="px-6 py-4">Voucher Catalog</th>
                  <th className="px-6 py-4">BankServ Telemetry</th>
                  <th className="px-6 py-4 text-center">Sponsor Ready</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-300/8">
                {filteredReport.map((merchant) => {
                  const isExpanded = expandedMerchant === merchant.merchantName;
                  return (
                    <>
                      <tr
                        key={merchant.merchantName}
                        className="transition hover:bg-slate-900/40 cursor-pointer"
                        onClick={() => toggleExpandMerchant(merchant.merchantName)}
                      >
                        {/* Name & Contact */}
                        <td className="px-6 py-5">
                          <div className="font-semibold text-white text-base">
                            {merchant.merchantName}
                          </div>
                          <div className="text-xs text-slate-300 mt-0.5">{merchant.email}</div>
                        </td>

                        {/* Onboarding Status */}
                        <td className="px-6 py-5">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${onboardingStatusTone(merchant.onboardingStatus)}`}>
                            {merchant.onboardingStatus}
                          </span>
                        </td>

                        {/* Products Summary */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm text-slate-200">
                            <Layers className="h-4 w-4 text-cyan-300" />
                            <span className="font-semibold">{merchant.productCount}</span>
                            <span>{merchant.productCount === 1 ? 'Product' : 'Products'}</span>
                          </div>
                          {merchant.productCatalogue.length > 0 && (
                            <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-1">
                              {merchant.productCatalogue.slice(0, 3).map((p, idx) => (
                                <span key={idx} className="bg-slate-900/60 px-2 py-0.5 rounded border border-white/5">
                                  {formatCurrency(p.value)}
                                </span>
                              ))}
                              {merchant.productCatalogue.length > 3 && (
                                <span className="text-cyan-300 font-medium">+{merchant.productCatalogue.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Payout Telemetry */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${telemetryStatusTone(merchant.payoutTelemetry.status)}`}>
                              {merchant.payoutTelemetry.status}
                            </span>
                            {merchant.payoutTelemetry.batchRef !== 'N/A' && (
                              <span className="text-xs font-mono text-slate-300 bg-slate-900/40 px-2 py-0.5 rounded">
                                {merchant.payoutTelemetry.batchRef}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                            <Coins className="h-3 w-3 text-emerald-400" />
                            <span>Last Settled: {formatDateTime(merchant.payoutTelemetry.lastSettlement)}</span>
                          </div>
                        </td>

                        {/* Sponsor Ready */}
                        <td className="px-6 py-5 text-center">
                          <div className="inline-flex items-center justify-center">
                            {merchant.isSponsorReady ? (
                              <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 text-xs font-semibold">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                Ready
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400 bg-slate-500/10 px-3 py-1 rounded-full border border-slate-500/20 text-xs font-semibold">
                                <XCircle className="h-4 w-4 text-slate-500 shrink-0" />
                                Unready
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Chevron Collapse */}
                        <td className="pr-6 pl-2 py-5 text-slate-400">
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </td>
                      </tr>

                      {/* Expanded Catalogue Detail */}
                      {isExpanded && (
                        <tr className="bg-slate-950/40">
                          <td colSpan={6} className="px-6 py-4 border-t border-b border-sky-300/8">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">
                                  Full Product Catalogue for {merchant.merchantName}
                                </p>
                                <span className="text-xs text-slate-300">
                                  Idempotency Verified Integration
                                </span>
                              </div>
                              {merchant.productCatalogue.length === 0 ? (
                                <p className="text-sm text-slate-400 py-2">No products configured for this merchant.</p>
                              ) : (
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {merchant.productCatalogue.map((prod, idx) => (
                                    <div
                                      key={idx}
                                      className={`rounded-xl border p-3 flex items-center justify-between ${
                                        prod.active
                                          ? 'border-sky-400/10 bg-[#112544]'
                                          : 'border-slate-800 bg-slate-900/20 opacity-60'
                                      }`}
                                    >
                                      <div>
                                        <p className="font-semibold text-white text-sm">{prod.name}</p>
                                        <p className="text-xs text-slate-400 mt-1">Status: {prod.active ? 'Active' : 'Inactive'}</p>
                                      </div>
                                      <p className="text-lg font-bold text-cyan-300">{formatCurrency(prod.value)}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bottom Status Summary Info */}
      {lastUpdated && (
        <section className="text-center text-xs text-slate-300/75">
          <span>Report Generated at: <b>{formatDateTime(lastUpdated)}</b></span>
          <span className="mx-2">•</span>
          <span>Security Protocol: POPIA and PCI compliant</span>
        </section>
      )}
    </div>
  );
}
