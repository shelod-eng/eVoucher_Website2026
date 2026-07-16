'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  MoreHorizontal,
} from 'lucide-react';

const CONTROLS = [
  {
    id: 'CTRL-001',
    framework: 'POPIA',
    control: 'Data Subject Consent',
    owner: 'Data Protection',
    evidence: 'Consent records, opt-out logs',
    lastReview: '01 Jun 2026',
    status: 'Compliant',
  },
  {
    id: 'CTRL-002',
    framework: 'POPIA',
    control: 'Data Retention Policy',
    owner: 'Data Protection',
    evidence: 'Retention schedule, deletion logs',
    lastReview: '01 Jun 2026',
    status: 'Compliant',
  },
  {
    id: 'CTRL-003',
    framework: 'FICA',
    control: 'Merchant KYC',
    owner: 'Compliance',
    evidence: 'ID documents, CIPC, bank letters',
    lastReview: '14 Jul 2026',
    status: 'In Progress',
  },
  {
    id: 'CTRL-004',
    framework: 'FICA',
    control: 'Consumer Identity Verification',
    owner: 'Compliance',
    evidence: 'ID + selfie verification queue',
    lastReview: '14 Jul 2026',
    status: 'In Progress',
  },
  {
    id: 'CTRL-005',
    framework: 'AML',
    control: 'Transaction Monitoring',
    owner: 'Risk',
    evidence: 'Fraud score rules, velocity limits',
    lastReview: '10 Jul 2026',
    status: 'Compliant',
  },
  {
    id: 'CTRL-006',
    framework: 'PASA',
    control: 'Bankserv ACB Compliance',
    owner: 'Treasury',
    evidence: 'ACB files, ACK/NCK records',
    lastReview: '14 Jul 2026',
    status: 'Compliant',
  },
  {
    id: 'CTRL-007',
    framework: 'PCI DSS',
    control: 'Payment Data Tokenisation',
    owner: 'Payments',
    evidence: 'Tokenised gateway boundary',
    lastReview: '01 Jul 2026',
    status: 'Compliant',
  },
  {
    id: 'CTRL-008',
    framework: 'Audit',
    control: 'Administrative Audit Logs',
    owner: 'Security',
    evidence: 'WORM ledger, admin activity',
    lastReview: '14 Jul 2026',
    status: 'Compliant',
  },
];

const KYC_QUEUE = [
  {
    id: 'KYC-081',
    entity: 'Nomsa Dlamini',
    type: 'Consumer',
    docs: 'ID + Selfie',
    submitted: '2h ago',
    status: 'Awaiting review',
  },
  {
    id: 'KYC-082',
    entity: 'Zanele Khumalo',
    type: 'Consumer',
    docs: 'ID only',
    submitted: '4h ago',
    status: 'Docs incomplete',
  },
  {
    id: 'KYC-083',
    entity: 'Mpho Sithole',
    type: 'Consumer',
    docs: 'ID + Proof of address',
    submitted: '6h ago',
    status: 'Awaiting review',
  },
  {
    id: 'KYC-084',
    entity: 'Spaza Corner Khayelitsha',
    type: 'Merchant',
    docs: 'ID + Bank letter',
    submitted: '5h ago',
    status: 'Awaiting review',
  },
  {
    id: 'KYC-085',
    entity: 'Nkosi Butchery Mamelodi',
    type: 'Merchant',
    docs: 'ID + CIPC',
    submitted: '8h ago',
    status: 'Awaiting review',
  },
];

const AUDIT_LOG = [
  {
    id: 'AUD-1041',
    user: 'lebo.mpeta',
    action: 'Approved merchant: Boxer Gauteng North',
    area: 'Merchants',
    time: '10:40 SAST',
    ip: '196.25.x.x',
  },
  {
    id: 'AUD-1042',
    user: 'finance.mgr',
    action: 'Approved settlement batch BATCH-2026-07-14-A',
    area: 'Treasury',
    time: '09:12 SAST',
    ip: '196.25.x.x',
  },
  {
    id: 'AUD-1043',
    user: 'compliance.officer',
    action: 'Reviewed KYC: KYC-081',
    area: 'Compliance',
    time: '08:55 SAST',
    ip: '196.25.x.x',
  },
  {
    id: 'AUD-1044',
    user: 'system',
    action: 'Database backup completed',
    area: 'Infrastructure',
    time: '02:00 SAST',
    ip: 'system',
  },
  {
    id: 'AUD-1045',
    user: 'lebo.mpeta',
    action: 'Feature flag FF-004 enabled',
    area: 'Administration',
    time: '01 Jul 2026',
    ip: '196.25.x.x',
  },
];

