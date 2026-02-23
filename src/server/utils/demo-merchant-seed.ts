import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';
import { BrandKey, getBrandByKey } from '@/lib/merchant-brand-catalog';

type DemoMerchantSeed = {
  brandKey: BrandKey;
  businessName: string;
  email: string;
  phone: string;
  businessType: string;
};

const DEMO_MERCHANTS: DemoMerchantSeed[] = [
  {
    brandKey: 'boxer',
    businessName: 'Boxer',
    email: 'demo-boxer@evoucher.co.za',
    phone: '0101000001',
    businessType: 'Supermarket',
  },
  {
    brandKey: 'shoprite',
    businessName: 'Shoprite',
    email: 'demo-shoprite@evoucher.co.za',
    phone: '0101000002',
    businessType: 'Supermarket',
  },
  {
    brandKey: 'pep',
    businessName: 'Pep',
    email: 'demo-pep@evoucher.co.za',
    phone: '0101000003',
    businessType: 'Retail',
  },
  {
    brandKey: 'game',
    businessName: 'Game',
    email: 'demo-game@evoucher.co.za',
    phone: '0101000004',
    businessType: 'Retail',
  },
  {
    brandKey: 'usave',
    businessName: 'uSave',
    email: 'demo-usave@evoucher.co.za',
    phone: '0101000005',
    businessType: 'Supermarket',
  },
  {
    brandKey: 'checkers',
    businessName: 'Checkers',
    email: 'demo-checkers@evoucher.co.za',
    phone: '0101000006',
    businessType: 'Supermarket',
  },
  {
    brandKey: 'engen',
    businessName: 'Engen',
    email: 'demo-engen@evoucher.co.za',
    phone: '0101000007',
    businessType: 'Fuel',
  },
  {
    brandKey: 'picknpay',
    businessName: 'Pick n Pay',
    email: 'demo-picknpay@evoucher.co.za',
    phone: '0101000008',
    businessType: 'Supermarket',
  },
  {
    brandKey: 'woolworths',
    businessName: 'Woolworths',
    email: 'demo-woolworths@evoucher.co.za',
    phone: '0101000009',
    businessType: 'Supermarket',
  },
  {
    brandKey: 'mrprice',
    businessName: 'Mr Price',
    email: 'demo-mrprice@evoucher.co.za',
    phone: '0101000010',
    businessType: 'Retail',
  },
  {
    brandKey: 'dischem',
    businessName: 'Dischem',
    email: 'demo-dischem@evoucher.co.za',
    phone: '0101000011',
    businessType: 'Pharmacy',
  },
  {
    brandKey: 'clicks',
    businessName: 'Clicks',
    email: 'demo-clicks@evoucher.co.za',
    phone: '0101000012',
    businessType: 'Pharmacy',
  },
  {
    brandKey: 'superstore',
    businessName: 'Super Store',
    email: 'demo-superstore@evoucher.co.za',
    phone: '0101000013',
    businessType: 'Retail',
  },
];

