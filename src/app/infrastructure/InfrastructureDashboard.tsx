'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Building2,
  ChevronDown,
  CreditCard,
  Download,
  Gift,
  Github,
  Globe2,
  Handshake,
  Landmark,
  LifeBuoy,
  Lock,
  Mail,
  Search,
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

type TabId = 'applications' | 'database' | 'jobs' | 'architecture';
type ModuleId =
  | 'overview'
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
  { id: 'applications', label: 'Applications' },
  { id: 'database', label: 'Data Assets' },
  { id: 'jobs', label: 'Operations' },
  { id: 'architecture', label: 'Platform Overview' },
];

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
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

const EXECUTIVE_METRICS = [
  { label: 'Infrastructure Health', value: '99.98%', trend: 'Enterprise grade', icon: ShieldCheck },
  { label: 'Partner Merchants', value: '487', trend: 'National coverage', icon: Building2 },
  { label: 'Active Users', value: '12,847', trend: 'Consumer reach', icon: Users },
  { label: 'Payment Success', value: '99.7%', trend: 'Across 8 channels', icon: CreditCard },
];

const ECC_METRICS = [
  { label: 'Platform Availability', value: '99.98%', trend: 'Healthy', icon: Activity },
  { label: 'Vouchers Issued Today', value: '32,420', trend: 'Live campaigns', icon: Gift },
  { label: 'Payments Processed', value: 'R2.4m', trend: 'Today', icon: CreditCard },
  { label: 'Government Programmes', value: '18', trend: 'Active', icon: Landmark },
  { label: 'Sponsors', value: '12', trend: 'Funded partners', icon: Handshake },
  { label: 'Security Controls', value: 'AA', trend: 'RBAC ready', icon: Lock },
];

const QUICK_ACTIONS = [
  'Register Merchant',
  'Create Voucher Campaign',
  'Register Government Programme',
  'Add Sponsor',
  'Create Consumer',
  'View Infrastructure',
  'Open USSD',
  'Reports',
];

const PLATFORM_HEALTH = [
  { name: 'Website', detail: '99.99% uptime' },
  { name: 'API', detail: 'P95 180ms' },
  { name: 'Database', detail: 'Backups current' },
  { name: 'Payments', detail: 'Gateway healthy' },
  { name: 'USSD', detail: 'Sessions active' },
  { name: 'SMS', detail: 'Queue clear' },
  { name: 'Email', detail: 'Deliverability stable' },
];

const NOTIFICATIONS = [
  'Merchant approval queue updated',
  'Government campaign completed',
  'Database backup successful',
  'Payment gateway healthy',
];

const AUDIT_EVENTS = [
  { time: '10:02 SAST', action: 'Merchant Created', actor: 'Platform Administrator' },
  { time: '10:15 SAST', action: 'Voucher Redeemed', actor: 'Voucher Engine' },
  { time: '10:32 SAST', action: 'Government Programme Approved', actor: 'Government Admin' },
  { time: '10:40 SAST', action: 'Payment Settled', actor: 'Finance Administrator' },
  { time: '10:51 SAST', action: 'Sponsor Registered', actor: 'Sponsor Administrator' },
];

const SEARCH_RESULTS = [
  'Consumer: 12,847 registered users',
  'Merchant: 487 active partners',
  'Voucher: 32,420 issued today',
  'Government Programme: Food Relief',
  'Sponsor: Corporate Partners',
  'Settlement: R2.4m processed',
  'USSD Session: Live menu traffic',
];

const MODULE_WORKSPACES: Record<
  Exclude<ModuleId, 'overview' | 'infrastructure'>,
  {
    title: string;
    description: string;
    icon: typeof Building2;
    stats: string[];
    navigation: string[];
  }
