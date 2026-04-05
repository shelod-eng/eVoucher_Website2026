import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';

function resolveClient() {
  try {
    return createAdminClient();
  } catch {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error('Missing Supabase environment variables.');
    }
    return createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchant_id')?.trim() || null;

    let query = resolveClient()
      .from('merchants')
      .select(
        'id,business_name,parent_brand,branch_name,status,business_type,city,province,default_total_discount_pct'
      )
      .order('business_name', { ascending: true });

    if (merchantId) {
      query = query.eq('id', merchantId);
    } else {
      query = query.in('status', ['approved', 'active']);
    }

    const { data, error } = await query.limit(1500);
    if (error) throw error;

    const merchants = (data ?? []).map((merchant: any) => ({
      id: merchant.id,
      business_name: merchant.business_name,
      businessName: merchant.business_name,
      parent_brand: merchant.parent_brand ?? merchant.business_name,
      parentBrand: merchant.parent_brand ?? merchant.business_name,
      branch_name: merchant.branch_name ?? merchant.business_name,
      branchName: merchant.branch_name ?? merchant.business_name,
      status: merchant.status,
      business_type: merchant.business_type ?? null,
      businessType: merchant.business_type ?? null,
      city: merchant.city ?? null,
      province: merchant.province ?? null,
      default_total_discount_pct: Number(merchant.default_total_discount_pct ?? 5),
      defaultTotalDiscountPct: Number(merchant.default_total_discount_pct ?? 5),
    }));

    return NextResponse.json({
      success: true,
      merchants,
      data: merchants,
      count: merchants.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load merchants.' },
      { status: 500 }
    );
  }
}

