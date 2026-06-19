import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { allowed } = await requirePortalUser(request, ['admin']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const linkageId = String(context.params?.id ?? '').trim();
    if (!linkageId) return jsonNoStore({ error: 'Linkage id is required.' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const isActive = body?.isActive === undefined ? undefined : Boolean(body.isActive);
    const verificationStatus = body?.verificationStatus
      ? String(body.verificationStatus).trim()
      : undefined;

    if (isActive === undefined && !verificationStatus) {
      return jsonNoStore({ error: 'No fields to update.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (isActive !== undefined) update.is_active = isActive;
    if (verificationStatus) update.verification_status = verificationStatus;

    const { data, error } = await admin
      .from('billing_bank_linkages')
      .update(update)
      .eq('id', linkageId)
      .select(
        'id,merchant_id,sponsor_bank_name,merchant_bank_name,account_number_last4,account_holder_name,branch_code,account_type,verification_status,verification_method,avs_match_code,avs_notes,encryption_key_id,is_active,created_at,updated_at'
      )
      .single();
    if (error) throw error;

    return jsonNoStore({ success: true, data });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to update bank linkage.' },
      { status: 500 }
    );
  }
}
