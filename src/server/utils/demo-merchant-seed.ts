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
    brandKey: 'shoprite',
    businessName: 'Shoprite',
    email: 'demo-shoprite@evoucher.co.za',
    phone: '0101000002',
    businessType: 'Supermarket',
    seedPortalAuth: true,
  },
  {
    brandKey: 'picknpay',
    businessName: 'Pick n Pay',
    email: 'demo-picknpay@evoucher.co.za',
    phone: '0101000003',
    businessType: 'Supermarket',
    seedPortalAuth: true,
  },
];

const DEMO_PRODUCTS_BY_BRAND: Partial<
  Record<BrandKey, Array<{ name: string; faceValue: number }>>
> = {
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
  // Keep production clean: only auto-seed demo merchants in non-production environments.
  // You can still force seeding by setting `SEED_DEMO_MERCHANTS=true`.
  if (process.env.NODE_ENV === 'production') {
    const override = String(process.env.SEED_DEMO_MERCHANTS ?? '')
      .trim()
      .toLowerCase();
    return ['true', '1', 'yes', 'on'].includes(override);
  }
  return true;
}

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const relation = relationName.toLowerCase();
  const bareRelation = relation.includes('.') ? (relation.split('.').at(-1) ?? relation) : relation;
  return (
    message.includes(`relation "${relation}" does not exist`) ||
    message.includes(`relation "${bareRelation}" does not exist`) ||
    message.includes(`could not find the table '${relation}' in the schema cache`) ||
    message.includes(`could not find the table '${bareRelation}' in the schema cache`)
  );
}

function isUserIdTypeMismatch(error: any) {
  const code = String(error?.code ?? '')
    .trim()
    .toLowerCase();
  const message = String(error?.message ?? '').toLowerCase();
  return (
    code === '22p02' ||
    message.includes('invalid input syntax for type integer') ||
    message.includes('invalid input syntax for type bigint') ||
    message.includes('operator does not exist: integer =') ||
    message.includes('operator does not exist: bigint =')
  );
}

function isKycApprovalGate(error: any) {
  const message = String(error?.message ?? '').toLowerCase();
  return message.includes('cannot be moved to approved without approved kyc review');
}

