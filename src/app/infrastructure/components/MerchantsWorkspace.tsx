'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  FileText,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';

const MERCHANTS = [
  {
    id: 'M-0041',
    name: 'Shoprite Soweto',
    category: 'Grocery',
    status: 'Active',
    kyc: 'Verified',
    settlement: 'R12,400',
    pos: 'Online',
    joined: '10 Jan 2026',
  },
  {
    id: 'M-0042',
    name: 'Boxer Gauteng North',
    category: 'Grocery',
    status: 'Active',
    kyc: 'Verified',
    settlement: 'R8,200',
    pos: 'Online',
    joined: '15 Jan 2026',
  },
  {
    id: 'M-0043',
    name: 'Spaza Corner Khayelitsha',
    category: 'Spaza',
    status: 'Pending',
    kyc: 'Pending',
    settlement: 'R0',
    pos: 'Offline',
    joined: '02 Jul 2026',
  },
  {
    id: 'M-0044',
    name: 'Pick n Pay Sandton',
    category: 'Grocery',
    status: 'Active',
    kyc: 'Verified',
    settlement: 'R21,800',
    pos: 'Online',
    joined: '20 Feb 2026',
  },
  {
    id: 'M-0045',
    name: 'Checkers Durban CBD',
    category: 'Grocery',
    status: 'Active',
    kyc: 'Verified',
    settlement: 'R9,600',
    pos: 'Online',
    joined: '05 Mar 2026',
  },
  {
    id: 'M-0046',
    name: 'Spar Limpopo',
    category: 'Grocery',
    status: 'Suspended',
    kyc: 'Failed',
    settlement: 'R0',
    pos: 'Offline',
    joined: '18 Apr 2026',
  },
];

const APPROVAL_QUEUE = [
  {
    id: 'APP-091',
    merchant: 'Spaza Corner Khayelitsha',
    type: 'New merchant',
    submitted: '5h ago',
    docs: 'ID + Bank letter',
    reviewer: 'Unassigned',
  },
  {
    id: 'APP-092',
    merchant: 'Nkosi Butchery Mamelodi',
    type: 'New merchant',
    submitted: '8h ago',
    docs: 'ID + CIPC',
    reviewer: 'Unassigned',
  },
  {
    id: 'APP-093',
    merchant: 'Thabo Spaza Tembisa',
    type: 'Bank detail change',
    submitted: '2h ago',
    docs: 'Bank confirmation',
    reviewer: 'Unassigned',
  },
];

const SETTLEMENT_QUEUE = [
  {
    id: 'SET-2026-07-14',
    merchant: 'Shoprite Soweto',
    amount: 'R12,400',
    batches: 3,
    status: 'Pending approval',
    due: 'T+1',
  },
  {
    id: 'SET-2026-07-14B',
    merchant: 'Pick n Pay Sandton',
    amount: 'R21,800',
    batches: 5,
    status: 'Pending approval',
    due: 'T+1',
  },
  {
    id: 'SET-2026-07-13',
    merchant: 'Boxer Gauteng North',
    amount: 'R8,200',
    batches: 2,
    status: 'Approved',
    due: 'Processed',
  },
];

type Panel = 'list' | 'approvals' | 'settlement' | 'performance';

function statusBadge(status: string) {
  if (status === 'Active') return 'bg-[#DCFCE7] text-[#166534]';
  if (status === 'Suspended') return 'bg-[#FEE2E2] text-[#B91C1C]';
  return 'bg-[#FEF3C7] text-[#92400E]';
}

function kycBadge(kyc: string) {
  if (kyc === 'Verified') return 'bg-[#DCFCE7] text-[#166534]';
  if (kyc === 'Failed') return 'bg-[#FEE2E2] text-[#B91C1C]';
  return 'bg-[#FEF3C7] text-[#92400E]';
}

