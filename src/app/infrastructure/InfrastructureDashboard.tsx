'use client';

import { useState } from 'react';
import {
  Building2,
  CreditCard,
  Download,
  Github,
  Globe2,
  Mail,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { STATS } from './data/infrastructureData';
import ApplicationsLauncher from './components/ApplicationsLauncher';
import DatabaseTab from './components/DatabaseTab';
import JobsTab from './components/JobsTab';
import ArchitectureTab from './components/ArchitectureTab';
import ShareModal from './components/ShareModal';

type TabId = 'applications' | 'database' | 'jobs' | 'architecture';

const TABS: { id: TabId; label: string }[] = [
  { id: 'applications', label: 'Applications' },
  { id: 'database', label: 'Data Assets' },
  { id: 'jobs', label: 'Operations' },
  { id: 'architecture', label: 'Platform Overview' },
];

const NAV_ITEMS = [
  'Overview',
  'Applications',
  'Merchants',
  'Payments',
  'Analytics',
  'Security',
  'Infrastructure',
  'Support',
];

const EXECUTIVE_METRICS = [
  { label: 'Infrastructure Health', value: '99.98%', trend: 'Enterprise grade', icon: ShieldCheck },
  { label: 'Partner Merchants', value: '487', trend: 'National coverage', icon: Building2 },
  { label: 'Active Users', value: '12,847', trend: 'Consumer reach', icon: Users },
  { label: 'Payment Success', value: '99.7%', trend: 'Across 8 channels', icon: CreditCard },
];

interface InfrastructureDashboardProps {
  role: string;
  userEmail: string;
}

export default function InfrastructureDashboard({ role, userEmail }: InfrastructureDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('applications');
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-body text-[#22324B]">
      <header className="sticky top-0 z-30 border-b border-[#E6EEF5] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#20B8C5] text-white">
              <Globe2 className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-headline text-lg font-bold text-[#20324A]">eVoucher</p>
              <p className="text-xs text-[#64748B]">Dignified Impact</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Infrastructure navigation">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  item === 'Infrastructure'
                    ? 'bg-[#20B8C5]/10 text-[#108995]'
                    : 'text-[#20324A] hover:bg-[#F1F5F9] hover:text-[#108995]'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 rounded-full border border-[#E6EEF5] bg-[#F7F9FC] px-3 py-1.5 text-xs text-[#64748B] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
            {userEmail} | {role}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-lg border border-[#E6EEF5] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#20B8C5]">
                Infrastructure Dashboard
              </p>
              <h1 className="mt-3 font-headline text-4xl font-bold tracking-tight text-[#20324A]">
                Trusted eVoucher platform operations
              </h1>
              <p className="mt-3 max-w-2xl text-base text-[#64748B]">
                A boardroom-ready view of the systems, partners, controls, and operating health
                behind the eVoucher marketplace.
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
              <p className="mt-2 font-headline text-2xl font-bold text-[#20324A]">{stat.value}</p>
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
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'border border-[#20B8C5] bg-[#20B8C5] text-white shadow-sm'
                  : 'text-[#64748B] hover:bg-white hover:text-[#108995]'
              }`}
            >
              {tab.label}
            </button>
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
