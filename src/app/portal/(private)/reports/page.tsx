import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { getReportingOverview } from '@/server/reporting/reporting-suite';

function formatCurrency(value: number) {
  return `R ${Number(value ?? 0).toFixed(2)}`;
}

function formatInteger(value: number) {
  return Intl.NumberFormat('en-ZA').format(Number(value ?? 0));
}

function formatPercent(value: number | null) {
  if (value === null || value === undefined) return 'Pending';
  return `${Number(value).toFixed(2)}%`;
}

function formatTableName(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function barWidth(value: number, max: number) {
  if (!max || max <= 0) return '6%';
  return `${Math.max(6, Math.round((value / max) * 100))}%`;
}

function sparkPath(values: number[]) {
  if (values.length === 0) return 'M 0 80';
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
      const y = 80 - ((value - min) / range) * 60;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function panelTone(index: number) {
  const tones = [
    'border-emerald-400/22 bg-[linear-gradient(180deg,rgba(16,185,129,0.1),rgba(8,26,51,0.95))]',
    'border-sky-400/22 bg-[linear-gradient(180deg,rgba(56,189,248,0.1),rgba(8,26,51,0.95))]',
    'border-amber-300/22 bg-[linear-gradient(180deg,rgba(251,191,36,0.1),rgba(8,26,51,0.95))]',
    'border-orange-400/22 bg-[linear-gradient(180deg,rgba(249,115,22,0.1),rgba(8,26,51,0.95))]',
  ];

  return tones[index % tones.length];
}

export const dynamic = 'force-dynamic';

export default async function PortalReportsPage() {
  const overview = await getReportingOverview();

  const dailySeries = overview.reports.dailyTransactionSummary.dailyVolumeSeries;
  const dailySeriesMax = Math.max(...dailySeries.map((row) => row.value), 1);
  const savingsSeries = overview.reports.consumerImpact.monthlySavings;
  const savingsSeriesMax = Math.max(...savingsSeries.map((row) => row.savings), 1);
  const paymentMethodSplit = overview.reports.dailyTransactionSummary.paymentMethodSplit;
  const topMerchants = overview.reports.merchantPerformance.topMerchants.slice(0, 5);
  const merchantStatusSplit = overview.reports.merchantPerformance.merchantStatusSplit;
  const faceValueDistribution = overview.reports.merchantPerformance.faceValueDistribution;
  const settlementStatusSplit = overview.reports.settlementLedger.settlementStatusSplit;
  const auditActionSplit = overview.reports.complianceAudit.auditActionSplit.slice(0, 6);
  const coverageEntries = Object.entries(overview.coverage);
  const sponsorAudience = overview.reports.executiveSponsorSummary.sponsorAudience.join(' | ');
  const sparkline = sparkPath(dailySeries.map((row) => row.value));
  const paymentMethodMax = Math.max(...paymentMethodSplit.map((row) => row.amount), 1);
  const settlementMax = Math.max(...settlementStatusSplit.map((row) => row.value), 1);
  const auditMax = Math.max(...auditActionSplit.map((row) => row.value), 1);
  const leadingPaymentMethod = paymentMethodSplit[0];
  const leadingChannel = overview.reports.consumerImpact.channelSplit[0];
  const strongestSegment = overview.reports.consumerImpact.segmentSplit[0];
  const sourceTables = overview.reports.executiveSponsorSummary.sourceTables;
  const sourceTableMax = Math.max(sourceTables.length, 1);
  const settlementCoveragePct =
    overview.reports.settlementLedger.pendingAmount +
      overview.reports.settlementLedger.settledAmount >
    0
      ? (overview.reports.settlementLedger.settledAmount /
          (overview.reports.settlementLedger.pendingAmount +
            overview.reports.settlementLedger.settledAmount)) *
        100
      : 0;

  const sponsorCards = [
    {
      label: 'Total Volume',
      value: formatCurrency(overview.executiveSummary.totalVolume),
      detail: `${formatInteger(overview.executiveSummary.transactionCount)} completed transactions`,
      code: 'VOL',
    },
    {
      label: 'Platform Revenue',
      value: formatCurrency(overview.executiveSummary.platformRevenue),
      detail: `${formatCurrency(overview.executiveSummary.pendingPayouts)} pending payout exposure`,
      code: 'REV',
    },
    {
      label: 'Consumer Savings',
      value: formatCurrency(overview.executiveSummary.totalSavings),
      detail: `${formatInteger(overview.executiveSummary.consumerCount)} consumers in scope`,
      code: 'SAV',
    },
    {
      label: 'Compliance Readiness',
      value: formatPercent(overview.reports.complianceAudit.popiaConsentRatePct),
      detail: `${formatInteger(overview.reports.complianceAudit.auditEventCount)} audit trail events`,
      code: 'KYC',
    },
  ];

  const reportCards = [
    {
      code: 'R-01',
      title: overview.reports.dailyTransactionSummary.title,
      metric: `${formatInteger(overview.reports.dailyTransactionSummary.completedCount)} completed`,
      detail: `${formatPercent(overview.reports.dailyTransactionSummary.failedRatePct)} failed rate`,
    },
    {
      code: 'R-02',
      title: overview.reports.merchantPerformance.title,
      metric: `${formatInteger(overview.reports.merchantPerformance.approvedMerchantCount)} approved merchants`,
      detail: `${formatInteger(overview.reports.merchantPerformance.activeProductCount)} active products`,
    },
    {
      code: 'R-03',
      title: overview.reports.consumerImpact.title,
      metric: `${formatInteger(overview.reports.consumerImpact.uniquePurchasingConsumers)} active consumers`,
      detail: `${formatCurrency(overview.reports.consumerImpact.walletSavingsBalance)} wallet savings`,
    },
    {
      code: 'R-04',
      title: overview.reports.settlementLedger.title,
      metric: `${formatCurrency(overview.reports.settlementLedger.pendingAmount)} pending`,
      detail: `${formatInteger(overview.reports.settlementLedger.batchCount)} payout batches`,
    },
    {
      code: 'R-05',
      title: overview.reports.complianceAudit.title,
      metric: `${formatInteger(overview.reports.complianceAudit.openFraudAlertCount)} open alerts`,
      detail: `${formatPercent(overview.reports.complianceAudit.fraudFlagRatePct)} fraud rate`,
    },
    {
      code: 'R-06',
      title: overview.reports.executiveSponsorSummary.title,
      metric: formatCurrency(overview.executiveSummary.settledToMerchants),
      detail: 'Executive narrative and sponsor summary',
    },
  ];

  const exportLinks = [
    { code: 'R-01', label: 'Daily Transaction Summary', report: 'r1' },
    { code: 'R-02', label: 'Merchant Performance', report: 'r2' },
    { code: 'R-03', label: 'Consumer Impact & Savings', report: 'r3' },
    { code: 'R-04', label: 'Settlement & Payout Ledger', report: 'r4' },
    { code: 'R-05', label: 'Compliance & Audit', report: 'r5' },
    { code: 'R-06', label: 'Executive Sponsor Summary', report: 'r6' },
  ];

  const specAnchors = [
    {
      title: 'How eVoucher Works',
      detail:
        'Browse, buy, redeem, save, and track are reflected here through merchants, vouchers, transactions, savings, and wallet activity.',
    },
    {
      title: 'Social impact logic',
      detail:
        'The live product story on evoucher.co.za emphasizes consumer savings, merchant growth, transparency, and universal access via USSD, app, and web.',
    },
    {
      title: 'Spec compliance',
      detail:
        'This page now follows the May 2026 BI blueprint: R-01 through R-06, mapped to source tables, recipients, and sponsor-ready acceptance criteria.',
    },
  ];

  const operatingModelCards = [
    {
      label: 'Buy and pay',
      value: leadingPaymentMethod?.method ?? 'Awaiting live mix',
      detail: leadingPaymentMethod
        ? `${formatCurrency(leadingPaymentMethod.amount)} processed via the leading rail`
        : 'Payment method split will light up as transaction data grows.',
    },
    {
      label: 'Redeem and save',
      value: formatCurrency(overview.executiveSummary.totalSavings),
      detail: `${formatInteger(overview.reports.consumerImpact.uniquePurchasingConsumers)} consumers realized value through the platform`,
    },
    {
      label: 'Access channel',
      value: leadingChannel?.label ?? 'Web',
      detail: leadingChannel
        ? `${formatPercent(leadingChannel.percentage ?? 0)} of purchasing activity`
        : 'USSD, app, SMS, and web channel intelligence is ready when source data arrives.',
    },
    {
      label: 'Government impact lens',
      value: strongestSegment?.label ?? 'Unknown',
      detail: strongestSegment
        ? `${formatInteger(strongestSegment.value)} consumers in the leading segment`
        : 'Segment reporting will highlight township, SASSA, union, and community reach.',
    },
  ];

  const merchantShare =
    overview.executiveSummary.settledToMerchants + overview.executiveSummary.pendingPayouts;
  const consumerShare = overview.executiveSummary.totalSavings;
  const platformShare = overview.executiveSummary.platformRevenue;
  const splitTotal = Math.max(merchantShare + consumerShare + platformShare, 1);
  const revenueSplitCards = [
    {
      label: 'Merchant settlement value',
      value: merchantShare,
      percentage: (merchantShare / splitTotal) * 100,
      detail: 'Net value released or queued for merchant payouts',
      tone: 'from-emerald-400 to-teal-400',
    },
    {
      label: 'Consumer benefit retained',
      value: consumerShare,
      percentage: (consumerShare / splitTotal) * 100,
      detail: 'Savings protected for households and beneficiaries',
      tone: 'from-sky-400 to-cyan-300',
    },
    {
      label: 'Platform revenue',
      value: platformShare,
      percentage: (platformShare / splitTotal) * 100,
      detail: 'Transparent operating revenue for infrastructure sustainability',
      tone: 'from-orange-400 to-amber-300',
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_30px_120px_rgba(2,8,23,0.42)]">
        <div className="grid gap-6 xl:grid-cols-[1.8fr_0.9fr]">
          <div className="space-y-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] border border-sky-300/20 bg-[linear-gradient(135deg,rgba(45,212,191,0.18),rgba(59,130,246,0.14))] p-2">
                    <AppImage
                      src="/assets/images/branding/evoucher-logo.png"
                      alt="eVoucher logo"
                      width={72}
                      height={72}
                      className="h-full w-full rounded-[1.15rem] object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
                      eVoucher Fintech Standards Dashboard
                    </p>
                    <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-white xl:text-6xl">
                      Command-centre reporting built to wow the sponsor.
                    </h1>
                  </div>
                </div>

                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300">
                  This BI suite translates the May 2026 reporting specification into a premium
                  sponsor-facing experience with executive metrics, merchant performance, consumer
                  impact, settlement controls, and cyber-grade compliance visibility in one surface.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px] xl:grid-cols-1">
                <div className="rounded-[1.5rem] border border-sky-400/16 bg-[#102647] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/75">
                    Data Stage
                  </p>
                  <p className="mt-2 text-xl font-semibold capitalize text-white">
                    {overview.dataStage}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-emerald-400/16 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(16,38,71,0.95))] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
                    Sponsor Snapshot
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white">
                    {overview.reports.executiveSponsorSummary.summaryLine}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                'Board pack ready',
                'Fintech confidence',
                'Cyber visibility',
                'Merchant intelligence',
                'Audit-backed metrics',
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-sky-400/18 bg-slate-950/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              {sponsorCards.map((card, index) => (
                <div
                  key={card.label}
                  className={`rounded-[1.6rem] border p-5 shadow-[0_18px_48px_rgba(2,8,23,0.26)] ${panelTone(index)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-200">
                      {card.code}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                      Live KPI
                    </span>
                  </div>
                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/80">
                    {card.label}
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-white">{card.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-sky-400/16 bg-[#102647]/90 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
                Report Coverage
              </p>
              <div className="mt-4 grid gap-3">
                {reportCards.map((card) => (
                  <div
                    key={card.code}
                    className="rounded-[1.2rem] border border-sky-400/10 bg-slate-950/18 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200">
                        {card.code}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.26em] text-slate-400">
                        {overview.reports.dailyTransactionSummary.refreshCadence}
                      </span>
                    </div>
                    <p className="mt-3 font-semibold text-white">{card.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{card.metric}</p>
                    <p className="text-sm text-slate-400">{card.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/api/v1/reporting/executive-summary"
                className="rounded-[1.3rem] bg-[linear-gradient(135deg,#f97316,#ea580c)] px-5 py-4 text-center text-sm font-semibold text-white shadow-[0_16px_40px_rgba(249,115,22,0.22)] transition hover:brightness-110"
              >
                Open Executive API
              </Link>
              <Link
                href="/api/v1/reporting/export?report=r6"
                className="rounded-[1.3rem] border border-sky-400/20 bg-[#102647] px-5 py-4 text-center text-sm font-semibold text-sky-100 transition hover:border-sky-300/36 hover:text-white"
              >
                Export Sponsor Summary
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
              Revenue Split Transparency
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              Merchant, consumer, and platform value distribution
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Sponsors can see exactly where value lands: merchants receive settlement value,
              consumers retain direct benefit, and the platform revenue is visible rather than
              hidden inside opaque fees.
            </p>

            <div className="mt-6 space-y-4">
              {revenueSplitCards.map((card) => (
                <div key={card.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-white">{card.label}</span>
                    <span className="text-slate-300">
                      {formatCurrency(card.value)} | {formatPercent(card.percentage)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-950/45">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${card.tone}`}
                      style={{ width: `${Math.max(8, Math.round(card.percentage))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-emerald-300/22 bg-[linear-gradient(180deg,rgba(16,185,129,0.14),rgba(16,38,71,0.95))] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-100">
              Preferred gateway positioning
            </p>
            <h3 className="mt-4 text-3xl font-semibold text-white">NetCash-ready payment rail</h3>
            <p className="mt-4 text-sm leading-7 text-slate-200">
              The portal now presents NetCash as the preferred payment gateway partner for sponsor
              conversations, while keeping the payment provider layer abstract enough for PayFast,
              EFT, PayShap, and future bank integrations.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {['Gateway governance', 'Settlement traceability', 'Sponsor reconciliation', 'Bank-grade controls'].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-[1rem] border border-emerald-300/16 bg-slate-950/18 p-3 text-sm font-semibold text-emerald-50"
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <div className="flex items-end justify-between gap-4 border-b border-sky-400/12 pb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
                Spec Alignment
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Built on the BI blueprint and the live eVoucher operating model
              </h2>
            </div>
            <span className="rounded-full border border-emerald-400/24 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
              May 2026 spec aligned
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {specAnchors.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.4rem] border border-sky-400/12 bg-[#102647]/80 p-5"
              >
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {operatingModelCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[1.4rem] border border-sky-400/10 bg-slate-950/18 p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/75">
                  {card.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
            Source Tables in Play
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Supabase data lineage</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The report is now anchored to the actual tables powering eVoucher across consumers,
            merchants, vouchers, settlements, billing, and compliance.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {sourceTables.map((tableName, index) => (
              <div
                key={tableName}
                className="rounded-[1.2rem] border border-sky-400/10 bg-[#102647]/80 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">
                    {formatTableName(tableName)}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                    T-{String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-slate-900/45">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-teal-400 to-sky-400"
                    style={{ width: barWidth(index + 1, sourceTableMax) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <div className="flex flex-col gap-3 border-b border-sky-400/12 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
                R-01 Daily Transaction Summary
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Transaction volume</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Completed transaction value across the reporting window, backed by payment
                transactions and ready for finance and sponsor review.
              </p>
            </div>
            <Link
              href="/api/v1/reporting/export?report=r1"
              className="rounded-full border border-sky-400/20 bg-[#102647] px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300/36 hover:text-white"
            >
              Export CSV
            </Link>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-sky-400/12 bg-[linear-gradient(180deg,rgba(59,130,246,0.05),rgba(15,23,42,0.08))] p-5">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Completed volume trend</span>
              <span>{formatCurrency(overview.reports.dailyTransactionSummary.totalVolume)}</span>
            </div>
            <div className="mt-5">
              <svg viewBox="0 0 100 80" className="h-72 w-full">
                <defs>
                  <linearGradient id="spark-fill" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(45,212,191,0.45)" />
                    <stop offset="100%" stopColor="rgba(45,212,191,0.02)" />
                  </linearGradient>
                </defs>
                {[16, 32, 48, 64].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="100"
                    y2={y}
                    stroke="rgba(148,163,184,0.18)"
                    strokeDasharray="3 3"
                  />
                ))}
                {dailySeries.map((row, index) => {
                  const x = dailySeries.length === 1 ? 0 : (index / (dailySeries.length - 1)) * 100;
                  return (
                    <text
                      key={row.label}
                      x={x}
                      y="78"
                      textAnchor={
                        index === 0 ? 'start' : index === dailySeries.length - 1 ? 'end' : 'middle'
                      }
                      fill="rgba(191,219,254,0.8)"
                      fontSize="4"
                    >
                      {row.label}
                    </text>
                  );
                })}
                <path d={`${sparkline} L 100 80 L 0 80 Z`} fill="url(#spark-fill)" opacity="0.65" />
                <path
                  d={sparkline}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {paymentMethodSplit.map((row) => (
              <div
                key={row.method}
                className="rounded-[1.4rem] border border-sky-400/12 bg-[#102647]/80 p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                  {row.method}
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {formatCurrency(row.amount)}
                </p>
                <p className="mt-1 text-sm text-slate-300">{row.count} transactions</p>
                <div className="mt-4 h-2 rounded-full bg-slate-900/50">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-sky-400"
                    style={{ width: barWidth(row.amount, paymentMethodMax) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
            R-05 Compliance and Verification Visibility
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Cyber and audit posture</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Sponsor and security leadership can see consent readiness, fraud exposure, and the live
            audit signal in one control panel.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-emerald-400/16 bg-[linear-gradient(180deg,rgba(16,185,129,0.1),rgba(8,26,51,0.95))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
                POPIA Consent
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatPercent(overview.reports.complianceAudit.popiaConsentRatePct)}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-orange-400/16 bg-[linear-gradient(180deg,rgba(249,115,22,0.1),rgba(8,26,51,0.95))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200/80">
                Fraud Flag Rate
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatPercent(overview.reports.complianceAudit.fraudFlagRatePct)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-sky-400/16 bg-[#102647]/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                Audit Completeness
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatPercent(overview.reports.complianceAudit.auditLogCompletenessPct)}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-amber-300/16 bg-[linear-gradient(180deg,rgba(251,191,36,0.1),rgba(8,26,51,0.95))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-100/80">
                Fraud Threshold
              </p>
              <p className="mt-3 text-xl font-semibold text-white">
                Target {formatPercent(overview.reports.complianceAudit.fraudTargetThresholdPct)}
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {overview.reports.complianceAudit.fraudTargetBreached
                  ? 'Attention required: live fraud rate is above the target line.'
                  : 'Within target: fraud signal is currently below the escalation threshold.'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-sky-400/10 bg-[#102647]/80 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                  Audit Action Distribution
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {formatInteger(overview.reports.complianceAudit.auditEventCount)} events recorded
                </p>
              </div>
              <Link
                href="/api/v1/reporting/export?report=r5"
                className="rounded-full border border-sky-400/16 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-300/30 hover:text-white"
              >
                Export
              </Link>
            </div>

            <div className="mt-5 space-y-4">
              {auditActionSplit.map((row) => (
                <div key={row.label}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                    <span>{row.label}</span>
                    <span>
                      {formatInteger(row.value)} | {formatPercent(row.percentage ?? 0)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900/45">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
                      style={{ width: barWidth(row.value, auditMax) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr_0.9fr]">
        <div className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
                R-02 Merchant Performance
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Merchant leaders</h2>
            </div>
            <Link
              href="/api/v1/reporting/export?report=r2"
              className="rounded-full border border-sky-400/16 bg-[#102647] px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-300/30 hover:text-white"
            >
              Export CSV
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {topMerchants.length === 0 && (
              <p className="text-sm text-slate-400">No merchant data yet.</p>
            )}
            {topMerchants.map((merchant, index) => (
              <div
                key={merchant.merchantId}
                className="rounded-[1.4rem] border border-sky-400/10 bg-[#102647]/80 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-sky-400/18 bg-slate-950/20 text-sm font-semibold text-sky-100">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{merchant.merchantName}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {merchant.transactionCount} transactions |{' '}
                        {formatPercent(merchant.avgDiscountPct)} avg discount
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">
                      {formatCurrency(merchant.grossRevenue)}
                    </p>
                    <p className="text-sm text-slate-400">
                      Net payable {formatCurrency(merchant.netMerchantPayable)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
                Merchant Mix
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Portfolio distribution</h3>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {merchantStatusSplit.map((row) => (
              <div key={row.label}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                  <span>{row.label}</span>
                  <span>
                    {formatInteger(row.value)} | {formatPercent(row.percentage ?? 0)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-900/45">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-300"
                    style={{
                      width: barWidth(
                        row.value,
                        Math.max(...merchantStatusSplit.map((entry) => entry.value), 1)
                      ),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-sky-400/10 bg-[#102647]/80 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
              Product Face Value Distribution
            </p>
            <div className="mt-4 space-y-3">
              {faceValueDistribution.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-sm text-slate-200"
                >
                  <span>{row.label}</span>
                  <span>
                    {formatInteger(row.value)} | {formatPercent(row.percentage ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
            Coverage and Instrumentation
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Spec readiness</h3>

          <div className="mt-6 flex flex-wrap gap-2">
            {coverageEntries.map(([key, available]) => (
              <span
                key={key}
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                  available
                    ? 'border-emerald-400/24 bg-emerald-400/10 text-emerald-100'
                    : 'border-amber-300/24 bg-amber-300/10 text-amber-100'
                }`}
              >
                {key}
              </span>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[1.4rem] border border-sky-400/10 bg-[#102647]/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/75">
                Payout Batch Timing
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {overview.reports.settlementLedger.averageBatchProcessingDays === null
                  ? 'Pending live confirmations'
                  : `${overview.reports.settlementLedger.averageBatchProcessingDays.toFixed(2)} days`}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-amber-300/18 bg-[linear-gradient(180deg,rgba(251,191,36,0.1),rgba(8,26,51,0.95))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-100/80">
                Cyber note
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                The dashboard now exposes channel, segment, settlement, and audit visibility. Any
                remaining gaps are surfaced honestly so the sponsor and Head of Cyber Security see a
                trustworthy control picture.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        <div className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
                R-03 Consumer Impact and Savings
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Consumer lift</h2>
            </div>
            <Link
              href="/api/v1/reporting/export?report=r3"
              className="rounded-full border border-sky-400/16 bg-[#102647] px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-300/30 hover:text-white"
            >
              Export CSV
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.4rem] border border-sky-400/10 bg-[#102647]/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                Channel Split
              </p>
              <div className="mt-4 space-y-3">
                {overview.reports.consumerImpact.channelSplit.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-sm text-slate-200"
                  >
                    <span>{row.label}</span>
                    <span>
                      {formatInteger(row.value)} | {formatPercent(row.percentage ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-sky-400/10 bg-[#102647]/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                Segment Split
              </p>
              <div className="mt-4 space-y-3">
                {overview.reports.consumerImpact.segmentSplit.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-sm text-slate-200"
                  >
                    <span>{row.label}</span>
                    <span>
                      {formatInteger(row.value)} | {formatPercent(row.percentage ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-sky-400/10 bg-[#102647]/80 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/75">
              Monthly Savings Run Rate
            </p>
            <div className="mt-5 space-y-4">
              {savingsSeries.map((row) => (
                <div key={row.month}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                    <span>{row.month}</span>
                    <span>{formatCurrency(row.savings)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900/45">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300"
                      style={{ width: barWidth(row.savings, savingsSeriesMax) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
                R-04 Settlement and Payout Ledger
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Settlement health</h2>
            </div>
            <Link
              href="/api/v1/reporting/export?report=r4"
              className="rounded-full border border-sky-400/16 bg-[#102647] px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-300/30 hover:text-white"
            >
              Export CSV
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-amber-300/18 bg-[linear-gradient(180deg,rgba(251,191,36,0.1),rgba(8,26,51,0.95))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-100/80">
                Pending Amount
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatCurrency(overview.reports.settlementLedger.pendingAmount)}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-emerald-400/18 bg-[linear-gradient(180deg,rgba(16,185,129,0.1),rgba(8,26,51,0.95))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
                Settled Amount
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatCurrency(overview.reports.settlementLedger.settledAmount)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-sky-400/16 bg-[#102647]/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                Reconciliation Accuracy
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatPercent(overview.reports.settlementLedger.reconciliationRatePct)}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-emerald-400/16 bg-[linear-gradient(180deg,rgba(16,185,129,0.1),rgba(8,26,51,0.95))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
                FNB Distribution Queue
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatCurrency(overview.reports.settlementLedger.distributionScheduledAmount)}
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {formatInteger(overview.reports.settlementLedger.pendingDistributionCount)}{' '}
                scheduled distributions awaiting release
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {settlementStatusSplit.map((row) => (
              <div key={row.label}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                  <span>{row.label}</span>
                  <span>
                    {formatInteger(row.value)} | {formatPercent(row.percentage ?? 0)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-900/45">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-amber-300 to-orange-400"
                    style={{ width: barWidth(row.value, settlementMax) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
            R-06 Executive Sponsor Summary
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Boardroom narrative</h2>

          <div className="mt-6 rounded-[1.5rem] border border-sky-400/10 bg-[#102647]/80 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
              Audience
            </p>
            <p className="mt-3 text-sm leading-7 text-white">{sponsorAudience}</p>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-sky-400/10 bg-[#102647]/80 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
              Executive Positioning
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              The design now tells a stronger story: measurable financial throughput, merchant
              traction, consumer benefit, payout discipline, cyber-aware governance, and the real
              eVoucher operating journey from browse to buy, redeem, save, and track.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            {exportLinks.map((item) => (
              <Link
                key={item.report}
                href={`/api/v1/reporting/export?report=${item.report}`}
                className="flex items-center justify-between rounded-[1.2rem] border border-sky-400/12 bg-slate-950/16 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-sky-300/30 hover:text-white"
              >
                <span>
                  {item.code} | {item.label}
                </span>
                <span className="text-sky-200">CSV</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