export default function MerchantsWorkspace() {
  const [panel, setPanel] = useState<Panel>('list');
  const [search, setSearch] = useState('');

  const filtered = MERCHANTS.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">
              Merchant Operations
            </p>
            <h2 className="mt-1 font-headline text-2xl font-bold text-[#20324A]">
              Merchant Management
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Approval workflow, compliance, settlement, and merchant performance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'list', label: 'Merchant Registry', icon: Building2 },
                { id: 'approvals', label: `Approvals (${APPROVAL_QUEUE.length})`, icon: Clock },
                { id: 'settlement', label: 'Settlement', icon: TrendingUp },
                { id: 'performance', label: 'Documents', icon: FileText },
              ] as { id: Panel; label: string; icon: typeof Building2 }[]
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

      {panel === 'list' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex flex-wrap items-center gap-4 border-b border-[#E6EEF5] p-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID, or category..."
                className="w-full rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#20B8C5]"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[#E6EEF5] px-3 py-2 text-sm font-semibold text-[#20324A] hover:bg-[#F7F9FC]"
            >
              <Filter className="h-4 w-4" /> Filter
            </button>
            <span className="text-sm text-[#64748B]">
              <span className="font-semibold text-[#20324A]">{filtered.length}</span> merchants
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Merchant ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Settlement</th>
                  <th className="px-4 py-3 text-left">KYC</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">POS</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{m.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{m.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-xs font-semibold text-[#108995]">
                        {m.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{m.settlement}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${kycBadge(m.kyc)}`}
                      >
                        {m.kyc}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(m.status)}`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${m.pos === 'Online' ? 'text-[#166534]' : 'text-[#94A3B8]'}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${m.pos === 'Online' ? 'bg-[#16A34A]' : 'bg-[#94A3B8]'}`}
                        />
                        {m.pos}
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

      {panel === 'approvals' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">
              Merchant Approval Queue
            </h3>
            <p className="mt-1 text-sm text-[#64748B]">
              New merchant applications and change requests awaiting review.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Ref</th>
                  <th className="px-4 py-3 text-left">Merchant</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Documents</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {APPROVAL_QUEUE.map((item) => (
                  <tr key={item.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{item.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{item.merchant}</td>
                    <td className="px-4 py-3 text-[#64748B]">{item.type}</td>
                    <td className="px-4 py-3 text-[#64748B]">{item.submitted}</td>
                    <td className="px-4 py-3 text-[#64748B]">{item.docs}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-[#166534] hover:bg-[#DCFCE7]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEE2E2]"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]"
                        >
                          Assign
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

      {panel === 'settlement' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">Settlement Queue</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Pending and processed merchant settlement batches.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Batch ID</th>
                  <th className="px-4 py-3 text-left">Merchant</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Batches</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Due</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {SETTLEMENT_QUEUE.map((item) => (
                  <tr key={item.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{item.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{item.merchant}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{item.amount}</td>
                    <td className="px-4 py-3 text-[#64748B]">{item.batches}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.status === 'Approved' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]'}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{item.due}</td>
                    <td className="px-4 py-3">
                      {item.status !== 'Approved' && (
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-xs font-semibold text-[#166534] hover:bg-[#DCFCE7]"
                        >
                          Approve batch
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'performance' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
          <h3 className="font-headline text-lg font-semibold text-[#20324A]">
            Compliance Documents
          </h3>
          <p className="mt-1 text-sm text-[#64748B]">
            Required documents per merchant for FICA and onboarding compliance.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              'CIPC Registration',
              'Bank Confirmation Letter',
              'ID Document (Director)',
              'Proof of Address',
              'Tax Clearance Certificate',
              'Signed Merchant Agreement',
            ].map((doc) => (
              <div
                key={doc}
                className="flex items-center gap-3 rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] px-4 py-3 text-sm"
              >
                <FileText className="h-4 w-4 shrink-0 text-[#108995]" />
                <span className="font-semibold text-[#20324A]">{doc}</span>
                <span className="ml-auto text-xs text-[#64748B]">Required</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
