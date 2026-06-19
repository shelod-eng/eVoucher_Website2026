'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppImage from '@/components/ui/AppImage';

export default function PortalHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/portal/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-4 py-4 xl:flex-row xl:items-center xl:justify-between xl:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.35rem] border border-slate-200 bg-teal-50 p-1.5">
            <AppImage
              src="/assets/images/branding/evoucher-logo.png"
              alt="eVoucher logo"
              width={48}
              height={48}
              className="h-full w-full rounded-[1rem] object-cover"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-bold text-slate-900">eVoucher Sponsor Intelligence</p>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                Live
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Fintech Standards Dashboard and BI Command Centre
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {user?.email && (
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#00a89d]">
                User Access
              </p>
              <p className="mt-0.5 font-bold text-slate-800">{user.email}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Link
              href="/portal/bankserv"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-[#00a89d] hover:bg-slate-50"
            >
              BankServ Console
            </Link>
            <Link
              href="/api/v1/reporting/executive-summary"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-[#00a89d] hover:bg-slate-50"
            >
              API View
            </Link>
            <button
              onClick={handleSignOut}
              className="rounded-full bg-[linear-gradient(135deg,#f97316,#ea580c)] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_12px_rgba(249,115,22,0.18)] transition hover:brightness-115"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
