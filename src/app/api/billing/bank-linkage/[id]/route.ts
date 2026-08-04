import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { allowed, user } = await requirePortalUser(request, ['admin', 'finance_approver']);
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

    // Retrieve existing linkage to check creator
    const { data: existing, error: fetchError } = await admin
      .from('billing_bank_linkages')
      .select('created_by, verification_status')
      .eq('id', linkageId)
      .maybeSingle();

    if (fetchError || !existing) {
      return jsonNoStore({ error: 'Bank linkage not found.' }, { status: 404 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (isActive !== undefined) update.is_active = isActive;
    if (verificationStatus) update.verification_status = verificationStatus;

    // Enforce dual-control check for activation or approval
    if (verificationStatus === 'approved' || isActive === true) {
      if (user && existing.created_by === user.id) {
        return jsonNoStore(
          {
            error:
              'Dual-control violation: You cannot approve or activate a bank linkage that you created.',
          },
          { status: 403 }
        );
      }
      update.approved_by = user?.id ?? null;
      update.approved_at = new Date().toISOString();
    }

    const { data, error } = await admin
      .from('billing_bank_linkages')
      .update(update)
      .eq('id', linkageId)
      .select(
        'id,merchant_id,sponsor_bank_name,merchant_bank_name,account_number_last4,account_holder_name,branch_code,account_type,verification_status,verification_method,avs_match_code,avs_notes,encryption_key_id,is_active,created_at,updated_at,created_by,approved_by,approved_at'
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
