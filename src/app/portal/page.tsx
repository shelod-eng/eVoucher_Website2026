import Link from 'next/link';
import { redirect } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isAdminRole, resolveUserRole } from '@/server/utils/role';

export const dynamic = 'force-dynamic';

export default async function PortalEntryPage() {
  const { supabase, user } = await getAuthenticatedUser();

  if (user) {
    const { role } = await resolveUserRole(supabase, user);
    if (isAdminRole(role)) {
      redirect('/portal/dashboard');
    }
  }

  const entryPoints = [
    {
      title: 'Admin command centre',
      detail:
        'Access sponsor reporting, merchant oversight, settlement intelligence, and compliance controls.',
    },
    {
      title: 'Protected by admin login',
      detail:
        'Only approved administrator accounts can open the internal portal and reporting suite.',
    },
    {
      title: 'Built for eVoucher operations',
      detail:
        'The experience is aligned to the May 2026 BI spec, Supabase production tables, and the live product model.',
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#07152b] text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.14),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.1),_transparent_22%),linear-gradient(180deg,#051120_0%,#081a33_52%,#07152b_100%)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(96,165,250,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.06)_1px,transparent_1px)] bg-[size:34px_34px]" />

      <main className="mx-auto flex min-h-screen w-full max-w-[1480px] items-center px-4 py-10 xl:px-6">
        <section className="grid w-full gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="overflow-hidden rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/92 p-6 shadow-[0_30px_120px_rgba(2,8,23,0.42)] xl:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] border border-sky-300/20 bg-[linear-gradient(135deg,rgba(45,212,191,0.18),rgba(59,130,246,0.14))] p-2">
                <AppImage
                  src="/assets/images/branding/evoucher-logo.png"
                  alt="eVoucher logo"
                  width={72}
                  height={72}
                  className="h-full w-full rounded-[1.15rem] object-cover"
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
                  Admin Portal Entry
                </p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight text-white xl:text-6xl">
                  Sign in to the eVoucher intelligence portal.
                </h1>
              </div>
            </div>

            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300">
              This is the front door for administrators. From here, approved admin users can log in
              to open the sponsor dashboard, reports portal, merchant oversight, settlement ledger,
              and compliance views.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                'Admin only',
                'Boardroom reporting',
                'Supabase-backed KPIs',
                'Sponsor readiness',
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-sky-400/18 bg-slate-950/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {entryPoints.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.4rem] border border-sky-400/12 bg-[#102647]/80 p-5"
                >
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/92 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.38)] xl:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
              Access Control
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Administrator sign-in</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Use an approved admin account to continue into the private command centre.
            </p>

            <div className="mt-8 space-y-3">
              <Link
                href="/portal/login"
                className="block rounded-[1.35rem] bg-[linear-gradient(135deg,#f97316,#ea580c)] px-5 py-4 text-center text-sm font-semibold text-white shadow-[0_16px_40px_rgba(249,115,22,0.22)] transition hover:brightness-110"
              >
                Continue to Admin Login
              </Link>
              <Link
                href="/merchant/login"
                className="block rounded-[1.35rem] border border-sky-400/20 bg-[#102647] px-5 py-4 text-center text-sm font-semibold text-sky-100 transition hover:border-sky-300/36 hover:text-white"
              >
                Merchant Login
              </Link>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-amber-300/18 bg-[linear-gradient(180deg,rgba(251,191,36,0.1),rgba(8,26,51,0.95))] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-100/80">
                Why you saw an error before
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                `/portal` was acting like the private dashboard route, so unauthenticated access
                could fall straight into protected server logic. This page now gives the portal a
                proper public landing step first.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