function isMissingColumn(error: any, columnName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const normalizedColumn = String(columnName ?? '')
    .trim()
    .toLowerCase();
  return (
    (message.includes(`column "${normalizedColumn}"`) && message.includes('does not exist')) ||
    (message.includes(`column ${normalizedColumn}`) && message.includes('does not exist')) ||
    message.includes(`could not find the '${normalizedColumn}' column`) ||
    message.includes(`could not find the column '${normalizedColumn}'`)
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
  const email = String(seed.email ?? '')
    .trim()
    .toLowerCase();
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

function buildDemoKpiRows(seed: DemoMerchantSeed, merchantId: string) {
  const brandPrefix = seed.brandKey.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'DEMO';
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const rows = [
    { faceValue: 200, totalDiscountPct: 4, daysAgo: 1 },
    { faceValue: 500, totalDiscountPct: 5, daysAgo: 4 },
    { faceValue: 1000, totalDiscountPct: 5, daysAgo: 9 },
    { faceValue: 350, totalDiscountPct: 4, daysAgo: 14 },
    { faceValue: 150, totalDiscountPct: 3, daysAgo: 21 },
    { faceValue: 800, totalDiscountPct: 5, daysAgo: 28 },
  ].map((entry, index) => {
    const pricing = calculateDiscountPricing(entry.faceValue, entry.totalDiscountPct);
    const createdAt = new Date(now - entry.daysAgo * dayMs + index * 1000).toISOString();
    const reference = `DEMO-${brandPrefix}-${String(index + 1).padStart(3, '0')}`;
    return {
      id: `demo-kpi-${seed.brandKey}-${index + 1}`,
      merchant_id: merchantId,
      amount: Number(pricing.consumerPrice.toFixed(2)),
      card_last_four: String(1200 + index),
      card_brand: index % 2 === 0 ? 'VISA' : 'MASTERCARD',
      payment_status: 'completed',
      voucher_code: `${brandPrefix}-VCH-${String(index + 1).padStart(3, '0')}`,
      transaction_reference: reference,
      created_at: createdAt,
      total_discount_pct: Number(pricing.totalDiscountPct.toFixed(2)),
      consumer_benefit_amount: Number(pricing.consumerBenefitAmount.toFixed(2)),
      evoucher_benefit_amount: Number(pricing.evoucherBenefitAmount.toFixed(2)),
      consumer_price: Number(pricing.consumerPrice.toFixed(2)),
      face_value: Number(pricing.faceValue.toFixed(2)),
      consumer_benefit_pct: Number(pricing.consumerBenefitPct.toFixed(2)),
      evoucher_benefit_pct: Number(pricing.evoucherBenefitPct.toFixed(2)),
      total_discount_amount: Number(pricing.totalDiscountAmount.toFixed(2)),
      merchant_receivable_after_total_discount: Number(
        pricing.merchantReceivableAfterTotalDiscount.toFixed(2)
      ),
      merchant_receivable_after_evoucher_benefit: Number(
        pricing.merchantReceivableAfterEvoucherBenefit.toFixed(2)
      ),
    };
  });
  return rows;
}

async function seedDemoKpiData(admin: any, seed: DemoMerchantSeed, merchantId: string) {
  const transactionRows = buildDemoKpiRows(seed, merchantId);
  if (transactionRows.length === 0) return;

  const referencePrefix = `DEMO-${seed.brandKey.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-`;
  const existingTx = await admin
    .from('payment_transactions')
    .select('id,transaction_reference', { count: 'exact' })
    .eq('merchant_id', merchantId)
    .like('transaction_reference', `${referencePrefix}%`);

  if (!existingTx.error && Number(existingTx.count ?? 0) < 3) {
    const richInsert = await admin.from('payment_transactions').insert(
      transactionRows.map((row) => ({
        merchant_id: row.merchant_id,
        amount: row.amount,
        card_last_four: row.card_last_four,
        card_brand: row.card_brand,
        payment_status: row.payment_status,
        voucher_code: row.voucher_code,
        transaction_reference: row.transaction_reference,
        created_at: row.created_at,
        total_discount_pct: row.total_discount_pct,
        consumer_benefit_amount: row.consumer_benefit_amount,
        evoucher_benefit_amount: row.evoucher_benefit_amount,
        consumer_price: row.consumer_price,
        face_value: row.face_value,
        consumer_benefit_pct: row.consumer_benefit_pct,
        evoucher_benefit_pct: row.evoucher_benefit_pct,
        total_discount_amount: row.total_discount_amount,
        merchant_receivable_after_total_discount: row.merchant_receivable_after_total_discount,
        merchant_receivable_after_evoucher_benefit:
          row.merchant_receivable_after_evoucher_benefit,
      }))
    );

    if (richInsert.error) {
      const missingOptionalColumn = [
        'total_discount_pct',
        'consumer_benefit_amount',
        'evoucher_benefit_amount',
        'consumer_price',
        'face_value',
        'consumer_benefit_pct',
        'evoucher_benefit_pct',
        'total_discount_amount',
        'merchant_receivable_after_total_discount',
        'merchant_receivable_after_evoucher_benefit',
      ].some((column) => isMissingColumn(richInsert.error, column));

      if (!missingOptionalColumn) throw richInsert.error;

      const fallbackInsert = await admin.from('payment_transactions').insert(
        transactionRows.map((row) => ({
          merchant_id: row.merchant_id,
          amount: row.amount,
          card_last_four: row.card_last_four,
          card_brand: row.card_brand,
          payment_status: row.payment_status,
          voucher_code: row.voucher_code,
          transaction_reference: row.transaction_reference,
          created_at: row.created_at,
        }))
      );
      if (fallbackInsert.error) throw fallbackInsert.error;
    }
  }

  const payoutRows = [
    {
      merchant_id: merchantId,
      amount: Number(
        transactionRows.slice(0, 3).reduce((sum, row) => sum + row.amount, 0).toFixed(2)
      ),
      status: 'completed',
      payout_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      merchant_id: merchantId,
      amount: Number(
        transactionRows.slice(3).reduce((sum, row) => sum + row.amount, 0).toFixed(2)
      ),
      status: 'pending',
      payout_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const existingPayouts = await admin
    .from('merchant_payouts')
    .select('id', { count: 'exact' })
    .eq('merchant_id', merchantId);

  if (!existingPayouts.error && Number(existingPayouts.count ?? 0) < 2) {
    const payoutInsert = await admin.from('merchant_payouts').insert(payoutRows);
    if (payoutInsert.error) throw payoutInsert.error;
  }
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
    if (profileError && !isUserIdTypeMismatch(profileError)) throw profileError;

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

    const promotionResult = await admin
      .from('merchants')
      .update(promotedFields)
      .eq('id', merchant.id);
    if (promotionResult.error && !isUserIdTypeMismatch(promotionResult.error)) {
      if (isKycApprovalGate(promotionResult.error)) {
        continue;
      }
      const fallbackResult = await admin
        .from('merchants')
        .update({
          user_id: userId,
          status: 'approved',
          approved_at: nowIso,
          onboarding_fee_paid: true,
        })
        .eq('id', merchant.id);
      if (fallbackResult.error) {
        if (isKycApprovalGate(fallbackResult.error)) {
          continue;
        }
        throw fallbackResult.error;
      }
    } else if (promotionResult.error && isUserIdTypeMismatch(promotionResult.error)) {
      const { user_id: _ignoredUserId, ...withoutUserId } = promotedFields;
      const fallbackNoUserId = await admin
        .from('merchants')
        .update(withoutUserId)
        .eq('id', merchant.id);
      if (fallbackNoUserId.error) {
        if (isKycApprovalGate(fallbackNoUserId.error)) {
          continue;
        }
        throw fallbackNoUserId.error;
      }
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
    if (
      verificationUpsert.error &&
      !isMissingRelation(verificationUpsert.error, 'public.merchant_onboarding_verifications')
    ) {
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

  if (
    existingProductsError &&
    !isMissingRelation(existingProductsError, 'public.merchant_products')
  ) {
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
        product_name:
          template.name ||
          buildDemoProductName(brand?.displayName ?? seed.businessName, template.faceValue),
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
    const { error: insertProductsError } = await admin
      .from('merchant_products')
      .insert(productsToInsert);
    if (
      insertProductsError &&
      !isMissingRelation(insertProductsError, 'public.merchant_products')
    ) {
      throw insertProductsError;
    }
  }

  for (const seed of DEMO_MERCHANTS) {
    const merchant = merchantByEmail.get(seed.email.toLowerCase());
    if (!merchant?.id) continue;
    await seedDemoKpiData(admin, seed, String(merchant.id));
  }
}
