'use client';

import { useMemo, useState } from 'react';
import { Search, Sun, Moon } from 'lucide-react';
import {
  PORTAL_APPS,
  WORKSPACES,
  type PortalApp,
  type WorkspaceId,
} from '../data/infrastructureData';
import AppDetailPanel from './AppDetailPanel';

const STATUS_STYLES: Record<string, string> = {
  live: 'bg-emerald-500/20 text-emerald-400',
  auth: 'bg-violet-500/20 text-violet-400',
  dev: 'bg-amber-500/20 text-amber-400',
  integrated: 'bg-cyan-500/20 text-cyan-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  ready: 'bg-blue-500/20 text-blue-400',
  planned: 'bg-slate-500/20 text-slate-400',
};

interface ApplicationsLauncherProps {
  onViewArchitecture: () => void;
}

export default function ApplicationsLauncher({ onViewArchitecture }: ApplicationsLauncherProps) {
  const [workspace, setWorkspace] = useState<WorkspaceId>('production');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<PortalApp | null>(null);
  const [isLight, setIsLight] = useState(false);

  const filteredApps = useMemo(() => {
    const query = search.trim().toLowerCase();
    return PORTAL_APPS.filter((app) => {
      const inWorkspace = app.workspace === workspace;
      if (!query) return inWorkspace;
      const searchable = [app.name, app.shortLabel, ...app.keywords].join(' ').toLowerCase();
      return inWorkspace && searchable.includes(query);
    });
  }, [workspace, search]);

  const shellBg = isLight ? 'bg-slate-50' : 'bg-[#060b13]';
  const sidebarBg = isLight ? 'bg-white border-slate-200' : 'bg-[#0b132b] border-indigo-500/15';
  const textMain = isLight ? 'text-slate-900' : 'text-slate-100';
  const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
  const inputBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
    : 'bg-[#0b132b] border-indigo-500/15 text-slate-100 placeholder:text-slate-500';
  const tileBg = isLight
    ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
    : 'bg-[#0b132b] border-indigo-500/12 hover:border-cyan-500/30 hover:bg-[#111b35]';
  const wsActive = isLight
    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25';
  const wsIdle = isLight
    ? 'text-slate-600 hover:bg-slate-50 border-transparent'
    : 'text-slate-400 hover:bg-white/5 border-transparent';

  return (
    <div className={`rounded-2xl border overflow-hidden ${isLight ? 'border-slate-200' : 'border-indigo-500/12'}`}>
      <div className={`flex min-h-[520px] ${shellBg}`}>
        {/* Workspace sidebar */}
        <nav
          className={`w-56 shrink-0 border-r p-4 ${sidebarBg}`}
          aria-label="Workspaces"
        >
          <p className={`mb-3 px-2 text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
            Workspaces
          </p>
          <ul className="space-y-1">
            {WORKSPACES.map((ws) => (
              <li key={ws.id}>
                <button
                  type="button"
                  onClick={() => setWorkspace(ws.id)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    workspace === ws.id ? wsActive : wsIdle
                  }`}
                >
                  {ws.label}
                </button>
              </li>
            ))}
          </ul>
          <p className={`mt-4 px-2 text-xs leading-relaxed ${textMuted}`}>
            {WORKSPACES.find((w) => w.id === workspace)?.description}
          </p>

          <button
            type="button"
            onClick={() => setIsLight((v) => !v)}
            className={`mt-6 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-indigo-500/15 text-slate-400 hover:bg-white/5'
            }`}
          >
            {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            {isLight ? 'Dark workspace' : 'Light workspace'}
          </button>
        </nav>

        {/* Tile grid area */}
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative min-w-[240px] flex-1">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${textMuted}`} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter apps by name..."
                className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-cyan-500/40 ${inputBg}`}
              />
            </div>
            <p className={`text-sm ${textMuted}`}>
              {filteredApps.length} app{filteredApps.length !== 1 ? 's' : ''}
            </p>
          </div>

          {filteredApps.length === 0 ? (
            <div className={`flex flex-1 items-center justify-center text-sm ${textMuted}`}>
              No apps match your search in this workspace.
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
                    className={`group flex flex-col items-center rounded-xl border p-5 transition-all ${tileBg}`}
                  >
                    <div
                      className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
                      style={{ backgroundColor: app.colorBg, color: app.color }}
                    >
                      <Icon className="h-8 w-8" />
                    </div>
                    <span className={`text-center text-sm font-medium leading-tight ${textMain}`}>
                      {app.shortLabel}
                    </span>
                    <span
                      className={`mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[app.status]}`}
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
        isLight={isLight}
        onClose={() => setSelectedApp(null)}
        onViewArchitecture={onViewArchitecture}
      />
    </div>
  );
}
