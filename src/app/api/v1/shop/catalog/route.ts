import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';
import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';
import {
  BrandKey,
  getBrandByKey,
  listMerchantBrands,
  resolveBrandFromMerchantName,
} from '@/lib/merchant-brand-catalog';
import {
  buildStarterProductsForBrand,
  getStarterProductCountForBrand,
  getStarterProductsForBrand,
} from '@/lib/starter-products';
import { ensureDemoMerchantsSeeded } from '@/server/utils/demo-merchant-seed';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type MerchantRow = {
  id: string;
  business_name: string;
  email: string;
  status: string;
  business_type: string | null;
  default_total_discount_pct: number | null;
  parent_brand: string | null;
  branch_name: string | null;
  branch_code: string | null;
  city: string | null;
  province: string | null;
  physical_address: string | null;
};

type ProductRow = {
  id: string;
  merchant_id: string;
  product_name: string;
  face_value: number;
  total_discount_pct: number | null;
  parent_brand: string | null;
  redemption_scope: string | null;
  valid_provinces: string[] | null;
  valid_branch_ids: string[] | null;
  is_active: boolean | null;
  is_special: boolean | null;
  special_title: string | null;
  special_end_at: string | null;
  display_priority: number | null;
  status: string | null;
  created_at: string;
};

type BrandLocation = {
  id: string;
  business_name: string;
  branch_name: string;
  branch_code: string | null;
  city: string | null;
  province: string | null;
  physical_address: string | null;
};

type BrandAggregation = {
  brandKey: string;
  mappedBrandKey: BrandKey | null;
  displayName: string;
  category: string;
  assetPath: string;
  estimatedLocationCount: number;
  estimatedProvinceCount: number;
  merchantIds: string[];
  locations: BrandLocation[];
  provinces: Set<string>;
  defaultTotalDiscountPct: number;
  representativeMerchant: MerchantRow | null;
};

type CatalogProduct = {
  id: string;
  brandKey: string;
  source: 'db' | 'starter';
  merchant_id: string | null;
  merchant_name: string;
  parent_brand: string;
  product_name: string;
  face_value: number;
  total_discount_pct: number;
  consumer_benefit_pct: number;
  evoucher_benefit_pct: number;
  total_discount_amount: number;
  consumer_benefit_amount: number;
  evoucher_benefit_amount: number;
  consumer_price: number;
  merchant_receivable_after_total_discount: number;
  merchant_receivable_after_evoucher_benefit: number;
  redemption_scope: 'all_branches' | 'specific_branch' | 'province_wide' | 'national';
  valid_provinces: string[];
  valid_branch_ids: string[];
  valid_location_count: number;
  is_active: boolean;
  is_special: boolean;
  special_title: string | null;
  special_end_at: string | null;
  display_priority: number;
  created_at: string;
};

const DEMO_BRAND_KEYS = new Set<BrandKey>([
  'shoprite',
  'checkers',
  'clicks',
  'pep',
  'engen',
  'boxer',
  'usave',
  'picknpay',
  'game',
  'woolworths',
  'mrprice',
  'superprecast',
]);

function resolveDataClient(supabase: any) {
  try {
    return { client: createAdminClient(), hasAdminEnv: true };
  } catch {
    return { client: supabase, hasAdminEnv: false };
  }
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

function withSearchMatch(text: string, term: string) {
  if (!term) return true;
  return text.toLowerCase().includes(term);
}

function isBankMerchantLabel(value: string) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  const bankTerms = [
    'absa',
    'fnb',
    'first national bank',
    'standard bank',
    'nedbank',
    'capitec',
    'investec',
    'tymebank',
    'bank',
  ];
  return bankTerms.some((term) => normalized.includes(term));
}

function normalizeScope(
  value: unknown
): 'all_branches' | 'specific_branch' | 'province_wide' | 'national' {
  const scope = String(value ?? '')
    .trim()
    .toLowerCase();
  if (
    scope === 'all_branches' ||
    scope === 'specific_branch' ||
    scope === 'province_wide' ||
    scope === 'national'
  ) {
    return scope;
  }
  return 'all_branches';
}

function uniqueStrings(values: unknown) {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(values.map((value) => String(value)).filter((value) => value.length > 0))
  );
}

