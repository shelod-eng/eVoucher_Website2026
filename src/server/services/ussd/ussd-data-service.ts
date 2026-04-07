import { createAdminClient } from '@/lib/supabase/admin';

export type UssdCustomer = {
  id: string;
  fullName: string | null;
  phone: string | null;
};

export type UssdMerchant = {
  id: string;
  displayName: string;
  productCount: number;
};

export type UssdMerchantProduct = {
  id: string;
  productName: string;
  consumerPrice: number;
};

const DEMO_MERCHANTS: UssdMerchant[] = [
  { id: 'demo-shoprite', displayName: 'Shoprite', productCount: 3 },
  { id: 'demo-picknpay', displayName: 'Pick n Pay', productCount: 3 },
  { id: 'demo-checkers', displayName: 'Checkers', productCount: 2 },
];

const DEMO_PRODUCTS_BY_MERCHANT: Record<string, UssdMerchantProduct[]> = {
  'demo-shoprite': [
    { id: 'd-s-1000', productName: 'R1000 Grocery Voucher', consumerPrice: 975 },
    { id: 'd-s-500', productName: 'R500 Grocery Voucher', consumerPrice: 487.5 },
    { id: 'd-s-200', productName: 'R200 Grocery Voucher', consumerPrice: 195 },
  ],
  'demo-picknpay': [
    { id: 'd-p-1000', productName: 'R1000 Grocery Voucher', consumerPrice: 975 },
    { id: 'd-p-500', productName: 'R500 Grocery Voucher', consumerPrice: 487.5 },
    { id: 'd-p-300', productName: 'R300 Grocery Voucher', consumerPrice: 292.5 },
  ],
  'demo-checkers': [
    { id: 'd-c-1000', productName: 'R1000 Grocery Voucher', consumerPrice: 975 },
    { id: 'd-c-500', productName: 'R500 Grocery Voucher', consumerPrice: 487.5 },
  ],
};

function normalizeMsisdn(msisdn: string) {
  const digits = String(msisdn ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('27')) return `+${digits}`;
  if (digits.startsWith('0')) return `+27${digits.slice(1)}`;
  return `+${digits}`;
}

function withSearchVariant(msisdn: string) {
  const normalized = normalizeMsisdn(msisdn);
  const digits = normalized.replace(/\D/g, '');
  const local = digits.startsWith('27') ? `0${digits.slice(2)}` : digits;
  return {
    normalized,
    digits,
    local,
  };
}

function toNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

async function getProductsFromMerchantProducts(merchantIds: string[]) {
  const admin = createAdminClient();
  const baseFields =
    'id,merchant_id,product_name,consumer_price,face_value,total_discount_pct,is_active,status,parent_brand,created_at';

  const attempts = [
    admin
      .from('merchant_products')
      .select(baseFields)
      .eq('is_active', true)
      .in('merchant_id', merchantIds)
      .limit(12000),
    admin
      .from('merchant_products')
      .select(baseFields)
      .eq('status', 'active')
      .in('merchant_id', merchantIds)
      .limit(12000),
    admin.from('merchant_products').select(baseFields).in('merchant_id', merchantIds).limit(12000),
  ];

  for (const query of attempts) {
    const result = await query;
    if (!result.error) return result.data ?? [];
  }

  return [];
}

export async function resolveCustomerByMsisdn(msisdn: string): Promise<UssdCustomer | null> {
  const admin = createAdminClient();
  const variants = withSearchVariant(msisdn);

  const { data, error } = await admin
    .from('user_profiles')
    .select('id,full_name,phone')
    .or(`phone.eq.${variants.normalized},phone.eq.${variants.digits},phone.eq.${variants.local}`)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: String(data.id),
    fullName: data.full_name ? String(data.full_name) : null,
    phone: data.phone ? String(data.phone) : null,
  };
}

export async function getShopMerchantsForUssd(): Promise<UssdMerchant[]> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return DEMO_MERCHANTS;
  }
  const { data: merchants, error } = await admin
    .from('merchants')
    .select('id,business_name,parent_brand,status')
    .in('status', ['approved', 'active'])
    .order('business_name', { ascending: true })
    .limit(2000);

  if (error || !merchants) return DEMO_MERCHANTS;

  const cleanedMerchants = merchants.filter((merchant) => {
    const businessName = String(merchant.business_name ?? '').toLowerCase();
    const parentBrand = String(merchant.parent_brand ?? '').toLowerCase();
    return !businessName.includes('demo') && !parentBrand.includes('demo');
  });

  const merchantIds = cleanedMerchants.map((merchant) => String(merchant.id));
  if (merchantIds.length === 0) return DEMO_MERCHANTS;

  const products = await getProductsFromMerchantProducts(merchantIds);

  const countMap = new Map<string, number>();
  products.forEach((row: any) => {
    const merchantId = String(row.merchant_id ?? '');
    const isActive =
      typeof row.is_active === 'boolean'
        ? row.is_active
        : String(row.status ?? '').toLowerCase() !== 'inactive';
    if (!merchantId || !isActive) return;
    countMap.set(merchantId, (countMap.get(merchantId) ?? 0) + 1);
  });

  const live = cleanedMerchants
    .map((merchant) => ({
      id: String(merchant.id),
      displayName: String(merchant.parent_brand ?? merchant.business_name ?? 'Merchant'),
      productCount: countMap.get(String(merchant.id)) ?? 0,
    }))
    .filter((merchant) => merchant.productCount > 0)
    .sort((first, second) => first.displayName.localeCompare(second.displayName));

  return live.length > 0 ? live : DEMO_MERCHANTS;
}

export async function getProductsForMerchantUssd(merchantId: string): Promise<UssdMerchantProduct[]> {
  if (!merchantId) return [];
  if (merchantId in DEMO_PRODUCTS_BY_MERCHANT) {
    return DEMO_PRODUCTS_BY_MERCHANT[merchantId] ?? [];
  }
  const rows = await getProductsFromMerchantProducts([merchantId]);

  const live = rows
    .filter((row: any) => {
      if (String(row.merchant_id ?? '') !== merchantId) return false;
      if (typeof row.is_active === 'boolean') return row.is_active;
      return String(row.status ?? '').toLowerCase() !== 'inactive';
    })
    .map((row: any) => {
      const faceValue = toNumber(row.face_value, 0);
      const totalDiscountPct = toNumber(row.total_discount_pct, 5);
      const consumerPrice = toNumber(
        row.consumer_price,
        Number((faceValue - faceValue * (totalDiscountPct / 100)).toFixed(2))
      );

      return {
        id: String(row.id),
        productName: String(row.product_name ?? 'Voucher'),
        consumerPrice,
      };
    })
    .sort((first, second) => first.consumerPrice - second.consumerPrice);

  return live.length > 0 ? live : DEMO_PRODUCTS_BY_MERCHANT['demo-shoprite'];
}

export async function getWalletBalanceForCustomerUssd(customerId: string): Promise<number> {
  if (!customerId) return 0;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('customer_vouchers')
    .select('current_balance,is_active')
    .eq('customer_id', customerId)
    .eq('is_active', true)
    .limit(4000);

  if (error || !data) return 0;
  return Number(
    data.reduce((sum: number, row: any) => sum + Number(row.current_balance ?? 0), 0).toFixed(2)
  );
}
