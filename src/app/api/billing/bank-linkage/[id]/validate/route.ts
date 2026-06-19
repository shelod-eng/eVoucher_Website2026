import { createAdminClient } from '@/lib/supabase/admin';
import { decryptSensitive } from '@/lib/billing/encryption';
import { validateAccountAVS } from '@/lib/billing/avs-validator';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request, context: { params: { id: string } }) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const linkageId = String(context.params?.id ?? '').trim();
    if (!linkageId) return jsonNoStore({ error: 'Linkage id is required.' }, { status: 400 });

    const admin = createAdminClient();
    const { data: linkage, error } = await admin
      .from('billing_bank_linkages')
      .select('*')
      .eq('id', linkageId)
      .single();
    if (error || !linkage) {
      return jsonNoStore({ error: 'Bank linkage not found.' }, { status: 404 });
    }

    const accountNumber = decryptSensitive(String(linkage.account_number_enc));
    const result = await validateAccountAVS({
      bankName: String(linkage.merchant_bank_name ?? linkage.sponsor_bank_name ?? 'FNB'),
      accountNumber,
      branchCode: String(linkage.branch_code),
      accountHolderName: String(linkage.account_holder_name),
    });

    const { data: updated, error: updateError } = await admin
      .from('billing_bank_linkages')
      .update({
        verification_status: result.status,
        avs_match_code: result.matchCode,
        avs_notes: result.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkageId)
      .select(
        'id,merchant_id,sponsor_bank_name,merchant_bank_name,account_number_last4,account_holder_name,branch_code,account_type,verification_status,verification_method,avs_match_code,avs_notes,encryption_key_id,is_active,created_at,updated_at'
      )
      .single();
    if (updateError) throw updateError;

    return jsonNoStore({ success: true, data: updated });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to validate bank linkage.' },
      { status: 500 }
    );
  }
}
