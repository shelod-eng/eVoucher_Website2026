'use client';

import { useState } from 'react';
import { Landmark, Users, BarChart3, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

const PROGRAMMES = [
  { id: 'GOV-001', name: 'SASSA Food Relief', dept: 'SASSA', province: 'All', beneficiaries: '42,000', budget: 'R14.7m', used: '72%', status: 'Active', ends: '31 Dec 2026' },
  { id: 'GOV-002', name: 'DTI Winter Warmth', dept: 'DTI', province: 'Gauteng', beneficiaries: '8,400', budget: 'R2.9m', used: '100%', status: 'Completed', ends: '30 Jun 2026' },
  { id: 'GOV-003', name: 'DBE Back to School', dept: 'DBE', province: 'All', beneficiaries: '18,000', budget: 'R6.3m', used: '0%', status: 'Scheduled', ends: '15 Aug 2026' },
  { id: 'GOV-004', name: 'DSD Child Support', dept: 'DSD', province: 'KZN', beneficiaries: '12,400', budget: 'R4.3m', used: '41%', status: 'Active', ends: '31 Dec 2026' },
];

const BENEFICIARIES = [
  { id: 'BEN-00124', name: 'Thandi Mthembu', programme: 'SASSA Food Relief', province: 'Gauteng', wallet: 'R350.00', status: 'Active' },
  { id: 'BEN-00231', name: 'Sipho Dlamini', programme: 'DSD Child Support', province: 'KZN', wallet: 'R350.00', status: 'Active' },
  { id: 'BEN-00389', name: 'Nomvula Khumalo', programme: 'SASSA Food Relief', province: 'WC', wallet: 'R0.00', status: 'Suspended' },
];

const PENDING_APPROVALS = [
  { id: 'GAPP-041', programme: 'DBE Back to School', action: 'Campaign activation', dept: 'DBE', raised: '2h ago' },
  { id: 'GAPP-042', programme: 'SASSA Food Relief', action: 'Budget extension R500k', dept: 'SASSA', raised: '6h ago' },
];

type Panel = 'programmes' | 'beneficiaries' | 'approvals' | 'reports';

function statusBadge(status: string) {
  if (status === 'Active') return 'bg-[#DCFCE7] text-[#166534]';
  if (status === 'Completed') return 'bg-[#EAFBFD] text-[#108995]';
  if (status === 'Scheduled') return 'bg-[#FEF3C7] text-[#92400E]';
  return 'bg-[#FEE2E2] text-[#B91C1C]';
}

export default function GovernmentWorkspace() {
  const [panel, setPanel] = useState<Panel>('programmes');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">Government Operations</p>
            <h2 className="mt-1 font-headline text-2xl font-bold text-[#20324A]">Government Programme Management</h2>
            <p className="mt-1 text-sm text-[#64748B]">Departments, campaigns, budgets, beneficiaries, reporting, and audits.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'programmes', label: 'Programmes', icon: Landmark },
              { id: 'beneficiaries', label: 'Beneficiaries', icon: Users },
              { id: 'approvals', label: `Approvals (${PENDING_APPROVALS.length})`, icon: CheckCircle2 },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
            ] as { id: Panel; label: string; icon: typeof Landmark }[]).map(({ id, label, icon: Icon }) => (
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

      {panel === 'programmes' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">Active Government Programmes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Programme ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Province</th>
                  <th className="px-4 py-3 text-left">Beneficiaries</th>
                  <th className="px-4 py-3 text-left">Budget</th>
                  <th className="px-4 py-3 text-left">Used</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {PROGRAMMES.map((p) => (
                  <tr key={p.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{p.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{p.name}</td>
                    <td className="px-4 py-3 text-[#64748B]">{p.dept}</td>
                    <td className="px-4 py-3 text-[#64748B]">{p.province}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{p.beneficiaries}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{p.budget}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-[#E6EEF5]">
                          <div
                            className="h-1.5 rounded-full bg-[#20B8C5]"
                            style={{ width: p.used }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[#64748B]">{p.used}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(p.status)}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'beneficiaries' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">Beneficiary Registry</h3>
            <p className="mt-1 text-sm text-[#64748B]">Government programme beneficiaries with wallet and status tracking.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Beneficiary ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Programme</th>
                  <th className="px-4 py-3 text-left">Province</th>
                  <th className="px-4 py-3 text-left">Wallet</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {BENEFICIARIES.map((b) => (
                  <tr key={b.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{b.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{b.name}</td>
                    <td className="px-4 py-3 text-[#64748B]">{b.programme}</td>
                    <td className="px-4 py-3 text-[#64748B]">{b.province}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{b.wallet}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(b.status)}`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'approvals' && (
        <div className="space-y-4">
          {PENDING_APPROVALS.map((item) => (
            <div key={item.id} className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#92400E]" />
                  <div>
                    <span className="font-mono text-xs text-[#64748B]">{item.id}</span>
                    <p className="mt-1 font-semibold text-[#20324A]">{item.programme}</p>
                    <p className="text-sm text-[#64748B]">Action: {item.action} · {item.dept} · {item.raised}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="rounded-lg border border-[#E6EEF5] bg-white px-3 py-1.5 text-xs font-semibold text-[#20324A] hover:bg-[#F7F9FC]">Review</button>
                  <button type="button" className="rounded-lg bg-[#20B8C5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#108995]">Approve</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {panel === 'reports' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: 'Provincial Beneficiary Report', desc: 'Breakdown by province, programme, and wallet status.', action: 'Export PDF' },
            { title: 'Budget Utilisation Report', desc: 'Budget vs spend per department and programme.', action: 'Export Excel' },
            { title: 'Voucher Redemption Report', desc: 'Redemption rates per programme and merchant.', action: 'Export CSV' },
            { title: 'Treasury Audit Pack', desc: 'Full settlement and disbursement audit trail.', action: 'Export PDF' },
          ].map((report) => (
            <div key={report.title} className="rounded-lg border border-[#E6EEF5] bg-white p-5">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#108995]" />
                <div className="flex-1">
                  <p className="font-semibold text-[#20324A]">{report.title}</p>
                  <p className="mt-1 text-sm text-[#64748B]">{report.desc}</p>
                  <button type="button" className="mt-3 rounded-lg bg-[#20B8C5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#108995]">
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