const DEMO_PRODUCTS_BY_BRAND: Partial<Record<BrandKey, Array<{ name: string; faceValue: number }>>> = {
  checkers: [
    { name: 'Checkers Grocery Voucher R200', faceValue: 200 },
    { name: 'Checkers Weekly Basket R500', faceValue: 500 },
    { name: 'Checkers Family Shop R1000', faceValue: 1000 },
  ],
  clicks: [
    { name: 'Clicks Pharmacy Essentials R100', faceValue: 100 },
    { name: 'Clicks Personal Care Voucher R250', faceValue: 250 },
    { name: 'Clicks Health Voucher R500', faceValue: 500 },
  ],
  pep: [
    { name: 'Pep Clothing Voucher R100', faceValue: 100 },
    { name: 'Pep Family Clothing Voucher R300', faceValue: 300 },
    { name: 'Pep Back-to-School Voucher R500', faceValue: 500 },
    { name: 'Pep Clothing Voucher R1000', faceValue: 1000 },
  ],
  shoprite: [
    { name: 'Shoprite Grocery Voucher R100', faceValue: 100 },
    { name: 'Shoprite Grocery Voucher R200', faceValue: 200 },
    { name: 'Shoprite Grocery Voucher R500', faceValue: 500 },
    { name: 'Shoprite Grocery Voucher R1000', faceValue: 1000 },
    { name: 'Shoprite Family Essentials Basket', faceValue: 350 },
  ],
  engen: [
    { name: 'Engen Fuel Voucher R100', faceValue: 100 },
    { name: 'Engen Fuel Voucher R300', faceValue: 300 },
    { name: 'Engen Fuel Voucher R500', faceValue: 500 },
  ],
  boxer: [
    { name: 'Boxer Grocery Voucher R100', faceValue: 100 },
    { name: 'Boxer Grocery Voucher R300', faceValue: 300 },
    { name: 'Boxer Grocery Voucher R500', faceValue: 500 },
    { name: 'Boxer Household Voucher R1000', faceValue: 1000 },
  ],
  usave: [
    { name: 'uSave Grocery Bundle R100', faceValue: 100 },
    { name: 'uSave Grocery Bundle R200', faceValue: 200 },
    { name: 'uSave Grocery Bundle R500', faceValue: 500 },
    { name: 'uSave Grocery Bundle R1000', faceValue: 1000 },
  ],
  picknpay: [
    { name: 'Pick n Pay Grocery Voucher R200', faceValue: 200 },
    { name: 'Pick n Pay Grocery Voucher R500', faceValue: 500 },
    { name: 'Pick n Pay Grocery Voucher R1000', faceValue: 1000 },
  ],
  mrprice: [
    { name: 'Mr Price Fashion Voucher R100', faceValue: 100 },
    { name: 'Mr Price Fashion Voucher R200', faceValue: 200 },
    { name: 'Mr Price Fashion Voucher R500', faceValue: 500 },
    { name: 'Mr Price Fashion Voucher R1000', faceValue: 1000 },
  ],
  game: [
    { name: 'Game Essentials Voucher R100', faceValue: 100 },
    { name: 'Game Essentials Voucher R200', faceValue: 200 },
    { name: 'Game Essentials Voucher R500', faceValue: 500 },
    { name: 'Game Essentials Voucher R1000', faceValue: 1000 },
  ],
  woolworths: [
    { name: 'Woolworths Grocery Voucher R100', faceValue: 100 },
    { name: 'Woolworths Grocery Voucher R200', faceValue: 200 },
    { name: 'Woolworths Grocery Voucher R500', faceValue: 500 },
    { name: 'Woolworths Grocery Voucher R1000', faceValue: 1000 },
  ],
};

function shouldSeedDemoData() {
  return process.env.NODE_ENV === 'development' || process.env.SEED_DEMO_MERCHANTS === 'true';
}

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const relation = relationName.toLowerCase();
  const bareRelation = relation.includes('.') ? relation.split('.').at(-1) ?? relation : relation;
  return (
    message.includes(`relation "${relation}" does not exist`) ||
    message.includes(`relation "${bareRelation}" does not exist`) ||
    message.includes(`could not find the table '${relation}' in the schema cache`) ||
    message.includes(`could not find the table '${bareRelation}' in the schema cache`)
  );
}

function buildDemoProductName(merchantName: string, faceValue: number) {
  return `${merchantName} Voucher R${faceValue}`;
}

function buildProductUniqKey(name: string, faceValue: number) {
  return `${String(name).trim().toLowerCase()}::${Number(faceValue).toFixed(2)}`;
}

