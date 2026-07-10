'use client';

import { CRON_JOBS } from '../data/infrastructureData';

const BADGE_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  dev: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  ready: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  planned: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

export default function JobsTab() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {CRON_JOBS.map((job) => (
          <div
            key={job.index}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-500/15 bg-[#0b132b] p-5 transition-colors hover:border-cyan-500/20"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 font-accent text-sm font-bold text-cyan-400">
                {job.index}
              </div>
              <div>
                <h4 className="font-semibold text-white">{job.title}</h4>
                <p className="mt-1 text-sm text-slate-400">{job.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-accent text-xs text-slate-500">{job.schedule}</span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${BADGE_STYLES[job.status]}`}
              >
                {job.statusLabel}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-6">
        <h3 className="mb-4 text-base font-semibold text-white">Storage Retention Policy Summary</h3>
        <ul className="grid gap-3 text-sm text-slate-400">
          <li>
            <strong className="text-slate-300">Daily incremental backups</strong> are stored in subfolders
            under <code className="text-cyan-400">BACKUPS/</code> and retained for 7 calendar days.
          </li>
          <li>
            <strong className="text-slate-300">Weekly full dumps</strong> are moved to offsite vault containers
            on Sundays and retained for 4 weeks.
          </li>
          <li>
            <strong className="text-slate-300">Monthly cold snapshots</strong> are archived securely in
            read-only directories and retained for 3 fiscal quarters.
          </li>
          <li>
            <strong className="text-slate-300">Manual schema snapshots</strong> are captured prior to major
            migrations using the Supabase CLI workflow.
          </li>
        </ul>
      </div>
    </div>
  );
}
