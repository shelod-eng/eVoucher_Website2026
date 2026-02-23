import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';
import { ensureDemoMerchantsSeeded } from '@/server/utils/demo-merchant-seed';

function resolveDataClient(supabase: any) {
  try {
    return { client: createAdminClient(), hasAdminEnv: true };
  } catch {
    return { client: supabase, hasAdminEnv: false };
  }
}

export async function GET(request: Request) {
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

    try {
      const admin = createAdminClient();
      await ensureDemoMerchantsSeeded(admin);
    } catch {
      // Continue without demo seeding when admin env is not available.
    }

    const { client, hasAdminEnv } = resolveDataClient(supabase);
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId')?.trim() || null;
    let activeQuery = client
      .from('merchants')
      .select(
        'id,business_name,email,status,default_total_discount_pct,parent_brand,branch_name,city,province'
      )
      .in('status', ['approved', 'active'])
      .order('business_name', { ascending: true });
    if (merchantId) {
      activeQuery = activeQuery.eq('id', merchantId);
    }
    const { data: activeRows, error: activeError } = await activeQuery;

    if (activeError) throw activeError;

    let rows = activeRows ?? [];
    let usedFallbackStatuses = false;
    if (rows.length === 0) {
      let fallbackQuery = client
        .from('merchants')
        .select(
          'id,business_name,email,status,default_total_discount_pct,parent_brand,branch_name,city,province'
        )
        .order('business_name', { ascending: true })
        .limit(120);
      if (merchantId) {
        fallbackQuery = fallbackQuery.eq('id', merchantId);
      }
      const { data: fallbackRows, error: fallbackError } = await fallbackQuery;
      if (fallbackError) throw fallbackError;
      rows = fallbackRows ?? [];
      usedFallbackStatuses = rows.length > 0;
    }

    return NextResponse.json({
      merchants: rows.map((merchant: any) => ({
        id: merchant.id,
        businessName: merchant.business_name,
        email: merchant.email,
        status: merchant.status,
        defaultTotalDiscountPct: Number(merchant.default_total_discount_pct ?? 5),
        parentBrand: merchant.parent_brand ?? merchant.business_name,
        branchName: merchant.branch_name ?? merchant.business_name,
        city: merchant.city ?? null,
        province: merchant.province ?? null,
      })),
      diagnostics: {
        isAuthenticated: true,
        role,
        hasAdminEnv,
        activeMerchantCount: activeRows?.length ?? 0,
        totalMerchantCount: rows.length,
        usedFallbackStatuses,
      },
      blockReason: rows.length === 0 ? 'no_active_merchants' : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to fetch active merchants.',
        code: 'merchants_load_failed',
      },
      { status: 500 }
    );
  }
}
