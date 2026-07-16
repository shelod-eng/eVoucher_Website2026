'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Wallet,
  Phone,
  MoreHorizontal,
} from 'lucide-react';

const CONSUMERS = [
  { id: 'C-00124', name: 'Thabo Nkosi', phone: '+27 82 345 6789', wallet: 'R240.00', kyc: 'Verified', status: 'Active', risk: 'Low', joined: '12 Jan 2026' },
  { id: 'C-00231', name: 'Nomsa Dlamini', phone: '+27 73 901 2345', wallet: 'R85.50', kyc: 'Pending', status: 'Active', risk: 'Low', joined: '03 Feb 2026' },
  { id: 'C-00389', name: 'Sipho Mthembu', phone: '+27 61 234 5678', wallet: 'R0.00', kyc: 'Failed', status: 'Suspended', risk: 'High', joined: '28 Jan 2026' },
  { id: 'C-00412', name: 'Lerato Mokoena', phone: '+27 79 567 8901', wallet: 'R1,200.00', kyc: 'Verified', status: 'Active', risk: 'Low', joined: '15 Mar 2026' },
  { id: 'C-00518', name: 'Bongani Zulu', phone: '+27 83 678 9012', wallet: 'R320.00', kyc: 'Verified', status: 'Active', risk: 'Medium', joined: '22 Apr 2026' },
  { id: 'C-00601', name: 'Zanele Khumalo', phone: '+27 71 789 0123', wallet: 'R55.00', kyc: 'Pending', status: 'Active', risk: 'Low', joined: '01 May 2026' },
];

const KYC_QUEUE = [
  { id: 'KYC-081', consumer: 'Nomsa Dlamini', submitted: '2h ago', docs: 'ID + Selfie', status: 'Awaiting review' },
  { id: 'KYC-082', consumer: 'Zanele Khumalo', submitted: '4h ago', docs: 'ID only', status: 'Docs incomplete' },
  { id: 'KYC-083', consumer: 'Mpho Sithole', submitted: '6h ago', docs: 'ID + Proof of address', status: 'Awaiting review' },
];

const FRAUD_ALERTS = [
  { id: 'FR-041', consumer: 'Sipho Mthembu', type: 'Duplicate device', severity: 'High', time: '19m ago' },
  { id: 'FR-042', consumer: 'Unknown', type: 'Velocity breach', severity: 'Medium', time: '1h ago' },
  { id: 'FR-043', consumer: 'Bongani Zulu', type: 'Unusual redemption pattern', severity: 'Medium', time: '3h ago' },
];

const WALLET_RULES = [
  { rule: 'Daily load limit', value: 'R5,000', status: 'Active' },
  { rule: 'Monthly load limit', value: 'R20,000', status: 'Active' },
  { rule: 'Single transaction cap', value: 'R2,000', status: 'Active' },
  { rule: 'Unverified wallet cap', value: 'R500', status: 'Active' },
];

type Panel = 'list' | 'kyc' | 'fraud' | 'wallet-rules';

function kycBadge(kyc: string) {
  if (kyc === 'Verified') return 'bg-[#DCFCE7] text-[#166534]';
  if (kyc === 'Failed') return 'bg-[#FEE2E2] text-[#B91C1C]';
  return 'bg-[#FEF3C7] text-[#92400E]';
}

function statusBadge(status: string) {
  return status === 'Active' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEE2E2] text-[#B91C1C]';
}

function riskBadge(risk: string) {
  if (risk === 'High') return 'text-[#B91C1C]';
  if (risk === 'Medium') return 'text-[#92400E]';
  return 'text-[#166534]';
}

