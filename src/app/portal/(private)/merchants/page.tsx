import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole, isAdminRole } from '@/server/utils/role';

export const dynamic = 'force-dynamic';

async function getMerchants() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('merchants')
    .select('id, business_name, email, phone, status, created_at')
    .order('created_at', { ascending: false });
  return data ?? [];
}

async function updateMerchantStatus(formData: FormData) {
  'use server';
  const merchantId = String(formData.get('merchantId') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();

  if (!merchantId || !status) return;

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) throw new Error('Unauthorized');
  const { role } = await resolveUserRole(supabase, user);
  if (!isAdminRole(role)) throw new Error('Unauthorized');

  const admin = createAdminClient();
  const updatePayload: Record<string, any> = { status };
  if (status === 'approved' || status === 'active') {
    updatePayload.approved_at = new Date().toISOString();
  }
  await admin.from('merchants').update(updatePayload).eq('id', merchantId);
  revalidatePath('/portal/merchants');
}

export default async function PortalMerchantsPage() {
  const merchants = await getMerchants();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Merchant management</h1>
        <p className="mt-2 text-sm text-slate-500">
          Review onboarding status and keep merchant records updated.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-3 pr-4">Business</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Phone</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {merchants.map((merchant) => (
                <tr key={merchant.id} className="text-slate-700">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-slate-900">{merchant.business_name}</div>
                    <div className="text-xs text-slate-400">
                      {merchant.created_at
                        ? new Date(merchant.created_at).toLocaleDateString()
                        : '—'}
                    </div>
                  </td>
                  <td className="py-3 pr-4">{merchant.email}</td>
                  <td className="py-3 pr-4">{merchant.phone}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {merchant.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <form action={updateMerchantStatus} className="flex items-center gap-2">
                      <input type="hidden" name="merchantId" value={merchant.id} />
                      <select
                        name="status"
                        defaultValue={merchant.status}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                      >
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="active">active</option>
                        <option value="suspended">suspended</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Update
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {merchants.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No merchants found yet.
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
