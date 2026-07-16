'use client';

import { useState } from 'react';
import {
  Settings,
  Users,
  Flag,
  Mail,
  Globe,
  ToggleLeft,
  ToggleRight,
  MoreHorizontal,
  Plus,
} from 'lucide-react';

const ADMIN_USERS = [
  { id: 'USR-001', name: 'Lebo Mpeta', email: 'mpetalebo@outlook.com', role: 'Super Admin', mfa: true, lastLogin: '14 Jul 2026 10:02', status: 'Active' },
  { id: 'USR-002', name: 'Finance Manager', email: 'finance@evoucher.co.za', role: 'Finance', mfa: true, lastLogin: '14 Jul 2026 09:15', status: 'Active' },
  { id: 'USR-003', name: 'Compliance Officer', email: 'compliance@evoucher.co.za', role: 'Compliance Officer', mfa: true, lastLogin: '13 Jul 2026 16:40', status: 'Active' },
  { id: 'USR-004', name: 'Support Lead', email: 'support@evoucher.co.za', role: 'Support Agent', mfa: false, lastLogin: '14 Jul 2026 08:30', status: 'Active' },
  { id: 'USR-005', name: 'Merchant Ops', email: 'merchants@evoucher.co.za', role: 'Merchant Ops', mfa: false, lastLogin: '12 Jul 2026 14:22', status: 'Inactive' },
];

const FEATURE_FLAGS = [
  { id: 'FF-001', name: 'USSD Offline Mode', description: 'Allow USSD sessions to cache menus offline', environment: 'Production', enabled: true, staged: false },
  { id: 'FF-002', name: 'Partial Voucher Redemption', description: 'Allow consumers to redeem partial voucher values', environment: 'Staging', enabled: false, staged: true },
  { id: 'FF-003', name: 'Sponsor Self-Service Portal', description: 'Enable sponsors to create campaigns without admin approval', environment: 'Development', enabled: false, staged: false },
  { id: 'FF-004', name: 'Government Bulk Import', description: 'CSV bulk beneficiary import for government programmes', environment: 'Production', enabled: true, staged: false },
  { id: 'FF-005', name: 'Biometric KYC', description: 'Facial recognition for consumer identity verification', environment: 'Planned', enabled: false, staged: false },
];

const EMAIL_TEMPLATES = [
  { id: 'ET-001', name: 'Welcome Email', trigger: 'Consumer registration', lastUpdated: '01 Jun 2026', status: 'Active' },
  { id: 'ET-002', name: 'Voucher Issued', trigger: 'Voucher purchase', lastUpdated: '15 Jun 2026', status: 'Active' },
  { id: 'ET-003', name: 'KYC Approved', trigger: 'Identity verification passed', lastUpdated: '20 Jun 2026', status: 'Active' },
  { id: 'ET-004', name: 'Settlement Processed', trigger: 'Merchant settlement', lastUpdated: '01 Jul 2026', status: 'Active' },
  { id: 'ET-005', name: 'Fraud Alert', trigger: 'Risk score threshold breach', lastUpdated: '10 Jul 2026', status: 'Active' },
];

const SYSTEM_PARAMS = [
  { key: 'platform.fee_percentage', value: '2.5%', category: 'Commerce', editable: true },
  { key: 'wallet.max_daily_load', value: 'R5,000', category: 'Wallet', editable: true },
  { key: 'voucher.default_expiry_days', value: '30', category: 'Vouchers', editable: true },
  { key: 'kyc.auto_approve_threshold', value: '85%', category: 'Compliance', editable: true },
  { key: 'settlement.run_time', value: '09:00 SAST', category: 'Treasury', editable: true },
  { key: 'ussd.session_timeout_seconds', value: '120', category: 'USSD', editable: true },
  { key: 'fraud.velocity_limit_per_hour', value: '5', category: 'Risk', editable: true },
  { key: 'notification.retry_attempts', value: '3', category: 'Messaging', editable: false },
];

type Panel = 'users' | 'flags' | 'templates' | 'params';

function statusBadge(s: string) {
  if (s === 'Active') return 'bg-[#DCFCE7] text-[#166534]';
  if (s === 'Inactive') return 'bg-[#FEE2E2] text-[#B91C1C]';
  return 'bg-[#F1F5F9] text-[#64748B]';
}

