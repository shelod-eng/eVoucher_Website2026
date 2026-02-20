import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';

const STARTER_FACE_VALUES = [100, 200, 500];

export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const [merchantsRes, productsRes] = await Promise.all([
      admin
        .from('merchants')
        .select('id,business_name,email,status,default_total_discount_pct')
        .in('status', ['active', 'approved', 'pending'])
        .order('business_name', { ascending: true }),
      admin
        .from('merchant_products')
        .select(
          'id,merchant_id,product_name,face_value,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,total_discount_amount,consumer_benefit_amount,evoucher_benefit_amount,consumer_price,merchant_receivable_after_total_discount,merchant_receivable_after_evoucher_benefit,is_active,created_at'
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ]);

    if (merchantsRes.error) throw merchantsRes.error;
    if (productsRes.error) throw productsRes.error;

    const merchants = merchantsRes.data ?? [];
    const products = productsRes.data ?? [];
    const merchantsById = new Map(merchants.map((merchant) => [merchant.id, merchant]));

    const catalogProducts = products
      .filter((product) => merchantsById.has(product.merchant_id))
      .map((product) => {
        const merchant = merchantsById.get(product.merchant_id);
        return {
          ...product,
          merchant_name: merchant?.business_name ?? 'Unknown Merchant',
          merchant_email: merchant?.email ?? '',
          is_fallback: false,
        };
      });

    const fallbackProducts = merchants.flatMap((merchant) => {
      const merchantHasProducts = catalogProducts.some(
        (product) => product.merchant_id === merchant.id
      );
      if (merchantHasProducts) return [];

      const totalDiscountPct = Number(
        merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT
      );

      return STARTER_FACE_VALUES.map((faceValue) => {
        const pricing = calculateDiscountPricing(faceValue, totalDiscountPct);
        return {
          id: `starter-${merchant.id}-${faceValue}`,
          merchant_id: merchant.id,
          merchant_name: merchant.business_name,
          merchant_email: merchant.email,
          product_name: `${merchant.business_name} Voucher R${faceValue}`,
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
          created_at: new Date().toISOString(),
          is_fallback: true,
        };
      });
    });

    const allCatalogProducts = [...catalogProducts, ...fallbackProducts];

    const merchantSummaries = merchants.map((merchant) => {
      const merchantProducts = allCatalogProducts.filter((product) => product.merchant_id === merchant.id);
      const avgDiscount =
        merchantProducts.length > 0
          ? merchantProducts.reduce(
              (total, product) => total + Number(product.total_discount_pct ?? 0),
              0
            ) / merchantProducts.length
          : Number(merchant.default_total_discount_pct ?? 5);

      return {
        id: merchant.id,
        businessName: merchant.business_name,
        email: merchant.email,
        status: merchant.status,
        defaultTotalDiscountPct: Number(merchant.default_total_discount_pct ?? 5),
        productCount: merchantProducts.length,
        averageDiscountPct: Number(avgDiscount.toFixed(2)),
      };
    });

    return NextResponse.json({
      merchants: merchantSummaries,
      products: allCatalogProducts,
      ussdAccessCode: '*120*384#',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load shop catalog.' },
      { status: 500 }
    );
  }
}