function toGenericBrandKey(value: string) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function toMerchantRow(
  row: Partial<MerchantRow> & { id: string; business_name: string; email: string; status: string }
) {
  return {
    id: row.id,
    business_name: row.business_name,
    email: row.email,
    status: row.status,
    business_type: row.business_type ?? null,
    default_total_discount_pct: row.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT,
    parent_brand: row.parent_brand ?? null,
    branch_name: row.branch_name ?? row.business_name,
    branch_code: row.branch_code ?? null,
    city: row.city ?? null,
    province: row.province ?? null,
    physical_address: row.physical_address ?? null,
  } as MerchantRow;
}

function toProductRow(
  row: Partial<ProductRow> & {
    id: string;
    merchant_id: string;
    product_name: string;
    face_value: number;
    created_at: string;
  }
) {
  return {
    id: row.id,
    merchant_id: row.merchant_id,
    product_name: row.product_name,
    face_value: row.face_value,
    total_discount_pct: row.total_discount_pct ?? null,
    parent_brand: row.parent_brand ?? null,
    redemption_scope: row.redemption_scope ?? 'all_branches',
    valid_provinces: row.valid_provinces ?? [],
    valid_branch_ids: row.valid_branch_ids ?? [],
    is_active: row.is_active ?? null,
    is_special: row.is_special ?? null,
    special_title: row.special_title ?? null,
    special_end_at: row.special_end_at ?? null,
    display_priority: row.display_priority ?? null,
    status: row.status ?? null,
    created_at: row.created_at,
  } as ProductRow;
}

async function fetchMerchants(dataClient: any, activeOnly: boolean): Promise<MerchantRow[]> {
  const fieldSets = [
    'id,business_name,email,status,business_type,default_total_discount_pct,parent_brand,branch_name,branch_code,city,province,physical_address',
    'id,business_name,email,status,default_total_discount_pct,parent_brand,branch_name,branch_code,city,province,physical_address',
    'id,business_name,email,status,default_total_discount_pct',
    'id,business_name,email,status',
  ];

  let lastError: any = null;
  for (const fields of fieldSets) {
    const query = dataClient
      .from('merchants')
      .select(fields)
      .order('business_name', { ascending: true })
      .limit(4000);
    const result = await query;
    if (!result.error) {
      const mapped = ((result.data ?? []) as MerchantRow[]).map((row) => toMerchantRow(row));
      if (!activeOnly) return mapped;
      return mapped.filter((merchant) =>
        ['approved', 'active'].includes(String(merchant.status ?? '').toLowerCase())
      );
    }
    lastError = result.error;
  }

  throw lastError ?? new Error('Failed to load merchants');
}

async function fetchProductsForMerchantIds(
  dataClient: any,
  merchantIds: string[]
): Promise<ProductRow[]> {
  if (merchantIds.length === 0) return [];
  const merchantIdSet = new Set(merchantIds.map((id) => String(id)));
  const queryPlans: Array<{
    fields: string;
    applyActiveFilter: (query: any) => any;
    isRowActive: (row: any) => boolean;
  }> = [
    {
      fields:
        'id,merchant_id,product_name,face_value,total_discount_pct,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_active,is_special,special_title,special_end_at,display_priority,created_at',
      applyActiveFilter: (query: any) => query.eq('is_active', true),
      isRowActive: (row: any) => Boolean(row?.is_active),
    },
    {
      fields:
        'id,merchant_id,product_name,face_value,total_discount_pct,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_active,created_at',
      applyActiveFilter: (query: any) => query.eq('is_active', true),
      isRowActive: (row: any) => Boolean(row?.is_active),
    },
    {
      fields:
        'id,merchant_id,product_name,face_value,total_discount_pct,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_special,special_title,special_end_at,display_priority,status,created_at',
      applyActiveFilter: (query: any) => query.eq('status', 'active'),
      isRowActive: (row: any) => String(row?.status ?? '').toLowerCase() === 'active',
    },
    {
      fields:
        'id,merchant_id,product_name,face_value,total_discount_pct,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_active,is_special,special_title,special_end_at,display_priority,status,created_at',
      applyActiveFilter: (query: any) => query,
      isRowActive: (row: any) => {
        if (typeof row?.is_active === 'boolean') return row.is_active;
        const status = String(row?.status ?? '').toLowerCase();
        if (!status) return true;
        return !['inactive', 'disabled', 'archived'].includes(status);
      },
    },
    {
      fields:
        'id,merchant_id,product_name,face_value,total_discount_pct,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_active,status,created_at',
      applyActiveFilter: (query: any) => query,
      isRowActive: (row: any) => {
        if (typeof row?.is_active === 'boolean') return row.is_active;
        const status = String(row?.status ?? '').toLowerCase();
        if (!status) return true;
        return !['inactive', 'disabled', 'archived'].includes(status);
      },
    },
  ];

  let lastError: any = null;
  for (const plan of queryPlans) {
    const query = dataClient
      .from('merchant_products')
      .select(plan.fields)
      .order('created_at', { ascending: false })
      .limit(12000);

    const result = await plan.applyActiveFilter(query);

    if (!result.error) {
      return (result.data ?? [])
        .filter((row: any) => plan.isRowActive(row))
        .map((row: any) => toProductRow(row))
        .filter((row: ProductRow) => merchantIdSet.has(String(row.merchant_id)));
    }

    if (isMissingRelation(result.error, 'public.merchant_products')) {
      return [];
    }

    lastError = result.error;
  }

  throw lastError ?? new Error('Failed to load products');
}

