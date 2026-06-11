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
    <header className="sticky top-0 z-30 border-b border-cyan-300/24 bg-[#091a34]">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-4 py-4 xl:flex-row xl:items-center xl:justify-between xl:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.35rem] border border-sky-300/20 bg-[linear-gradient(135deg,rgba(20,184,166,0.25),rgba(14,165,233,0.18))] p-1.5 shadow-[0_16px_40px_rgba(15,118,110,0.18)]">
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
              <p className="text-lg font-semibold text-white">eVoucher Sponsor Intelligence</p>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/32 bg-emerald-400/14 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                Live
              </span>
            </div>
            <p className="text-sm text-slate-200">
              Fintech Standards Dashboard and BI Command Centre
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {user?.email && (
            <div className="rounded-[1.2rem] border border-cyan-300/22 bg-[#102647] px-4 py-3 text-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-100/90">
                User Access
              </p>
              <p className="mt-1 font-semibold text-white">{user.email}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link
              href="/portal/bankserv"
              className="rounded-full border border-cyan-300/28 bg-[#102647] px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-200 hover:bg-[#15315a]"
            >
              BankServ Console
            </Link>
            <Link
              href="/api/v1/reporting/executive-summary"
              className="rounded-full border border-cyan-300/24 bg-slate-950/35 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200 hover:bg-slate-900/70"
            >
              API View
            </Link>
            <button
              onClick={handleSignOut}
              className="rounded-full bg-[linear-gradient(135deg,#f97316,#ea580c)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(249,115,22,0.28)] transition hover:brightness-110"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
