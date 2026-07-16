'use client';

import { useState } from 'react';
import {
  Smartphone,
  Download,
  Bell,
  History,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const BUILDS = [
  {
    id: 'BUILD-001',
    version: 'BuildVersion1',
    platform: 'Android APK',
    date: '14 Jul 2026',
    size: '61 MB',
    status: 'Released',
    notes: 'QR scanner, offline voucher caching, USSD fallback',
  },
  {
    id: 'BUILD-000',
    version: 'BuildVersion0',
    platform: 'Android APK',
    date: '01 Jun 2026',
    size: '58 MB',
    status: 'Superseded',
    notes: 'Initial release, basic wallet and voucher display',
  },
];

const PUSH_NOTIFICATIONS = [
  {
    id: 'PUSH-041',
    title: 'Voucher Expiry Reminder',
    audience: 'All consumers',
    scheduled: '14 Jul 2026 18:00',
    status: 'Scheduled',
    sent: '—',
  },
  {
    id: 'PUSH-042',
    title: 'New Merchant: Boxer Gauteng',
    audience: 'Gauteng consumers',
    scheduled: '13 Jul 2026 09:00',
    status: 'Sent',
    sent: '4,812',
  },
  {
    id: 'PUSH-043',
    title: 'Government Food Relief Available',
    audience: 'SASSA beneficiaries',
    scheduled: '01 Jul 2026 08:00',
    status: 'Sent',
    sent: '42,000',
  },
];

const DISTRIBUTION_LINKS = [
  {
    label: 'Latest APK Download',
    url: '/downloads/eVoucher_APK_14-July-2026_BuildVersion1.apk',
    type: 'Direct download',
  },
  {
    label: 'Expo EAS Build History',
    url: 'https://expo.dev/accounts/evoucher_prod/projects/evoucheroffline/builds',
    type: 'Expo dashboard',
  },
];

type Panel = 'builds' | 'notifications' | 'distribution' | 'history';

function statusBadge(s: string) {
  if (s === 'Released' || s === 'Sent') return 'bg-[#DCFCE7] text-[#166534]';
  if (s === 'Scheduled') return 'bg-[#FEF3C7] text-[#92400E]';
  if (s === 'Superseded') return 'bg-[#F1F5F9] text-[#64748B]';
  return 'bg-[#EAFBFD] text-[#108995]';
}

export default function MobileWorkspace() {
  const [panel, setPanel] = useState<Panel>('builds');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">
              Mobile Operations
            </p>
            <h2 className="mt-1 font-headline text-2xl font-bold text-[#20324A]">
              Mobile App Management
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Android APK releases, Expo EAS builds, push notifications, and distribution.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'builds', label: 'Builds', icon: Smartphone },
                { id: 'notifications', label: 'Push Notifications', icon: Bell },
                { id: 'distribution', label: 'Distribution', icon: Download },
                { id: 'history', label: 'Release History', icon: History },
              ] as { id: Panel; label: string; icon: typeof Smartphone }[]
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

      {panel === 'builds' && (
        <div className="space-y-4">
          {BUILDS.map((build) => (
            <div
              key={build.id}
              className={`rounded-lg border p-5 ${build.status === 'Released' ? 'border-[#D7F3F6] bg-[#EAFBFD]' : 'border-[#E6EEF5] bg-white'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#108995] shadow-sm">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-headline text-base font-semibold text-[#20324A]">
                        {build.version}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(build.status)}`}
                      >
                        {build.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#64748B]">
                      {build.platform} · {build.size} · {build.date}
                    </p>
                    <p className="mt-1 text-xs text-[#64748B]">{build.notes}</p>
                  </div>
                </div>
                {build.status === 'Released' && (
                  <a
                    href="/downloads/eVoucher_APK_14-July-2026_BuildVersion1.apk"
                    download
                    className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#108995]"
                  >
                    <Download className="h-4 w-4" /> Download APK
                  </a>
                )}
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
            <div className="flex items-start gap-3">
              <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-[#108995]" />
              <div>
                <p className="font-semibold text-[#20324A]">Expo EAS Build System</p>
                <p className="mt-1 text-sm text-[#64748B]">
                  Full build history, logs, and artefacts available on the Expo dashboard.
                </p>
                <a
                  href="https://expo.dev/accounts/evoucher_prod/projects/evoucheroffline/builds"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#D7F3F6] bg-[#EAFBFD] px-3 py-1.5 text-xs font-semibold text-[#108995] hover:bg-[#D7F3F6]"
                >
                  Open Expo Dashboard <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {panel === 'notifications' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-5">
            <div>
              <h3 className="font-headline text-lg font-semibold text-[#20324A]">
                Push Notification Campaigns
              </h3>
              <p className="mt-1 text-sm text-[#64748B]">
                Scheduled and sent push notifications with audience targeting.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#108995]"
            >
              <Bell className="h-4 w-4" /> New Notification
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Audience</th>
                  <th className="px-4 py-3 text-left">Scheduled</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Sent To</th>
                </tr>
              </thead>
              <tbody>
                {PUSH_NOTIFICATIONS.map((n) => (
                  <tr key={n.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{n.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{n.title}</td>
                    <td className="px-4 py-3 text-[#64748B]">{n.audience}</td>
                    <td className="px-4 py-3 text-[#64748B]">{n.scheduled}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(n.status)}`}
                      >
                        {n.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{n.sent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'distribution' && (
        <div className="space-y-4">
          {DISTRIBUTION_LINKS.map((link) => (
            <div key={link.label} className="rounded-lg border border-[#E6EEF5] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#20324A]">{link.label}</p>
                  <p className="mt-1 text-xs text-[#64748B]">{link.type}</p>
                </div>
                <a
                  href={link.url}
                  target={link.type === 'Direct download' ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  download={link.type === 'Direct download'}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#108995]"
                >
                  {link.type === 'Direct download' ? (
                    <Download className="h-4 w-4" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  {link.type === 'Direct download' ? 'Download' : 'Open'}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {panel === 'history' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">Release History</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Chronological record of all mobile app releases and changes.
            </p>
          </div>
          <div className="divide-y divide-[#E6EEF5]">
            {BUILDS.map((build) => (
              <div key={build.id} className="flex items-start gap-4 px-5 py-4">
                {build.status === 'Released' ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#16A34A]" />
                ) : (
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#94A3B8]" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#20324A]">{build.version}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusBadge(build.status)}`}
                    >
                      {build.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#64748B]">
                    {build.date} · {build.platform} · {build.size}
                  </p>
                  <p className="mt-1 text-xs text-[#64748B]">{build.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
