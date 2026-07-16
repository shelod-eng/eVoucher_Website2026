'use client';

import { useState } from 'react';
import {
  Handshake,
  BarChart3,
  FileText,
  DollarSign,
  CheckCircle2,
  MoreHorizontal,
  Plus,
  TrendingUp,
} from 'lucide-react';

const SPONSORS = [
  {
    id: 'SP-001',
    name: 'SASSA',
    type: 'Government',
    allocated: 'R14.7m',
    used: 'R10.6m',
    campaigns: 3,
    status: 'Active',
    contact: 'grants@sassa.gov.za',
  },
  {
    id: 'SP-002',
    name: 'DTI',
    type: 'Government',
    allocated: 'R2.9m',
    used: 'R2.9m',
    campaigns: 1,
    status: 'Completed',
    contact: 'info@dti.gov.za',
  },
  {
    id: 'SP-003',
    name: 'Shoprite Holdings',
    type: 'Corporate',
    allocated: 'R3.2m',
    used: 'R1.8m',
    campaigns: 2,
    status: 'Active',
    contact: 'partnerships@shoprite.co.za',
  },
  {
    id: 'SP-004',
    name: 'DBE',
    type: 'Government',
    allocated: 'R6.3m',
    used: 'R0',
    campaigns: 1,
    status: 'Scheduled',
    contact: 'info@dbe.gov.za',
  },
  {
    id: 'SP-005',
    name: 'Pick n Pay',
    type: 'Corporate',
    allocated: 'R1.5m',
    used: 'R0.9m',
    campaigns: 1,
    status: 'Active',
    contact: 'corporate@pnp.co.za',
  },
];

const CAMPAIGNS = [
  {
    id: 'SC-001',
    sponsor: 'SASSA',
    name: 'July Food Relief',
    budget: 'R2.4m',
    issued: '18,400',
    redeemed: '14,200',
    roi: '77%',
    status: 'Active',
  },
  {
    id: 'SC-002',
    sponsor: 'Shoprite Holdings',
    name: 'Winter Savings',
    budget: 'R800k',
    issued: '4,200',
    redeemed: '3,900',
    roi: '93%',
    status: 'Active',
  },
  {
    id: 'SC-003',
    sponsor: 'DTI',
    name: 'Winter Warmth',
    budget: 'R2.9m',
    issued: '8,400',
    redeemed: '8,400',
    roi: '100%',
    status: 'Completed',
  },
  {
    id: 'SC-004',
    sponsor: 'DBE',
    name: 'Back to School',
    budget: 'R6.3m',
    issued: '0',
    redeemed: '0',
    roi: '—',
    status: 'Scheduled',
  },
];

const INVOICES = [
  {
    id: 'INV-2026-041',
    sponsor: 'SASSA',
    amount: 'R2.4m',
    period: 'Jul 2026',
    issued: '01 Jul 2026',
    due: '15 Jul 2026',
    status: 'Paid',
  },
  {
    id: 'INV-2026-042',
    sponsor: 'Shoprite Holdings',
    amount: 'R800k',
    period: 'Jul 2026',
    issued: '01 Jul 2026',
    due: '15 Jul 2026',
    status: 'Pending',
  },
  {
    id: 'INV-2026-043',
    sponsor: 'Pick n Pay',
    amount: 'R500k',
    period: 'Jun 2026',
    issued: '01 Jun 2026',
    due: '15 Jun 2026',
    status: 'Paid',
  },
];

type Panel = 'sponsors' | 'campaigns' | 'invoices' | 'reports';

function statusBadge(s: string) {
  if (s === 'Active' || s === 'Paid') return 'bg-[#DCFCE7] text-[#166534]';
  if (s === 'Completed') return 'bg-[#EAFBFD] text-[#108995]';
  if (s === 'Scheduled') return 'bg-[#FEF3C7] text-[#92400E]';
  if (s === 'Pending') return 'bg-[#FEF3C7] text-[#92400E]';
  return 'bg-[#F1F5F9] text-[#64748B]';
}

