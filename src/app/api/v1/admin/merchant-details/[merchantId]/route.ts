import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/v1/admin/merchant-details/[merchantId]
 * Returns the full merchant profile captured during onboarding.
 * Role-protected — admin only.
 *
 * This queries columns that exist in the base merchants table
 * (from the 20260213 migration + the 20260224 onboarding migration).
 * No later migration is required.
 */
async function fetchMerchantDetails(merchantId: string): Promise<{
  data: Record<string, unknown> | null;
  error: string | null;
}> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('merchants')
    .select(
      [
        'id',
        'business_name',
        'contact_name',
        'email',
        'phone',
        'parent_brand',
        'branch_name',
        'merchant_type',
        'business_type',
        'status',
        'vetting_status',
        'physical_address',
        'city',
        'province',
        'location_lat',
        'location_lng',
        'registration_number',
        'tax_number',
        'pharmacy_license_number',
        'responsible_pharmacist_name',
        'owner_id_number',
        'proof_of_premises',
        'bank_name',
        'account_number',
        'branch_code',
        'account_holder_name',
        'default_total_discount_pct',
        'charity_donation_amount',
        'onboarding_fee_paid',
        'email_verified',
        'phone_verified',
        'created_at',
        'approved_at',
        'onboarding_completed_at',
      ].join(', ')
    )
    .eq('id', merchantId)
    .maybeSingle();

  if (error) {
    // If the error is a missing column, tell us which one
    const msg = String((error as any)?.message ?? '').toLowerCase();
    // Fallback: try a minimal query (columns guaranteed from original migration)
    if (msg.includes('does not exist') || msg.includes('column') || msg.includes('schema')) {
      const { data: minimal, error: minimalError } = await admin
        .from('merchants')
        .select('id, business_name, contact_name, email, phone, status, created_at')
        .eq('id', merchantId)
        .maybeSingle();
      if (minimalError) {
        return { data: null, error: String((minimalError as any)?.message ?? 'Unknown error') };
      }
      if (!minimal) {
        return { data: null, error: 'Merchant not found.' };
      }
      return {
        data: { ...(minimal as unknown as Record<string, unknown>), _missingColumns: true },
        error: null,
      };
    }
    return { data: null, error: String((error as any)?.message ?? 'Unknown error') };
  }

  if (!data) {
    return { data: null, error: 'Merchant not found.' };
  }

  return { data: data as unknown as Record<string, unknown>, error: null };
}

export async function GET(_request: Request, { params }: { params: { merchantId: string } }) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const { merchantId } = params;
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
    }

    const { data: merchant, error } = await fetchMerchantDetails(merchantId);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });
    }

    return NextResponse.json(merchant);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch merchant details' },
      { status: 500 }
    );
  }
}
