import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';
import { BrandKey, getBrandByKey } from '@/lib/merchant-brand-catalog';

type DemoMerchantSeed = {
  brandKey: BrandKey;
  businessName: string;
  email: string;
  phone: string;
  businessType: string;
  merchantType?: 'chain' | 'private';
  seedPortalAuth?: boolean;
};

const DEMO_MERCHANTS: DemoMerchantSeed[] = [
  {
    brandKey: 'boxer',
    businessName: 'Boxer',
    email: 'demo-boxer@evoucher.co.za',
    phone: '0101000001',
    businessType: 'Supermarket',
    seedPortalAuth: true,
  },
  {
    brandKey: 'shoprite',
    businessName: 'Shoprite',
    email: 'demo-shoprite@evoucher.co.za',
    phone: '0101000002',
    businessType: 'Supermarket',
    seedPortalAuth: true,
  },
  {
    brandKey: 'pep',
    businessName: 'Pep',
    email: 'demo-pep@evoucher.co.za',
    phone: '0101000003',
    businessType: 'Retail',
    seedPortalAuth: true,
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
    seedPortalAuth: true,
  },
  {
    brandKey: 'engen',
    businessName: 'Engen',
    email: 'demo-engen@evoucher.co.za',
    phone: '0101000007',
    businessType: 'Fuel',
    seedPortalAuth: true,
  },
  {
    brandKey: 'picknpay',
    businessName: 'Pick n Pay',
    email: 'demo-picknpay@evoucher.co.za',
    phone: '0101000008',
    businessType: 'Supermarket',
    seedPortalAuth: true,
  },
  {
    brandKey: 'superstore',
    businessName: 'Kalapeng Demo Store',
    email: 'demo-kalapeng@evoucher.co.za',
    phone: '0101000099',
    businessType: 'Supermarket',
    merchantType: 'private',
    seedPortalAuth: true,
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
    seedPortalAuth: true,
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
  const flags = [
    String(process.env.SEED_DEMO_MERCHANTS ?? '').toLowerCase(),
    String(process.env.ENABLE_DEMO_MERCHANT_SEED ?? '').toLowerCase(),
    String(process.env.NEXT_PUBLIC_ENABLE_DEMO_MERCHANT_SEED ?? '').toLowerCase(),
    String(process.env.NEXT_PUBLIC_FORCE_DEMO_SEED_ON_LOGIN ?? '').toLowerCase(),
  ];
  const enabled = flags.some((value) => ['true', '1', 'yes', 'on'].includes(value));
  return process.env.NODE_ENV === 'development' || enabled;
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

function resolveDemoMerchantPassword() {
  return 'demo123';
}

async function findAuthUserByEmail(admin: any, email: string) {
  let page = 1;
  const perPage = 200;
  while (page <= 100) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find((user: any) => String(user.email ?? '').toLowerCase() === email);
    if (match) return match;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function ensureDemoMerchantAuthUser(admin: any, seed: DemoMerchantSeed) {
  const email = String(seed.email ?? '').trim().toLowerCase();
  const password = resolveDemoMerchantPassword();
  const metadata = {
    role: 'merchant',
    full_name: `${seed.businessName} Demo Manager`,
    phone: seed.phone,
    must_change_password: false,
  };

  const existing = await findAuthUserByEmail(admin, email);
  if (existing?.id) {
    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        ...metadata,
      },
    });
    if (updateError) throw updateError;
    return existing.id as string;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  const createdId = data?.user?.id;
  if (!createdId) throw new Error(`Failed to create auth user for ${seed.businessName}.`);
  return createdId as string;
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

  const nowIso = new Date().toISOString();
  const portalSeeds = DEMO_MERCHANTS.filter((seed) => Boolean(seed.seedPortalAuth));
  for (const seed of portalSeeds) {
    const merchant = merchantByEmail.get(seed.email.toLowerCase());
    if (!merchant?.id) continue;

    const userId = await ensureDemoMerchantAuthUser(admin, seed);
    const { error: profileError } = await admin.from('user_profiles').upsert(
      {
        id: userId,
        email: seed.email.toLowerCase(),
        full_name: `${seed.businessName} Demo Manager`,
        phone: seed.phone,
        role: 'merchant',
      },
      { onConflict: 'id' }
    );
    if (profileError) throw profileError;

    const promotedFields = {
      user_id: userId,
      status: 'approved',
      approved_at: nowIso,
      onboarding_fee_paid: true,
      merchant_type: seed.merchantType ?? 'chain',
      vetting_status: 'approved',
      email_verified: true,
      phone_verified: true,
      must_reset_password: false,
      onboarding_completed_at: nowIso,
    };

    const promotionResult = await admin.from('merchants').update(promotedFields).eq('id', merchant.id);
    if (promotionResult.error) {
      const fallbackResult = await admin
        .from('merchants')
        .update({
          user_id: userId,
          status: 'approved',
          approved_at: nowIso,
          onboarding_fee_paid: true,
        })
        .eq('id', merchant.id);
      if (fallbackResult.error) throw fallbackResult.error;
    }

    const verificationUpsert = await admin.from('merchant_onboarding_verifications').upsert(
      {
        merchant_id: merchant.id,
        email_verified_at: nowIso,
        sms_verified_at: nowIso,
        credentials_sent_at: nowIso,
        otp_attempts: 0,
      },
      { onConflict: 'merchant_id' }
    );
    if (verificationUpsert.error && !isMissingRelation(verificationUpsert.error, 'public.merchant_onboarding_verifications')) {
      throw verificationUpsert.error;
    }
  }

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
