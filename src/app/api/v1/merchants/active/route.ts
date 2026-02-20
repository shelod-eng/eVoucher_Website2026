import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';

function isMissingAdminEnvError(error: any) {
  return String(error?.message ?? '').includes(
    'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL'
  );
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to buy vouchers.',
          code: 'unauthenticated',
          diagnostics: { isAuthenticated: false },
        },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return NextResponse.json(
        {
          error: 'Only signed-in consumers can buy vouchers.',
          code: 'consumer_only_purchase',
          diagnostics: { isAuthenticated: true, role },
        },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('merchants')
      .select('id,business_name,email,status,default_total_discount_pct')
      .in('status', ['active', 'approved'])
      .order('business_name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      merchants: (data ?? []).map((merchant) => ({
        id: merchant.id,
        businessName: merchant.business_name,
        email: merchant.email,
        status: merchant.status,
        defaultTotalDiscountPct: Number(merchant.default_total_discount_pct ?? 5),
      })),
      diagnostics: {
        isAuthenticated: true,
        role,
        hasAdminEnv: true,
        activeMerchantCount: data?.length ?? 0,
      },
      blockReason: (data?.length ?? 0) === 0 ? 'no_active_merchants' : null,
    });
  } catch (error: any) {
    if (isMissingAdminEnvError(error)) {
      return NextResponse.json(
        {
          error:
            'Server is missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. Add them to load active merchants.',
          code: 'missing_admin_env',
          diagnostics: {
            isAuthenticated: true,
            hasAdminEnv: false,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || 'Failed to fetch active merchants.',
        code: 'merchants_load_failed',
      },
      { status: 500 }
    );
  }
}
