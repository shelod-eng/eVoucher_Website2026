import Link from 'next/link';
import { redirect } from 'next/navigation';
import PortalHeader from './PortalHeader';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole, isAdminRole } from '@/server/utils/role';

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PortalHeader />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <nav className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {[
              { href: '/portal', label: 'Overview' },
              { href: '/portal/merchants', label: 'Merchants' },
              { href: '/portal/vouchers', label: 'Vouchers' },
              { href: '/portal/redemptions', label: 'Redemptions' },
              { href: '/portal/reports', label: 'Reports' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
