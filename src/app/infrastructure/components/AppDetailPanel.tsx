'use client';

import { X, ExternalLink } from 'lucide-react';
import type { PortalApp } from '../data/infrastructureData';

const STATUS_STYLES: Record<string, string> = {
  live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  auth: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  dev: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  integrated: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ready: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  planned: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

interface AppDetailPanelProps {
  app: PortalApp | null;
  isLight: boolean;
  onClose: () => void;
  onViewArchitecture?: () => void;
}

export default function AppDetailPanel({
  app,
  isLight,
  onClose,
  onViewArchitecture,
}: AppDetailPanelProps) {
  if (!app) return null;

  const Icon = app.icon;
  const isArchitectureTile = app.id === 'architecture-overview';

  const panelBg = isLight ? 'bg-white border-slate-200' : 'bg-[#0b132b] border-indigo-500/20';
  const textMain = isLight ? 'text-slate-900' : 'text-slate-100';
  const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
  const credBg = isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10';

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l shadow-2xl animate-slide-in ${panelBg}`}
        role="dialog"
        aria-labelledby="app-detail-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-inherit p-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: app.colorBg, color: app.color }}
            >
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h2 id="app-detail-title" className={`text-lg font-semibold ${textMain}`}>
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
            className={`rounded-lg p-2 transition-colors ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}
            aria-label="Close panel"
          >
            <X className={`h-5 w-5 ${textMuted}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className={`text-sm leading-relaxed ${textMuted}`}>{app.description}</p>

          {app.credentials && app.credentials.length > 0 && (
            <div className={`mt-5 rounded-lg border p-4 ${credBg}`}>
              <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                Access Credentials
              </p>
              <div className="space-y-2">
                {app.credentials.map((cred) => (
                  <div key={cred.label} className="text-sm">
                    <span className="font-medium" style={{ color: app.color }}>
                      {cred.label}:
                    </span>{' '}
                    <span className={textMuted}>{cred.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
              Metadata
            </p>
            <div className="grid grid-cols-2 gap-3">
              {app.footerMeta.map((meta) => (
                <div
                  key={meta.label}
                  className={`rounded-lg border px-3 py-2 ${credBg}`}
                >
                  <p className={`text-xs ${textMuted}`}>{meta.label}</p>
                  <p className={`text-sm font-medium ${textMain}`}>{meta.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-inherit p-6">
          {isArchitectureTile && onViewArchitecture ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewArchitecture();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-500"
            >
              View Architecture Tab
              <ExternalLink className="h-4 w-4" />
            </button>
          ) : app.launchUrl ? (
            <a
              href={app.launchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: app.color }}
            >
              {app.launchLabel ?? 'Launch'}
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <p className={`text-center text-sm ${textMuted}`}>
              No external launch URL — operational component
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
