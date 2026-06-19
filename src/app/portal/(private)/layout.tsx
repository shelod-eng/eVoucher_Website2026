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
    <div className="min-h-screen bg-[#f4fbfa] text-slate-900">
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(13,148,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.03) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <PortalHeader />

      <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-6 xl:px-6">
        <aside className="hidden w-[272px] flex-shrink-0 xl:block">
          <div className="sticky top-24 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
            <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#00a89d,#0d9488)] p-5 text-white shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-teal-100">
                Sponsor Direction
              </p>
              <h2 className="mt-4 text-2xl font-bold leading-tight text-white">
                eVoucher reporting with boardroom polish.
              </h2>
              <p className="mt-4 text-xs leading-5 text-teal-50">
                Premium operational visibility for finance, sponsor oversight, cyber governance, and
                growth intelligence.
              </p>
            </div>

            <div className="mt-6">
              <p className="px-1 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
                Navigation
              </p>
              <nav className="mt-4 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200/80 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#00a89d]/50 hover:bg-slate-100/80"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-bold tracking-[0.18em] text-[#00a89d]">
                      {item.code}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#00a89d]">
                Session
              </p>
              <p className="mt-3 text-sm font-bold text-slate-800 truncate">{user.email}</p>
              <p className="mt-1 text-xs capitalize text-slate-500">{role.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
