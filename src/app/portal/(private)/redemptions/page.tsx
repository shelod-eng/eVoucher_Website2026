import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole, isAdminRole } from '@/server/utils/role';

export const dynamic = 'force-dynamic';

async function redeemVoucher(formData: FormData) {
  'use server';
  const voucherCode = String(formData.get('voucherCode') ?? '')
    .trim()
    .toUpperCase();
  const amount = Number(formData.get('amount') ?? 0);

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) throw new Error('Unauthorized');
  const { role } = await resolveUserRole(supabase, user);
  if (!isAdminRole(role)) throw new Error('Unauthorized');

  if (!voucherCode || amount <= 0) {
    redirect('/portal/redemptions?error=missing');
  }

  const admin = createAdminClient();
  const { data: voucher } = await admin
    .from('customer_vouchers')
    .select('id, customer_id, merchant_name, current_balance, is_active')
    .eq('voucher_code', voucherCode)
    .maybeSingle();

  if (!voucher?.id || !voucher.is_active) {
    redirect('/portal/redemptions?error=notfound');
  }

  if (Number(voucher.current_balance) < amount) {
    redirect('/portal/redemptions?error=balance');
  }

  const newBalance = Number(voucher.current_balance) - amount;
  await admin
    .from('customer_vouchers')
    .update({ current_balance: newBalance, is_active: newBalance > 0 })
    .eq('id', voucher.id);

  await admin.from('redemption_history').insert({
    customer_id: voucher.customer_id,
    voucher_id: voucher.id,
    merchant_name: voucher.merchant_name,
    amount,
    transaction_type: 'redemption',
  });

  revalidatePath('/portal/redemptions');
  redirect('/portal/redemptions?success=1');
}

async function getRedemptions() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('redemption_history')
    .select('id, merchant_name, amount, created_at')
    .order('created_at', { ascending: false })
    .limit(30);
  return data ?? [];
}

export default async function PortalRedemptionsPage({
  searchParams,
}: {
  searchParams?: { error?: string; success?: string };
}) {
  const redemptions = await getRedemptions();
  const error = searchParams?.error;
  const success = searchParams?.success;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Voucher redemption</h1>
        <p className="mt-2 text-sm text-slate-500">
          Redeem voucher balances and log transactions instantly.
        </p>

        {success && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Redemption recorded successfully.
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {error === 'missing' && 'Please provide voucher code and amount.'}
            {error === 'notfound' && 'Voucher not found or inactive.'}
            {error === 'balance' && 'Redemption amount exceeds current balance.'}
          </div>
        )}

        <form action={redeemVoucher} className="mt-6 grid gap-4 md:grid-cols-[2fr,1fr,auto]">
          <div>
            <label className="text-xs font-semibold text-slate-500">Voucher Code *</label>
            <input
              name="voucherCode"
              type="text"
              required
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="EV-XXXXXX"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Amount (ZAR) *</label>
            <input
              name="amount"
              type="number"
              min="1"
              step="0.01"
              required
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="150"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Redeem
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent redemptions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 pr-4">Merchant</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {redemptions.map((row) => (
                <tr key={row.id} className="text-slate-700">
                  <td className="py-2 pr-4 font-semibold text-slate-900">{row.merchant_name}</td>
                  <td className="py-2 pr-4">R {Number(row.amount).toFixed(2)}</td>
                  <td className="py-2 pr-4 text-slate-500">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {redemptions.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-500">
                    No redemption activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
