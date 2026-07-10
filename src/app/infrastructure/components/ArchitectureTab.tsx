'use client';

import { useState } from 'react';
import {
  Download,
  Layers,
  GitBranch,
  Database,
  Shield,
  Globe,
  Server,
  Smartphone,
  CreditCard,
  MessageSquare,
  Users,
  Store,
  BarChart3,
  Lock,
  Cloud,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';
import { ARCHITECTURE_PDF_PATH } from '../data/infrastructureData';

type ArchView = 'production' | 'spec';
type SpecSection = 'overview' | 'tech-stack' | 'data-flow' | 'erd' | 'security' | 'integrations';

const SPEC_SECTIONS: { id: SpecSection; label: string; icon: typeof Layers }[] = [
  { id: 'overview', label: 'Overview', icon: Layers },
  { id: 'tech-stack', label: 'Tech Stack', icon: GitBranch },
  { id: 'data-flow', label: 'Data Flow', icon: ArrowRight },
  { id: 'erd', label: 'ERD', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Globe },
];

function PlannedBadge() {
  return (
    <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400 border border-amber-500/25">
      Planned
    </span>
  );
}

function AsciiBlock({ children }: { children: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-indigo-500/15 bg-[#04080e] p-4">
      <pre className="font-accent text-xs leading-relaxed text-cyan-300/90 whitespace-pre">{children}</pre>
    </div>
  );
}

export default function ArchitectureTab() {
  const [view, setView] = useState<ArchView>('production');
  const [specSection, setSpecSection] = useState<SpecSection>('overview');

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-xl border border-indigo-500/15 bg-[#0b132b] p-1">
          <button
            type="button"
            onClick={() => setView('production')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              view === 'production'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Production View
          </button>
          <button
            type="button"
            onClick={() => setView('spec')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              view === 'spec'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Technical Specification (PDF)
          </button>
        </div>

        <a
          href={ARCHITECTURE_PDF_PATH}
          download
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/15 bg-[#0b132b] px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/10"
        >
          <Download className="h-4 w-4" />
          Download full PDF
        </a>
      </div>

      {view === 'production' ? <ProductionView /> : <SpecView section={specSection} onSectionChange={setSpecSection} />}
    </div>
  );
}

function ProductionView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-slate-300">
        This view reflects the <strong className="text-cyan-400">live 2026 stack</strong> as deployed on Vercel + Supabase,
        not the generic December 2025 specification document.
      </p>

      <div className="rounded-2xl border border-indigo-500/15 bg-[#0b132b] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">System Architecture Diagram — January 2026</h3>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">VERIFIED</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/architecture-2026.png"
          alt="eVoucher Platform Architecture 2026"
          className="w-full rounded-xl border border-indigo-500/15"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <p className="mt-3 text-xs text-slate-500">
          Place architecture-2026.png in /public/ to display the diagram image.
        </p>
      </div>

      <ArchPanel title="Layer 1 — Consumer Layer">
        <AsciiBlock>{`+-------------------------------------------------------------------------+
|  www.evoucher.co.za (Next.js 14 / Vercel)   Mobile App (Expo/RN)       |
|    - Buy Vouchers                             - Buy Vouchers            |
|    - Cart & Checkout                          - QR Code Scanner         |
|    - PayFast, Ozow, USSD, EFT, Airtime        - Offline Voucher Cache   |
|    - Voucher Wallet                           - SMS-triggered updates   |
+-------------------------------------------------------------------------+
                              | HTTPS / REST API
                              v`}</AsciiBlock>
      </ArchPanel>

      <ArchPanel title="Layer 2 — Payment Processing (Next.js API Routes)">
        <AsciiBlock>{`+-------------------------------------------------------------------------+
|  /api/v1/vouchers/purchase                                              |
|    - Payment validation & pricing calculation                           |
|    - Revenue split: 96% Merchant / 2.8% Member Benefit / 1.2% Platform |
|    - Providers: PayFast (cards), Ozow (EFT), USSD, Airtime             |
|    - Voucher code generation & transaction recording                    |
|    - createBillingEvent()       --> writes to billing_events            |
|    - queueBankservSettlement()  --> writes to bankserv_ledger           |
+-------------------------------------------------------------------------+
                              | Supabase SDK
                              v`}</AsciiBlock>
      </ArchPanel>

      <ArchPanel title="Layer 3 — Database Layer (Supabase PostgreSQL + Auth + Storage)">
        <AsciiBlock>{`+-------------------------------------------------------------------------+
|  Core Tables:                        Security:                          |
|    - billing_events  (portal reads)    - RLS on all sensitive tables    |
|    - payment_transactions              - Service role for admin ops     |
|    - customer_vouchers (issued codes)  - Anon key for public reads      |
|    - bankserv_ledger  (settle queue)   - POPIA-aligned data handling    |
|    - billing_settlements               - KYC gating before issuance     |
|    - merchants + merchant_products     - Audit logging on key actions   |
|    - audit_events + fraud_alerts       - 5-year PASA retention policy   |
+-------------------------------------------------------------------------+
                              | REST API Calls
                              v`}</AsciiBlock>
      </ArchPanel>

      <ArchPanel title="Layer 4 — Billing Engine Portal (React + Vite / Vercel)">
        <AsciiBlock>{`+-------------------------------------------------------------------------+
|  URL: https://evoucher-billing-portal.vercel.app                        |
|                                                                         |
|  1. DASHBOARD        GET /api/billing/dashboard                         |
|  2. VOUCHER LEDGER   GET /api/billing/events                            |
|  3. SETTLEMENTS      GET/POST /api/billing/settlements                  |
|  4. BANKSERV ADAPTOR GET /api/billing/bankserv/status                   |
|  5. AUDIT LOG        GET /api/v1/admin/audit-events                     |
+-------------------------------------------------------------------------+
                              | ACH File Export
                              v`}</AsciiBlock>
      </ArchPanel>

      <ArchPanel title="Layer 5 — Banking Settlement Layer">
        <AsciiBlock>{`+-------------------------------------------------------------------------+
|  FNB Sponsor Bank  -->  PCH/SAMOS (SARB)  -->  BankServ Africa          |
|  eVoucher Operating Account               ISO 20022 / ACK + NCK         |
|                                                                         |
|                   v  EFT Credit (T+2 Settlement)                        |
|                                                                         |
|  Merchant Bank Accounts (each receives 96% of face value)              |
+-------------------------------------------------------------------------+`}</AsciiBlock>
      </ArchPanel>

      <ArchPanel title="Revenue Split — Per R100 Voucher Purchase">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { pct: '96%', label: 'Merchant Payout', sub: 'R96.00 gross → R95.52 net after 0.5% bank fee', border: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.08)', accent: '#10b981' },
            { pct: '2.8%', label: 'Member Benefit', sub: 'R2.80 credited to consumer wallet', border: 'rgba(139,92,246,0.25)', bg: 'rgba(139,92,246,0.08)', accent: '#8b5cf6' },
            { pct: '1.2%', label: 'Platform Revenue', sub: 'R1.20 retained by eVoucher platform', border: 'rgba(6,182,212,0.25)', bg: 'rgba(6,182,212,0.08)', accent: '#06b6d4' },
            { pct: 'T+2', label: 'Settlement Cycle', sub: 'Merchants paid within 2 business days via BankServ ACH', border: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.08)', accent: '#f59e0b' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border p-5 text-center"
              style={{ borderColor: item.border, backgroundColor: item.bg }}
            >
              <div className="text-2xl font-bold" style={{ color: item.accent }}>{item.pct}</div>
              <div className="mt-1 text-sm font-medium text-white">{item.label}</div>
              <div className="mt-1 text-xs text-slate-400">{item.sub}</div>
            </div>
          ))}
        </div>
      </ArchPanel>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { title: 'Vercel Global CDN', text: 'Hosts the Next.js website, billing portal, and admin portal. Serverless API routes handle all payment and voucher logic.', color: 'border-l-violet-500' },
          { title: 'Supabase (PostgreSQL + Auth + Storage)', text: 'Central data store with RLS on all sensitive tables. Supabase Auth handles JWT tokens for admin, merchant and consumer roles.', color: 'border-l-cyan-500' },
          { title: 'BankServ Africa (ISO 20022)', text: 'ACH/NAEDO file submissions via FNB Sponsor Bank. ACK/NCK confirmations tracked in the billing portal per batch.', color: 'border-l-emerald-500' },
          { title: 'Full Architecture PDF', text: 'Download the signed December 2025 specification document for DTI and formal architecture reviews.', color: 'border-l-amber-500' },
        ].map((note) => (
          <div key={note.title} className={`rounded-xl border border-indigo-500/15 border-l-4 bg-[#0b132b] p-4 ${note.color}`}>
            <h5 className="text-sm font-semibold text-white">{note.title}</h5>
            <p className="mt-1 text-sm text-slate-400">{note.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-indigo-500/15 bg-[#0b132b] p-5">
      <h3 className="mb-4 text-sm font-semibold text-cyan-400">{title}</h3>
      {children}
    </div>
  );
}

function SpecView({
  section,
  onSectionChange,
}: {
  section: SpecSection;
  onSectionChange: (s: SpecSection) => void;
}) {
  return (
    <div className="animate-fade-in">
      <p className="mb-4 rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-slate-300">
        Mirrors the <strong className="text-violet-400">System Architecture - 2026.pdf</strong> specification.
        Items marked <span className="text-amber-400 font-semibold">Planned</span> are in the signed spec but not yet in production.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {SPEC_SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSectionChange(id)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              section === id
                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                : 'border-indigo-500/15 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {section === 'overview' && <SpecOverview />}
      {section === 'tech-stack' && <SpecTechStack />}
      {section === 'data-flow' && <SpecDataFlow />}
      {section === 'erd' && <SpecERD />}
      {section === 'security' && <SpecSecurity />}
      {section === 'integrations' && <SpecIntegrations />}
    </div>
  );
}

function SpecOverview() {
  return (
    <div className="space-y-4 rounded-2xl border border-indigo-500/15 bg-[#0b132b] p-6">
      <h3 className="flex items-center gap-2 text-base font-semibold text-white">
        <Layers className="h-5 w-5 text-cyan-400" /> High-Level System Architecture
      </h3>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-300">
          <Globe className="h-4 w-4" /> Presentation Layer (Frontend)
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Smartphone, label: 'Mobile PWA', sub: 'React + Tailwind' },
            { icon: Globe, label: 'Web Portal', sub: 'React SPA' },
            { icon: MessageSquare, label: 'USSD Interface', sub: '*120*384#' },
            { icon: Store, label: 'Merchant POS', sub: 'QR Scanner' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="rounded-lg border border-blue-500/15 bg-[#060b13] p-3 text-center">
              <Icon className="mx-auto mb-1 h-5 w-5 text-blue-400" />
              <p className="text-xs font-medium text-white">{label}</p>
              <p className="text-[10px] text-slate-500">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center"><ArrowDown className="h-5 w-5 text-slate-600" /></div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-300">
          <Server className="h-4 w-4" /> Application Layer (Backend Services)
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { icon: Users, label: 'Auth Service', sub: 'JWT + MFA' },
            { icon: CreditCard, label: 'Voucher Engine', sub: 'Issue/Redeem' },
            { icon: BarChart3, label: 'Ledger Service', sub: 'Double-entry' },
            { icon: Store, label: 'Merchant API', sub: 'Settlements' },
            { icon: Shield, label: 'Fraud Detection', sub: 'ML-based', planned: true },
          ].map(({ icon: Icon, label, sub, planned }) => (
            <div key={label} className="rounded-lg border border-emerald-500/15 bg-[#060b13] p-3 text-center">
              <Icon className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
              <p className="text-xs font-medium text-white">{label}</p>
              <p className="text-[10px] text-slate-500">{sub}</p>
              {planned && <div className="mt-1"><PlannedBadge /></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center"><ArrowDown className="h-5 w-5 text-slate-600" /></div>

      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-violet-300">
          <Database className="h-4 w-4" /> Data Layer (Storage & Integration)
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Database, label: 'PostgreSQL', sub: 'Primary DB' },
            { icon: Cloud, label: 'Redis Cache', sub: 'Session/Cache', planned: true },
            { icon: Lock, label: 'Vault', sub: 'Secrets Mgmt', planned: true },
            { icon: BarChart3, label: 'Analytics DW', sub: 'Reporting', planned: true },
          ].map(({ icon: Icon, label, sub, planned }) => (
            <div key={label} className="rounded-lg border border-violet-500/15 bg-[#060b13] p-3 text-center">
              <Icon className="mx-auto mb-1 h-5 w-5 text-violet-400" />
              <p className="text-xs font-medium text-white">{label}</p>
              <p className="text-[10px] text-slate-500">{sub}</p>
              {planned && <div className="mt-1"><PlannedBadge /></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpecTechStack() {
  const columns = [
    {
      title: 'Frontend',
      color: 'blue',
      items: [
        { name: 'React 18', sub: 'UI Framework' },
        { name: 'Tailwind CSS', sub: 'Styling' },
        { name: 'React Query', sub: 'Data Fetching' },
        { name: 'Framer Motion', sub: 'Animations', planned: true },
        { name: 'PWA', sub: 'Offline Support' },
      ],
    },
    {
      title: 'Backend',
      color: 'emerald',
      items: [
        { name: 'Node.js / Python', sub: 'API Services', planned: true },
        { name: 'RESTful API', sub: 'Communication' },
        { name: 'JWT + OAuth2', sub: 'Authentication' },
        { name: 'Serverless Functions', sub: 'Microservices', planned: true },
        { name: 'Queue System', sub: 'Async Processing', planned: true },
      ],
    },
    {
      title: 'Infrastructure',
      color: 'violet',
      items: [
        { name: 'AWS / Azure', sub: 'Cloud Platform', planned: true },
        { name: 'PostgreSQL', sub: 'Database' },
        { name: 'Redis', sub: 'Caching Layer', planned: true },
        { name: 'CDN', sub: 'Content Delivery' },
        { name: 'Docker + K8s', sub: 'Containerization', planned: true },
      ],
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((col) => (
        <div key={col.title} className="rounded-2xl border border-indigo-500/15 bg-[#0b132b] p-4">
          <h3 className="mb-3 text-sm font-bold text-white">{col.title}</h3>
          <div className="space-y-2">
            {col.items.map((item) => (
              <div key={item.name} className="rounded-lg border border-indigo-500/10 bg-[#060b13] p-3">
                <p className="text-sm font-medium text-white">
                  {item.name}
                  {'planned' in item && item.planned && <PlannedBadge />}
                </p>
                <p className="text-xs text-slate-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SpecDataFlow() {
  const purchaseSteps = [
    { step: '1', label: 'Consumer', sub: 'Selects Voucher' },
    { step: '2', label: 'Payment', sub: 'Card/EFT/Wallet' },
    { step: '3', label: 'Validation', sub: 'Fraud Check' },
    { step: '4', label: 'Ledger', sub: 'Debit/Credit' },
    { step: '5', label: 'Issue', sub: 'Generate Code' },
    { step: '6', label: 'Notify', sub: 'SMS/Push' },
  ];

  const redeemSteps = [
    { step: '1', label: 'Consumer', sub: 'Shows QR/Code' },
    { step: '2', label: 'Merchant POS', sub: 'Scans Code' },
    { step: '3', label: 'Validate', sub: 'Check Balance' },
    { step: '4', label: 'Authorize', sub: 'Amount Check' },
    { step: '5', label: 'Ledger', sub: 'Update Balance' },
    { step: '6', label: 'Confirm', sub: 'Receipt' },
  ];

  return (
    <div className="space-y-6 rounded-2xl border border-indigo-500/15 bg-[#0b132b] p-6">
      <div>
        <h3 className="mb-4 text-sm font-semibold text-white">3.1 Voucher Purchase Flow</h3>
        <FlowSteps steps={purchaseSteps} />
      </div>
      <div>
        <h3 className="mb-4 text-sm font-semibold text-white">3.2 Voucher Redemption Flow</h3>
        <FlowSteps steps={redeemSteps} />
      </div>
    </div>
  );
}

function FlowSteps({ steps }: { steps: { step: string; label: string; sub: string }[] }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {steps.map((item, idx) => (
        <div key={item.step} className="flex items-center gap-2">
          <div className="min-w-[90px] rounded-lg border border-indigo-500/15 bg-[#060b13] p-3 text-center">
            <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white">
              {item.step}
            </div>
            <p className="text-xs font-medium text-white">{item.label}</p>
            <p className="text-[10px] text-slate-500">{item.sub}</p>
          </div>
          {idx < steps.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />}
        </div>
      ))}
    </div>
  );
}

function SpecERD() {
  const entities = [
    { name: 'ConsumerProfile', color: 'blue', fields: ['id (PK)', 'userId, email, fullName', 'phone, walletBalance', 'rewardsTier, rewardsPoints'] },
    { name: 'Merchant', color: 'emerald', fields: ['id (PK)', 'name, logo, category', 'email, status', 'bankName, accountNumber'] },
    { name: 'VoucherProduct', color: 'amber', fields: ['id (PK)', 'merchantId (FK)', 'faceValue, consumerPrice', 'merchantPayout, platformMargin'] },
    { name: 'VoucherInstance', color: 'violet', fields: ['id (PK)', 'voucherProductId (FK)', 'consumerId (FK)', 'voucherCode, remainingBalance'] },
    { name: 'Transaction', color: 'red', fields: ['id (PK)', 'type, amount, status', 'userId, merchantId (FK)', 'paymentMethod, reference'] },
    { name: 'LedgerEntry', color: 'indigo', fields: ['id (PK)', 'entryType, amount', 'transactionId (FK)', 'merchantId (FK)'] },
    { name: 'WalletTransaction', color: 'teal', fields: ['id (PK)', 'userId (FK)', 'type, amount', 'balanceAfter, status'] },
    { name: 'Referral', color: 'pink', fields: ['id (PK)', 'referrerUserId (FK)', 'referredUserId (FK)', 'referralCode, bonusAmount'] },
  ];

  return (
    <div className="rounded-2xl border border-indigo-500/15 bg-[#0b132b] p-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {entities.map((e) => (
          <div key={e.name} className="rounded-lg border border-indigo-500/15 bg-[#060b13] p-3">
            <h4 className="text-sm font-bold text-cyan-400">{e.name}</h4>
            <div className="mt-2 space-y-0.5">
              {e.fields.map((f) => (
                <p key={f} className="font-accent text-[10px] text-slate-400">{f}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-indigo-500/10 bg-[#060b13] p-3 text-xs text-slate-400">
        <p className="mb-2 font-semibold text-slate-300">Relationships:</p>
        <div className="grid gap-1 sm:grid-cols-2">
          <p>Merchant (1) → (*) VoucherProduct</p>
          <p>VoucherProduct (1) → (*) VoucherInstance</p>
          <p>ConsumerProfile (1) → (*) VoucherInstance</p>
          <p>ConsumerProfile (1) → (*) Transaction</p>
          <p>Transaction (1) → (*) LedgerEntry</p>
          <p>ConsumerProfile (1) → (*) WalletTransaction</p>
        </div>
      </div>
    </div>
  );
}

function SpecSecurity() {
  const layers = [
    { n: '1', title: 'Network Security', sub: 'TLS 1.3, WAF, DDoS Protection, VPN' },
    { n: '2', title: 'Application Security', sub: 'JWT Auth, RBAC, Input Validation, OWASP' },
    { n: '3', title: 'Data Security', sub: 'AES-256 Encryption, Key Rotation, Masking' },
    { n: '4', title: 'Operational Security', sub: 'Audit Logs, SIEM, Incident Response' },
  ];

  const compliance = ['POPIA', 'PASA', 'SARB', 'FIC', 'PCI-DSS', 'ISO 27001'];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-indigo-500/15 bg-[#0b132b] p-5">
        <h3 className="mb-4 text-sm font-bold text-white">Security Layers</h3>
        <div className="space-y-2">
          {layers.map((l) => (
            <div key={l.n} className="flex items-start gap-3 rounded-lg border border-indigo-500/10 bg-[#060b13] p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-red-500/15 text-sm font-bold text-red-400">
                {l.n}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{l.title}</p>
                <p className="text-xs text-slate-500">{l.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-indigo-500/15 bg-[#0b132b] p-5">
        <h3 className="mb-4 text-sm font-bold text-white">Compliance Framework</h3>
        <div className="grid grid-cols-2 gap-2">
          {compliance.map((c) => (
            <div key={c} className="rounded-lg border border-emerald-500/15 bg-[#060b13] p-3 text-center">
              <p className="text-sm font-bold text-emerald-400">{c}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpecIntegrations() {
  const groups = [
    {
      title: 'Payment Gateways',
      icon: CreditCard,
      color: 'text-blue-400',
      items: ['Peach Payments', 'PayFast', 'Ozow (EFT)', 'SnapScan'],
    },
    {
      title: 'Communication',
      icon: MessageSquare,
      color: 'text-emerald-400',
      items: ['USSD Gateway (*120*384#)', 'SMS API (Clickatell)', 'Push Notifications', 'Email (SendGrid)'],
    },
    {
      title: 'Third Party',
      icon: Store,
      color: 'text-violet-400',
      items: ['Retailer POS Systems', 'SASSA Database', 'Analytics (Google)', 'KYC Provider'],
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {groups.map((g) => {
        const Icon = g.icon;
        return (
          <div key={g.title} className="rounded-2xl border border-indigo-500/15 bg-[#0b132b] p-5">
            <h3 className={`mb-3 flex items-center gap-2 text-sm font-bold text-white`}>
              <Icon className={`h-4 w-4 ${g.color}`} />
              {g.title}
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              {g.items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
