import Link from 'next/link';
import { redirect } from 'next/navigation';
import PortalHeader from './PortalHeader';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole, isAdminRole } from '@/server/utils/role';

const navigation = [
  { href: '/portal/bankserv', label: 'BankServ', code: 'BS' },
  { href: '/portal/dashboard', label: 'Overview', code: 'OV' },
  { href: '/portal/merchants', label: 'Merchants', code: 'MR' },
  { href: '/portal/merchant-report', label: 'Merchant Report', code: 'MP' },
  { href: '/portal/compliance', label: 'Compliance', code: 'KY' },
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
    <div className="min-h-screen bg-[#07172e] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.08),_transparent_24%),linear-gradient(180deg,#06142a_0%,#081a33_42%,#07152b_100%)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(96,165,250,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.06)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <PortalHeader />

      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-6 xl:px-6">
        <aside className="hidden w-[272px] flex-shrink-0 xl:block">
          <div className="sticky top-24 overflow-hidden rounded-[2rem] border border-cyan-300/22 bg-[#0a1d39] p-5 shadow-[0_24px_80px_rgba(2,8,23,0.58)]">
            <div className="rounded-[1.5rem] border border-amber-300/28 bg-[linear-gradient(180deg,rgba(251,146,60,0.18),rgba(15,23,42,0.08))] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-cyan-100">
                Sponsor Direction
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight text-white">
                eVoucher reporting with boardroom polish.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-200">
                Premium operational visibility for finance, sponsor oversight, cyber governance, and
                growth intelligence.
              </p>
            </div>

            <div className="mt-6">
              <p className="px-1 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-300">
                Navigation
              </p>
              <nav className="mt-4 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-[1.25rem] border border-sky-300/24 bg-[#10284b] px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/65 hover:bg-[#153666]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/35 bg-[#0d315a] text-[11px] font-bold tracking-[0.18em] text-cyan-100">
                      {item.code}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-cyan-300/18 bg-[#0d2749] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-cyan-100">
                Session
              </p>
              <p className="mt-3 text-lg font-semibold text-white">{user.email}</p>
              <p className="mt-1 text-sm capitalize text-slate-200">{role.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