> = {
  applications: {
    title: 'Applications Workspace',
    description: 'Launch, monitor, and govern the operational applications in the eVoucher estate.',
    icon: Globe2,
    stats: ['8 production apps', '4 partner portals', '99.98% availability'],
    navigation: ['App catalogue', 'Launch links', 'Ownership', 'Environment status'],
  },
  consumers: {
    title: 'Consumer Workspace',
    description:
      'Manage registrations, wallets, rewards, transactions, redemptions, and support cases.',
    icon: Users,
    stats: ['12,847 registered', '10,201 active', 'R1.8m wallet movement'],
    navigation: ['Registrations', 'Wallets', 'Transactions', 'Rewards', 'Support cases'],
  },
  merchants: {
    title: 'Merchant Workspace',
    description: 'Operate stores, branches, products, settlements, compliance, and performance.',
    icon: Building2,
    stats: ['487 active', '18 pending', '12 suspended'],
    navigation: ['Stores', 'Branches', 'Products', 'Transactions', 'Settlements', 'Performance'],
  },
  vouchers: {
    title: 'Voucher Engine',
    description:
      'Design templates, issue campaigns, govern expiry, and monitor redemption performance.',
    icon: Gift,
    stats: ['32,420 issued today', '91.3% redemption health', '14 templates'],
    navigation: [
      'Templates',
      'Campaigns',
      'Government vouchers',
      'Retail vouchers',
      'Expiry',
      'Redemptions',
    ],
  },
  payments: {
    title: 'Payments Workspace',
    description: 'Track payment channels, settlements, invoices, reconciliation, and exceptions.',
    icon: CreditCard,
    stats: ['R2.4m processed', '99.7% success', '8 channels'],
    navigation: ['Transactions', 'Settlements', 'Invoices', 'Reconciliation', 'Exceptions'],
  },
  ussd: {
    title: 'USSD Workspace',
    description:
      'Monitor sessions, menus, simulator results, provider health, and support escalation.',
    icon: Smartphone,
    stats: ['4,812 sessions', '99.4% completion', '2 live menus'],
    navigation: ['Sessions', 'Menus', 'Simulator', 'Provider status', 'Escalations'],
  },
  government: {
    title: 'Government Workspace',
    description:
      'Coordinate national, provincial, municipal, beneficiary, funding, and compliance programmes.',
    icon: Landmark,
    stats: ['18 programmes', '9 provinces', '6 impact reports'],
    navigation: ['National', 'Provincial', 'Municipal', 'Beneficiaries', 'Funding', 'Compliance'],
  },
  sponsors: {
    title: 'Sponsor Workspace',
    description:
      'Give CSI and corporate partners visibility into funding, campaigns, impact, and downloads.',
    icon: Handshake,
    stats: ['12 sponsors', 'R8.6m allocated', '24 impact packs'],
    navigation: ['Funding', 'Beneficiaries', 'Campaigns', 'Impact', 'Reporting', 'Downloads'],
  },
  analytics: {
    title: 'Analytics Workspace',
    description:
      'Board-level reporting for financial, merchant, consumer, government, and sponsor insights.',
    icon: BarChart3,
    stats: ['7 dashboards', '15 exports', 'Live executive view'],
    navigation: ['Financial', 'Merchant', 'Consumer', 'Government', 'Sponsors', 'Infrastructure'],
  },
  security: {
    title: 'Security Centre',
    description:
      'Control users, roles, permissions, MFA, failed logins, audit, API keys, and devices.',
    icon: ShieldCheck,
    stats: ['MFA ready', 'RBAC matrix', '5 audit filters'],
    navigation: ['Users', 'Roles', 'Permissions', 'MFA', 'Failed logins', 'Audit', 'API keys'],
  },
  admin: {
    title: 'Platform Administration',
    description:
      'Manage organisation settings, branding, channels, integrations, APIs, and configuration.',
    icon: Settings,
    stats: ['9 settings groups', '4 integrations', '3 environments'],
    navigation: ['Organisation', 'Branding', 'USSD', 'SMS', 'Email', 'Payment gateways', 'API'],
  },
  support: {
    title: 'Support Workspace',
    description:
      'Coordinate customer, merchant, government, and sponsor support with operational context.',
    icon: LifeBuoy,
    stats: ['42 open cases', '8 escalations', '94% SLA'],
    navigation: ['Tickets', 'WhatsApp', 'Email intake', 'Knowledge base', 'Escalations'],
  },
};