type Panel = 'controls' | 'kyc' | 'audit' | 'reports';

function statusBadge(s: string) {
  if (s === 'Compliant') return 'bg-[#DCFCE7] text-[#166534]';
  if (s === 'In Progress') return 'bg-[#FEF3C7] text-[#92400E]';
  if (s === 'Awaiting review') return 'bg-[#FEF3C7] text-[#92400E]';
  if (s === 'Docs incomplete') return 'bg-[#FEE2E2] text-[#B91C1C]';
  return 'bg-[#F1F5F9] text-[#64748B]';
}

export default function ComplianceWorkspace() {
  const [panel, setPanel] = useState<Panel>('controls');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">
              Compliance Operations
            </p>
            <h2 className="mt-1 font-headline text-2xl font-bold text-[#20324A]">
              Enterprise Compliance
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              POPIA, FICA, KYC, AML, PASA, PCI DSS, audit logs, and regulatory reporting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'controls', label: 'Controls', icon: ShieldCheck },
                { id: 'kyc', label: `KYC Queue (${KYC_QUEUE.length})`, icon: Clock },
                { id: 'audit', label: 'Audit Log', icon: FileText },
                { id: 'reports', label: 'Reports', icon: Download },
              ] as { id: Panel; label: string; icon: typeof ShieldCheck }[]
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

      {panel === 'controls' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">
              Compliance Control Register
            </h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Active controls across POPIA, FICA, AML, PASA, PCI DSS, and audit frameworks.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Control ID</th>
                  <th className="px-4 py-3 text-left">Framework</th>
                  <th className="px-4 py-3 text-left">Control</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Evidence</th>
                  <th className="px-4 py-3 text-left">Last Review</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {CONTROLS.map((c) => (
                  <tr key={c.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{c.id}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-xs font-semibold text-[#108995]">
                        {c.framework}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{c.control}</td>
                    <td className="px-4 py-3 text-[#64748B]">{c.owner}</td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{c.evidence}</td>
                    <td className="px-4 py-3 text-[#64748B]">{c.lastReview}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(c.status)}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]"
                        >
                          Review
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

      {panel === 'kyc' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">
              KYC Verification Queue
            </h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Consumer and merchant identity documents awaiting compliance review.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Ref</th>
                  <th className="px-4 py-3 text-left">Entity</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Documents</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {KYC_QUEUE.map((item) => (
                  <tr key={item.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{item.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{item.entity}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-xs font-semibold text-[#108995]">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{item.docs}</td>
                    <td className="px-4 py-3 text-[#64748B]">{item.submitted}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
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
                          <AlertTriangle className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]"
                        >
                          Request docs
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

      {panel === 'audit' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-5">
            <div>
              <h3 className="font-headline text-lg font-semibold text-[#20324A]">Audit Log</h3>
              <p className="mt-1 text-sm text-[#64748B]">
                Immutable record of all administrative and system actions.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[#E6EEF5] px-3 py-2 text-sm font-semibold text-[#20324A] hover:bg-[#F7F9FC]"
            >
              <Download className="h-4 w-4" /> Export Log
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Audit ID</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Area</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">IP</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOG.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{entry.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#20324A]">{entry.user}</td>
                    <td className="px-4 py-3 text-[#20324A]">{entry.action}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-xs font-semibold text-[#108995]">
                        {entry.area}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{entry.time}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{entry.ip}</td>
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
              title: 'POPIA Compliance Report',
              desc: 'Consent records, data subject requests, and retention compliance.',
              action: 'Export PDF',
            },
            {
              title: 'FICA / KYC Evidence Pack',
              desc: 'All merchant and consumer identity verification records.',
              action: 'Export PDF',
            },
            {
              title: 'AML Monitoring Report',
              desc: 'Transaction monitoring rules, fraud scores, and blocked events.',
              action: 'Export Excel',
            },
            {
              title: 'PASA Settlement Audit',
              desc: 'Bankserv ACB files, ACK/NCK records, and settlement reconciliation.',
              action: 'Export CSV',
            },
            {
              title: 'Full Audit Trail Export',
              desc: 'Complete administrative and system audit log for the selected period.',
              action: 'Export CSV',
            },
            {
              title: 'Risk Register',
              desc: 'Identified risks, mitigations, owners, and review dates.',
              action: 'Export PDF',
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
