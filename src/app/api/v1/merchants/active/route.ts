import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';
import { ensureDemoMerchantsSeeded } from '@/server/utils/demo-merchant-seed';
import {
  calculateDiscountPricing,
  DEFAULT_TOTAL_DISCOUNT_PCT,
  normalizeTotalDiscountPct,
} from '@/lib/pricing';

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

function isMissingSchemaField(error: any, fieldName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const field = fieldName.toLowerCase();
  return (
    message.includes(`column "${field}" does not exist`) ||
    message.includes(`could not find the '${field}' column`) ||
    message.includes(`record "${field}" has no field`) ||
    message.includes('schema cache')
  );
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to buy vouchers.',
          code: 'unauthenticated',
          diagnostics: { isAuthenticated: false },
        },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return NextResponse.json(
        {
          error: 'Only signed-in consumers can buy vouchers.',
          code: 'consumer_only_purchase',
          diagnostics: { isAuthenticated: true, role },
        },
        { status: 403 }
      );
    }

    try {
      const admin = createAdminClient();
      await ensureDemoMerchantsSeeded(admin);
    } catch {
      // Continue without demo seeding when admin env is not available.
    }

    const { client, hasAdminEnv } = resolveDataClient(supabase);
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId')?.trim() || null;
    let activeQuery = client
      .from('merchants')
      .select(
        'id,business_name,email,status,default_total_discount_pct,parent_brand,branch_name,city,province'
      )
      .in('status', ['approved', 'active'])
      .order('business_name', { ascending: true });
    if (merchantId) {
      activeQuery = activeQuery.eq('id', merchantId);
    }
    const { data: activeRows, error: activeError } = await activeQuery;

    if (activeError) throw activeError;

    let rows = activeRows ?? [];
    let usedFallbackStatuses = false;
    if (rows.length === 0) {
      let fallbackQuery = client
        .from('merchants')
        .select(
          'id,business_name,email,status,default_total_discount_pct,parent_brand,branch_name,city,province'
        )
        .order('business_name', { ascending: true })
        .limit(120);
      if (merchantId) {
        fallbackQuery = fallbackQuery.eq('id', merchantId);
      }
      const { data: fallbackRows, error: fallbackError } = await fallbackQuery;
      if (fallbackError) throw fallbackError;
      rows = fallbackRows ?? [];
      usedFallbackStatuses = rows.length > 0;
    }

    const merchantIds = rows.map((merchant: any) => String(merchant.id));
    let productRows: any[] = [];
    if (merchantIds.length > 0) {
      const productFieldSets = [
        'id,merchant_id,product_name,face_value,total_discount_pct,consumer_price,consumer_benefit_amount,parent_brand,is_active,created_at',
        'id,merchant_id,product_name,face_value,total_discount_pct,consumer_price,consumer_benefit_amount,parent_brand,created_at',
      ];
      let productsData: any[] = [];
      let productsError: any = null;

      for (const fields of productFieldSets) {
        const result = await client
          .from('merchant_products')
          .select(fields)
          .in('merchant_id', merchantIds)
          .order('created_at', { ascending: false })
          .limit(5000);

        if (!result.error) {
          productsData = result.data ?? [];
          productsError = null;
          break;
        }

        if (isMissingRelation(result.error, 'public.merchant_products')) {
          productsData = [];
          productsError = null;
          break;
        }

        if (
          isMissingSchemaField(result.error, 'merchant_products.status') ||
          isMissingSchemaField(result.error, 'status')
        ) {
          continue;
        }

        productsError = result.error;
        break;
      }

      if (productsError) {
        throw productsError;
      }

      productRows = (productsData ?? []).filter((product: any) => {
        if (typeof product?.is_active === 'boolean') return product.is_active;
        return true;
      });
    }

    const productsByMerchant = new Map<string, any[]>();
    productRows.forEach((product: any) => {
      const key = String(product.merchant_id ?? '');
      if (!key) return;
      const current = productsByMerchant.get(key) ?? [];
      current.push(product);
      productsByMerchant.set(key, current);
    });

    return NextResponse.json({
      merchants: rows.map((merchant: any) => ({
        id: merchant.id,
        businessName: merchant.business_name,
        email: merchant.email,
        status: merchant.status,
        defaultTotalDiscountPct: Number(merchant.default_total_discount_pct ?? 5),
        parentBrand: merchant.parent_brand ?? merchant.business_name,
        branchName: merchant.branch_name ?? merchant.business_name,
        city: merchant.city ?? null,
        province: merchant.province ?? null,
        productCount: (productsByMerchant.get(String(merchant.id)) ?? []).length,
        products: (productsByMerchant.get(String(merchant.id)) ?? []).slice(0, 6).map((product) => {
          const fallbackDiscountPct = normalizeTotalDiscountPct(
            product.total_discount_pct,
            merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT
          );
          const faceValue = Number(product.face_value ?? 0);
          const pricing =
            Number.isFinite(Number(product.consumer_price)) &&
            Number(product.consumer_price) > 0 &&
            Number.isFinite(Number(product.consumer_benefit_amount))
              ? {
                  faceValue,
                  totalDiscountPct: fallbackDiscountPct,
                  consumerPrice: Number(product.consumer_price),
                  consumerBenefitAmount: Number(product.consumer_benefit_amount),
                }
              : calculateDiscountPricing(faceValue, fallbackDiscountPct);

          return {
            id: String(product.id),
            productName: String(product.product_name ?? 'Voucher Product'),
            faceValue: Number(faceValue.toFixed(2)),
            totalDiscountPct: Number(Number(pricing.totalDiscountPct).toFixed(2)),
            consumerPrice: Number(Number(pricing.consumerPrice).toFixed(2)),
            consumerBenefitAmount: Number(Number(pricing.consumerBenefitAmount).toFixed(2)),
            parentBrand:
              String(product.parent_brand ?? merchant.parent_brand ?? merchant.business_name) ||
              merchant.business_name,
          };
        }),
      })),
      diagnostics: {
        isAuthenticated: true,
        role,
        hasAdminEnv,
        activeMerchantCount: activeRows?.length ?? 0,
        totalMerchantCount: rows.length,
        usedFallbackStatuses,
        productRowCount: productRows.length,
      },
      blockReason: rows.length === 0 ? 'no_active_merchants' : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to fetch active merchants.',
        code: 'merchants_load_failed',
      },
      { status: 500 }
    );
  }
}
