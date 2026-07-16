'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Gift,
  Layers,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
} from 'lucide-react';

const VOUCHER_TEMPLATES = [
  { id: 'VT-001', name: 'Standard Grocery', type: 'Open', value: 'R50–R500', expiry: '30 days', campaigns: 4, status: 'Active' },
  { id: 'VT-002', name: 'Government Food Relief', type: 'Restricted', value: 'R350', expiry: '14 days', campaigns: 2, status: 'Active' },
  { id: 'VT-003', name: 'Corporate Gift Card', type: 'Fixed', value: 'R200', expiry: '90 days', campaigns: 1, status: 'Active' },
  { id: 'VT-004', name: 'SASSA Beneficiary', type: 'Restricted', value: 'R350', expiry: '7 days', campaigns: 3, status: 'Active' },
  { id: 'VT-005', name: 'Cashback Reward', type: 'Cashback', value: '5%', expiry: '60 days', campaigns: 0, status: 'Draft' },
];

const CAMPAIGNS = [
  { id: 'CAM-2026-07', name: 'July Food Relief', sponsor: 'SASSA', budget: 'R2.4m', issued: '18,400', redeemed: '14,200', status: 'Active', ends: '31 Jul 2026' },
  { id: 'CAM-2026-06', name: 'Winter Warmth', sponsor: 'DTI', budget: 'R800k', issued: '4,200', redeemed: '4,200', status: 'Completed', ends: '30 Jun 2026' },
  { id: 'CAM-2026-08', name: 'Back to School', sponsor: 'DBE', budget: 'R1.2m', issued: '0', redeemed: '0', status: 'Scheduled', ends: '15 Aug 2026' },
];

const REDEMPTION_RULES = [
  { rule: 'Single voucher per transaction', value: 'Enabled', editable: true },
  { rule: 'QR code expiry on scan', value: '60 seconds', editable: true },
  { rule: 'Partial redemption', value: 'Disabled', editable: true },
  { rule: 'Cross-merchant redemption', value: 'Disabled', editable: false },
  { rule: 'USSD redemption', value: 'Enabled', editable: true },
  { rule: 'Offline QR caching', value: 'Enabled (Mobile)', editable: true },
];

type Panel = 'templates' | 'campaigns' | 'rules' | 'bulk';

function statusBadge(status: string) {
  if (status === 'Active') return 'bg-[#DCFCE7] text-[#166534]';
  if (status === 'Completed') return 'bg-[#EAFBFD] text-[#108995]';
  if (status === 'Scheduled') return 'bg-[#FEF3C7] text-[#92400E]';
  return 'bg-[#F1F5F9] text-[#64748B]';
}

export default function VoucherEngineWorkspace() {
  const [panel, setPanel] = useState<Panel>('templates');
  const [search, setSearch] = useState('');

  const filteredTemplates = VOUCHER_TEMPLATES.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">Voucher Engine</p>
            <h2 className="mt-1 font-headline text-2xl font-bold text-[#20324A]">Voucher Configuration</h2>
            <p className="mt-1 text-sm text-[#64748B]">Templates, campaigns, redemption rules, expiry, QR codes, and bulk issuance.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'templates', label: 'Templates', icon: Layers },
              { id: 'campaigns', label: 'Campaigns', icon: Zap },
              { id: 'rules', label: 'Redemption Rules', icon: CheckCircle2 },
              { id: 'bulk', label: 'Bulk Issuance', icon: Gift },
            ] as { id: Panel; label: string; icon: typeof Gift }[]).map(({ id, label, icon: Icon }) => (
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

      {panel === 'templates' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex flex-wrap items-center gap-4 border-b border-[#E6EEF5] p-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#20B8C5]"
              />
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#108995]">
              <Gift className="h-4 w-4" /> New Template
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Template ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Value</th>
                  <th className="px-4 py-3 text-left">Expiry</th>
                  <th className="px-4 py-3 text-left">Campaigns</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((v) => (
                  <tr key={v.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{v.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{v.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-xs font-semibold text-[#108995]">{v.type}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{v.value}</td>
                    <td className="px-4 py-3 text-[#64748B]">{v.expiry}</td>
                    <td className="px-4 py-3 text-[#64748B]">{v.campaigns}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(v.status)}`}>{v.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]">Edit</button>
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEE2E2]">Freeze</button>
                        <button type="button" className="rounded px-2 py-1 text-[#94A3B8] hover:bg-[#F7F9FC]">
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
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-5">
            <div>
              <h3 className="font-headline text-lg font-semibold text-[#20324A]">Active Campaigns</h3>
              <p className="mt-1 text-sm text-[#64748B]">Government and sponsor voucher campaigns with budget tracking.</p>
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#108995]">
              <Zap className="h-4 w-4" /> New Campaign
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Campaign ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Sponsor</th>
                  <th className="px-4 py-3 text-left">Budget</th>
                  <th className="px-4 py-3 text-left">Issued</th>
                  <th className="px-4 py-3 text-left">Redeemed</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Ends</th>
                </tr>
              </thead>
              <tbody>
                {CAMPAIGNS.map((c) => (
                  <tr key={c.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{c.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{c.name}</td>
                    <td className="px-4 py-3 text-[#64748B]">{c.sponsor}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{c.budget}</td>
                    <td className="px-4 py-3 text-[#64748B]">{c.issued}</td>
                    <td className="px-4 py-3 text-[#64748B]">{c.redeemed}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{c.ends}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'rules' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">Redemption Rules</h3>
            <p className="mt-1 text-sm text-[#64748B]">Platform-wide voucher redemption configuration.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Rule</th>
                  <th className="px-4 py-3 text-left">Value</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {REDEMPTION_RULES.map((rule) => (
                  <tr key={rule.rule} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{rule.rule}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${rule.value.includes('Enabled') ? 'bg-[#DCFCE7] text-[#166534]' : rule.value.includes('Disabled') ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-[#EAFBFD] text-[#108995]'}`}>
                        {rule.value}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {rule.editable ? (
                        <button type="button" className="text-xs font-semibold text-[#108995] hover:underline">Edit rule</button>
                      ) : (
                        <span className="text-xs text-[#94A3B8]">System locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'bulk' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white p-6">
          <h3 className="font-headline text-lg font-semibold text-[#20324A]">Bulk Voucher Issuance</h3>
          <p className="mt-1 text-sm text-[#64748B]">Issue vouchers in bulk for government programmes, sponsor campaigns, or corporate clients.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Template', placeholder: 'Select voucher template', type: 'select' },
              { label: 'Campaign', placeholder: 'Select campaign', type: 'select' },
              { label: 'Quantity', placeholder: 'e.g. 1000', type: 'number' },
              { label: 'Expiry date', placeholder: 'YYYY-MM-DD', type: 'date' },
            ].map((field) => (
              <div key={field.label}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] px-4 py-2.5 text-sm text-[#20324A] outline-none focus:border-[#20B8C5]"
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#108995]">
              <Gift className="h-4 w-4" /> Generate Vouchers
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[#E6EEF5] bg-white px-5 py-2.5 text-sm font-semibold text-[#20324A] hover:bg-[#F7F9FC]">
              <Filter className="h-4 w-4" /> Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
