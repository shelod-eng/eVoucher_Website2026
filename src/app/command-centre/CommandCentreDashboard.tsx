'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  Activity,
  BadgeCheck,
  Banknote,
  Building2,
  ClipboardCheck,
  Database,
  FileWarning,
  Gauge,
  HeartPulse,
  Landmark,
  Lock,
  Network,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  TicketCheck,
  Users,
  WalletCards,
} from 'lucide-react';

import {
  CommandCentrePayload,
  EMPTY_STATUS_METRIC,
  Metric,
  formatMetricValue,
  formatTimestamp,
  healthMetric,
  isDistributionMetric,
  isFreshnessMetric,
  metricEntries,
  statusTone,
  worstEvidenceStatus,
} from './view-model';

type Props = {
  userEmail: string;
  role: string | null;
};

type LoadState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: CommandCentrePayload; error: null }
  | { status: 'error'; data: null; error: string };

const dimensionConfig = [
  {
    key: 'customer',
    title: 'Customer',
    icon: Users,
    flow: ['Consumer', 'Product', 'Purchase', 'Payment'],
    color: 'border-blue-200 bg-blue-50 text-blue-900',
  },
  {
    key: 'commerce',
    title: 'Commerce',
    icon: ShoppingBag,
    flow: ['Merchant', 'Product', 'Voucher', 'Redemption'],
    color: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  {
    key: 'financial',
    title: 'Financial',
    icon: Banknote,
    flow: ['Payment', 'Billing', 'Settlement', 'Reconciliation'],
    color: 'border-slate-300 bg-slate-50 text-slate-900',
  },
  {
    key: 'governance',
    title: 'Governance',
    icon: ShieldCheck,
    flow: ['Monitoring', 'Audit', 'Exceptions', 'Reporting'],
    color: 'border-violet-200 bg-violet-50 text-violet-900',
  },
] as const;

const metricLabels: Record<string, string> = {
  consumerRegistrations: 'Consumer registrations',
  paymentTransactions: 'Payment transactions',
  wallet: 'Wallet activity',
  voucherLifecycle: 'Voucher lifecycle',
  merchants: 'Merchants',
  products: 'Merchant products',
  issuedVouchers: 'Issued vouchers',
  redeemedVouchers: 'Redeemed vouchers',
  payments: 'Payments',
  paymentProvider: 'Payment provider',
  billingEvents: 'Billing events',
  ledger: 'Ledger',
  settlement: 'Settlements',
  reconciliation: 'Reconciliation runs',
  reconciliationFreshness: 'Reconciliation freshness',
  settlementBatchStatus: 'Settlement batch health',
  bankServStatus: 'BankServ',
  bankServAckNckStatus: 'ACK/NCK',
  audit: 'Audit events',
  exceptions: 'Reconciliation exceptions',
  platformEvents: 'Platform events',
  platformOutbox: 'Outbox',
  platformEventStatus: 'Platform event health',
  platformOutboxStatus: 'Outbox health',
  fraudAlertStatus: 'Fraud alerts',
  merchantKycStatus: 'KYC/compliance',
  merchantOnboardingVerifications: 'Onboarding verification',
  evidenceStatus: 'Evidence status',
  securityControlPosture: 'Security controls',
};

const healthRows = [
  { key: 'website', label: 'Website', icon: Gauge, source: 'UI route /command-centre' },
  { key: 'database', label: 'Database', icon: Database, source: 'Aggregate table query success' },
  {
    key: 'paymentProvider',
    label: 'Payment',
    icon: WalletCards,
    source: 'Payment provider factory',
  },
  { key: 'billing', label: 'Billing', icon: Activity, source: 'public.billing_events' },
  { key: 'bankServ', label: 'BankServ', icon: Landmark, source: 'Canonical BankServ adaptor' },
  {
    key: 'reconciliationFreshness',
    label: 'Reconciliation',
    icon: ClipboardCheck,
    source: 'public.reconciliation_runs',
  },
  {
    key: 'platformEvents',
    label: 'Platform Events',
    icon: Network,
    source: 'public.platform_events',
  },
  { key: 'auditTrail', label: 'Audit/Governance', icon: Lock, source: 'public.audit_events' },
] as const;

const exceptionRows = [
  { key: 'failedPayments', label: 'Failed Payments', metric: null },
  { key: 'platformEvents', label: 'Platform Events', metric: 'platformEventStatus' },
  { key: 'outbox', label: 'Outbox', metric: 'platformOutboxStatus' },
  { key: 'reconciliation', label: 'Reconciliation', metric: 'exceptions' },
  { key: 'bankserv', label: 'BankServ ACK/NCK', metric: 'bankServAckNckStatus' },
  { key: 'settlement', label: 'Settlement', metric: 'settlementBatchStatus' },
  { key: 'voucher', label: 'Voucher', metric: null },
  { key: 'fraud', label: 'Fraud/Governance', metric: 'fraudAlertStatus' },
] as const;

function labelForMetric(key: string) {
  return metricLabels[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

function environmentLabel() {
  if (typeof window === 'undefined') return 'EVIDENCE PENDING';
  return window.location.hostname === 'localhost' ? 'Local runtime' : 'Protected runtime';
}

function metricStatus(metric: Metric | undefined) {
  return metric?.businessCapability ?? 'EVIDENCE PENDING';
}

function sourceStatus(metric: Metric | undefined) {
  return metric?.sourceAvailability ?? 'EVIDENCE PENDING';
}

function DimensionIcon({ name }: { name: string }) {
  const icons: Record<string, typeof Activity> = {
    consumerRegistrations: Users,
    paymentTransactions: WalletCards,
    wallet: WalletCards,
    voucherLifecycle: TicketCheck,
    merchants: Building2,
    products: ShoppingBag,
    issuedVouchers: TicketCheck,
    redeemedVouchers: BadgeCheck,
    payments: WalletCards,
    paymentProvider: WalletCards,
    billingEvents: Activity,
    ledger: Database,
    settlement: Landmark,
    reconciliation: ClipboardCheck,
    reconciliationFreshness: RefreshCw,
    settlementBatchStatus: Landmark,
    bankServStatus: Landmark,
    bankServAckNckStatus: FileWarning,
    audit: Lock,
    exceptions: AlertTriangle,
    platformEvents: Network,
    platformOutbox: Network,
    fraudAlertStatus: FileWarning,
    merchantKycStatus: ShieldCheck,
    securityControlPosture: Lock,
  };
  const Icon = icons[name] ?? Activity;
  return <Icon className="h-4 w-4" />;
}

function StatusBadge({ label, status }: { label?: string; status: string | undefined }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusTone(
        status
      )}`}
    >
      {label ? `${label}: ` : ''}
      {status ?? 'EVIDENCE PENDING'}
    </span>
  );
}

function MetricCard({ name, metric }: { name: string; metric: Metric }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">{labelForMetric(name)}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{formatMetricValue(metric)}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <DimensionIcon name={name} />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge label="Source" status={metric.sourceAvailability} />
        <StatusBadge label="Proof" status={metric.businessCapability} />
      </div>

      {isDistributionMetric(metric) && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {Object.entries(metric.values).map(([status, value]) => (
            <div key={status} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold text-slate-500">{status}</p>
              <p className="text-sm font-bold text-slate-900">
                {value === null ? 'EVIDENCE PENDING' : value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {isFreshnessMetric(metric) && (
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <p>
            Latest run:{' '}
            <span className="font-bold text-slate-900">
              {metric.latestRunStatus ?? 'EVIDENCE PENDING'}
            </span>
          </p>
          <p className="mt-1">Timestamp: {formatTimestamp(metric.latestRunTimestamp)}</p>
          <p className="mt-1">
            Exceptions:{' '}
            <span className="font-bold text-slate-900">
              {metric.exceptionCount === null ? 'EVIDENCE PENDING' : metric.exceptionCount}
            </span>
          </p>
        </div>
      )}

      <p className="mt-4 truncate text-[11px] font-medium text-slate-400" title={metric.source}>
        {metric.source}
      </p>
      {metric.note && <p className="mt-2 text-xs leading-5 text-slate-500">{metric.note}</p>}
    </article>
  );
}

function DimensionPanel({
  title,
  metrics,
  color,
  icon: Icon,
}: {
  title: string;
  metrics: Record<string, Metric>;
  color: string;
  icon: typeof Activity;
}) {
  const entries = metricEntries(metrics);
  const status = worstEvidenceStatus(entries.map(([, metric]) => metric));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${color}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
            <p className="text-xs font-medium text-slate-500">Read-only operational dimension</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {entries.length > 0 ? (
          entries.map(([name, metric]) => <MetricCard key={name} name={name} metric={metric} />)
        ) : (
          <MetricCard name="evidencePending" metric={EMPTY_STATUS_METRIC} />
        )}
      </div>
    </section>
  );
}

function FourDVisualization({ payload }: { payload: CommandCentrePayload | null }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">4D Orchestration View</h2>
          <p className="text-sm text-slate-500">
            Connected dimensions around the Command Centre control layer.
          </p>
        </div>
        <StatusBadge status={payload ? 'LIVE' : 'EVIDENCE PENDING'} label="API" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px_1fr]">
        <div className="grid gap-4">
          {dimensionConfig.slice(0, 2).map((item) => {
            const metrics = payload?.dimensions[item.key] ?? {};
            const status = worstEvidenceStatus(Object.values(metrics));
            return <OrbitNode key={item.key} item={item} status={status} />;
          })}
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-blue-200 bg-blue-950 p-5 text-center text-white shadow-sm">
          <Network className="h-8 w-8 text-blue-200" />
          <p className="mt-3 text-xs font-bold uppercase">eVoucher Platform</p>
          <h3 className="mt-1 text-xl font-black">COMMAND CENTRE</h3>
          <p className="mt-3 text-xs leading-5 text-blue-100">
            API to data to evidence status to UI. The dashboard is never the source of truth.
          </p>
        </div>

        <div className="grid gap-4">
          {dimensionConfig.slice(2).map((item) => {
            const metrics = payload?.dimensions[item.key] ?? {};
            const status = worstEvidenceStatus(Object.values(metrics));
            return <OrbitNode key={item.key} item={item} status={status} />;
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {dimensionConfig.map((item) => (
          <div key={item.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold text-slate-950">{item.title}</p>
            <div className="mt-3 space-y-2">
              {item.flow.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-700">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrbitNode({ item, status }: { item: (typeof dimensionConfig)[number]; status: string }) {
  const Icon = item.icon;
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${item.color}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <p className="text-sm font-black text-slate-950">{item.title}</p>
        </div>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function HealthSection({ payload }: { payload: CommandCentrePayload | null }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <HeartPulse className="h-5 w-5 text-blue-700" />
        <h2 className="text-lg font-bold text-slate-950">Platform Health</h2>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {healthRows.map((item) => {
          const metric = healthMetric(payload, item.key, item.source);
          const Icon = item.icon;
          return (
            <div key={item.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-700">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-950">{item.label}</p>
                  <p className="truncate text-[11px] text-slate-500">{metric.source}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label="Source" status={sourceStatus(metric)} />
                <StatusBadge label="Proof" status={metricStatus(metric)} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ExceptionPanel({ payload }: { payload: CommandCentrePayload | null }) {
  const financial = payload?.dimensions.financial ?? {};
  const governance = payload?.dimensions.governance ?? {};

  function findMetric(metric: (typeof exceptionRows)[number]['metric']) {
    if (!metric) return EMPTY_STATUS_METRIC;
    return financial[metric] ?? governance[metric] ?? EMPTY_STATUS_METRIC;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-bold text-slate-950">Exceptions</h2>
        </div>
        <StatusBadge status={payload?.exceptions.length ? 'EVIDENCE PENDING' : 'LIVE'} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {exceptionRows.map((row) => {
          const metric = findMetric(row.metric);
          return (
            <div key={row.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-950">{row.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {row.metric ? formatMetricValue(metric) : 'EVIDENCE PENDING'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge label="Source" status={sourceStatus(metric)} />
                <StatusBadge label="Proof" status={metricStatus(metric)} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {(payload?.exceptions ?? []).length > 0 ? (
          payload?.exceptions.map((item) => (
            <div
              key={`${item.area}-${item.message}`}
              className="rounded-xl border border-amber-200 bg-amber-50 p-4"
            >
              <p className="text-sm font-bold text-amber-900">{item.area}</p>
              <p className="mt-1 text-sm text-amber-800">{item.message}</p>
              <p className="mt-2 text-[11px] font-semibold text-amber-700">{item.source}</p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
            No exception records returned by the Command Centre API.
          </div>
        )}
      </div>
    </section>
  );
}

function ExecutiveKpis({ payload }: { payload: CommandCentrePayload | null }) {
  const cards = [
    ['Consumer registrations', payload?.dimensions.customer.consumerRegistrations],
    ['Payment transactions', payload?.dimensions.customer.paymentTransactions],
    ['Merchants', payload?.dimensions.commerce.merchants],
    ['Issued vouchers', payload?.dimensions.commerce.issuedVouchers],
    ['Billing events', payload?.dimensions.financial.billingEvents],
    ['Ledger entries', payload?.dimensions.financial.ledger],
    ['Audit events', payload?.dimensions.governance.audit],
    ['Reconciliation exceptions', payload?.dimensions.governance.exceptions],
  ] as const;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Gauge className="h-5 w-5 text-blue-700" />
        <h2 className="text-lg font-bold text-slate-950">Executive Intelligence</h2>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, metric]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{formatMetricValue(metric)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge label="Source" status={sourceStatus(metric)} />
              <StatusBadge label="Proof" status={metricStatus(metric)} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EventFeed({ payload }: { payload: CommandCentrePayload | null }) {
  const rows = [
    ['Platform event status', payload?.dimensions.governance.platformEventStatus],
    ['Outbox status', payload?.dimensions.governance.platformOutboxStatus],
    ['Settlement batch status', payload?.dimensions.financial.settlementBatchStatus],
    ['ACK/NCK status', payload?.dimensions.financial.bankServAckNckStatus],
  ] as const;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Activity className="h-5 w-5 text-blue-700" />
        <h2 className="text-lg font-bold text-slate-950">Transaction and Event View</h2>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {rows.map(([label, metric]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-950">{label}</p>
              <StatusBadge status={metricStatus(metric)} />
            </div>
            {metric && isDistributionMetric(metric) ? (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(metric.values).map(([status, value]) => (
                  <div key={status} className="rounded-lg bg-white px-3 py-2">
                    <p className="text-[11px] font-semibold text-slate-500">{status}</p>
                    <p className="text-sm font-black text-slate-950">
                      {value === null ? 'EVIDENCE PENDING' : value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-slate-600">EVIDENCE PENDING</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CommandCentreDashboard({ userEmail, role }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading', data: null, error: null });
  const [environment, setEnvironment] = useState('EVIDENCE PENDING');

  useEffect(() => {
    let cancelled = false;
    setEnvironment(environmentLabel());

    async function load() {
      try {
        const response = await fetch('/api/command-center', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(
            response.status === 403 ? 'Forbidden' : `Request failed: ${response.status}`
          );
        }

        const data = (await response.json()) as CommandCentrePayload;
        if (!cancelled) setState({ status: 'ready', data, error: null });
      } catch (error: any) {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error?.message ?? 'Command Centre API request failed.',
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const payload = state.data;
  const allMetrics = useMemo(() => {
    if (!payload) return [];
    return [
      ...Object.values(payload.dimensions.customer),
      ...Object.values(payload.dimensions.commerce),
      ...Object.values(payload.dimensions.financial),
      ...Object.values(payload.dimensions.governance),
    ];
  }, [payload]);

  const evidenceStatus = payload ? worstEvidenceStatus(allMetrics) : 'EVIDENCE PENDING';
  const overallStatus =
    payload?.systemHealth.state === 'healthy'
      ? 'LIVE'
      : payload?.systemHealth.state === 'gap'
        ? 'GAP / NOT READY'
        : 'EVIDENCE PENDING';

  return (
    <main className="min-h-screen bg-[#f6f9fd] text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-6 lg:flex-row lg:items-center lg:justify-between xl:px-8">
          <div>
            <p className="text-sm font-bold uppercase text-blue-700">eVoucher Platform</p>
            <h1 className="mt-1 text-4xl font-black text-slate-950">COMMAND CENTRE</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Read-only 4D operational control tower for customer, commerce, financial, and
              governance evidence.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HeaderFact
              label="Overall Platform Status"
              value={overallStatus}
              status={overallStatus}
            />
            <HeaderFact
              label="Last Updated"
              value={payload ? formatTimestamp(payload.timestamp) : 'Loading'}
              status={payload ? 'LIVE' : 'EVIDENCE PENDING'}
            />
            <HeaderFact label="Environment" value={environment} status="EVIDENCE PENDING" />
            <HeaderFact label="Evidence Status" value={evidenceStatus} status={evidenceStatus} />
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1680px] gap-6 px-4 py-6 xl:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-950">{userEmail}</p>
              <p className="text-xs text-slate-500">
                Authorized role: {role ?? 'EVIDENCE PENDING'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label="Mode" status="LIVE" />
              <StatusBadge label="Access" status="LIVE" />
              <StatusBadge label="Control Actions" status="GAP / NOT READY" />
            </div>
          </div>
        </div>

        {state.status === 'loading' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-600 shadow-sm">
            Loading Command Centre evidence from the read-only API...
          </div>
        )}

        {state.status === 'error' && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-900 shadow-sm">
            {state.error}
          </div>
        )}

        <ExecutiveKpis payload={payload} />
        <HealthSection payload={payload} />
        <FourDVisualization payload={payload} />
        <EventFeed payload={payload} />
        <ExceptionPanel payload={payload} />

        <div className="grid gap-6 xl:grid-cols-2">
          {dimensionConfig.map((item) => {
            const metrics = payload?.dimensions[item.key] ?? {};
            return (
              <DimensionPanel
                key={item.key}
                title={item.title}
                metrics={metrics}
                color={item.color}
                icon={item.icon}
              />
            );
          })}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ArrowDown className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-950">Evidence Principle</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {payload?.evidence.principle ??
              'API to data to evidence status to UI. Evidence remains pending until returned by the API.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              payload?.evidence.statuses ?? [
                'LIVE',
                'SANDBOX',
                'CONTROLLED MOCK',
                'EVIDENCE PENDING',
                'GAP / NOT READY',
              ]
            ).map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function HeaderFact({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <div className="min-w-[180px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
      <div className="mt-2">
        <StatusBadge status={status} />
      </div>
    </div>
  );
}
