import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';

export async function GET(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId')?.trim() || null;
    const query = searchParams.get('q')?.trim() || '';

    const admin = createAdminClient();

    if (merchantId) {
      const { data: merchant, error: merchantError } = await admin
        .from('merchants')
        .select('id,business_name,email,status,default_total_discount_pct')
        .eq('id', merchantId)
        .maybeSingle();

      if (merchantError) throw merchantError;
      if (!merchant) {
        return NextResponse.json({
          merchants: [],
          products: [],
          ussdAccessCode: '*120*384#',
          mode: 'merchant_products',
        });
      }

      const { data: productRows, error: productsError } = await admin
        .from('merchant_products')
        .select('id,merchant_id,product_name,face_value,total_discount_pct,is_active,created_at')
        .eq('merchant_id', merchant.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(120);

      if (productsError) throw productsError;

      const products = (productRows ?? []).map((product) => {
        const pricing = calculateDiscountPricing(
          Number(product.face_value),
          Number(product.total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT)
        );
        return {
          id: product.id,
          merchant_id: merchant.id,
          merchant_name: merchant.business_name,
          merchant_email: merchant.email,
          product_name: product.product_name,
          face_value: pricing.faceValue,
          total_discount_pct: pricing.totalDiscountPct,
          consumer_benefit_pct: pricing.consumerBenefitPct,
          evoucher_benefit_pct: pricing.evoucherBenefitPct,
          total_discount_amount: pricing.totalDiscountAmount,
          consumer_benefit_amount: pricing.consumerBenefitAmount,
          evoucher_benefit_amount: pricing.evoucherBenefitAmount,
          consumer_price: pricing.consumerPrice,
          merchant_receivable_after_total_discount: pricing.merchantReceivableAfterTotalDiscount,
          merchant_receivable_after_evoucher_benefit: pricing.merchantReceivableAfterEvoucherBenefit,
          is_active: true,
          created_at: product.created_at,
        };
      });

      const averageDiscountPct =
        products.length > 0
          ? products.reduce((total, product) => total + Number(product.total_discount_pct), 0) / products.length
          : Number(merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT);

      return NextResponse.json({
        merchants: [
          {
            id: merchant.id,
            businessName: merchant.business_name,
            email: merchant.email,
            status: merchant.status,
            defaultTotalDiscountPct: Number(
              merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT
            ),
            productCount: products.length,
            averageDiscountPct: Number(averageDiscountPct.toFixed(2)),
          },
        ],
        products,
        ussdAccessCode: '*120*384#',
        mode: 'merchant_products',
      });
    }

    const { data: activeProducts, error: activeProductsError } = await admin
      .from('merchant_products')
      .select('merchant_id,total_discount_pct')
      .eq('is_active', true)
      .limit(5000);

    if (activeProductsError) throw activeProductsError;

    const merchantStats = new Map<string, { count: number; totalDiscount: number }>();
    for (const product of activeProducts ?? []) {
      const current = merchantStats.get(product.merchant_id) ?? { count: 0, totalDiscount: 0 };
      current.count += 1;
      current.totalDiscount += Number(product.total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT);
      merchantStats.set(product.merchant_id, current);
    }

    const activeMerchantIds = Array.from(merchantStats.keys());
    if (activeMerchantIds.length === 0) {
      return NextResponse.json({
        merchants: [],
        products: [],
        ussdAccessCode: '*120*384#',
        mode: 'merchant_directory',
      });
    }

    let merchantsQuery = admin
      .from('merchants')
      .select('id,business_name,email,status,default_total_discount_pct')
      .in('id', activeMerchantIds)
      .order('business_name', { ascending: true })
      .limit(120);

    if (query) {
      merchantsQuery = merchantsQuery.ilike('business_name', `%${query}%`);
    }

    const { data: merchants, error: merchantsError } = await merchantsQuery;
    if (merchantsError) throw merchantsError;

    const merchantSummaries = (merchants ?? []).map((merchant) => {
      const stats = merchantStats.get(merchant.id) ?? { count: 0, totalDiscount: 0 };
      const averageDiscountPct =
        stats.count > 0
          ? Number((stats.totalDiscount / stats.count).toFixed(2))
          : Number(merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT);
      return {
        id: merchant.id,
        businessName: merchant.business_name,
        email: merchant.email,
        status: merchant.status,
        defaultTotalDiscountPct: Number(merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT),
        productCount: stats.count,
        averageDiscountPct,
      };
    });

    return NextResponse.json({
      merchants: merchantSummaries,
      products: [],
      ussdAccessCode: '*120*384#',
      mode: 'merchant_directory',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load shop catalog.' },
      { status: 500 }
    );
  }
}
