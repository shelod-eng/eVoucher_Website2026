import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import {
  approveMerchantManually,
  resendMerchantCredentials,
} from '@/server/utils/merchant-onboarding';
import { isAdminRole, resolveUserRole } from '@/server/utils/role';
import { MerchantDetailsProvider, ViewDetailsButton } from './ViewDetailsButton';

export const dynamic = 'force-dynamic';

async function requireAdminContext() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) throw new Error('Unauthorized');
  const { role } = await resolveUserRole(supabase, user);
  if (!isAdminRole(role)) throw new Error('Unauthorized');
  return { user, role };
}

async function getMerchants() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('merchants')
    .select('id, business_name, email, phone, status, created_at, approved_at')
    .order('created_at', { ascending: false });
  return data ?? [];
}

async function updateMerchantStatus(formData: FormData) {
  'use server';
  const merchantId = String(formData.get('merchantId') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();

  if (!merchantId || !status) return;

  await requireAdminContext();

  const admin = createAdminClient();
  const updatePayload: Record<string, any> = { status };
  if (status === 'approved' || status === 'active') {
    const existingReview = await admin
      .from('merchant_kyc_reviews')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('review_status', 'approved')
      .limit(1);
    if (!existingReview.error && (!existingReview.data || existingReview.data.length === 0)) {
      await admin.from('merchant_kyc_reviews').insert({
        merchant_id: merchantId,
        review_status: 'approved',
        reviewed_by: null,
        review_notes: 'Administrative status update from sponsor merchant management.',
      });
    }
    updatePayload.approved_at = new Date().toISOString();
    updatePayload.vetting_status = 'approved';
    updatePayload.email_verified = true;
    updatePayload.phone_verified = true;
  }
  await admin.from('merchants').update(updatePayload).eq('id', merchantId);
  revalidatePath('/portal/merchants');
}

async function approveMerchantAction(formData: FormData) {
  'use server';
  const merchantId = String(formData.get('merchantId') ?? '').trim();
  if (!merchantId) return;

  const { user, role } = await requireAdminContext();
  await approveMerchantManually({
    merchantId,
    actorId: user.id,
    actorRole: role,
  });
  revalidatePath('/portal/merchants');
  revalidatePath('/portal/dashboard');
  revalidatePath('/portal/reports');
  redirect('/portal/merchants?notice=merchant-approved');
}

async function resendCredentialsAction(formData: FormData) {
  'use server';
  const merchantId = String(formData.get('merchantId') ?? '').trim();
  if (!merchantId) return;

  const { user, role } = await requireAdminContext();
  await resendMerchantCredentials({
    merchantId,
    actorId: user.id,
    actorRole: role,
  });
  revalidatePath('/portal/merchants');
  redirect('/portal/merchants?notice=credentials-resent');
}

function formatNotice(value: string | undefined) {
  if (value === 'merchant-approved') {
    return 'Merchant approved using the full onboarding workflow. Credentials and approval notifications were attempted.';
  }
  if (value === 'credentials-resent') {
    return 'Merchant credentials were reissued through the onboarding engine.';
  }
  return null;
}

export default async function PortalMerchantsPage({
  searchParams,
}: {
  searchParams?: { notice?: string };
}) {
  const merchants = await getMerchants();
  const notice = formatNotice(searchParams?.notice);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Merchant management</h1>
        <p className="mt-2 text-sm text-slate-500">
          Review onboarding status, approve merchants with the real backend workflow, and reset or
          resend credentials when needed.
        </p>
        {notice && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <MerchantDetailsProvider>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-3 pr-4">Business</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Phone</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Workflow</th>
                  <th className="py-3 pr-4">Maintenance</th>
                  <th className="py-3 pr-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {merchants.map((merchant) => {
                  const status = String(merchant.status ?? '').toLowerCase();
                  const isApproved = status === 'approved' || status === 'active';

                  return (
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
                        {merchant.approved_at && (
                          <div className="mt-1 text-xs text-slate-400">
                            Approved {new Date(merchant.approved_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {isApproved ? (
                          <div className="text-xs text-emerald-700">Approval workflow completed</div>
                        ) : (
                          <form action={approveMerchantAction}>
                            <input type="hidden" name="merchantId" value={merchant.id} />
                            <button
                              type="submit"
                              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              Approve Merchant
                            </button>
                          </form>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap items-center gap-2">
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

                          <form action={resendCredentialsAction}>
                            <input type="hidden" name="merchantId" value={merchant.id} />
                            <button
                              type="submit"
                              className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                            >
                              Reset Credentials
                            </button>
                          </form>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <ViewDetailsButton merchantId={merchant.id} />
                      </td>
                    </tr>
                  );
                })}
                {merchants.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      No merchants found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </MerchantDetailsProvider>
      </section>
    </div>
  );
}
