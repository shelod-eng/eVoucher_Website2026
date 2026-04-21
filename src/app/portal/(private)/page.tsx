import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function getCounts() {
  const supabase = createAdminClient();
  const [merchants, vouchers, redemptions, payouts] = await Promise.all([
    supabase.from('merchants').select('id', { count: 'exact', head: true }),
    supabase.from('customer_vouchers').select('id', { count: 'exact', head: true }),
    supabase.from('redemption_history').select('id', { count: 'exact', head: true }),
    supabase.from('merchant_payouts').select('id', { count: 'exact', head: true }),
  ]);

  return {
    merchants: merchants.count ?? 0,
    vouchers: vouchers.count ?? 0,
    redemptions: redemptions.count ?? 0,
    payouts: payouts.count ?? 0,
  };
}

async function getRecentRedemptions() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('redemption_history')
    .select('id, merchant_name, amount, created_at')
    .order('created_at', { ascending: false })
    .limit(6);
  return data ?? [];
}

async function getRecentMerchants() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('merchants')
    .select('id, business_name, email, status, created_at')
    .order('created_at', { ascending: false })
    .limit(6);
  return data ?? [];
}

export default async function PortalDashboard() {
  const [counts, redemptions, merchants] = await Promise.all([
    getCounts(),
    getRecentRedemptions(),
    getRecentMerchants(),
  ]);

  const statCards = [
    { label: 'Merchants', value: counts.merchants },
    { label: 'Vouchers Issued', value: counts.vouchers },
    { label: 'Redemptions', value: counts.redemptions },
    { label: 'Payout Records', value: counts.payouts },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Portal overview</h1>
        <p className="mt-2 text-sm text-slate-500">
          Track platform health and jump into merchant, voucher, and redemption workflows.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent redemptions</h2>
          <div className="mt-4 space-y-3 text-sm">
            {redemptions.length === 0 && (
              <p className="text-slate-500">No redemptions recorded yet.</p>
            )}
            {redemptions.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-800">{item.merchant_name}</p>
                  <p className="text-xs text-slate-400">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                  </p>
                </div>
                <span className="font-semibold text-emerald-600">
                  R {Number(item.amount ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent merchants</h2>
          <div className="mt-4 space-y-3 text-sm">
            {merchants.length === 0 && (
              <p className="text-slate-500">No merchants onboarded yet.</p>
            )}
            {merchants.map((merchant) => (
              <div
                key={merchant.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-800">{merchant.business_name}</p>
                  <p className="text-xs text-slate-400">{merchant.email}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {merchant.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
