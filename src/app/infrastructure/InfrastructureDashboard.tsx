'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Database,
  Download,
  Filter,
  Gift,
  Github,
  Globe2,
  Handshake,
  Landmark,
  LifeBuoy,
  Mail,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Smartphone,
  UserCircle,
  Users,
  Zap,
} from 'lucide-react';
import { STATS } from './data/infrastructureData';
import ApplicationsLauncher from './components/ApplicationsLauncher';
import DatabaseTab from './components/DatabaseTab';
import JobsTab from './components/JobsTab';
import ArchitectureTab from './components/ArchitectureTab';
import ShareModal from './components/ShareModal';

type TabId =
  | 'system-health'
  | 'applications'
  | 'database'
  | 'jobs'
  | 'deployments'
  | 'compliance'
  | 'architecture';
type ModuleId =
  | 'overview'
  | 'operations'
  | 'applications'
  | 'consumers'
  | 'merchants'
  | 'vouchers'
  | 'payments'
  | 'ussd'
  | 'government'
  | 'sponsors'
  | 'analytics'
  | 'infrastructure'
  | 'security'
  | 'admin'
  | 'support';

const TABS: { id: TabId; label: string }[] = [
  { id: 'system-health', label: 'System Health' },
  { id: 'applications', label: 'Applications' },
  { id: 'database', label: 'Data Assets' },
  { id: 'jobs', label: 'Operations' },
  { id: 'deployments', label: 'Deployments' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'architecture', label: 'Architecture' },
];

const NAV_ITEMS = [
  { id: 'overview', label: 'Executive' },
  { id: 'operations', label: 'Operations' },
  { id: 'applications', label: 'Applications' },
  { id: 'consumers', label: 'Consumers' },
  { id: 'merchants', label: 'Merchants' },
  { id: 'vouchers', label: 'Voucher Engine' },
  { id: 'payments', label: 'Payments' },
  { id: 'ussd', label: 'USSD' },
  { id: 'government', label: 'Government' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'security', label: 'Security' },
  { id: 'admin', label: 'Administration' },
  { id: 'support', label: 'Support' },
] satisfies { id: ModuleId; label: string }[];

const TAB_IDS = new Set<TabId>(TABS.map((tab) => tab.id));
const MODULE_IDS = new Set<ModuleId>(NAV_ITEMS.map((item) => item.id));

const SYSTEM_HEALTH = [
  { name: 'Platform Availability', status: 'Operational', value: '99.98%', latency: '134ms', tone: 'success' },
  { name: 'API Gateway', status: 'Operational', value: '99.97%', latency: '180ms', tone: 'success' },
  { name: 'Database', status: 'Watch', value: '31ms p95', latency: '+4ms', tone: 'warn' },
  { name: 'Payment Gateway', status: 'Operational', value: '99.70%', latency: '212ms', tone: 'success' },
  { name: 'Messaging Queue', status: 'Operational', value: '42 queued', latency: '5m SLA', tone: 'success' },
  { name: 'Bankserv', status: 'Operational', value: 'ACK current', latency: 'T+1', tone: 'success' },
  { name: 'USSD', status: 'Operational', value: '4,812 sessions', latency: '1.2s', tone: 'success' },
  { name: 'Government Gateway', status: 'Attention', value: '2 approvals', latency: '24h SLA', tone: 'danger' },
];

const KPI_WIDGETS = [
  { label: 'Consumers Online', value: '1,284', day: '+8.4%', week: '+22%', month: '+41%', tone: 'success' },
  { label: 'Merchants Online', value: '342', day: '+3.1%', week: '+11%', month: '+18%', tone: 'success' },
  { label: "Today's Voucher Sales", value: '32,420', day: '+12%', week: '+19%', month: '+34%', tone: 'success' },
  { label: "Today's Redemptions", value: '27,908', day: '+9.8%', week: '+16%', month: '+28%', tone: 'success' },
  { label: "Today's Revenue", value: 'R2.4m', day: '+7.2%', week: '+13%', month: '+31%', tone: 'success' },
  { label: 'Settlement Queue', value: 'R684k', day: '14 batches', week: 'T+1', month: '99.2%', tone: 'warn' },
  { label: 'Pending KYC', value: '18', day: '-4', week: '-11', month: '-39%', tone: 'warn' },
  { label: 'Fraud Alerts', value: '3', day: '+1', week: '-6', month: '-22%', tone: 'danger' },
];

