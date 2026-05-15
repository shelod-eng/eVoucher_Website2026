import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { getReportingOverview } from '@/server/reporting/reporting-suite';

export const dynamic = 'force-dynamic';

function formatCurrency(value: number) {
  return `R ${Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))}`;
}

function formatInteger(value: number) {
  return Intl.NumberFormat('en-ZA').format(Number(value ?? 0));
}

function formatPercent(value: number) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function formatDateTime(value: string | null) {
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

function barWidth(value: number, max: number) {
  if (!max || max <= 0) return '8%';
  return `${Math.max(8, Math.round((value / max) * 100))}%`;
}

async function getRecentRedemptions() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('redemption_history')
    .select('id, merchant_name, amount, created_at')
    .order('created_at', { ascending: false })
    .limit(6);
  return data ?? [];
}

async function getRecentMerchants() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('merchants')
    .select('id, business_name, email, status, created_at')
    .order('created_at', { ascending: false })
    .limit(6);
  return data ?? [];
}

export default async function PortalDashboard() {
  const [overview, redemptions, merchants] = await Promise.all([
    getReportingOverview(),
    getRecentRedemptions(),
    getRecentMerchants(),
  ]);

  const approvalRate =
    overview.executiveSummary.merchantCount > 0
      ? (overview.executiveSummary.approvedMerchantCount /
          overview.executiveSummary.merchantCount) *
        100
      : 0;
  const consumerActivationRate =
    overview.executiveSummary.consumerCount > 0
      ? (overview.reports.consumerImpact.uniquePurchasingConsumers /
          overview.executiveSummary.consumerCount) *
        100
      : 0;
  const settlementProgress =
    overview.reports.settlementLedger.pendingAmount +
      overview.reports.settlementLedger.settledAmount >
    0
      ? (overview.reports.settlementLedger.settledAmount /
          (overview.reports.settlementLedger.pendingAmount +
            overview.reports.settlementLedger.settledAmount)) *
        100
      : 0;
  const leadingMethod = overview.reports.dailyTransactionSummary.paymentMethodSplit[0];
  const leadMerchant = overview.reports.merchantPerformance.topMerchants[0];
  const leadChannel = overview.reports.consumerImpact.channelSplit[0];
  const merchantStatusMax = Math.max(
    ...overview.reports.merchantPerformance.merchantStatusSplit.map((entry) => entry.value),
    1
  );

  const statCards = [
    {
      code: 'VOL',
      label: 'Gross processing volume',
      value: formatCurrency(overview.executiveSummary.totalVolume),
      detail: `${formatInteger(overview.executiveSummary.transactionCount)} completed transactions`,
      tone: 'border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(16,38,71,0.96))]',
    },
    {
      code: 'SAV',
      label: 'Consumer savings generated',
      value: formatCurrency(overview.executiveSummary.totalSavings),
      detail: `${formatInteger(overview.reports.consumerImpact.uniquePurchasingConsumers)} active purchasing consumers`,
      tone: 'border-sky-400/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.12),rgba(16,38,71,0.96))]',
    },
    {
      code: 'MR',
      label: 'Merchant approval rate',
      value: formatPercent(approvalRate),
      detail: `${formatInteger(overview.executiveSummary.approvedMerchantCount)} of ${formatInteger(overview.executiveSummary.merchantCount)} approved`,
      tone: 'border-amber-300/20 bg-[linear-gradient(180deg,rgba(251,191,36,0.1),rgba(16,38,71,0.96))]',
    },
    {
      code: 'RISK',
      label: 'Compliance confidence',
      value:
        overview.reports.complianceAudit.popiaConsentRatePct === null
          ? 'Pending'
          : formatPercent(overview.reports.complianceAudit.popiaConsentRatePct),
      detail: `${formatInteger(overview.reports.complianceAudit.auditEventCount)} audit events, ${formatInteger(overview.reports.complianceAudit.openFraudAlertCount)} open alerts`,
      tone: 'border-orange-400/20 bg-[linear-gradient(180deg,rgba(249,115,22,0.1),rgba(16,38,71,0.96))]',
    },
  ];

  const intelligenceCards = [
    {
      label: 'Leading payment method',
      value: leadingMethod?.method ?? 'Awaiting data',
      detail: leadingMethod
        ? `${formatCurrency(leadingMethod.amount)} across ${formatInteger(leadingMethod.count)} transactions`
        : 'The reporting engine will elevate the first live payment rail as activity lands.',
    },
    {
      label: 'Top merchant by volume',
      value: leadMerchant?.merchantName ?? 'Awaiting merchant activity',
      detail: leadMerchant
        ? `${formatCurrency(leadMerchant.grossRevenue)} gross revenue with ${formatCurrency(leadMerchant.netMerchantPayable)} net payable`
        : 'Merchant leaderboard activates when transactions and invoices are available.',
    },
    {
      label: 'Primary access channel',
      value: leadChannel?.label ?? 'Web',
      detail: leadChannel
        ? `${formatPercent(leadChannel.percentage ?? 0)} of purchasing activity`
        : 'Channel intelligence will sharpen as consumer instrumentation expands.',
    },
    {
      label: 'Settlement progress',
      value: formatPercent(settlementProgress),
      detail: `${formatCurrency(overview.reports.settlementLedger.settledAmount)} settled versus ${formatCurrency(overview.reports.settlementLedger.pendingAmount)} pending`,
    },
  ];

  const quickActions = [
    {
      href: '/portal/reports',
      label: 'Open Intelligence Suite',
      detail: 'Jump into the premium board-reporting surface',
      primary: true,
    },
    {
      href: '/portal/merchants',
      label: 'Review merchants',
      detail: 'Check onboarding status and portfolio mix',
    },
    {
      href: '/portal/redemptions',
      label: 'Inspect redemptions',
      detail: 'Trace recent voucher spend and merchant activity',
    },
    {
      href: '/api/v1/reporting/executive-summary',
      label: 'Open sponsor API',
      detail: 'Expose machine-readable KPI output for integrations',
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_30px_120px_rgba(2,8,23,0.42)]">
        <div className="grid gap-6 xl:grid-cols-[1.65fr_0.95fr]">
          <div className="space-y-6">
            <div className="max-w-4xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
                Sponsor Command Centre
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-white xl:text-6xl">
                Premium eVoucher intelligence with sponsor-grade clarity.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                This overview turns the portal into a decision surface: live throughput, merchant
                readiness, consumer value creation, and settlement confidence in one polished admin
                experience.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                'Board pack ready',
                'Sharper KPI hierarchy',
                'Merchant intelligence',
                'Settlement discipline',
                'Audit-backed narrative',
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-sky-400/18 bg-slate-950/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <article
                  key={card.label}
                  className={`rounded-[1.6rem] border p-5 shadow-[0_18px_48px_rgba(2,8,23,0.26)] ${card.tone}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-200">
                      {card.code}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                      Live
                    </span>
                  </div>
                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/80">
                    {card.label}
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-white">{card.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{card.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-sky-400/16 bg-[#102647]/90 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
                Executive Narrative
              </p>
              <p className="mt-4 text-lg font-semibold leading-8 text-white">
                {overview.reports.executiveSponsorSummary.summaryLine}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-sky-400/10 bg-slate-950/18 p-4">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-slate-400">
                    Data stage
                  </p>
                  <p className="mt-2 text-xl font-semibold capitalize text-white">
                    {overview.dataStage}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-sky-400/10 bg-slate-950/18 p-4">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-slate-400">
                    Consumer activation
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatPercent(consumerActivationRate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`rounded-[1.3rem] border px-5 py-4 transition ${
                    action.primary
                      ? 'border-orange-400/20 bg-[linear-gradient(135deg,#f97316,#ea580c)] text-white shadow-[0_16px_40px_rgba(249,115,22,0.22)] hover:brightness-110'
                      : 'border-sky-400/20 bg-[#102647] text-sky-100 hover:border-sky-300/36 hover:text-white'
                  }`}
                >
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="mt-2 text-sm leading-6 text-inherit/80">{action.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        {intelligenceCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[1.6rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.38)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/75">
              {card.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <div className="flex items-end justify-between gap-4 border-b border-sky-400/12 pb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
                Merchant Readiness
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Portfolio quality and status
              </h2>
            </div>
            <Link
              href="/portal/reports"
              className="rounded-full border border-sky-400/20 bg-[#102647] px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300/36 hover:text-white"
            >
              Open full report
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              {merchants.length === 0 && (
                <p className="rounded-[1.3rem] border border-sky-400/10 bg-[#102647]/60 px-4 py-5 text-sm text-slate-300">
                  No merchants onboarded yet.
                </p>
              )}
              {merchants.map((merchant) => (
                <div
                  key={merchant.id}
                  className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-sky-400/10 bg-[#102647]/80 px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {merchant.business_name ?? 'Unnamed merchant'}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {merchant.email ?? 'No email captured'}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                      Added {formatDateTime(merchant.created_at)}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-400/18 bg-emerald-400/10 px-3 py-1 text-xs font-semibold capitalize text-emerald-100">
                    {merchant.status ?? 'pending'}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-sky-400/10 bg-[#102647]/80 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                Merchant status mix
              </p>
              <div className="mt-5 space-y-4">
                {overview.reports.merchantPerformance.merchantStatusSplit.map((row) => (
                  <div key={row.label}>
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                      <span>{row.label}</span>
                      <span>
                        {formatInteger(row.value)} | {formatPercent(row.percentage ?? 0)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-900/45">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-sky-400"
                        style={{ width: barWidth(row.value, merchantStatusMax) }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.25rem] border border-amber-300/16 bg-[linear-gradient(180deg,rgba(251,191,36,0.1),rgba(8,26,51,0.95))] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-100/80">
                  Sponsor readout
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {approvalRate >= 80
                    ? 'Merchant readiness is strong enough for a confident sponsor narrative.'
                    : 'Merchant approval remains the clearest operational unlock for the next sponsor review.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
            Live Redemption Feed
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Operational pulse</h2>
          <div className="mt-6 space-y-3">
            {redemptions.length === 0 && (
              <p className="rounded-[1.3rem] border border-sky-400/10 bg-[#102647]/60 px-4 py-5 text-sm text-slate-300">
                No redemptions recorded yet.
              </p>
            )}
            {redemptions.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-sky-400/10 bg-[#102647]/80 px-4 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {item.merchant_name ?? 'Unknown merchant'}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{formatDateTime(item.created_at)}</p>
                </div>
                <span className="whitespace-nowrap text-lg font-semibold text-emerald-300">
                  {formatCurrency(Number(item.amount ?? 0))}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-sky-400/10 bg-[#102647]/80 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              Why this feels stronger
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              The overview now mirrors the intelligence suite instead of looking like a default
              admin table. That gives you clearer hierarchy, better contrast, and faster executive
              scanning.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
