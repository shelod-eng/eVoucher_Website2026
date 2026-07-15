'use client';

import { CheckCircle2, Clock3 } from 'lucide-react';
import { CRON_JOBS } from '../data/infrastructureData';

const BADGE_STYLES: Record<string, string> = {
  active: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
  dev: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
  ready: 'bg-[#EAFBFD] text-[#108995] border-[#B9E9EE]',
  planned: 'bg-[#F1F5F9] text-[#64748B] border-[#E6EEF5]',
};

export default function JobsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
        <h2 className="font-headline text-xl font-semibold text-[#20324A]">Operating Rhythm</h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Automated platform routines that keep vouchers, settlements, notifications, and backups
          reliable.
        </p>
      </div>

      <div className="grid gap-3">
        {CRON_JOBS.map((job) => (
          <div
            key={job.index}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm transition-colors hover:border-[#20B8C5]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#20B8C5]/10 text-[#20B8C5]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-headline font-semibold text-[#20324A]">{job.title}</h4>
                <p className="mt-1 text-sm text-[#64748B]">{job.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
                <Clock3 className="h-3.5 w-3.5" />
                {job.schedule}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${BADGE_STYLES[job.status]}`}
              >
                {job.statusLabel}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-[#D7F3F6] bg-[#EAFBFD] p-6">
        <h3 className="mb-4 font-headline text-base font-semibold text-[#20324A]">
          Continuity and Retention Summary
        </h3>
        <ul className="grid gap-3 text-sm text-[#64748B]">
          <li>
            <strong className="text-[#20324A]">Daily continuity snapshots</strong> retain recent
            operational data for 7 calendar days.
          </li>
          <li>
            <strong className="text-[#20324A]">Weekly full platform archives</strong> are retained
            for 4 weeks for recovery planning.
          </li>
          <li>
            <strong className="text-[#20324A]">Monthly cold snapshots</strong> support longer-term
            audit and governance reviews.
          </li>
          <li>
            <strong className="text-[#20324A]">Pre-release snapshots</strong> are captured before
            major platform changes.
          </li>
        </ul>
      </div>
    </div>
  );
}
