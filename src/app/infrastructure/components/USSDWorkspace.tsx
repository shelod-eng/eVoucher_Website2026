'use client';

import { useState } from 'react';
import {
  Smartphone,
  MessageSquare,
  Activity,
  BarChart3,
  Play,
  RefreshCw,
  Download,
} from 'lucide-react';

const LIVE_SESSIONS = [
  { id: 'SES-8841', msisdn: '+27 82 ***6789', menu: 'Main Menu', step: 'Voucher Balance', duration: '42s', status: 'Active' },
  { id: 'SES-8842', msisdn: '+27 73 ***2345', menu: 'Registration', step: 'Enter ID Number', duration: '1m 12s', status: 'Active' },
  { id: 'SES-8843', msisdn: '+27 61 ***5678', menu: 'Buy Voucher', step: 'Select Merchant', duration: '28s', status: 'Active' },
  { id: 'SES-8844', msisdn: '+27 79 ***8901', menu: 'Redeem', step: 'Enter PIN', duration: '55s', status: 'Active' },
  { id: 'SES-8845', msisdn: '+27 83 ***9012', menu: 'Main Menu', step: 'Timeout', duration: '2m 01s', status: 'Timed out' },
];

const MENU_STRUCTURE = [
  { id: 'MENU-01', name: 'Main Menu', options: 5, sessions: 1842, completionRate: '94%', status: 'Active' },
  { id: 'MENU-02', name: 'Registration', options: 4, sessions: 412, completionRate: '88%', status: 'Active' },
  { id: 'MENU-03', name: 'Buy Voucher', options: 6, sessions: 1204, completionRate: '91%', status: 'Active' },
  { id: 'MENU-04', name: 'Redeem Voucher', options: 3, sessions: 984, completionRate: '97%', status: 'Active' },
  { id: 'MENU-05', name: 'Wallet Balance', options: 2, sessions: 2108, completionRate: '99%', status: 'Active' },
  { id: 'MENU-06', name: 'Government Benefits', options: 4, sessions: 262, completionRate: '85%', status: 'Active' },
];

const PROVIDER_STATUS = [
  { provider: 'MTN', shortcode: '*120*384#', sessions: '1,842', latency: '1.1s', uptime: '99.8%', status: 'Operational' },
  { provider: 'Vodacom', shortcode: '*120*384#', sessions: '1,604', latency: '1.3s', uptime: '99.6%', status: 'Operational' },
  { provider: 'Cell C', shortcode: '*120*384#', sessions: '842', latency: '1.4s', uptime: '99.1%', status: 'Operational' },
  { provider: 'Telkom', shortcode: '*120*384#', sessions: '524', latency: '1.8s', uptime: '98.4%', status: 'Degraded' },
];

type Panel = 'sessions' | 'menus' | 'providers' | 'analytics';

function statusBadge(s: string) {
  if (s === 'Active' || s === 'Operational') return 'bg-[#DCFCE7] text-[#166534]';
  if (s === 'Degraded') return 'bg-[#FEF3C7] text-[#92400E]';
  if (s === 'Timed out') return 'bg-[#F1F5F9] text-[#64748B]';
  return 'bg-[#FEE2E2] text-[#B91C1C]';
}

export default function USSDWorkspace() {
  const [panel, setPanel] = useState<Panel>('sessions');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">USSD Operations</p>
            <h2 className="mt-1 font-headline text-2xl font-bold text-[#20324A]">USSD Platform Management</h2>
            <p className="mt-1 text-sm text-[#64748B]">Live sessions, menu builder, provider health, and session analytics. Shortcode: *120*384#</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'sessions', label: 'Live Sessions', icon: Activity },
              { id: 'menus', label: 'Menu Structure', icon: MessageSquare },
              { id: 'providers', label: 'Providers', icon: Smartphone },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ] as { id: Panel; label: string; icon: typeof Activity }[]).map(({ id, label, icon: Icon }) => (
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

      {panel === 'sessions' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-4">
            <p className="font-semibold text-[#20324A]">Live USSD Sessions</p>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EAFBFD] px-3 py-1 text-xs font-bold text-[#108995]">
              <RefreshCw className="h-3 w-3" /> 4,812 active
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Session ID</th>
                  <th className="px-4 py-3 text-left">MSISDN</th>
                  <th className="px-4 py-3 text-left">Menu</th>
                  <th className="px-4 py-3 text-left">Current Step</th>
                  <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {LIVE_SESSIONS.map((s) => (
                  <tr key={s.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{s.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#20324A]">{s.msisdn}</td>
                    <td className="px-4 py-3 text-[#64748B]">{s.menu}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{s.step}</td>
                    <td className="px-4 py-3 text-[#64748B]">{s.duration}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(s.status)}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]">Replay</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'menus' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-5">
            <div>
              <h3 className="font-headline text-lg font-semibold text-[#20324A]">USSD Menu Structure</h3>
              <p className="mt-1 text-sm text-[#64748B]">Menu definitions with session volume and completion rates.</p>
            </div>
            <a
              href="https://www.evoucher.co.za/ussd-console"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#108995]"
            >
              <Play className="h-4 w-4" /> Open Simulator
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Menu ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Options</th>
                  <th className="px-4 py-3 text-left">Sessions Today</th>
                  <th className="px-4 py-3 text-left">Completion</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {MENU_STRUCTURE.map((m) => (
                  <tr key={m.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{m.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{m.name}</td>
                    <td className="px-4 py-3 text-[#64748B]">{m.options}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{m.sessions.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-[#166534]">{m.completionRate}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(m.status)}`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'providers' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {PROVIDER_STATUS.map((p) => (
            <div key={p.provider} className="rounded-lg border border-[#E6EEF5] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-headline text-base font-semibold text-[#20324A]">{p.provider}</p>
                  <p className="font-mono text-xs text-[#64748B]">{p.shortcode}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(p.status)}`}>{p.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-[#F7F9FC] px-3 py-2">
                  <p className="text-xs text-[#94A3B8]">Sessions</p>
                  <p className="font-semibold text-[#20324A]">{p.sessions}</p>
                </div>
                <div className="rounded-lg bg-[#F7F9FC] px-3 py-2">
                  <p className="text-xs text-[#94A3B8]">Latency</p>
                  <p className="font-semibold text-[#20324A]">{p.latency}</p>
                </div>
                <div className="rounded-lg bg-[#F7F9FC] px-3 py-2">
                  <p className="text-xs text-[#94A3B8]">Uptime</p>
                  <p className="font-semibold text-[#166534]">{p.uptime}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {panel === 'analytics' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: 'Session Volume Report', desc: 'Daily, weekly, and monthly USSD session counts by provider and menu.', action: 'Export CSV' },
            { title: 'Menu Completion Analysis', desc: 'Drop-off points per menu step with funnel visualisation.', action: 'Export PDF' },
            { title: 'Provider Performance', desc: 'Latency, uptime, and error rates per mobile network operator.', action: 'Export Excel' },
            { title: 'Redemption via USSD', desc: 'Voucher redemptions completed through USSD channel.', action: 'Export CSV' },
          ].map((report) => (
            <div key={report.title} className="rounded-lg border border-[#E6EEF5] bg-white p-5">
              <div className="flex items-start gap-3">
                <Download className="mt-0.5 h-5 w-5 shrink-0 text-[#108995]" />
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
