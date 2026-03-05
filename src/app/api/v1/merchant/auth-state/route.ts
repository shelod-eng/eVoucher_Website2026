import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    if (role !== 'merchant') {
      return NextResponse.json({
        role,
        isMerchant: false,
        mustResetPassword: false,
        merchantId: null,
      });
    }

    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<{
      id: string;
      must_reset_password: boolean | null;
      status: string | null;
    }>(admin, user, 'id,must_reset_password,status');

    const mustResetPassword = Boolean(
      merchant?.must_reset_password ?? user.user_metadata?.must_change_password
    );

    return NextResponse.json(
      {
        role,
        isMerchant: true,
        mustResetPassword,
        merchantId: merchant?.id ?? null,
        merchantStatus: merchant?.status ?? null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to resolve merchant auth state.' },
      { status: 500 }
    );
  }
}