export default function AdminWorkspace() {
  const [panel, setPanel] = useState<Panel>('users');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">Administration</p>
            <h2 className="mt-1 font-headline text-2xl font-bold text-[#20324A]">Enterprise Administration</h2>
            <p className="mt-1 text-sm text-[#64748B]">Users, roles, feature flags, email templates, and system parameters.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'users', label: 'Users', icon: Users },
              { id: 'flags', label: 'Feature Flags', icon: Flag },
              { id: 'templates', label: 'Email Templates', icon: Mail },
              { id: 'params', label: 'System Params', icon: Settings },
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

      {panel === 'users' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-5">
            <div>
              <h3 className="font-headline text-lg font-semibold text-[#20324A]">Platform Users</h3>
              <p className="mt-1 text-sm text-[#64748B]">Internal staff accounts with role assignments and MFA status.</p>
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#108995]">
              <Plus className="h-4 w-4" /> Invite User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">User ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">MFA</th>
                  <th className="px-4 py-3 text-left">Last Login</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ADMIN_USERS.map((u) => (
                  <tr key={u.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{u.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{u.name}</td>
                    <td className="px-4 py-3 text-[#64748B]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-xs font-semibold text-[#108995]">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.mfa ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                        {u.mfa ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{u.lastLogin}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(u.status)}`}>{u.status}</span>
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

      {panel === 'flags' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">Feature Flags</h3>
            <p className="mt-1 text-sm text-[#64748B]">Toggle platform capabilities per environment without code deployments.</p>
          </div>
          <div className="divide-y divide-[#E6EEF5]">
            {FEATURE_FLAGS.map((flag) => (
              <div key={flag.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 hover:bg-[#F7F9FC]">
                <div className="flex items-start gap-3">
                  {flag.enabled
                    ? <ToggleRight className="mt-0.5 h-5 w-5 shrink-0 text-[#20B8C5]" />
                    : <ToggleLeft className="mt-0.5 h-5 w-5 shrink-0 text-[#94A3B8]" />
                  }
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#20324A]">{flag.name}</p>
                      <span className="font-mono text-xs text-[#94A3B8]">{flag.id}</span>
                      {flag.staged && <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-bold text-[#92400E]">Staged</span>}
                    </div>
                    <p className="text-sm text-[#64748B]">{flag.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#64748B]">{flag.environment}</span>
                  <button type="button" className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${flag.enabled ? 'bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA]' : 'bg-[#DCFCE7] text-[#166534] hover:bg-[#BBF7D0]'}`}>
                    {flag.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {panel === 'templates' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-5">
            <div>
              <h3 className="font-headline text-lg font-semibold text-[#20324A]">Email Templates</h3>
              <p className="mt-1 text-sm text-[#64748B]">Transactional and notification email templates with trigger mapping.</p>
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#108995]">
              <Plus className="h-4 w-4" /> New Template
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Template ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Trigger</th>
                  <th className="px-4 py-3 text-left">Last Updated</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {EMAIL_TEMPLATES.map((t) => (
                  <tr key={t.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{t.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{t.name}</td>
                    <td className="px-4 py-3 text-[#64748B]">{t.trigger}</td>
                    <td className="px-4 py-3 text-[#64748B]">{t.lastUpdated}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(t.status)}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]">Edit</button>
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#64748B] hover:bg-[#F7F9FC]">Preview</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'params' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">System Parameters</h3>
            <p className="mt-1 text-sm text-[#64748B]">Runtime configuration values controlling platform behaviour.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Parameter Key</th>
                  <th className="px-4 py-3 text-left">Value</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {SYSTEM_PARAMS.map((p) => (
                  <tr key={p.key} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#20324A]">{p.key}</td>
                    <td className="px-4 py-3 font-semibold text-[#108995]">{p.value}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-xs font-semibold text-[#108995]">{p.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.editable
                        ? <button type="button" className="text-xs font-semibold text-[#108995] hover:underline">Edit value</button>
                        : <span className="text-xs text-[#94A3B8]">System locked</span>
                      }
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