const OPERATION_QUEUES = [
  { name: 'Settlement Queue', count: 14, owner: 'Treasury', oldest: '42m', action: 'Approve batch' },
  { name: 'Approval Queue', count: 23, owner: 'Operations', oldest: '3h', action: 'Assign reviewer' },
  { name: 'KYC Queue', count: 18, owner: 'Compliance', oldest: '6h', action: 'Request docs' },
  { name: 'Voucher Queue', count: 36, owner: 'Campaigns', oldest: '21m', action: 'Release campaign' },
  { name: 'Consumer Queue', count: 57, owner: 'Support', oldest: '2h', action: 'Merge duplicates' },
  { name: 'Merchant Queue', count: 12, owner: 'Merchant Ops', oldest: '5h', action: 'Approve merchant' },
  { name: 'Fraud Queue', count: 3, owner: 'Risk', oldest: '19m', action: 'Escalate case' },
  { name: 'Notification Queue', count: 42, owner: 'Platform', oldest: '8m', action: 'Replay failed' },
];

const ACTIVITY_EVENTS = [
  { time: '10:58 SAST', event: 'Suspicious redemption blocked', area: 'Fraud', severity: 'High' },
  { time: '10:52 SAST', event: 'Bankserv payout ACK received', area: 'Settlement', severity: 'Normal' },
  { time: '10:47 SAST', event: 'Government food relief campaign activated', area: 'Government', severity: 'Normal' },
  { time: '10:40 SAST', event: 'Merchant approved: Boxer Gauteng North', area: 'Merchants', severity: 'Normal' },
  { time: '10:32 SAST', event: 'Database backup completed successfully', area: 'Infrastructure', severity: 'Normal' },
  { time: '10:21 SAST', event: 'Support ticket escalated to treasury', area: 'Support', severity: 'Medium' },
  { time: '10:15 SAST', event: 'Voucher redeemed via USSD', area: 'Voucher Engine', severity: 'Normal' },
  { time: '10:02 SAST', event: 'System deployment completed', area: 'CI/CD', severity: 'Normal' },
];

const EXECUTIVE_ALERTS = [
  { title: 'Government campaign budget threshold reached', detail: 'Food relief programme at 92% allocation.', action: 'Review budget', tone: 'warn' },
  { title: 'KYC verification backlog', detail: '18 merchant records need compliance review.', action: 'Open KYC queue', tone: 'warn' },
  { title: 'Fraud pattern detected', detail: '3 redemptions blocked across duplicate device fingerprints.', action: 'Escalate risk', tone: 'danger' },
];

const DEPLOYMENTS = [
  { service: 'Website', environment: 'Production', version: 'main@HEAD', status: 'Ready', time: '10:02 SAST' },
  { service: 'Billing Engine', environment: 'Production', version: 'release-2026.07', status: 'Ready', time: '09:18 SAST' },
  { service: 'USSD API', environment: 'Production', version: 'ussd-demo-evidence', status: 'Ready', time: '08:44 SAST' },
  { service: 'Settlement Cron', environment: 'Scheduled', version: 'bankserv-acb', status: 'Running', time: '09:00 SAST' },
];

const COMPLIANCE_CONTROLS = [
  { name: 'POPIA', status: 'Active', owner: 'Data Protection', evidence: 'Consent, retention, subject access' },
  { name: 'FICA / KYC', status: 'Active', owner: 'Compliance', evidence: 'Merchant documents and review queues' },
  { name: 'AML', status: 'Monitoring', owner: 'Risk', evidence: 'Fraud score and redemption rules' },
  { name: 'PASA', status: 'Active', owner: 'Treasury', evidence: 'Bankserv files, ACK/NCK and settlement audit' },
  { name: 'PCI DSS', status: 'Gateway scoped', owner: 'Payments', evidence: 'Tokenized payment provider boundary' },
  { name: 'Audit Logs', status: 'Active', owner: 'Security', evidence: 'Administrative and ledger activity' },
];

