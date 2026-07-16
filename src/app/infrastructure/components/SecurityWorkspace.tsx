'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Users,
  Lock,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

const RBAC_ROLES = [
  { role: 'Super Admin', users: 2, permissions: 'Full platform access', mfa: 'Required', status: 'Active' },
  { role: 'Finance', users: 4, permissions: 'Payments, settlements, reports', mfa: 'Required', status: 'Active' },
  { role: 'Compliance Officer', users: 3, permissions: 'KYC, audit logs, risk register', mfa: 'Required', status: 'Active' },
  { role: 'Merchant Ops', users: 6, permissions: 'Merchant approvals, documents', mfa: 'Enabled', status: 'Active' },
  { role: 'Support Agent', users: 12, permissions: 'Consumer profiles, tickets', mfa: 'Enabled', status: 'Active' },
  { role: 'Auditor', users: 3, permissions: 'Read-only audit trail', mfa: 'Required', status: 'Active' },
  { role: 'Sponsor', users: 8, permissions: 'Campaign ROI, reports', mfa: 'Optional', status: 'Active' },
  { role: 'Government', users: 5, permissions: 'Programme data, beneficiaries', mfa: 'Required', status: 'Active' },
];

const FAILED_LOGINS = [
  { id: 'SEC-081', email: 'admin@evoucher.co.za', ip: '196.25.x.x', attempts: 5, time: '10:42 SAST', action: 'Locked' },
  { id: 'SEC-082', email: 'finance@evoucher.co.za', ip: '41.13.x.x', attempts: 3, time: '10:18 SAST', action: 'Warned' },
  { id: 'SEC-083', email: 'unknown@domain.com', ip: '185.220.x.x', attempts: 12, time: '09:55 SAST', action: 'Blocked' },
];

const API_KEYS = [
  { id: 'KEY-001', name: 'Payment Gateway Integration', scope: 'payments:read payments:write', created: '01 Jan 2026', expires: '31 Dec 2026', status: 'Active' },
  { id: 'KEY-002', name: 'USSD Session Handler', scope: 'ussd:session ussd:menu', created: '15 Feb 2026', expires: '14 Feb 2027', status: 'Active' },
  { id: 'KEY-003', name: 'Government Data Feed', scope: 'government:read', created: '01 Mar 2026', expires: '28 Feb 2027', status: 'Active' },
  { id: 'KEY-004', name: 'Legacy Billing Connector', scope: 'billing:read', created: '10 Nov 2025', expires: '09 Nov 2026', status: 'Expiring soon' },
];

const THREAT_ALERTS = [
  { id: 'THR-041', type: 'Credential stuffing', source: '185.220.x.x', severity: 'High', time: '10:55 SAST', status: 'Under review' },
  { id: 'THR-042', type: 'Unusual API volume', source: 'KEY-002', severity: 'Medium', time: '10:22 SAST', status: 'Monitoring' },
  { id: 'THR-043', type: 'Duplicate device fingerprint', source: 'C-00389', severity: 'Medium', time: '09:48 SAST', status: 'Escalated' },
];

type Panel = 'rbac' | 'logins' | 'api-keys' | 'threats';

function severityBadge(s: string) {
  if (s === 'High') return 'bg-[#FEE2E2] text-[#B91C1C]';
  if (s === 'Medium') return 'bg-[#FEF3C7] text-[#92400E]';
  return 'bg-[#EAFBFD] text-[#108995]';
}

function statusBadge(s: string) {
  if (s === 'Active') return 'bg-[#DCFCE7] text-[#166534]';
  if (s === 'Expiring soon') return 'bg-[#FEF3C7] text-[#92400E]';
  if (s === 'Blocked' || s === 'Locked') return 'bg-[#FEE2E2] text-[#B91C1C]';
  return 'bg-[#F1F5F9] text-[#64748B]';
}

