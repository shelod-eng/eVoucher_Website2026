'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Building2,
  CreditCard,
  Database,
  Download,
  FileText,
  Globe2,
  Landmark,
  ShieldCheck,
  Smartphone,
  Store,
  Users,
} from 'lucide-react';
import { ARCHITECTURE_PDF_PATH } from '../data/infrastructureData';

type ArchView = 'story' | 'controls';

const FLOW = [
  { label: 'Consumer', sub: 'Web, mobile, USSD', icon: Users },
  { label: 'Merchant', sub: 'Retail and township stores', icon: Store },
  { label: 'eVoucher Platform', sub: 'Wallets, vouchers, rewards', icon: Globe2 },
  { label: 'Banking Partners', sub: 'Payments and settlement', icon: Landmark },
  { label: 'Government & Sponsors', sub: 'Program funding and oversight', icon: Building2 },
  { label: 'Reporting', sub: 'Impact and compliance analytics', icon: BarChart3 },
];

const CONTROLS = [
  {
    title: 'Secure Access',
    text: 'Role-based access separates consumer, merchant, sponsor, and administrator journeys.',
    icon: ShieldCheck,
  },
  {
    title: 'Financial Integrity',
    text: 'Voucher purchase, redemption, ledger, and settlement events are recorded with audit visibility.',
    icon: CreditCard,
  },
  {
    title: 'Data Protection',
    text: 'Sensitive customer, merchant, and payment records are protected with database policies and controlled administration.',
    icon: Database,
  },
  {
    title: 'Inclusive Access',
    text: 'The platform supports web, mobile, and USSD so beneficiaries can participate without a smartphone.',
    icon: Smartphone,
  },
];

const OUTCOMES = [
  { value: 'T+2', label: 'Settlement target', text: 'Merchant payout cycle via banking partners' },
  { value: '8', label: 'Payment channels', text: 'Cards, EFT, cash, wallet, airtime, and USSD' },
  { value: '20', label: 'Core data assets', text: 'Structured platform records for auditability' },
  { value: '99.7%', label: 'Payment success', text: 'Measured across active payment journeys' },
];

export default function ArchitectureTab() {
  const [view, setView] = useState<ArchView>('story');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
        <div>
          <h2 className="font-headline text-xl font-semibold text-[#20324A]">Platform Overview</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            A business-first view of how eVoucher connects consumers, merchants, banks, sponsors,
            and reporting.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="inline-flex rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] p-1">
            <button
              type="button"
              onClick={() => setView('story')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                view === 'story'
                  ? 'bg-white text-[#108995] shadow-sm'
                  : 'text-[#64748B] hover:text-[#20324A]'
              }`}
            >
              Value Flow
            </button>
            <button
              type="button"
              onClick={() => setView('controls')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                view === 'controls'
                  ? 'bg-white text-[#108995] shadow-sm'
                  : 'text-[#64748B] hover:text-[#20324A]'
              }`}
            >
              Controls
            </button>
          </div>

          <a
            href={ARCHITECTURE_PDF_PATH}
            download
            className="inline-flex items-center gap-2 rounded-lg border border-[#20B8C5] bg-white px-4 py-2 text-sm font-semibold text-[#108995] transition-colors hover:bg-[#EAFBFD]"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
        </div>
      </div>

      {view === 'story' ? <ValueFlow /> : <ControlsView />}
    </div>
  );
}

function ValueFlow() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr]">
          {FLOW.map(({ label, sub, icon: Icon }, index) => (
            <div key={label} className="contents">
              <div className="rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] p-4 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#20B8C5]/10 text-[#20B8C5]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-headline text-sm font-semibold text-[#20324A]">{label}</p>
                <p className="mt-1 text-xs text-[#64748B]">{sub}</p>
              </div>
              {index < FLOW.length - 1 && (
                <div className="hidden items-center justify-center text-[#94A3B8] lg:flex">
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
              {index < FLOW.length - 1 && (
                <div className="flex justify-center text-[#94A3B8] lg:hidden">
                  <ArrowDown className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {OUTCOMES.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm"
          >
            <p className="font-headline text-3xl font-bold text-[#20B8C5]">{item.value}</p>
            <p className="mt-2 font-semibold text-[#20324A]">{item.label}</p>
            <p className="mt-1 text-sm text-[#64748B]">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-[#D7F3F6] bg-[#EAFBFD] p-6">
        <h3 className="font-headline text-lg font-semibold text-[#20324A]">Executive Narrative</h3>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          eVoucher converts sponsor or consumer funding into controlled digital value that can be
          spent with approved merchants, settled through banking partners, and reported back through
          measurable impact dashboards. The same operating model supports urban retail, township
          merchants, and low-connectivity access through USSD.
        </p>
      </div>
    </div>
  );
}

function ControlsView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2">
        {CONTROLS.map(({ title, text, icon: Icon }) => (
          <div key={title} className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#20B8C5]/10 text-[#20B8C5]">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-headline text-base font-semibold text-[#20324A]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">{text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-[#E6EEF5] bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#20324A]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">
              Detailed Technical Pack
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              The full PDF remains available for technical diligence, architecture review, and
              implementation handover. This dashboard presents the same platform in language suited
              to government, financial institutions, sponsors, and investors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