const QUICK_ACTIONS = [
  'Approve Settlement',
  'Assign KYC Review',
  'Create Campaign',
  'Freeze Voucher',
  'Export Treasury Pack',
  'Replay Notifications',
  'Open Incident',
  'Download Audit Log',
];

const SEARCH_RESULTS = [
  'Consumer: 12,847 registered users',
  'Merchant: 487 active partners',
  'Voucher: 32,420 issued today',
  'Government Programme: Food Relief',
  'Sponsor: Corporate Partners',
  'Settlement: R684k queued',
  'USSD Session: Live menu traffic',
  'Fraud Alert: 3 active investigations',
];

const MODULE_WORKSPACES: Record<
  Exclude<ModuleId, 'overview' | 'operations' | 'infrastructure'>,
  {
    title: string;
    description: string;
    icon: typeof Building2;
    metrics: { label: string; value: string; trend: string }[];
    queues: string[];
    actions: string[];
  }
> = {
  applications: {
    title: 'Applications Workspace',
    description: 'Launch, monitor, and govern the operational applications in the eVoucher estate.',
    icon: Globe2,
    metrics: [
      { label: 'Production apps', value: '8', trend: 'All reachable' },
      { label: 'Partner portals', value: '4', trend: 'RBAC protected' },
      { label: 'Availability', value: '99.98%', trend: '+0.02% today' },
    ],
    queues: ['App catalogue', 'Environment health', 'Ownership', 'Release readiness'],
    actions: ['Launch app', 'Open logs', 'Assign owner', 'Export inventory'],
  },
  consumers: {
    title: 'Consumer Management',
    description: 'Operate profiles, wallets, voucher history, verification, device trust, and support.',
    icon: Users,
    metrics: [
      { label: 'Registered', value: '12,847', trend: '+312 this week' },
      { label: 'Online now', value: '1,284', trend: '+8.4% today' },
      { label: 'Support tickets', value: '42', trend: '94% SLA' },
    ],
    queues: ['Wallet exceptions', 'Device history', 'Fraud score', 'Support tickets'],
    actions: ['Suspend', 'Reactivate', 'Merge account', 'Open profile'],
  },
  merchants: {
    title: 'Merchant Relationship Management',
    description: 'Manage merchant profiles, settlement history, POS health, compliance, documents, and performance.',
    icon: Building2,
    metrics: [
      { label: 'Active merchants', value: '487', trend: '+18 this month' },
      { label: 'Pending approval', value: '12', trend: '5h oldest' },
      { label: 'POS health', value: '98.6%', trend: 'Stable' },
    ],
    queues: ['Approvals', 'KYC documents', 'Bank details', 'Terminal status'],
    actions: ['Approve', 'Reject', 'Escalate', 'Export merchants'],
  },
  vouchers: {
    title: 'Voucher Engine',
    description: 'Control generation, inventory, campaigns, templates, expiry, usage rules, and audit trails.',
    icon: Gift,
    metrics: [
      { label: 'Issued today', value: '32,420', trend: '+12%' },
      { label: 'Redeemed today', value: '27,908', trend: '+9.8%' },
      { label: 'Templates', value: '14', trend: '4 active campaigns' },
    ],
    queues: ['Generation batches', 'QR validation', 'Expiry rules', 'Fraud detection'],
    actions: ['Generate', 'Freeze', 'Bulk import', 'Export audit trail'],
  },
  payments: {
    title: 'Treasury Dashboard',
    description: 'Track incoming payments, outgoing settlements, Bankserv, PayFast, Ozow, refunds, and cash flow.',
    icon: CreditCard,
    metrics: [
      { label: 'Processed today', value: 'R2.4m', trend: '+7.2%' },
      { label: 'Success rate', value: '99.7%', trend: '8 channels' },
      { label: 'Failed payments', value: '11', trend: '-18%' },
    ],
    queues: ['Reconciliation', 'Chargebacks', 'Refunds', 'Bankserv files'],
    actions: ['Approve payout', 'Reconcile', 'Refund', 'Export treasury pack'],
  },
  ussd: {
    title: 'USSD Operations',
    description: 'Monitor citizen sessions, menus, provider health, service availability, and support escalation.',
    icon: Smartphone,
    metrics: [
      { label: 'Live sessions', value: '4,812', trend: '99.4% completion' },
      { label: 'Shortcode', value: '*120*384#', trend: 'Target route' },
      { label: 'Menu latency', value: '1.2s', trend: 'Healthy' },
    ],
    queues: ['Sessions', 'Menus', 'Provider status', 'Escalations'],
    actions: ['Open simulator', 'Replay session', 'Export logs', 'Escalate'],
  },
  government: {
    title: 'Government Programme Management',
    description: 'Coordinate departments, campaigns, budgets, beneficiaries, reporting, audits, and fraud monitoring.',
    icon: Landmark,
    metrics: [
      { label: 'Programmes', value: '18', trend: '9 provinces' },
      { label: 'Beneficiaries', value: '86,400', trend: '+4.2%' },
      { label: 'Budget usage', value: '72%', trend: 'On track' },
    ],
    queues: ['Budgets', 'Beneficiaries', 'Provincial reports', 'Treasury reports'],
    actions: ['Approve campaign', 'Export report', 'Review budget', 'Open audit'],
  },
  sponsors: {
    title: 'Sponsor Relationship Management',
    description: 'Manage funding, beneficiaries, campaign performance, ROI, invoices, settlement reports, and contracts.',
    icon: Handshake,
    metrics: [
      { label: 'Sponsors', value: '12', trend: '4 active briefs' },
      { label: 'Allocated', value: 'R8.6m', trend: '68% used' },
      { label: 'Impact packs', value: '24', trend: 'Ready' },
    ],
    queues: ['Invoices', 'Contracts', 'Campaign ROI', 'Beneficiary exports'],
    actions: ['Create invoice', 'Export ROI', 'Renew contract', 'Assign campaign'],
  },
  analytics: {
    title: 'Business Intelligence',
    description: 'Interactive dashboards for province heatmaps, behaviour, merchant performance, revenue, and trends.',
    icon: BarChart3,
    metrics: [
      { label: 'Dashboards', value: '7', trend: 'Live filters' },
      { label: 'Exports', value: '15', trend: 'CSV, Excel, PDF' },
      { label: 'Forecast', value: '+31%', trend: 'Monthly revenue' },
    ],
    queues: ['Province heatmap', 'Revenue trends', 'Sponsor reporting', 'Predictive analytics'],
    actions: ['Export PDF', 'Open BI view', 'Schedule report', 'Filter province'],
  },
  security: {
    title: 'Enterprise Security Centre',
    description: 'Control RBAC, MFA, SSO, API security, threat detection, failed logins, encryption, and sessions.',
    icon: ShieldCheck,
    metrics: [
      { label: 'RBAC roles', value: '8', trend: 'Active' },
      { label: 'Failed logins', value: '17', trend: '-12%' },
      { label: 'Threat alerts', value: '3', trend: 'Under review' },
    ],
    queues: ['Failed logins', 'Device trust', 'API keys', 'Security audit'],
    actions: ['Force MFA', 'Revoke session', 'Rotate key', 'Open audit'],
  },
  admin: {
    title: 'Enterprise Administration',
    description: 'Manage users, roles, permissions, feature flags, templates, providers, integrations, and parameters.',
    icon: Settings,
    metrics: [
      { label: 'Users', value: '64', trend: '12 roles' },
      { label: 'Feature flags', value: '9', trend: '3 staged' },
      { label: 'Integrations', value: '4', trend: 'Healthy' },
    ],
    queues: ['User management', 'Permissions', 'Notification templates', 'System parameters'],
    actions: ['Invite user', 'Edit roles', 'Toggle flag', 'Export settings'],
  },
  support: {
    title: 'Support Command Centre',
    description: 'Coordinate customer, merchant, government, and sponsor support with operational context.',
    icon: LifeBuoy,
    metrics: [
      { label: 'Open cases', value: '42', trend: '8 escalations' },
      { label: 'SLA', value: '94%', trend: '+2%' },
      { label: 'WhatsApp intake', value: '31', trend: 'Today' },
    ],
    queues: ['Tickets', 'WhatsApp', 'Email intake', 'Knowledge base'],
    actions: ['Assign', 'Escalate', 'Reply', 'Export cases'],
  },
};

