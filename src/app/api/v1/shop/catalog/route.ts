import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';
import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';
import {
  BrandKey,
  getBrandByKey,
  isBrandKey,
  listMerchantBrands,
  resolveBrandFromMerchantName,
} from '@/lib/merchant-brand-catalog';
import {
  buildStarterProductsForBrand,
  getStarterProductCountForBrand,
  getStarterProductsForBrand,
} from '@/lib/starter-products';

type MerchantRow = {
  id: string;
  business_name: string;
  email: string;
  status: string;
  default_total_discount_pct: number | null;
};

type ProductRow = {
  id: string;
  merchant_id: string;
  product_name: string;
  face_value: number;
  total_discount_pct: number | null;
  is_active: boolean;
  created_at: string;
};

type CatalogProduct = {
  id: string;
  brandKey: BrandKey;
  source: 'db' | 'starter';
  merchant_id: string | null;
  merchant_name: string;
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
  is_active: boolean;
};

function resolveDataClient(supabase: any) {
  try {
    return createAdminClient();
  } catch {
    return supabase;
  }
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

function withSearchMatch(text: string, term: string) {
  if (!term) return true;
  return text.toLowerCase().includes(term);
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
    const requestedBrandKey = isBrandKey(requestedBrandRaw) ? requestedBrandRaw : null;
    const dataClient = resolveDataClient(supabase);
    const brandCatalog = listMerchantBrands();

    const { data: activeRows, error: activeError } = await dataClient
      .from('merchants')
      .select('id,business_name,email,status,default_total_discount_pct')
      .in('status', ['approved', 'active'])
      .order('business_name', { ascending: true })
      .limit(4000);

    if (activeError) throw activeError;

    let merchants = (activeRows ?? []) as MerchantRow[];
    if (merchants.length === 0) {
      const { data: fallbackRows, error: fallbackError } = await dataClient
        .from('merchants')
        .select('id,business_name,email,status,default_total_discount_pct')
        .order('business_name', { ascending: true })
        .limit(4000);
      if (fallbackError) throw fallbackError;
      merchants = (fallbackRows ?? []) as MerchantRow[];
    }

    const merchantsByBrand = new Map<BrandKey, MerchantRow[]>();
    const representativeByBrand = new Map<BrandKey, MerchantRow | null>();
    const merchantById = new Map<string, MerchantRow>();
    const unassignedMerchants: MerchantRow[] = [];

    brandCatalog.forEach((brand) => {
      merchantsByBrand.set(brand.brandKey, []);
      representativeByBrand.set(brand.brandKey, null);
    });

    merchants.forEach((merchant) => {
      merchantById.set(merchant.id, merchant);
      const mappedBrand = resolveBrandFromMerchantName(merchant.business_name);
      if (!mappedBrand) {
        unassignedMerchants.push(merchant);
        return;
      }
      merchantsByBrand.get(mappedBrand)?.push(merchant);
    });

    const unassignedQueue = [...unassignedMerchants];
    brandCatalog.forEach((brand) => {
      const mapped = merchantsByBrand.get(brand.brandKey) ?? [];
      if (mapped.length > 0) {
        representativeByBrand.set(brand.brandKey, mapped[0]);
      } else {
        representativeByBrand.set(brand.brandKey, unassignedQueue.shift() ?? null);
      }
    });

    const brandedMerchantIds = Array.from(
      new Set(
        brandCatalog.flatMap((brand) =>
          (merchantsByBrand.get(brand.brandKey) ?? []).map((merchant) => merchant.id)
        )
      )
    );

    let productRows: ProductRow[] = [];
    if (brandedMerchantIds.length > 0) {
      const { data, error } = await dataClient
        .from('merchant_products')
        .select('id,merchant_id,product_name,face_value,total_discount_pct,is_active,created_at')
        .in('merchant_id', brandedMerchantIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6000);

      if (error && !isMissingRelation(error, 'public.merchant_products')) {
        throw error;
      }
      productRows = (data ?? []) as ProductRow[];
    }

    const dbProductsByBrand = new Map<BrandKey, CatalogProduct[]>();
    brandCatalog.forEach((brand) => dbProductsByBrand.set(brand.brandKey, []));

    productRows.forEach((row) => {
      const merchant = merchantById.get(row.merchant_id);
      if (!merchant) return;
      const mappedBrand = resolveBrandFromMerchantName(merchant.business_name);
      if (!mappedBrand) return;
      const brand = getBrandByKey(mappedBrand);
      const pricing = calculateDiscountPricing(
        Number(row.face_value),
        Number(row.total_discount_pct ?? merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT)
      );

      dbProductsByBrand.get(mappedBrand)?.push({
        id: row.id,
        brandKey: mappedBrand,
        source: 'db',
        merchant_id: merchant.id,
        merchant_name: brand?.displayName ?? merchant.business_name,
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
        is_active: true,
      });
    });

    const defaultBrandKey =
      requestedBrandKey ?? brandCatalog.find((brand) => (representativeByBrand.get(brand.brandKey) ?? null) !== null)?.brandKey ?? brandCatalog[0].brandKey;

    const selectedBrand = getBrandByKey(defaultBrandKey);
    const representativeMerchant = representativeByBrand.get(defaultBrandKey) ?? null;
    const dbSelectedProducts = dbProductsByBrand.get(defaultBrandKey) ?? [];

    let selectedProducts: CatalogProduct[] =
      dbSelectedProducts.length > 0
        ? dbSelectedProducts
        : buildStarterProductsForBrand({
            brandKey: defaultBrandKey,
            merchantId: representativeMerchant?.id ?? null,
            merchantName: selectedBrand?.displayName ?? representativeMerchant?.business_name ?? null,
            defaultTotalDiscountPct:
              representativeMerchant?.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT,
          }).map((product) => ({ ...product, source: 'starter' as const }));

    if (searchTerm) {
      selectedProducts = selectedProducts.filter(
        (product) =>
          withSearchMatch(product.product_name, searchTerm) ||
          withSearchMatch(product.merchant_name, searchTerm)
      );
    }

    const brands = brandCatalog.map((brand) => {
      const representative = representativeByBrand.get(brand.brandKey) ?? null;
      const brandDbProducts = dbProductsByBrand.get(brand.brandKey) ?? [];
      const starterTemplates = getStarterProductsForBrand(brand.brandKey);
      const searchMatches =
        !searchTerm ||
        withSearchMatch(brand.displayName, searchTerm) ||
        withSearchMatch(brand.category, searchTerm) ||
        brandDbProducts.some(
          (product) =>
            withSearchMatch(product.product_name, searchTerm) ||
            withSearchMatch(product.merchant_name, searchTerm)
        ) ||
        starterTemplates.some((product) => withSearchMatch(product.name, searchTerm));

      return {
        brandKey: brand.brandKey,
        displayName: brand.displayName,
        category: brand.category,
        assetPath: brand.assetPath,
        merchantCount: (merchantsByBrand.get(brand.brandKey) ?? []).length,
        productCount:
          brandDbProducts.length > 0
            ? brandDbProducts.length
            : getStarterProductCountForBrand(brand.brandKey),
        merchantId: representative?.id ?? null,
        merchantName: representative?.business_name ?? null,
        defaultTotalDiscountPct: Number(
          representative?.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT
        ),
        matchesSearch: searchMatches,
      };
    });

    return NextResponse.json({
      brands,
      products: selectedProducts,
      selectedBrandKey: defaultBrandKey,
      ussdAccessCode: '*120*384#',
      mode: 'brand_catalog',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load shop catalog.', code: 'shop_catalog_failed' },
      { status: 500 }
    );
  }
}
