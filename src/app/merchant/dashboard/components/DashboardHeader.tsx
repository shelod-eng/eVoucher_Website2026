'use client';

import Icon from '@/components/ui/AppIcon';

interface DashboardHeaderProps {
  businessName?: string;
  email?: string;
  merchantType?: string;
  status?: string;
  onSignOut: () => void;
}

export default function DashboardHeader({
  businessName,
  email,
  merchantType = 'private',
  status = 'pending',
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-teal-300/30 bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 p-6 text-white shadow-[0_24px_70px_rgba(13,148,136,0.2)] md:p-8">
      <div
        className="absolute inset-0 -z-10 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-secondary/10 blur-[110px]" />
      <div className="absolute bottom-0 left-1/3 -z-10 h-48 w-48 rounded-full bg-primary/20 blur-[90px]" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-teal-100 backdrop-blur-md">
              Merchant Growth Hub
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-200" />
              </span>
              Live cashflow view
            </span>
          </div>

          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              {businessName || 'Business Portal'}
            </h1>
            <p className="mt-2 max-w-2xl font-body text-sm text-teal-100/80 md:text-base">
              Track settlements, product performance, and growth levers from one premium operating
              workspace. {email ? <span className="font-semibold text-white">{email}</span> : 'Secure access is active.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-100">
              Type: {merchantType.toUpperCase()}
            </span>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-100">
              Support: 0800 EVOUCHER
            </span>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-100">
              Settlements ready this week
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md sm:min-w-[240px]">
          <div className="flex items-center gap-2 text-sm text-teal-50">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            {status?.toUpperCase() || 'PENDING'}
          </div>
          <div className="font-headline text-2xl font-semibold text-white">Money matters, fast</div>
          <p className="text-sm text-teal-100/80">
            Review payouts, discount health, and customer momentum without leaving the dashboard.
          </p>
          <button
            onClick={onSignOut}
            className="mt-1 flex w-full items-center justify-center space-x-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-headline text-sm font-bold tracking-wider text-white transition-all duration-300 hover:bg-white/15 active:scale-[0.98]"
          >
            <Icon name="ArrowRightOnRectangleIcon" size={18} variant="outline" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