interface InfrastructureDashboardProps {
  role: string;
  userEmail: string;
}

function toneClasses(tone: string) {
  if (tone === 'danger') return 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]';
  if (tone === 'warn') return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
  return 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]';
}

function ModuleWorkspace({
  module,
}: {
  module: (typeof MODULE_WORKSPACES)[keyof typeof MODULE_WORKSPACES];
}) {
  const Icon = module.icon;

  return (
    <section className="mb-10 rounded-lg border border-[#E6EEF5] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#20B8C5]/10 text-[#20B8C5]">
            <Icon className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">
            Operational Module
          </p>
          <h2 className="mt-3 font-headline text-3xl font-bold text-[#20324A]">{module.title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#64748B]">{module.description}</p>
        </div>
        <div className="grid min-w-[260px] gap-3">
          {module.metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                {metric.label}
              </p>
              <p className="mt-1 font-headline text-2xl font-bold text-[#20324A]">{metric.value}</p>
              <p className="text-xs font-semibold text-[#16A34A]">{metric.trend}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
            Live Queues
          </p>
          <div className="mt-4 space-y-2">
            {module.queues.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                  index === 0
                    ? 'bg-[#20B8C5] text-white'
                    : 'bg-white text-[#20324A] hover:bg-[#EAFBFD] hover:text-[#108995]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </aside>

        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="grid border-b border-[#E6EEF5] bg-[#F7F9FC] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B] md:grid-cols-4">
            <span>Workspace</span>
            <span>Status</span>
            <span>Owner</span>
            <span>Action</span>
          </div>
          {module.queues.map((item, index) => (
            <div
              key={item}
              className="grid gap-2 border-b border-[#E6EEF5] px-4 py-4 text-sm last:border-b-0 md:grid-cols-4"
            >
              <span className="font-semibold text-[#20324A]">{item}</span>
              <span className="text-[#16A34A]">Operational</span>
              <span className="text-[#64748B]">RBAC protected</span>
              <button type="button" className="text-left font-semibold text-[#108995]">
                {module.actions[index % module.actions.length]}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExecutiveOverview({ pulse }: { pulse: number }) {
  return (
    <>
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KPI_WIDGETS.map((metric, index) => (
          <div key={metric.label} className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-[#64748B]">{metric.label}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${toneClasses(metric.tone)}`}>
                Live
              </span>
            </div>
            <p className="mt-3 font-headline text-3xl font-bold text-[#20324A]">
              {index < 2 ? `${Number(metric.value.replace(/,/g, '')) + pulse}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : metric.value}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <span className="rounded-md bg-[#F7F9FC] px-2 py-1 text-[#16A34A]">D {metric.day}</span>
              <span className="rounded-md bg-[#F7F9FC] px-2 py-1 text-[#108995]">W {metric.week}</span>
              <span className="rounded-md bg-[#F7F9FC] px-2 py-1 text-[#64748B]">M {metric.month}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-headline text-lg font-semibold text-[#20324A]">Live Activity Feed</h2>
              <p className="text-sm text-[#64748B]">Chronological platform events refreshing automatically.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EAFBFD] px-3 py-1 text-xs font-bold text-[#108995]">
              <RefreshCw className="h-3.5 w-3.5" />
              {pulse + 1}s pulse
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-[#E6EEF5]">
            {ACTIVITY_EVENTS.map((event) => (
              <div key={`${event.time}-${event.event}`} className="grid gap-2 border-b border-[#E6EEF5] px-4 py-3 text-sm last:border-b-0 md:grid-cols-[110px_1fr_120px_90px]">
                <span className="font-semibold text-[#108995]">{event.time}</span>
                <span className="text-[#20324A]">{event.event}</span>
                <span className="text-[#64748B]">{event.area}</span>
                <span className={event.severity === 'High' ? 'font-semibold text-[#B91C1C]' : 'text-[#64748B]'}>
                  {event.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
          <h2 className="font-headline text-lg font-semibold text-[#20324A]">Executive Alerts</h2>
          <div className="mt-4 space-y-3">
            {EXECUTIVE_ALERTS.map((alert) => (
              <div key={alert.title} className={`rounded-lg border p-4 ${toneClasses(alert.tone)}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-1 text-xs opacity-80">{alert.detail}</p>
                    <button type="button" className="mt-3 rounded-md bg-white/80 px-3 py-1.5 text-xs font-bold text-[#20324A]">
                      {alert.action}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <OperationsCentre compact />
    </>
  );
}

function OperationsCentre({ compact = false }: { compact?: boolean }) {
  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-lg font-semibold text-[#20324A]">Operations Centre</h2>
            <p className="text-sm text-[#64748B]">Queues with assign, approve, reject, escalate, and export workflows.</p>
          </div>
          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[#E6EEF5] px-3 py-2 text-sm font-semibold text-[#20324A] hover:bg-[#F7F9FC]">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {OPERATION_QUEUES.slice(0, compact ? 5 : OPERATION_QUEUES.length).map((queue) => (
            <div key={queue.name} className="rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[#20324A]">{queue.name}</p>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#108995]">{queue.count}</span>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-[#64748B] sm:grid-cols-3">
                <span>{queue.owner}</span>
                <span>Oldest {queue.oldest}</span>
                <button type="button" className="text-left font-bold text-[#108995]">{queue.action}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <h2 className="font-headline text-lg font-semibold text-[#20324A]">Immediate Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => (
            <button key={action} type="button" className="inline-flex items-center gap-2 rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] px-3 py-2.5 text-left text-sm font-semibold text-[#20324A] hover:border-[#20B8C5] hover:bg-[#EAFBFD]">
              <Zap className="h-4 w-4 text-[#20B8C5]" />
              {action}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function SystemHealthTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SYSTEM_HEALTH.map((item) => (
          <div key={item.name} className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#20B8C5]/10 text-[#20B8C5]">
                {item.name.includes('Database') ? <Database className="h-5 w-5" /> : <Server className="h-5 w-5" />}
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${toneClasses(item.tone)}`}>
                {item.status}
              </span>
            </div>
            <p className="mt-4 font-semibold text-[#20324A]">{item.name}</p>
            <p className="mt-2 font-headline text-2xl font-bold text-[#20324A]">{item.value}</p>
            <p className="mt-1 text-xs text-[#64748B]">Latency / SLA: {item.latency}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <h2 className="font-headline text-lg font-semibold text-[#20324A]">Monitoring Coverage</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {['API monitoring', 'Server status', 'Storage checks', 'Backups', 'Disaster recovery', 'Log retention'].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg bg-[#F7F9FC] p-3 text-sm font-semibold text-[#20324A]">
              <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeploymentsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-headline text-xl font-semibold text-[#20324A]">CI/CD and Deployments</h2>
            <p className="mt-1 text-sm text-[#64748B]">GitHub and Vercel promotion status for production services.</p>
          </div>
          <a href="https://github.com/shelod-eng/eVoucher_Website2026/actions" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#20B8C5] bg-white px-4 py-2 text-sm font-semibold text-[#108995] hover:bg-[#EAFBFD]">
            <Github className="h-4 w-4" />
            GitHub Actions
          </a>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-[#E6EEF5] bg-white">
        {DEPLOYMENTS.map((deployment) => (
          <div key={`${deployment.service}-${deployment.time}`} className="grid gap-2 border-b border-[#E6EEF5] px-5 py-4 text-sm last:border-b-0 md:grid-cols-[1fr_140px_160px_120px_120px]">
            <span className="font-semibold text-[#20324A]">{deployment.service}</span>
            <span className="text-[#64748B]">{deployment.environment}</span>
            <span className="font-mono text-xs text-[#64748B]">{deployment.version}</span>
            <span className="font-semibold text-[#16A34A]">{deployment.status}</span>
            <span className="text-[#64748B]">{deployment.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplianceTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <h2 className="font-headline text-xl font-semibold text-[#20324A]">Enterprise Compliance</h2>
        <p className="mt-1 text-sm text-[#64748B]">Operational controls for POPIA, FICA, KYC, AML, PASA, PCI DSS, audit logs, and regulatory reporting.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {COMPLIANCE_CONTROLS.map((control) => (
          <div key={control.name} className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-headline text-lg font-semibold text-[#20324A]">{control.name}</p>
                <p className="mt-1 text-sm text-[#64748B]">{control.evidence}</p>
              </div>
              <span className="rounded-full bg-[#EAFBFD] px-3 py-1 text-xs font-bold text-[#108995]">{control.status}</span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">Owner</p>
            <p className="mt-1 text-sm font-semibold text-[#20324A]">{control.owner}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InfrastructureDashboard({ role, userEmail }: InfrastructureDashboardProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('system-health');
  const [activeModule, setActiveModule] = useState<ModuleId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [pulse, setPulse] = useState(0);

  const searchMatches = useMemo(
    () =>
      searchQuery.trim()
        ? SEARCH_RESULTS.filter((result) => result.toLowerCase().includes(searchQuery.toLowerCase()))
        : [],
    [searchQuery]
  );

  useEffect(() => {
    const timer = window.setInterval(() => setPulse((value) => (value + 1) % 9), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const requestedModule = searchParams.get('module') as ModuleId | null;
    const requestedTab = searchParams.get('tab') as TabId | null;
    if (requestedModule && MODULE_IDS.has(requestedModule)) {
      setActiveModule(requestedModule);
    } else if (requestedTab) {
      setActiveModule('infrastructure');
    }
    if (requestedTab && TAB_IDS.has(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-body text-[#22324B]">
      <header className="sticky top-0 z-30 border-b border-[#E6EEF5] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#20B8C5] text-white">
              <Globe2 className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-headline text-lg font-bold text-[#20324A]">eVoucher ECC 2.0</p>
              <p className="text-xs text-[#64748B]">Enterprise Operations Platform</p>
            </div>
          </div>

          <nav className="mx-4 hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex" aria-label="Command Centre modules">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={`/infrastructure?module=${item.id}`}
                onClick={() => setActiveModule(item.id)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeModule === item.id
                    ? 'bg-[#20B8C5]/10 text-[#108995]'
                    : 'text-[#20324A] hover:bg-[#F1F5F9] hover:text-[#108995]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            <div className="flex items-center gap-2 rounded-full border border-[#BBF7D0] bg-[#DCFCE7] px-3 py-1.5 text-xs font-bold text-[#166534]">
              <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
              Live
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#E6EEF5] bg-[#F7F9FC] px-3 py-1.5 text-xs text-[#64748B]">
              <UserCircle className="h-4 w-4 text-[#108995]" />
              <span className="max-w-[150px] truncate">{userEmail}</span>
              <span className="capitalize">| {role.replace(/_/g, ' ')}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-lg border border-[#E6EEF5] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#20B8C5]">
                Enterprise Operations Platform
              </p>
              <h1 className="mt-3 font-headline text-4xl font-bold tracking-tight text-[#20324A]">
                Real-time operating control for the South African eVoucher ecosystem
              </h1>
              <p className="mt-3 max-w-2xl text-base text-[#64748B]">
                Platform health, live queues, treasury, compliance, government programmes, sponsors,
                security, and infrastructure operations in one authenticated workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setShareOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#108995]">
                <Mail className="h-4 w-4" />
                Share Brief
              </button>
              <a href="/docs/system-architecture-2026.pdf" download className="inline-flex items-center gap-2 rounded-lg border border-[#20B8C5] bg-white px-4 py-2.5 text-sm font-semibold text-[#108995] transition-colors hover:bg-[#EAFBFD]">
                <Download className="h-4 w-4" />
                Executive Brief
              </a>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="rounded-lg border border-[#E6EEF5] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
              Global Search
            </label>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] px-4 py-3">
              <Search className="h-4 w-4 text-[#108995]" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search consumers, merchants, vouchers, settlements, fraud alerts..."
                className="w-full bg-transparent text-sm text-[#20324A] outline-none placeholder:text-[#94A3B8]"
              />
            </div>
            {searchMatches.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {searchMatches.slice(0, 4).map((result) => (
                  <div key={result} className="rounded-md bg-[#EAFBFD] px-3 py-2 text-xs text-[#20324A]">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-lg border border-[#E6EEF5] bg-white p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#108995]" />
              <p className="text-sm font-semibold text-[#20324A]">Attention Required</p>
              <span className="ml-auto rounded-full bg-[#EF4444] px-2 py-0.5 text-xs font-bold text-white">
                {EXECUTIVE_ALERTS.length}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {EXECUTIVE_ALERTS.slice(0, 3).map((item) => (
                <p key={item.title} className="rounded-md bg-[#F7F9FC] px-3 py-2 text-xs text-[#64748B]">
                  {item.title}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#E6EEF5] bg-white p-4">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-[#108995]" />
              <p className="text-sm font-semibold text-[#20324A]">Enterprise Session</p>
            </div>
            <p className="mt-3 truncate text-sm font-semibold text-[#20324A]">{userEmail}</p>
            <p className="mt-1 text-xs capitalize text-[#64748B]">{role.replace(/_/g, ' ')}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-[#108995]">RBAC</span>
              <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-[#108995]">Audit</span>
              <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-[#108995]">MFA Ready</span>
            </div>
          </div>
        </section>

        {activeModule === 'overview' && <ExecutiveOverview pulse={pulse} />}
        {activeModule === 'operations' && <OperationsCentre />}

        {activeModule !== 'overview' && activeModule !== 'operations' && activeModule !== 'infrastructure' && (
          <ModuleWorkspace module={MODULE_WORKSPACES[activeModule]} />
        )}

        {activeModule === 'infrastructure' && (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">{stat.label}</p>
                  <p className="mt-2 font-headline text-3xl font-bold text-[#20324A]">{stat.value}</p>
                </div>
              ))}
            </section>

            <section className="mb-8 flex flex-wrap items-center justify-between gap-6 rounded-lg border border-[#D7F3F6] bg-[#EAFBFD] p-6">
              <div className="max-w-xl">
                <h2 className="font-headline text-lg font-semibold text-[#20324A]">
                  Infrastructure Portal retained and expanded
                </h2>
                <p className="mt-2 text-sm text-[#64748B]">
                  System health, deployments, API monitoring, database, storage, CI/CD, backups,
                  disaster recovery, logs, architecture, documentation, and compliance.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setShareOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#108995]">
                  <Mail className="h-4 w-4" />
                  Copy Email Template
                </button>
                <a href="https://github.com/shelod-eng/eVoucher_Website2026/actions" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#B9E9EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#20324A] hover:bg-[#F7F9FC]">
                  <Github className="h-4 w-4" />
                  GitHub Actions
                </a>
              </div>
            </section>

            <div className="mb-6 flex gap-2 overflow-x-auto border-b border-[#E6EEF5] pb-2">
              {TABS.map((tab) => (
                <Link
                  key={tab.id}
                  href={`/infrastructure?tab=${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'border border-[#20B8C5] bg-[#20B8C5] text-white shadow-sm'
                      : 'text-[#64748B] hover:bg-white hover:text-[#108995]'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>

            <div className="animate-fade-in pb-16">
              {activeTab === 'system-health' && <SystemHealthTab />}
              {activeTab === 'applications' && <ApplicationsLauncher onViewArchitecture={() => setActiveTab('architecture')} />}
              {activeTab === 'database' && <DatabaseTab />}
              {activeTab === 'jobs' && <JobsTab />}
              {activeTab === 'deployments' && <DeploymentsTab />}
              {activeTab === 'compliance' && <ComplianceTab />}
              {activeTab === 'architecture' && <ArchitectureTab />}
            </div>
          </>
        )}

        <footer className="border-t border-[#E6EEF5] pt-8 text-center text-sm text-[#64748B]">
          <p>
            &copy; 2026 eVoucher Platform. Developed by <strong className="text-[#20324A]">Lebo Mpeta</strong>.
          </p>
          <p className="mt-2">
            Website Repo:{' '}
            <a href="https://github.com/shelod-eng/eVoucher_Website2026" target="_blank" rel="noopener noreferrer" className="text-[#108995] hover:underline">
              shelod-eng/eVoucher_Website2026
            </a>
            {' | '}
            Vercel Deployments:{' '}
            <a href="https://vercel.com/shelod-engs-projects/~/deployments" target="_blank" rel="noopener noreferrer" className="text-[#108995] hover:underline">
              shelod-engs-projects
            </a>
            {' | '}
            Email:{' '}
            <a href="mailto:mpetalebo@outlook.com" className="text-[#108995] hover:underline">
              mpetalebo@outlook.com
            </a>
          </p>
        </footer>
      </main>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
