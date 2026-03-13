import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';
import { getMerchantComplianceSnapshot } from '@/server/utils/compliance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isMerchantContext(
  role: string,
  merchant: { user_id?: string | null } | null,
  userId: string
) {
  if (role === 'merchant') return true;
  return Boolean(merchant?.user_id) && String(merchant?.user_id) === String(userId);
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<{
      id: string;
      user_id: string | null;
      status: string | null;
      business_name?: string | null;
    }>(admin, user, 'id,user_id,status,business_name');

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    }
    if (!isMerchantContext(role, merchant, user.id)) {
      return NextResponse.json(
        { error: 'Merchant-only endpoint.', code: 'merchant_only' },
        { status: 403 }
      );
    }

    const snapshot = await getMerchantComplianceSnapshot(admin, merchant.id, merchant.status);
    return NextResponse.json(
      {
        merchantId: merchant.id,
        merchantName: merchant.business_name ?? null,
        merchantStatus: merchant.status,
        ...snapshot,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load compliance status.' },
      { status: 500 }
    );
  }
}
