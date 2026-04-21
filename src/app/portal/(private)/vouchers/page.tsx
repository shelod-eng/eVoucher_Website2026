import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole, isAdminRole } from '@/server/utils/role';

export const dynamic = 'force-dynamic';

function generateVoucherCode() {
  return `EV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function createVoucher(formData: FormData) {
  'use server';
  const email = String(formData.get('customerEmail') ?? '').trim().toLowerCase();
  const merchantName = String(formData.get('merchantName') ?? '').trim();
  const faceValue = Number(formData.get('faceValue') ?? 0);
  const discountPercent = Number(formData.get('discountPercent') ?? 0);
  const expiresAt = String(formData.get('expiresAt') ?? '').trim();

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) throw new Error('Unauthorized');
  const { role } = await resolveUserRole(supabase, user);
  if (!isAdminRole(role)) throw new Error('Unauthorized');

  if (!email || !merchantName || faceValue <= 0) {
    redirect('/portal/vouchers?error=missing');
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!profile?.id) {
    redirect('/portal/vouchers?error=customer');
  }

  const voucherCode = generateVoucherCode();
  const { error } = await admin.from('customer_vouchers').insert({
    customer_id: profile.id,
    merchant_name: merchantName,
    voucher_code: voucherCode,
    face_value: faceValue,
    discount_percent: Number.isFinite(discountPercent) ? discountPercent : 0,
    current_balance: faceValue,
    is_active: true,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
  });

  if (error) {
    redirect('/portal/vouchers?error=save');
  }

  revalidatePath('/portal/vouchers');
  redirect(`/portal/vouchers?created=${voucherCode}`);
}

async function getVouchers() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('customer_vouchers')
    .select('id, voucher_code, merchant_name, face_value, current_balance, is_active, issued_at')
    .order('issued_at', { ascending: false })
    .limit(25);
  return data ?? [];
}

export default async function PortalVouchersPage({
  searchParams,
}: {
  searchParams?: { created?: string; error?: string };
}) {
  const vouchers = await getVouchers();
  const createdCode = searchParams?.created;
  const error = searchParams?.error;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Voucher creation</h1>
        <p className="mt-2 text-sm text-slate-500">
          Issue vouchers to customers and keep balances in sync.
        </p>
        {createdCode && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Voucher created: <span className="font-semibold">{createdCode}</span>
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {error === 'customer' && 'Customer not found for that email.'}
            {error === 'save' && 'Failed to save voucher. Please retry.'}
            {error === 'missing' && 'Please complete all required fields.'}
          </div>
        )}

        <form action={createVoucher} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-500">Customer Email *</label>
            <input
              name="customerEmail"
              type="email"
              required
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="customer@email.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Merchant Name *</label>
            <input
              name="merchantName"
              type="text"
              required
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Merchant name"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Face Value (ZAR) *</label>
            <input
              name="faceValue"
              type="number"
              min="1"
              step="0.01"
              required
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Discount %</label>
            <input
              name="discountPercent"
              type="number"
              min="0"
              step="0.01"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="5"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Expiry Date</label>
            <input
              name="expiresAt"
              type="date"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
            >
              Create Voucher
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent vouchers</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Merchant</th>
                <th className="py-2 pr-4">Face Value</th>
                <th className="py-2 pr-4">Balance</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vouchers.map((voucher) => (
                <tr key={voucher.id} className="text-slate-700">
                  <td className="py-2 pr-4 font-semibold text-slate-900">{voucher.voucher_code}</td>
                  <td className="py-2 pr-4">{voucher.merchant_name}</td>
                  <td className="py-2 pr-4">R {Number(voucher.face_value).toFixed(2)}</td>
                  <td className="py-2 pr-4">R {Number(voucher.current_balance).toFixed(2)}</td>
                  <td className="py-2 pr-4">
                    {voucher.is_active ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                        Closed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No vouchers issued yet.
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
