'use client';

import { X, ExternalLink } from 'lucide-react';
import type { PortalApp } from '../data/infrastructureData';

const STATUS_STYLES: Record<string, string> = {
  live: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
  auth: 'bg-[#EAFBFD] text-[#108995] border-[#B9E9EE]',
  dev: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
  integrated: 'bg-[#EAFBFD] text-[#108995] border-[#B9E9EE]',
  active: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
  ready: 'bg-[#EAFBFD] text-[#108995] border-[#B9E9EE]',
  planned: 'bg-[#F1F5F9] text-[#64748B] border-[#E6EEF5]',
};

interface AppDetailPanelProps {
  app: PortalApp | null;
  onClose: () => void;
  onViewArchitecture?: () => void;
}

export default function AppDetailPanel({ app, onClose, onViewArchitecture }: AppDetailPanelProps) {
  if (!app) return null;

  const Icon = app.icon;
  const isArchitectureTile = app.id === 'architecture-overview';

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[#20324A]/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[#E6EEF5] bg-white shadow-2xl animate-slide-in"
        role="dialog"
        aria-labelledby="app-detail-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6EEF5] p-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: app.colorBg, color: app.color }}
            >
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h2
                id="app-detail-title"
                className="font-headline text-lg font-semibold text-[#20324A]"
              >
                {app.name}
              </h2>
              <span
                className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[app.status]}`}
              >
                {app.statusLabel}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#20324A]"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm leading-relaxed text-[#64748B]">{app.description}</p>

          {app.credentials && app.credentials.length > 0 && (
            <div className="mt-5 rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                Access Details
              </p>
              <div className="space-y-2">
                {app.credentials.map((cred) => (
                  <div key={cred.label} className="text-sm">
                    <span className="font-semibold" style={{ color: app.color }}>
                      {cred.label}:
                    </span>{' '}
                    <span className="text-[#64748B]">{cred.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
              Platform Context
            </p>
            <div className="grid grid-cols-2 gap-3">
              {app.footerMeta.map((meta) =>
                meta.href ? (
                  <a
                    key={meta.label}
                    href={meta.href}
                    download={meta.download}
                    target={meta.download ? undefined : '_blank'}
                    rel={meta.download ? undefined : 'noopener noreferrer'}
                    className="rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] px-3 py-2 transition-colors hover:border-[#20B8C5] hover:bg-[#EAFBFD]"
                  >
                    <p className="text-xs text-[#64748B]">{meta.label}</p>
                    <p className="text-sm font-semibold text-[#20324A]">{meta.value}</p>
                  </a>
                ) : (
                  <div
                    key={meta.label}
                    className="rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] px-3 py-2"
                  >
                    <p className="text-xs text-[#64748B]">{meta.label}</p>
                    <p className="text-sm font-semibold text-[#20324A]">{meta.value}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[#E6EEF5] p-6">
          {isArchitectureTile && onViewArchitecture ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewArchitecture();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#20B8C5] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#108995]"
            >
              View Platform Overview
              <ExternalLink className="h-4 w-4" />
            </button>
          ) : app.launchUrl ? (
            <a
              href={app.launchUrl}
              download={app.launchUrl.endsWith('.apk')}
              target={app.launchUrl.endsWith('.apk') ? undefined : '_blank'}
              rel={app.launchUrl.endsWith('.apk') ? undefined : 'noopener noreferrer'}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: app.color }}
            >
              {app.launchLabel ?? 'Open'}
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <p className="text-center text-sm text-[#64748B]">Operational component</p>
          )}
        </div>
      </aside>
    </>
  );
}