function resolveBrandMeta(
  rawBrandName: string,
  fallbackName: string,
  fallbackCategory: string | null
) {
  const explicitParentBrand = String(rawBrandName ?? '').trim();
  const fallbackDisplayName =
    explicitParentBrand || String(fallbackName ?? '').trim() || 'Merchant';
  const mappedBrandKey =
    resolveBrandFromMerchantName(explicitParentBrand) ??
    resolveBrandFromMerchantName(fallbackDisplayName);
  const mappedBrand = mappedBrandKey ? getBrandByKey(mappedBrandKey) : null;
  if (!mappedBrand) {
    return {
      brandKey: toGenericBrandKey(fallbackDisplayName) || 'merchant-generic',
      mappedBrandKey: null,
      displayName: fallbackDisplayName,
      category: fallbackCategory ?? 'Retail',
      assetPath: '',
      estimatedLocationCount: 0,
      estimatedProvinceCount: 0,
    };
  }

  return {
    brandKey: mappedBrand.brandKey,
    mappedBrandKey: mappedBrand.brandKey,
    displayName: mappedBrand.displayName,
    category: mappedBrand.category ?? fallbackCategory ?? 'Retail',
    assetPath: mappedBrand.assetPath ?? '',
    estimatedLocationCount: Number(mappedBrand.estimatedLocationCount ?? 0),
    estimatedProvinceCount: Number(mappedBrand.estimatedProvinceCount ?? 0),
  };
}

function getResolvedLocationCount(brand: BrandAggregation | null | undefined) {
  if (!brand) return 0;
  return Math.max(brand.locations.length, Number(brand.estimatedLocationCount ?? 0));
}

function getResolvedProvinceCount(brand: BrandAggregation | null | undefined) {
  if (!brand) return 0;
  return Math.max(brand.provinces.size, Number(brand.estimatedProvinceCount ?? 0));
}

