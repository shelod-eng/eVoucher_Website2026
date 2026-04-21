'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PortalHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/portal/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-semibold">
            EV
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Business Portal</p>
            <p className="text-sm font-semibold text-slate-900">eVoucher Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          {user?.email && <span className="hidden sm:inline">Signed in as {user.email}</span>}
          <Link
            href="/portal"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-600"
          >
            Dashboard
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