export async function ensureDemoMerchantsSeeded(admin: any) {
  if (!shouldSeedDemoData()) return;

  const { data: existingMerchants, error: existingMerchantsError } = await admin
    .from('merchants')
    .select('id,business_name,email,default_total_discount_pct')
    .in(
      'email',
      DEMO_MERCHANTS.map((merchant) => merchant.email)
    );

  if (existingMerchantsError) throw existingMerchantsError;

  const existingByEmail = new Map<string, any>();
  (existingMerchants ?? []).forEach((merchant: any) => {
    existingByEmail.set(String(merchant.email).toLowerCase(), merchant);
  });

  const missingSeeds = DEMO_MERCHANTS.filter(
    (merchant) => !existingByEmail.has(merchant.email.toLowerCase())
  );

  if (missingSeeds.length > 0) {
    const { error: insertMerchantsError } = await admin.from('merchants').insert(
      missingSeeds.map((merchant) => ({
        user_id: null,
        business_name: merchant.businessName,
        contact_name: `${merchant.businessName} Demo Contact`,
        email: merchant.email,
        phone: merchant.phone,
        status: 'active',
        onboarding_fee_paid: true,
        default_total_discount_pct: DEFAULT_TOTAL_DISCOUNT_PCT,
        business_type: merchant.businessType,
        physical_address: 'South Africa',
        bank_name: 'Demo Bank',
      }))
    );

    if (insertMerchantsError) throw insertMerchantsError;
  }

  const { data: seededMerchants, error: seededMerchantsError } = await admin
    .from('merchants')
    .select('id,business_name,email,default_total_discount_pct')
    .in(
      'email',
      DEMO_MERCHANTS.map((merchant) => merchant.email)
    );

  if (seededMerchantsError) throw seededMerchantsError;

  const merchantByEmail = new Map<string, any>();
  (seededMerchants ?? []).forEach((merchant: any) => {
    merchantByEmail.set(String(merchant.email).toLowerCase(), merchant);
  });

  const merchantIds = Array.from(merchantByEmail.values()).map((merchant) => merchant.id);
  if (merchantIds.length === 0) return;

  const { data: existingProducts, error: existingProductsError } = await admin
    .from('merchant_products')
    .select('id,merchant_id,product_name,face_value')
    .in('merchant_id', merchantIds)
    .eq('is_active', true);

  if (existingProductsError && !isMissingRelation(existingProductsError, 'public.merchant_products')) {
    throw existingProductsError;
  }

  const productsByMerchant = new Map<string, Set<string>>();
  (existingProducts ?? []).forEach((product: any) => {
    const merchantId = String(product.merchant_id);
    const existingSet = productsByMerchant.get(merchantId) ?? new Set<string>();
    existingSet.add(buildProductUniqKey(product.product_name, Number(product.face_value)));
    productsByMerchant.set(merchantId, existingSet);
  });

  const productsToInsert: any[] = [];
  DEMO_MERCHANTS.forEach((seed) => {
    const merchant = merchantByEmail.get(seed.email.toLowerCase());
    if (!merchant) return;
    const templates = DEMO_PRODUCTS_BY_BRAND[seed.brandKey] ?? [];
    if (templates.length === 0) return;

    const brand = getBrandByKey(seed.brandKey);
    const existingSet = productsByMerchant.get(String(merchant.id)) ?? new Set<string>();
    templates.forEach((template) => {
      const uniqKey = buildProductUniqKey(template.name, template.faceValue);
      if (existingSet.has(uniqKey)) return;

      const pricing = calculateDiscountPricing(
        Number(template.faceValue),
        Number(merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT)
      );
      productsToInsert.push({
        merchant_id: merchant.id,
        product_name: template.name || buildDemoProductName(brand?.displayName ?? seed.businessName, template.faceValue),
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
      });
      existingSet.add(uniqKey);
    });
    productsByMerchant.set(String(merchant.id), existingSet);
  });

  if (productsToInsert.length > 0) {
    const { error: insertProductsError } = await admin.from('merchant_products').insert(productsToInsert);
    if (insertProductsError && !isMissingRelation(insertProductsError, 'public.merchant_products')) {
      throw insertProductsError;
    }
  }
}