function dedupeProducts(products: CatalogProduct[]) {
  const map = new Map<string, CatalogProduct>();
  products.forEach((product) => {
    const signature = [
      product.product_name.toLowerCase(),
      product.face_value.toFixed(2),
      product.total_discount_pct.toFixed(2),
      String(Boolean(product.is_special)),
      String(product.special_title ?? ''),
      String(product.special_end_at ?? ''),
      product.redemption_scope,
      [...product.valid_provinces].sort().join('|'),
      [...product.valid_branch_ids].sort().join('|'),
    ].join('::');

    if (!map.has(signature)) {
      map.set(signature, product);
    }
  });
  return Array.from(map.values());
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'unauthenticated' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return NextResponse.json(
        { error: 'Shop is consumer-only.', code: 'consumer_only_shop' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedBrandRaw = searchParams.get('brandKey')?.trim() ?? '';
    const searchTerm = searchParams.get('q')?.trim().toLowerCase() ?? '';
    const debugEnabled = ['1', 'true', 'yes', 'on'].includes(
      String(searchParams.get('debug') ?? '')
        .trim()
        .toLowerCase()
    );
    const { client: dataClient, hasAdminEnv } = resolveDataClient(supabase);

    // Keep local demo data usable even when only a subset of merchants has been onboarded.
    try {
      const admin = createAdminClient();
      await ensureDemoMerchantsSeeded(admin);
    } catch {
      // Ignore seeding failures when admin env is not configured; catalog still falls back safely.
    }

    let merchants = await fetchMerchants(dataClient, true);
    const merchantCountActiveOnly = merchants.length;
    if (merchants.length === 0) {
      merchants = await fetchMerchants(dataClient, false);
    }
    const merchantCountTotal = merchants.length;

    const merchantById = new Map<string, MerchantRow>();
    const brandMap = new Map<string, BrandAggregation>();

    merchants.forEach((merchant) => {
      if (
        isBankMerchantLabel(merchant.business_name) ||
        isBankMerchantLabel(String(merchant.parent_brand ?? ''))
      ) {
        return;
      }

      merchantById.set(merchant.id, merchant);
      const merchantBrandName = String(merchant.parent_brand ?? '').trim();
      const brandMeta = resolveBrandMeta(
        merchantBrandName,
        merchant.business_name,
        merchant.business_type
      );
      if (!brandMeta) return;

      if (!brandMap.has(brandMeta.brandKey)) {
        brandMap.set(brandMeta.brandKey, {
          brandKey: brandMeta.brandKey,
          mappedBrandKey: brandMeta.mappedBrandKey,
          displayName: brandMeta.displayName,
          category: brandMeta.category,
          assetPath: brandMeta.assetPath,
          estimatedLocationCount: brandMeta.estimatedLocationCount,
          estimatedProvinceCount: brandMeta.estimatedProvinceCount,
          merchantIds: [],
          locations: [],
          provinces: new Set<string>(),
          defaultTotalDiscountPct: Number(
            merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT
          ),
          representativeMerchant: merchant,
        });
      }

      const current = brandMap.get(brandMeta.brandKey)!;
      current.merchantIds.push(merchant.id);
      current.locations.push({
        id: merchant.id,
        business_name: merchant.business_name,
        branch_name: merchant.branch_name || merchant.business_name,
        branch_code: merchant.branch_code,
        city: merchant.city,
        province: merchant.province,
        physical_address: merchant.physical_address,
      });
      if (merchant.province) {
        current.provinces.add(merchant.province);
      }
      if (
        current.representativeMerchant?.default_total_discount_pct === null &&
        merchant.default_total_discount_pct !== null
      ) {
        current.representativeMerchant = merchant;
      }
    });

    // Ensure required demo brands always appear with seeded products even if no merchant rows exist yet.
    listMerchantBrands()
      .filter((brand) => DEMO_BRAND_KEYS.has(brand.brandKey))
      .forEach((brand) => {
        if (brandMap.has(brand.brandKey)) return;
        brandMap.set(brand.brandKey, {
          brandKey: brand.brandKey,
          mappedBrandKey: brand.brandKey,
          displayName: brand.displayName,
          category: brand.category,
          assetPath: brand.assetPath,
          estimatedLocationCount: Number(brand.estimatedLocationCount ?? 0),
          estimatedProvinceCount: Number(brand.estimatedProvinceCount ?? 0),
          merchantIds: [],
          locations: [
            {
              id: `demo-${brand.brandKey}`,
              business_name: brand.displayName,
              branch_name: 'National Coverage',
              branch_code: `${brand.brandKey.toUpperCase()}-NAT-001`,
              city: 'South Africa',
              province: 'National',
              physical_address: 'Redeem at participating locations nationwide',
            },
          ],
          provinces: new Set<string>(['National']),
          defaultTotalDiscountPct: DEFAULT_TOTAL_DISCOUNT_PCT,
          representativeMerchant: null,
        });
      });

    const merchantIds = Array.from(
      new Set(Array.from(brandMap.values()).flatMap((brand) => brand.merchantIds))
    );

    const productRows = await fetchProductsForMerchantIds(dataClient, merchantIds);
    const productRowCount = productRows.length;

    const representativeByCategory = new Map<string, MerchantRow>();
    let globalRepresentative: MerchantRow | null = null;
    Array.from(brandMap.values()).forEach((brand) => {
      if (!brand.representativeMerchant) return;
      const categoryKey = String(brand.category || '')
        .trim()
        .toLowerCase();
      if (categoryKey && !representativeByCategory.has(categoryKey)) {
        representativeByCategory.set(categoryKey, brand.representativeMerchant);
      }
      if (!globalRepresentative) {
        globalRepresentative = brand.representativeMerchant;
      }
    });

    const checkoutRepresentativeByBrandKey = new Map<string, MerchantRow | null>();
    Array.from(brandMap.values()).forEach((brand) => {
      const categoryKey = String(brand.category || '')
        .trim()
        .toLowerCase();
      const categoryRepresentative =
        (categoryKey ? representativeByCategory.get(categoryKey) : null) ?? null;
      checkoutRepresentativeByBrandKey.set(
        brand.brandKey,
        brand.representativeMerchant ?? categoryRepresentative ?? globalRepresentative ?? null
      );
    });

    const dbProductsByBrand = new Map<string, CatalogProduct[]>();
    Array.from(brandMap.keys()).forEach((brandKey) => dbProductsByBrand.set(brandKey, []));

    productRows.forEach((row) => {
      const merchant = merchantById.get(row.merchant_id);
      if (!merchant) return;

      const productBrandName =
        String(row.parent_brand ?? '').trim() ||
        String(merchant.parent_brand ?? '').trim() ||
        merchant.business_name;
      const brandMeta = resolveBrandMeta(
        productBrandName,
        merchant.business_name,
        merchant.business_type
      );
      if (!brandMeta) return;
      if (!dbProductsByBrand.has(brandMeta.brandKey)) {
        dbProductsByBrand.set(brandMeta.brandKey, []);
      }

      const brand = brandMap.get(brandMeta.brandKey);
      const faceValue = Number(row.face_value);
      const totalDiscountPct = Number(
        row.total_discount_pct ?? merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT
      );

      if (!Number.isFinite(faceValue) || faceValue <= 0) {
        return;
      }

      let pricing;
      try {
        pricing = calculateDiscountPricing(faceValue, totalDiscountPct);
      } catch {
        return;
      }

      dbProductsByBrand.get(brandMeta.brandKey)?.push({
        id: row.id,
        brandKey: brandMeta.brandKey,
        source: 'db',
        merchant_id: merchant.id,
        merchant_name: brand?.displayName ?? brandMeta.displayName,
        parent_brand: brand?.displayName ?? brandMeta.displayName,
        product_name: row.product_name,
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
        redemption_scope: normalizeScope(row.redemption_scope),
        valid_provinces: uniqueStrings(row.valid_provinces),
        valid_branch_ids: uniqueStrings(row.valid_branch_ids),
        valid_location_count: getResolvedLocationCount(brand),
        is_active: true,
        is_special: Boolean(row.is_special),
        special_title: row.special_title ?? null,
        special_end_at: row.special_end_at ?? null,
        display_priority: Number(row.display_priority ?? 0),
        created_at: row.created_at,
      });
    });

    const dedupedProductsByBrand = new Map<string, CatalogProduct[]>();
    dbProductsByBrand.forEach((products, brandKey) => {
      dedupedProductsByBrand.set(brandKey, dedupeProducts(products));
    });

    const brandSummaries = Array.from(brandMap.values())
      .map((brand) => {
        const checkoutMerchant = checkoutRepresentativeByBrandKey.get(brand.brandKey) ?? null;
        const dbProducts = dedupedProductsByBrand.get(brand.brandKey) ?? [];
        const starterProducts =
          brand.mappedBrandKey && dbProducts.length === 0
            ? getStarterProductsForBrand(brand.mappedBrandKey)
            : [];
        const matchesSearch =
          !searchTerm ||
          withSearchMatch(brand.displayName, searchTerm) ||
          withSearchMatch(brand.category, searchTerm) ||
          brand.locations.some(
            (location) =>
              withSearchMatch(location.branch_name, searchTerm) ||
              withSearchMatch(location.city ?? '', searchTerm) ||
              withSearchMatch(location.province ?? '', searchTerm)
          ) ||
          dbProducts.some(
            (product) =>
              withSearchMatch(product.product_name, searchTerm) ||
              withSearchMatch(product.merchant_name, searchTerm)
          ) ||
          starterProducts.some((product) => withSearchMatch(product.name, searchTerm));

        return {
          brandKey: brand.brandKey,
          displayName: brand.displayName,
          category: brand.category,
          assetPath: brand.assetPath,
          merchantCount: getResolvedLocationCount(brand),
          productCount:
            dbProducts.length > 0
              ? dbProducts.length
              : brand.mappedBrandKey
                ? getStarterProductCountForBrand(brand.mappedBrandKey)
                : 0,
          merchantId: checkoutMerchant?.id ?? null,
          merchantName: checkoutMerchant?.business_name ?? null,
          defaultTotalDiscountPct: Number(
            checkoutMerchant?.default_total_discount_pct ?? brand.defaultTotalDiscountPct
          ),
          matchesSearch,
          provinceCount: getResolvedProvinceCount(brand),
          locations: brand.locations,
        };
      })
      .filter((brand) => brand.productCount > 0)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    const validRequestedBrand = requestedBrandRaw
      ? brandSummaries.find((brand) => brand.brandKey === requestedBrandRaw)
      : null;
    const shouldUseRequestedBrand =
      Boolean(validRequestedBrand) && (!searchTerm || Boolean(validRequestedBrand?.matchesSearch));
    const defaultBrandKey =
      (shouldUseRequestedBrand ? validRequestedBrand?.brandKey : null) ??
      brandSummaries.find((brand) => brand.matchesSearch)?.brandKey ??
      validRequestedBrand?.brandKey ??
      brandSummaries[0]?.brandKey ??
      '';

    const selectedBrand = brandMap.get(defaultBrandKey);
    const selectedCheckoutMerchant =
      (selectedBrand ? checkoutRepresentativeByBrandKey.get(selectedBrand.brandKey) : null) ?? null;
    const selectedDbProducts = dedupedProductsByBrand.get(defaultBrandKey) ?? [];

    let selectedProducts: CatalogProduct[] = selectedDbProducts;
    const selectedDbProductCount = selectedDbProducts.length;
    let usedStarterFallback = false;
    if (selectedProducts.length === 0 && selectedBrand?.mappedBrandKey) {
      usedStarterFallback = true;
      selectedProducts = buildStarterProductsForBrand({
        brandKey: selectedBrand.mappedBrandKey,
        merchantId: selectedCheckoutMerchant?.id ?? null,
        merchantName: selectedBrand.displayName,
        defaultTotalDiscountPct:
          selectedCheckoutMerchant?.default_total_discount_pct ??
          selectedBrand.defaultTotalDiscountPct,
      }).map((product) => ({
        ...product,
        brandKey: defaultBrandKey,
        parent_brand: selectedBrand.displayName,
        redemption_scope: 'all_branches' as const,
        valid_provinces: [],
        valid_branch_ids: [],
        valid_location_count: getResolvedLocationCount(selectedBrand),
        source: 'starter' as const,
        is_special: false,
        special_title: null,
        special_end_at: null,
        display_priority: 0,
        created_at: new Date().toISOString(),
      }));
    }

    if (searchTerm) {
      selectedProducts = selectedProducts.filter(
        (product) =>
          withSearchMatch(product.product_name, searchTerm) ||
          withSearchMatch(product.merchant_name, searchTerm) ||
          withSearchMatch(product.parent_brand, searchTerm)
      );
    }

    selectedProducts = selectedProducts
      .filter((product) => {
        if (!product.is_special || !product.special_end_at) return true;
        return new Date(product.special_end_at).getTime() > Date.now();
      })
      .sort((a, b) => {
        const specialWeight = Number(Boolean(b.is_special)) - Number(Boolean(a.is_special));
        if (specialWeight !== 0) return specialWeight;
        const priorityWeight = Number(b.display_priority ?? 0) - Number(a.display_priority ?? 0);
        if (priorityWeight !== 0) return priorityWeight;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    return NextResponse.json(
      {
        brands: brandSummaries,
        products: selectedProducts,
        selectedBrandKey: defaultBrandKey,
        ussdAccessCode: '*120*384#',
        mode: 'brand_catalog',
        diagnostics: debugEnabled
          ? {
              hasAdminEnv,
              merchantCountActiveOnly,
              merchantCountTotal,
              brandCount: brandSummaries.length,
              merchantIdsCount: merchantIds.length,
              productRowCount,
              selectedBrandKey: defaultBrandKey,
              selectedDbProductCount,
              usedStarterFallback,
            }
          : undefined,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load shop catalog.', code: 'shop_catalog_failed' },
      { status: 500 }
    );
  }
}
