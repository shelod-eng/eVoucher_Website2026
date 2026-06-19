import { createAdminClient } from '@/lib/supabase/admin';
import { encryptSensitive } from '@/lib/billing/encryption';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const merchantId = String(searchParams.get('merchantId') ?? '').trim();

    const admin = createAdminClient();
    let query = admin
      .from('billing_bank_linkages')
      .select(
        'id,merchant_id,sponsor_bank_name,merchant_bank_name,account_number_last4,account_holder_name,branch_code,account_type,verification_status,verification_method,avs_match_code,avs_notes,encryption_key_id,is_active,created_at,updated_at'
      )
      .order('created_at', { ascending: false })
      .limit(200);

    if (merchantId) query = query.eq('merchant_id', merchantId);
    const { data, error } = await query;
    if (error) throw error;

    return jsonNoStore({ success: true, data: data ?? [] });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to list bank linkages.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { allowed, user } = await requirePortalUser(request, ['admin', 'finance_approver']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const merchantId = String(body?.merchantId ?? '').trim();
    const sponsorBankName = String(body?.sponsorBankName ?? 'FNB').trim() || 'FNB';
    const merchantBankName = body?.merchantBankName ? String(body.merchantBankName).trim() : null;
    const accountNumber = String(body?.accountNumber ?? '').trim();
    const accountHolderName = String(body?.accountHolderName ?? '').trim();
    const branchCode = String(body?.branchCode ?? '').trim();
    const accountType = String(body?.accountType ?? '').trim();
    const verificationMethod = String(body?.verificationMethod ?? 'avs').trim() || 'avs';

    if (!merchantId || !accountNumber || !accountHolderName || !branchCode || !accountType) {
      return jsonNoStore(
        {
          error:
            'merchantId, accountNumber, accountHolderName, branchCode, and accountType are required.',
        },
        { status: 400 }
      );
    }

    const last4 = accountNumber.slice(-4).padStart(4, '0');
    const { ciphertext, keyId } = encryptSensitive(accountNumber);

    const admin = createAdminClient();

    // Deactivate existing active linkages for this merchant (keep history).
    await admin
      .from('billing_bank_linkages')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('merchant_id', merchantId)
      .eq('is_active', true);

    const { data, error } = await admin
      .from('billing_bank_linkages')
      .insert({
        merchant_id: merchantId,
        sponsor_bank_name: sponsorBankName,
        merchant_bank_name: merchantBankName,
        account_number_enc: ciphertext,
        account_number_last4: last4,
        account_holder_name: accountHolderName,
        branch_code: branchCode,
        account_type: accountType,
        verification_status: 'pending',
        verification_method: verificationMethod,
        encryption_key_id: keyId,
        is_active: true,
        created_by: user?.id ?? null,
      })
      .select(
        'id,merchant_id,sponsor_bank_name,merchant_bank_name,account_number_last4,account_holder_name,branch_code,account_type,verification_status,verification_method,avs_match_code,avs_notes,encryption_key_id,is_active,created_at,updated_at'
      )
      .single();

    if (error) throw error;
    return jsonNoStore({ success: true, data });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to create bank linkage.' },
      { status: 500 }
    );
  }
}
