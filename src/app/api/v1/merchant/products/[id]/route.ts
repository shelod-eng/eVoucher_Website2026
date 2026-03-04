import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import {
  calculateDiscountPricing,
  DEFAULT_TOTAL_DISCOUNT_PCT,
  MAX_TOTAL_DISCOUNT_PCT,
  MIN_TOTAL_DISCOUNT_PCT,
} from '@/lib/pricing';
import { isMerchantRole, resolveUserRole } from '@/server/utils/role';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';

interface UpdateMerchantProductRequest {
  productName?: string;
  faceValue?: number;
  totalDiscountPct?: number;
  redemptionScope?: 'all_branches' | 'specific_branch' | 'province_wide' | 'national';
  validProvinces?: string[];
  validBranchIds?: string[];
  isActive?: boolean;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    if (!isMerchantRole(role)) {
      return NextResponse.json(
        { error: 'Merchant product management is merchant-only.', code: 'merchant_only' },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<any>(
      admin,
      user,
      'id,business_name,parent_brand,default_total_discount_pct'
    );
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    }

    const { data: existing, error: existingError } = await admin
      .from('merchant_products')
      .select(
        'id,merchant_id,product_name,face_value,total_discount_pct,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_active'
      )
      .eq('id', params.id)
      .eq('merchant_id', merchant.id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const body = (await request.json()) as UpdateMerchantProductRequest;
    if (
      body.redemptionScope &&
      !['all_branches', 'specific_branch', 'province_wide', 'national'].includes(body.redemptionScope)
    ) {
      return NextResponse.json({ error: 'Redemption scope is invalid.' }, { status: 400 });
    }
    if (body.validProvinces !== undefined && !Array.isArray(body.validProvinces)) {
      return NextResponse.json({ error: 'validProvinces must be an array.' }, { status: 400 });
    }
    if (body.validBranchIds !== undefined && !Array.isArray(body.validBranchIds)) {
      return NextResponse.json({ error: 'validBranchIds must be an array.' }, { status: 400 });
    }
    if (
      body.totalDiscountPct !== undefined &&
      (!Number.isFinite(body.totalDiscountPct) ||
        body.totalDiscountPct < MIN_TOTAL_DISCOUNT_PCT ||
        body.totalDiscountPct > MAX_TOTAL_DISCOUNT_PCT)
    ) {
      return NextResponse.json(
        { error: `Total discount percentage must be between ${MIN_TOTAL_DISCOUNT_PCT} and ${MAX_TOTAL_DISCOUNT_PCT}.` },
        { status: 400 }
      );
    }

    const nextFaceValue = Number(body.faceValue ?? existing.face_value);
    const nextTotalDiscountPct = Number(
      body.totalDiscountPct ?? existing.total_discount_pct ?? merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT
    );

    const pricing = calculateDiscountPricing(nextFaceValue, nextTotalDiscountPct);

    const { data: product, error: updateError } = await admin
      .from('merchant_products')
      .update({
        product_name: body.productName?.trim() || existing.product_name,
        parent_brand: existing.parent_brand || merchant.parent_brand || merchant.business_name,
        redemption_scope: body.redemptionScope ?? existing.redemption_scope ?? 'all_branches',
        valid_provinces: body.validProvinces ?? existing.valid_provinces ?? [],
        valid_branch_ids: body.validBranchIds ?? existing.valid_branch_ids ?? [],
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
        is_active: body.isActive ?? existing.is_active,
      })
      .eq('id', params.id)
      .eq('merchant_id', merchant.id)
      .select(
        'id,product_name,face_value,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,total_discount_amount,consumer_benefit_amount,evoucher_benefit_amount,consumer_price,merchant_receivable_after_total_discount,merchant_receivable_after_evoucher_benefit,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_active,created_at,updated_at'
      )
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      message: 'Product updated.',
      product,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update merchant product.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    if (!isMerchantRole(role)) {
      return NextResponse.json(
        { error: 'Merchant product management is merchant-only.', code: 'merchant_only' },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<any>(admin, user, 'id');
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    }

    const { error } = await admin
      .from('merchant_products')
      .update({ is_active: false })
      .eq('id', params.id)
      .eq('merchant_id', merchant.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Product deactivated.' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to deactivate merchant product.' },
      { status: 500 }
    );
  }
}