export default function ConsumersWorkspace() {
  const [panel, setPanel] = useState<Panel>('list');
  const [search, setSearch] = useState('');

  const filtered = CONSUMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">Consumer Operations</p>
            <h2 className="mt-1 font-headline text-2xl font-bold text-[#20324A]">Consumer Management</h2>
            <p className="mt-1 text-sm text-[#64748B]">Registration, identity verification, wallet rules, fraud monitoring, and support.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'list', label: 'Consumer Registry', icon: UserCheck },
              { id: 'kyc', label: `KYC Queue (${KYC_QUEUE.length})`, icon: Clock },
              { id: 'fraud', label: `Fraud Alerts (${FRAUD_ALERTS.length})`, icon: ShieldAlert },
              { id: 'wallet-rules', label: 'Wallet Rules', icon: Wallet },
            ] as { id: Panel; label: string; icon: typeof UserCheck }[]).map(({ id, label, icon: Icon }) => (
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
                placeholder="Search by name, ID, or phone..."
                className="w-full rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#20B8C5]"
              />
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[#E6EEF5] px-3 py-2 text-sm font-semibold text-[#20324A] hover:bg-[#F7F9FC]">
              <Filter className="h-4 w-4" /> Filter
            </button>
            <span className="text-sm text-[#64748B]"><span className="font-semibold text-[#20324A]">{filtered.length}</span> consumers</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Consumer ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Wallet</th>
                  <th className="px-4 py-3 text-left">KYC</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Risk</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{c.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{c.name}</td>
                    <td className="px-4 py-3 text-[#64748B]">
                      <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{c.wallet}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${kycBadge(c.kyc)}`}>{c.kyc}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(c.status)}`}>{c.status}</span>
                    </td>
                    <td className={`px-4 py-3 text-xs font-bold ${riskBadge(c.risk)}`}>{c.risk}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]">View</button>
                        {c.status === 'Active' ? (
                          <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEE2E2]">
                            <UserX className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#166534] hover:bg-[#DCFCE7]">
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
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

      {panel === 'kyc' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">KYC Verification Queue</h3>
            <p className="mt-1 text-sm text-[#64748B]">Identity documents awaiting compliance review. Oldest: 6h.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Ref</th>
                  <th className="px-4 py-3 text-left">Consumer</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Documents</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {KYC_QUEUE.map((item) => (
                  <tr key={item.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{item.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{item.consumer}</td>
                    <td className="px-4 py-3 text-[#64748B]">{item.submitted}</td>
                    <td className="px-4 py-3 text-[#64748B]">{item.docs}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.status === 'Awaiting review' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#FEE2E2] text-[#B91C1C]'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#166534] hover:bg-[#DCFCE7]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEE2E2]">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]">Request docs</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'fraud' && (
        <div className="space-y-4">
          {FRAUD_ALERTS.map((alert) => (
            <div key={alert.id} className={`rounded-lg border p-5 ${alert.severity === 'High' ? 'border-[#FECACA] bg-[#FEF2F2]' : 'border-[#FDE68A] bg-[#FFFBEB]'}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className={`mt-0.5 h-5 w-5 shrink-0 ${alert.severity === 'High' ? 'text-[#B91C1C]' : 'text-[#92400E]'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#64748B]">{alert.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${alert.severity === 'High' ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-[#20324A]">{alert.type}</p>
                    <p className="text-sm text-[#64748B]">Consumer: {alert.consumer} · {alert.time}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="rounded-lg border border-[#E6EEF5] bg-white px-3 py-1.5 text-xs font-semibold text-[#20324A] hover:bg-[#F7F9FC]">Investigate</button>
                  <button type="button" className="rounded-lg bg-[#B91C1C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#991B1B]">Escalate</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {panel === 'wallet-rules' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">Wallet Configuration Rules</h3>
            <p className="mt-1 text-sm text-[#64748B]">Platform-wide wallet limits enforced at transaction level.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Rule</th>
                  <th className="px-4 py-3 text-left">Value</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {WALLET_RULES.map((rule) => (
                  <tr key={rule.rule} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{rule.rule}</td>
                    <td className="px-4 py-3 font-semibold text-[#108995]">{rule.value}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-xs font-bold text-[#166534]">{rule.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" className="text-xs font-semibold text-[#108995] hover:underline">Edit rule</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
