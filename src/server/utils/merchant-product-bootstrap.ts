import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';

type MerchantBootstrapRecord = {
  id: string;
  business_name: string;
  parent_brand?: string | null;
  business_type?: string | null;
  default_total_discount_pct?: number | null;
  merchant_type?: 'chain' | 'private' | null;
};

type StarterTemplate = {
  productName: string;
  faceValue: number;
};

function normalizeBusinessType(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function resolveStarterTemplates(merchant: MerchantBootstrapRecord): StarterTemplate[] {
  const businessType = normalizeBusinessType(merchant.business_type);
  const merchantName = String(merchant.business_name ?? 'Merchant').trim();

  if (businessType === 'pharmacy') {
    return [
      { productName: `${merchantName} Essentials R100`, faceValue: 100 },
      { productName: `${merchantName} Wellness R250`, faceValue: 250 },
      { productName: `${merchantName} Family Care R500`, faceValue: 500 },
    ];
  }

  if (businessType === 'restaurant') {
    return [
      { productName: `${merchantName} Meal Voucher R100`, faceValue: 100 },
      { productName: `${merchantName} Lunch Voucher R200`, faceValue: 200 },
      { productName: `${merchantName} Family Meal R500`, faceValue: 500 },
    ];
  }

  return [
    { productName: `${merchantName} Voucher R100`, faceValue: 100 },
    { productName: `${merchantName} Voucher R200`, faceValue: 200 },
    { productName: `${merchantName} Voucher R500`, faceValue: 500 },
    { productName: `${merchantName} Voucher R1000`, faceValue: 1000 },
  ];
}

export async function ensureMerchantStarterProducts(admin: any, merchant: MerchantBootstrapRecord) {
  const { count, error: countError } = await admin
    .from('merchant_products')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchant.id);
  if (countError) throw countError;
  if (Number(count ?? 0) > 0) {
    return { inserted: 0, skipped: true as const };
  }

  const templates = resolveStarterTemplates(merchant);
  const discountPct = Number(merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT);
  const parentBrand = String(merchant.parent_brand ?? merchant.business_name ?? '').trim() || null;

  const rows = templates.map((template) => {
    const pricing = calculateDiscountPricing(template.faceValue, discountPct);
    return {
      merchant_id: merchant.id,
      product_name: template.productName,
      parent_brand: parentBrand,
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
    };
  });

  const { error: insertError } = await admin.from('merchant_products').insert(rows);
  if (insertError) throw insertError;
  return { inserted: rows.length, skipped: false as const };
}