export default function SponsorsWorkspace() {
  const [panel, setPanel] = useState<Panel>('sponsors');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">
              Sponsor Relations
            </p>
            <h2 className="mt-1 font-headline text-2xl font-bold text-[#20324A]">
              Sponsor Relationship Management
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Funding, campaigns, ROI reporting, invoices, and contract management.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'sponsors', label: 'Sponsors', icon: Handshake },
                { id: 'campaigns', label: 'Campaigns', icon: TrendingUp },
                { id: 'invoices', label: 'Invoices', icon: DollarSign },
                { id: 'reports', label: 'ROI Reports', icon: BarChart3 },
              ] as { id: Panel; label: string; icon: typeof Handshake }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPanel(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  panel === id
                    ? 'bg-[#20B8C5] text-white'
                    : 'border border-[#E6EEF5] bg-white text-[#20324A] hover:bg-[#EAFBFD]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {panel === 'sponsors' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-5">
            <div>
              <h3 className="font-headline text-lg font-semibold text-[#20324A]">
                Sponsor Registry
              </h3>
              <p className="mt-1 text-sm text-[#64748B]">
                Government and corporate sponsors with allocation and campaign tracking.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#108995]"
            >
              <Plus className="h-4 w-4" /> Add Sponsor
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Sponsor ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Allocated</th>
                  <th className="px-4 py-3 text-left">Used</th>
                  <th className="px-4 py-3 text-left">Campaigns</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {SPONSORS.map((s) => (
                  <tr key={s.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{s.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-xs font-semibold text-[#108995]">
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{s.allocated}</td>
                    <td className="px-4 py-3 text-[#64748B]">{s.used}</td>
                    <td className="px-4 py-3 text-[#64748B]">{s.campaigns}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(s.status)}`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-[#94A3B8] hover:bg-[#F7F9FC]"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'campaigns' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">
              Sponsor Campaigns
            </h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Campaign performance with issuance, redemption, and ROI tracking.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Campaign ID</th>
                  <th className="px-4 py-3 text-left">Sponsor</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Budget</th>
                  <th className="px-4 py-3 text-left">Issued</th>
                  <th className="px-4 py-3 text-left">Redeemed</th>
                  <th className="px-4 py-3 text-left">ROI</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {CAMPAIGNS.map((c) => (
                  <tr key={c.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{c.id}</td>
                    <td className="px-4 py-3 text-[#64748B]">{c.sponsor}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{c.name}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{c.budget}</td>
                    <td className="px-4 py-3 text-[#64748B]">{c.issued}</td>
                    <td className="px-4 py-3 text-[#64748B]">{c.redeemed}</td>
                    <td className="px-4 py-3 font-semibold text-[#166534]">{c.roi}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(c.status)}`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'invoices' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-5">
            <div>
              <h3 className="font-headline text-lg font-semibold text-[#20324A]">
                Sponsor Invoices
              </h3>
              <p className="mt-1 text-sm text-[#64748B]">
                Billing records per sponsor with payment status tracking.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#108995]"
            >
              <Plus className="h-4 w-4" /> Create Invoice
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Invoice ID</th>
                  <th className="px-4 py-3 text-left">Sponsor</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-left">Issued</th>
                  <th className="px-4 py-3 text-left">Due</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {INVOICES.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{inv.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{inv.sponsor}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{inv.amount}</td>
                    <td className="px-4 py-3 text-[#64748B]">{inv.period}</td>
                    <td className="px-4 py-3 text-[#64748B]">{inv.issued}</td>
                    <td className="px-4 py-3 text-[#64748B]">{inv.due}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(inv.status)}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]"
                        >
                          Download
                        </button>
                        {inv.status === 'Pending' && (
                          <button
                            type="button"
                            className="rounded px-2 py-1 text-xs font-semibold text-[#166534] hover:bg-[#DCFCE7]"
                          >
                            <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'reports' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: 'Sponsor ROI Summary',
              desc: 'Redemption rates, voucher utilisation, and campaign performance per sponsor.',
              action: 'Export PDF',
            },
            {
              title: 'Budget Utilisation Report',
              desc: 'Allocated vs spent per sponsor and campaign with variance analysis.',
              action: 'Export Excel',
            },
            {
              title: 'Beneficiary Impact Pack',
              desc: 'Number of beneficiaries reached, provinces covered, and demographic breakdown.',
              action: 'Export PDF',
            },
            {
              title: 'Settlement Reconciliation',
              desc: 'Sponsor funding received vs vouchers issued and redeemed.',
              action: 'Export CSV',
            },
          ].map((report) => (
            <div key={report.title} className="rounded-lg border border-[#E6EEF5] bg-white p-5">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#108995]" />
                <div className="flex-1">
                  <p className="font-semibold text-[#20324A]">{report.title}</p>
                  <p className="mt-1 text-sm text-[#64748B]">{report.desc}</p>
                  <button
                    type="button"
                    className="mt-3 rounded-lg bg-[#20B8C5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#108995]"
                  >
                    {report.action}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