interface InfrastructureDashboardProps {
  role: string;
  userEmail: string;
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
            Authenticated Module
          </p>
          <h2 className="mt-3 font-headline text-3xl font-bold text-[#20324A]">{module.title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#64748B]">{module.description}</p>
        </div>
        <div className="grid min-w-[260px] gap-3">
          {module.stats.map((stat) => (
            <div key={stat} className="rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] px-4 py-3">
              <p className="text-sm font-semibold text-[#20324A]">{stat}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
            Context Navigation
          </p>
          <div className="mt-4 space-y-2">
            {module.navigation.map((item, index) => (
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
          <div className="grid border-b border-[#E6EEF5] bg-[#F7F9FC] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B] md:grid-cols-3">
            <span>Workspace</span>
            <span>Status</span>
            <span>Governance</span>
          </div>
          {module.navigation.slice(0, 5).map((item) => (
            <div
              key={item}
              className="grid gap-2 border-b border-[#E6EEF5] px-4 py-4 text-sm last:border-b-0 md:grid-cols-3"
            >
              <span className="font-semibold text-[#20324A]">{item}</span>
              <span className="text-[#16A34A]">Operational</span>
              <span className="text-[#64748B]">RBAC protected</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function InfrastructureDashboard({ role, userEmail }: InfrastructureDashboardProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('applications');
  const [activeModule, setActiveModule] = useState<ModuleId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const searchMatches = searchQuery.trim()
    ? SEARCH_RESULTS.filter((result) => result.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

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
              <p className="font-headline text-lg font-bold text-[#20324A]">eVoucher ECC</p>
              <p className="text-xs text-[#64748B]">Command Centre</p>
            </div>
          </div>

          <nav
            className="mx-4 hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex"
            aria-label="Command Centre modules"
          >
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
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] text-[#20324A] hover:bg-[#F1F5F9]"
              aria-label="Notifications"
            >
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EF4444]" />
              <Activity className="h-4 w-4" />
            </button>
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
                eVoucher Command Centre
              </p>
              <h1 className="mt-3 font-headline text-4xl font-bold tracking-tight text-[#20324A]">
                Enterprise operations for the eVoucher ecosystem
              </h1>
              <p className="mt-3 max-w-2xl text-base text-[#64748B]">
                Authenticated control centre for platform health, merchants, consumers, voucher
                campaigns, payments, government programmes, sponsors, security, and support.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#108995]"
              >
                <Mail className="h-4 w-4" />
                Share Brief
              </button>
              <a
                href="/docs/system-architecture-2026.pdf"
                download
                className="inline-flex items-center gap-2 rounded-lg border border-[#20B8C5] bg-white px-4 py-2.5 text-sm font-semibold text-[#108995] transition-colors hover:bg-[#EAFBFD]"
              >
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
                placeholder="Search consumers, merchants, vouchers, settlements, sponsors..."
                className="w-full bg-transparent text-sm text-[#20324A] outline-none placeholder:text-[#94A3B8]"
              />
            </div>
            {searchMatches.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {searchMatches.slice(0, 4).map((result) => (
                  <div
                    key={result}
                    className="rounded-md bg-[#EAFBFD] px-3 py-2 text-xs text-[#20324A]"
                  >
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-lg border border-[#E6EEF5] bg-white p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#108995]" />
              <p className="text-sm font-semibold text-[#20324A]">Notifications</p>
              <span className="ml-auto rounded-full bg-[#20B8C5] px-2 py-0.5 text-xs font-bold text-white">
                {NOTIFICATIONS.length}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {NOTIFICATIONS.slice(0, 3).map((item) => (
                <p key={item} className="rounded-md bg-[#F7F9FC] px-3 py-2 text-xs text-[#64748B]">
                  {item}
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
              <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-[#108995]">Profile</span>
              <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-[#108995]">Security</span>
              <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-[#108995]">Logout</span>
            </div>
          </div>
        </section>

        {activeModule === 'overview' && (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ECC_METRICS.map(({ label, value, trend, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#20B8C5]/10 text-[#20B8C5]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-[#64748B]">{label}</p>
                  <p className="mt-2 font-headline text-3xl font-bold text-[#20324A]">{value}</p>
                  <p className="mt-2 text-xs font-semibold text-[#16A34A]">{trend}</p>
                </div>
              ))}
            </section>

            <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
                <h2 className="font-headline text-lg font-semibold text-[#20324A]">
                  Quick Actions
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action}
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] px-3 py-2.5 text-left text-sm font-semibold text-[#20324A] hover:border-[#20B8C5] hover:bg-[#EAFBFD]"
                    >
                      <Zap className="h-4 w-4 text-[#20B8C5]" />
                      {action}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
                <h2 className="font-headline text-lg font-semibold text-[#20324A]">
                  Platform Health
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {PLATFORM_HEALTH.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A]" />
                        <p className="text-sm font-semibold text-[#20324A]">{item.name}</p>
                      </div>
                      <p className="mt-1 text-xs text-[#64748B]">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mb-8 rounded-lg border border-[#E6EEF5] bg-white p-5">
              <h2 className="font-headline text-lg font-semibold text-[#20324A]">Audit Centre</h2>
              <div className="mt-4 overflow-hidden rounded-lg border border-[#E6EEF5]">
                {AUDIT_EVENTS.map((event) => (
                  <div
                    key={`${event.time}-${event.action}`}
                    className="grid gap-2 border-b border-[#E6EEF5] px-4 py-3 text-sm last:border-b-0 md:grid-cols-[140px_1fr_220px]"
                  >
                    <span className="font-semibold text-[#108995]">{event.time}</span>
                    <span className="text-[#20324A]">{event.action}</span>
                    <span className="text-[#64748B]">{event.actor}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeModule !== 'overview' && activeModule !== 'infrastructure' && (
          <ModuleWorkspace module={MODULE_WORKSPACES[activeModule]} />
        )}

        {activeModule === 'infrastructure' && (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {EXECUTIVE_METRICS.map(({ label, value, trend, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#20B8C5]/10 text-[#20B8C5]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-[#64748B]">{label}</p>
                  <p className="mt-2 font-headline text-3xl font-bold text-[#20324A]">{value}</p>
                  <p className="mt-2 text-xs font-semibold text-[#16A34A]">{trend}</p>
                </div>
              ))}
            </section>

            <section className="mb-8 grid gap-4 md:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-[#E6EEF5] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-headline text-2xl font-bold text-[#20324A]">
                    {stat.value}
                  </p>
                </div>
              ))}
            </section>

            <section className="mb-8 flex flex-wrap items-center justify-between gap-6 rounded-lg border border-[#D7F3F6] bg-[#EAFBFD] p-6">
              <div className="max-w-xl">
                <h2 className="font-headline text-lg font-semibold text-[#20324A]">
                  Share platform confidence with stakeholders
                </h2>
                <p className="mt-2 text-sm text-[#64748B]">
                  Copy a concise handover note or open the repository for technical due diligence.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#108995]"
                >
                  <Mail className="h-4 w-4" />
                  Copy Email Template
                </button>
                <a
                  href="https://github.com/shelod-eng/eVoucher_Website2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#B9E9EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#20324A] hover:bg-[#F7F9FC]"
                >
                  <Github className="h-4 w-4" />
                  View GitHub Repo
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
              {activeTab === 'applications' && (
                <ApplicationsLauncher onViewArchitecture={() => setActiveTab('architecture')} />
              )}
              {activeTab === 'database' && <DatabaseTab />}
              {activeTab === 'jobs' && <JobsTab />}
              {activeTab === 'architecture' && <ArchitectureTab />}
            </div>
          </>
        )}

        <footer className="border-t border-[#E6EEF5] pt-8 text-center text-sm text-[#64748B]">
          <p>
            &copy; 2026 eVoucher Platform. Developed by{' '}
            <strong className="text-[#20324A]">Lebo Mpeta</strong>.
          </p>
          <p className="mt-2">
            Website Repo:{' '}
            <a
              href="https://github.com/shelod-eng/eVoucher_Website2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#108995] hover:underline"
            >
              shelod-eng/eVoucher_Website2026
            </a>
            {' | '}
            Mobile Repo:{' '}
            <a
              href="https://github.com/shelod-eng/eVoucherMobile"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#108995] hover:underline"
            >
              shelod-eng/eVoucherMobile
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
