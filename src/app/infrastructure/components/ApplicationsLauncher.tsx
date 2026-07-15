'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  PORTAL_APPS,
  WORKSPACES,
  type PortalApp,
  type WorkspaceId,
} from '../data/infrastructureData';
import AppDetailPanel from './AppDetailPanel';

const STATUS_STYLES: Record<string, string> = {
  live: 'bg-[#DCFCE7] text-[#166534]',
  auth: 'bg-[#EAFBFD] text-[#108995]',
  dev: 'bg-[#FEF3C7] text-[#92400E]',
  integrated: 'bg-[#EAFBFD] text-[#108995]',
  active: 'bg-[#DCFCE7] text-[#166534]',
  ready: 'bg-[#EAFBFD] text-[#108995]',
  planned: 'bg-[#F1F5F9] text-[#64748B]',
};

interface ApplicationsLauncherProps {
  onViewArchitecture: () => void;
}

export default function ApplicationsLauncher({ onViewArchitecture }: ApplicationsLauncherProps) {
  const [workspace, setWorkspace] = useState<WorkspaceId>('production');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<PortalApp | null>(null);

  const filteredApps = useMemo(() => {
    const query = search.trim().toLowerCase();
    return PORTAL_APPS.filter((app) => {
      const inWorkspace = app.workspace === workspace;
      if (!query) return inWorkspace;
      const searchable = [app.name, app.shortLabel, ...app.keywords].join(' ').toLowerCase();
      return inWorkspace && searchable.includes(query);
    });
  }, [workspace, search]);

  return (
    <div className="overflow-hidden rounded-lg border border-[#E6EEF5] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
      <div className="grid min-h-[520px] lg:grid-cols-[240px_1fr]">
        <nav
          className="border-b border-[#E6EEF5] bg-[#F7F9FC] p-4 lg:border-b-0 lg:border-r"
          aria-label="Workspaces"
        >
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
            Workspaces
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {WORKSPACES.map((ws) => (
              <li key={ws.id}>
                <button
                  type="button"
                  onClick={() => setWorkspace(ws.id)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                    workspace === ws.id
                      ? 'border-[#20B8C5] bg-white text-[#108995] shadow-sm'
                      : 'border-transparent text-[#64748B] hover:border-[#E6EEF5] hover:bg-white'
                  }`}
                >
                  {ws.label}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 px-2 text-xs leading-relaxed text-[#64748B]">
            {WORKSPACES.find((w) => w.id === workspace)?.description}
          </p>
        </nav>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applications, services, or partners..."
                className="w-full rounded-lg border border-[#E6EEF5] bg-white py-2.5 pl-10 pr-4 text-sm text-[#22324B] outline-none placeholder:text-[#94A3B8] focus:border-[#20B8C5] focus:ring-2 focus:ring-[#20B8C5]/20"
              />
            </div>
            <p className="text-sm text-[#64748B]">
              <span className="font-semibold text-[#20324A]">{filteredApps.length}</span> assets
            </p>
          </div>

          {filteredApps.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#DCE6EF] bg-[#F7F9FC] text-sm text-[#64748B]">
              No platform assets match this search.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredApps.map((app) => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedApp(app)}
                    className="group flex min-h-[148px] flex-col items-center rounded-lg border border-[#E6EEF5] bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#20B8C5] hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
                  >
                    <div
                      className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                      style={{ backgroundColor: app.colorBg, color: app.color }}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className="text-sm font-semibold leading-tight text-[#20324A]">
                      {app.shortLabel}
                    </span>
                    <span
                      className={`mt-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[app.status]}`}
                    >
                      {app.statusLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AppDetailPanel
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onViewArchitecture={onViewArchitecture}
      />
    </div>
  );
}
