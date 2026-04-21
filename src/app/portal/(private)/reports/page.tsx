import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function getTotals() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('redemption_history')
    .select('amount')
    .order('created_at', { ascending: false });

  const totalValue =
    data?.reduce((sum, row) => sum + Number(row.amount ?? 0), 0) ?? 0;

  return { totalValue, count: data?.length ?? 0 };
}

export default async function PortalReportsPage() {
  const totals = await getTotals();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Reports & exports</h1>
        <p className="mt-2 text-sm text-slate-500">
          Download CSV reports for reconciliation and investor reporting.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Total Redemption Value
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              R {totals.totalValue.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Redemption Transactions
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totals.count}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/api/portal/redemptions-export"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Download Redemptions CSV
          </Link>
        </div>
      </section>
    </div>
  );
}
