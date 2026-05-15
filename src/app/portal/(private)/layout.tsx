import Link from 'next/link';
import { redirect } from 'next/navigation';
import PortalHeader from './PortalHeader';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole, isAdminRole } from '@/server/utils/role';

const navigation = [
  { href: '/portal/dashboard', label: 'Overview', code: 'OV' },
  { href: '/portal/merchants', label: 'Merchants', code: 'MR' },
  { href: '/portal/vouchers', label: 'Vouchers', code: 'VC' },
  { href: '/portal/redemptions', label: 'Redemptions', code: 'RD' },
  { href: '/portal/reports', label: 'Reports', code: 'BI' },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    redirect('/portal/login');
  }

  const { role } = await resolveUserRole(supabase, user);
  if (!isAdminRole(role)) {
    redirect('/shop');
  }

  return (
    <div className="min-h-screen bg-[#081a33] text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.08),_transparent_24%),linear-gradient(180deg,#06142a_0%,#081a33_42%,#07152b_100%)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(96,165,250,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.06)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <PortalHeader />

      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-6 xl:px-6">
        <aside className="hidden w-[272px] flex-shrink-0 xl:block">
          <div className="sticky top-24 overflow-hidden rounded-[2rem] border border-sky-400/20 bg-[#0b1d3a]/90 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.45)] backdrop-blur">
            <div className="rounded-[1.5rem] border border-amber-300/25 bg-[linear-gradient(180deg,rgba(251,146,60,0.14),rgba(15,23,42,0.05))] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-200/80">
                Sponsor Direction
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight text-white">
                eVoucher reporting with boardroom polish.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Premium operational visibility for finance, sponsor oversight, cyber governance, and
                growth intelligence.
              </p>
            </div>

            <div className="mt-6">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                Navigation
              </p>
              <nav className="mt-4 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-[1.25rem] border border-sky-400/12 bg-slate-900/20 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-300/35 hover:bg-slate-800/40 hover:text-white"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-400/20 bg-[#0f274b] text-[11px] font-bold tracking-[0.18em] text-sky-200">
                      {item.code}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-sky-400/16 bg-[#0d2344] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-200/80">
                Session
              </p>
              <p className="mt-3 text-lg font-semibold text-white">{user.email}</p>
              <p className="mt-1 text-sm capitalize text-slate-300">{role.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
