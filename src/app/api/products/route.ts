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
    const merchantId =
      searchParams.get('merchant_id')?.trim() || searchParams.get('merchantId')?.trim() || null;

    let query = resolveClient()
      .from('merchant_products')
      .select(
        'id,merchant_id,product_name,face_value,total_discount_pct,is_active,status,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,display_priority,created_at'
      )
      .order('display_priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (merchantId) {
      query = query.eq('merchant_id', merchantId);
    }

    const { data, error } = await query.limit(3000);
    if (error) throw error;

    const products = (data ?? [])
      .filter((product: any) => {
        const activeByFlag = product?.is_active === true;
        const activeByStatus = String(product?.status ?? '').toLowerCase() === 'active';
        return activeByFlag || activeByStatus || product?.status == null;
      })
      .map((product: any) => ({
        id: product.id,
        merchant_id: product.merchant_id,
        merchantId: product.merchant_id,
        product_name: product.product_name,
        productName: product.product_name,
        face_value: Number(product.face_value ?? 0),
        faceValue: Number(product.face_value ?? 0),
        total_discount_pct: Number(product.total_discount_pct ?? 0),
        totalDiscountPct: Number(product.total_discount_pct ?? 0),
        parent_brand: product.parent_brand ?? null,
        parentBrand: product.parent_brand ?? null,
        redemption_scope: product.redemption_scope ?? 'all_branches',
        valid_provinces: Array.isArray(product.valid_provinces) ? product.valid_provinces : [],
        valid_branch_ids: Array.isArray(product.valid_branch_ids) ? product.valid_branch_ids : [],
        is_active: Boolean(product.is_active ?? true),
        status: product.status ?? null,
      }));

    return NextResponse.json({
      success: true,
      products,
      data: products,
      count: products.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load products.' },
      { status: 500 }
    );
  }
}