export default function SecurityWorkspace() {
  const [panel, setPanel] = useState<Panel>('rbac');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">Security Operations</p>
            <h2 className="mt-1 font-headline text-2xl font-bold text-[#20324A]">Enterprise Security Centre</h2>
            <p className="mt-1 text-sm text-[#64748B]">RBAC, MFA enforcement, API keys, failed logins, and threat detection.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'rbac', label: 'RBAC Roles', icon: Users },
              { id: 'logins', label: `Failed Logins (${FAILED_LOGINS.length})`, icon: Lock },
              { id: 'api-keys', label: 'API Keys', icon: Key },
              { id: 'threats', label: `Threats (${THREAT_ALERTS.length})`, icon: ShieldAlert },
            ] as { id: Panel; label: string; icon: typeof Users }[]).map(({ id, label, icon: Icon }) => (
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

      {panel === 'rbac' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-5">
            <div>
              <h3 className="font-headline text-lg font-semibold text-[#20324A]">Role-Based Access Control</h3>
              <p className="mt-1 text-sm text-[#64748B]">Platform roles, user counts, permissions, and MFA enforcement.</p>
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#108995]">
              <Users className="h-4 w-4" /> Add Role
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Users</th>
                  <th className="px-4 py-3 text-left">Permissions</th>
                  <th className="px-4 py-3 text-left">MFA</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {RBAC_ROLES.map((r) => (
                  <tr key={r.role} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{r.role}</td>
                    <td className="px-4 py-3 text-[#64748B]">{r.users}</td>
                    <td className="px-4 py-3 text-[#64748B] text-xs">{r.permissions}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${r.mfa === 'Required' ? 'bg-[#DCFCE7] text-[#166534]' : r.mfa === 'Enabled' ? 'bg-[#EAFBFD] text-[#108995]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                        {r.mfa}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]">Edit</button>
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

      {panel === 'logins' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">Failed Login Attempts</h3>
            <p className="mt-1 text-sm text-[#64748B]">Suspicious authentication events requiring review or escalation.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Ref</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">IP Address</th>
                  <th className="px-4 py-3 text-left">Attempts</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Action Taken</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {FAILED_LOGINS.map((item) => (
                  <tr key={item.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{item.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{item.email}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{item.ip}</td>
                    <td className="px-4 py-3 font-bold text-[#B91C1C]">{item.attempts}</td>
                    <td className="px-4 py-3 text-[#64748B]">{item.time}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(item.action)}`}>{item.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]">Investigate</button>
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEE2E2]">Block IP</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'api-keys' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-5">
            <div>
              <h3 className="font-headline text-lg font-semibold text-[#20324A]">API Key Management</h3>
              <p className="mt-1 text-sm text-[#64748B]">Platform integration keys with scope, expiry, and rotation controls.</p>
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#108995]">
              <Key className="h-4 w-4" /> Generate Key
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Key ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Scope</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {API_KEYS.map((key) => (
                  <tr key={key.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{key.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{key.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{key.scope}</td>
                    <td className="px-4 py-3 text-[#64748B]">{key.created}</td>
                    <td className="px-4 py-3 text-[#64748B]">{key.expires}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(key.status)}`}>{key.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]">Rotate</button>
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEE2E2]">Revoke</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'threats' && (
        <div className="space-y-4">
          {THREAT_ALERTS.map((alert) => (
            <div key={alert.id} className={`rounded-lg border p-5 ${alert.severity === 'High' ? 'border-[#FECACA] bg-[#FEF2F2]' : 'border-[#FDE68A] bg-[#FFFBEB]'}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className={`mt-0.5 h-5 w-5 shrink-0 ${alert.severity === 'High' ? 'text-[#B91C1C]' : 'text-[#92400E]'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#64748B]">{alert.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${severityBadge(alert.severity)}`}>{alert.severity}</span>
                    </div>
                    <p className="mt-1 font-semibold text-[#20324A]">{alert.type}</p>
                    <p className="text-sm text-[#64748B]">Source: {alert.source} · {alert.time} · {alert.status}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="rounded-lg border border-[#E6EEF5] bg-white px-3 py-1.5 text-xs font-semibold text-[#20324A] hover:bg-[#F7F9FC]">
                    <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />Investigate
                  </button>
                  <button type="button" className="rounded-lg bg-[#B91C1C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#991B1B]">
                    <XCircle className="inline h-3.5 w-3.5 mr-1" />Escalate
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
