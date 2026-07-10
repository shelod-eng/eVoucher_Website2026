'use client';

import { useState } from 'react';
import { Github, Mail } from 'lucide-react';
import { STATS } from './data/infrastructureData';
import ApplicationsLauncher from './components/ApplicationsLauncher';
import DatabaseTab from './components/DatabaseTab';
import JobsTab from './components/JobsTab';
import ArchitectureTab from './components/ArchitectureTab';
import ShareModal from './components/ShareModal';

type TabId = 'applications' | 'database' | 'jobs' | 'architecture';

const TABS: { id: TabId; label: string }[] = [
  { id: 'applications', label: 'Live Applications & APIs' },
  { id: 'database', label: 'Database Tables' },
  { id: 'jobs', label: 'Automated Jobs & Backups' },
  { id: 'architecture', label: 'Architecture Diagram' },
];

interface InfrastructureDashboardProps {
  role: string;
  userEmail: string;
}

export default function InfrastructureDashboard({ role, userEmail }: InfrastructureDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('applications');
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-100"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 40%),
            linear-gradient(rgba(255, 255, 255, 0.005) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.005) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 30px 30px, 30px 30px',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-6 border-b border-indigo-500/12 pb-8">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-sm font-extrabold tracking-wider text-white shadow-lg shadow-cyan-500/20"
              aria-hidden="true"
            >
              EV
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                eVoucher Platform
              </h1>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Infrastructure & Hosting Overview
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-indigo-500/15 bg-[#0b132b] px-4 py-2 text-sm">
              <span className="h-2 w-2 animate-pulse-subtle rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
              Production: <strong className="text-emerald-400">Online</strong>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-indigo-500/15 bg-[#0b132b] px-4 py-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
              Version: <strong className="text-cyan-400">1.0 (2026)</strong>
            </div>
            <div className="hidden rounded-full border border-indigo-500/15 bg-[#0b132b] px-4 py-2 text-xs text-slate-400 sm:block">
              {userEmail} · {role}
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-indigo-500/15 bg-[#0b132b] p-5 text-center transition-colors hover:border-cyan-500/25"
            >
              <div className="text-3xl font-bold text-cyan-400">{stat.value}</div>
              <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Share panel */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-indigo-500/15 bg-[#0b132b] p-6">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-white">Share Dashboard with Stakeholders</h2>
            <p className="mt-2 text-sm text-slate-400">
              This interactive page showcases our exact system topology, database layout, backups,
              and live URLs. Copy the email handover template or view the GitHub repository.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500"
            >
              <Mail className="h-4 w-4" />
              Copy Email Template
            </button>
            <a
              href="https://github.com/shelod-eng/eVoucher_Website2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/20 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5"
            >
              <Github className="h-4 w-4" />
              View GitHub Repo
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-indigo-500/12 pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'border border-cyan-500/25 bg-cyan-500/10 text-cyan-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-in pb-16">
          {activeTab === 'applications' && (
            <ApplicationsLauncher onViewArchitecture={() => setActiveTab('architecture')} />
          )}
          {activeTab === 'database' && <DatabaseTab />}
          {activeTab === 'jobs' && <JobsTab />}
          {activeTab === 'architecture' && <ArchitectureTab />}
        </div>

        {/* Footer */}
        <footer className="border-t border-indigo-500/12 pt-8 text-center text-sm text-slate-500">
          <p>
            &copy; 2026 eVoucher Platform. Developed by{' '}
            <strong className="text-cyan-400">Lebo Mpeta</strong>.
          </p>
          <p className="mt-2">
            Website Repo:{' '}
            <a
              href="https://github.com/shelod-eng/eVoucher_Website2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              shelod-eng/eVoucher_Website2026
            </a>
            {' · '}
            Mobile Repo:{' '}
            <a
              href="https://github.com/shelod-eng/eVoucherMobile"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              shelod-eng/eVoucherMobile
            </a>
            {' · '}
            Email:{' '}
            <a href="mailto:mpetalebo@outlook.com" className="text-cyan-400 hover:underline">
              mpetalebo@outlook.com
            </a>
          </p>
        </footer>
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
