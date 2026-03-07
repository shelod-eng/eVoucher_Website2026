import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';
import { reconcileMerchantResetState } from '@/server/utils/merchant-onboarding';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    const admin = createAdminClient();
    let merchant:
      | {
          id: string;
          user_id: string | null;
          must_reset_password: boolean | null;
          status: string | null;
        }
      | null = null;
    try {
      merchant = await resolveMerchantForUser<{
        id: string;
        user_id: string | null;
        must_reset_password: boolean | null;
        status: string | null;
      }>(admin, user, 'id,user_id,must_reset_password,status');
    } catch (merchantResolveError: any) {
      console.warn(
        '[merchant-auth-state][resolve-merchant][warn]',
        merchantResolveError?.message || merchantResolveError
      );
    }

    const isMerchant =
      role === 'merchant' ||
      (Boolean(merchant?.user_id) && String(merchant?.user_id) === String(user.id));
    if (!isMerchant) {
      return NextResponse.json({
        role,
        isMerchant: false,
        mustResetPassword: false,
        merchantId: null,
      });
    }

    let effectiveMerchant = merchant;
    if (Boolean(effectiveMerchant?.must_reset_password) || Boolean(user.user_metadata?.must_change_password)) {
      try {
        await reconcileMerchantResetState(user.id);
        try {
          effectiveMerchant = await resolveMerchantForUser<{
            id: string;
            user_id: string | null;
            must_reset_password: boolean | null;
            status: string | null;
          }>(admin, user, 'id,user_id,must_reset_password,status');
        } catch (reloadError: any) {
          console.warn(
            '[merchant-auth-state][reload-merchant][warn]',
            reloadError?.message || reloadError
          );
        }
      } catch (reconcileError: any) {
        console.warn(
          '[merchant-auth-state][reconcile-reset][warn]',
          reconcileError?.message || reconcileError
        );
      }
    }

    // Keep strict behavior for safety/tests: if auth metadata still requires reset, enforce it.
    // Merchant row is also considered, but metadata remains authoritative until refreshed.
    const mustResetPassword =
      Boolean(effectiveMerchant?.must_reset_password) || Boolean(user.user_metadata?.must_change_password);

    return NextResponse.json(
      {
        role,
        isMerchant,
        mustResetPassword,
        merchantId: effectiveMerchant?.id ?? null,
        merchantStatus: effectiveMerchant?.status ?? null,
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
