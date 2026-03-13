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
import { writeAuditEvent } from '@/server/utils/audit';
import { getMerchantComplianceSnapshot } from '@/server/utils/compliance';

interface UpdateMerchantProductRequest {
  productName?: string;
  faceValue?: number;
  totalDiscountPct?: number;
  redemptionScope?: 'all_branches' | 'specific_branch' | 'province_wide' | 'national';
  validProvinces?: string[];
  validBranchIds?: string[];
  isActive?: boolean;
  isSpecial?: boolean;
  specialTitle?: string;
  specialEndAt?: string | null;
  displayPriority?: number;
}

function isMissingColumn(error: any, columnName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const normalizedColumn = columnName.toLowerCase();
  return (
    (message.includes(`column "${normalizedColumn}"`) && message.includes('does not exist')) ||
    (message.includes(`column ${normalizedColumn}`) && message.includes('does not exist')) ||
    (message.includes(`column "merchant_products.${normalizedColumn}"`) &&
      message.includes('does not exist')) ||
    (message.includes(`column merchant_products.${normalizedColumn}`) &&
      message.includes('does not exist')) ||
    message.includes(`could not find the '${normalizedColumn}' column`) ||
    message.includes(`could not find the column '${normalizedColumn}'`)
  );
}

function isMissingSpecialsColumn(error: any) {
  return ['is_special', 'special_title', 'special_end_at', 'display_priority'].some((column) =>
    isMissingColumn(error, column)
  );
}

function canOperateMerchantProducts(role: string, merchant: any, userId: string) {
  if (isMerchantRole(role)) return true;
  return Boolean(merchant?.user_id) && String(merchant.user_id) === String(userId);
}

function isMerchantStatusOperable(status: unknown) {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase();
  if (process.env.NODE_ENV === 'test') {
    const testRaw = String(
      process.env.FORCE_MERCHANT_AUTO_APPROVAL ??
        process.env.NEXT_PUBLIC_FORCE_MERCHANT_AUTO_APPROVAL ??
        ''
    )
      .trim()
      .toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(testRaw) && normalized === 'pending') return true;
    return normalized === 'approved' || normalized === 'active';
  }
  const forceAutoApproval =
    String(
      process.env.FORCE_MERCHANT_AUTO_APPROVAL ??
        process.env.NEXT_PUBLIC_FORCE_MERCHANT_AUTO_APPROVAL ??
        ''
    )
      .trim()
      .toLowerCase() !== 'false';
  if (forceAutoApproval && normalized === 'pending') return true;
  return normalized === 'approved' || normalized === 'active';
}

async function safeAuditProductEvent(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    actorId: string;
    merchantId: string;
    productId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await writeAuditEvent(admin as any, {
      actorId: input.actorId,
      actorRole: 'merchant',
      entityType: 'merchant_product',
      entityId: input.productId,
      action: input.action,
      metadata: {
        merchantId: input.merchantId,
        ...(input.metadata ?? {}),
      },
      requestId: null,
    });
  } catch (auditError: any) {
    console.warn('[merchant-products][audit][warn]', auditError?.message || auditError);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<any>(
      admin,
      user,
      'id,user_id,business_name,parent_brand,default_total_discount_pct,status'
    );
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    }
    if (!canOperateMerchantProducts(role, merchant, user.id)) {
      return NextResponse.json(
        { error: 'Merchant product management is merchant-only.', code: 'merchant_only' },
        { status: 403 }
      );
    }
    if (!isMerchantStatusOperable(merchant.status)) {
      return NextResponse.json(
        {
          error:
            'Merchant is not approved for product operations yet. Complete onboarding approval first.',
          code: 'merchant_not_approved',
          merchantStatus: merchant.status,
        },
        { status: 409 }
      );
    }
    const complianceSnapshot = await getMerchantComplianceSnapshot(
      admin,
      merchant.id,
      merchant.status
    );
    if (!complianceSnapshot.canIssueVouchers) {
      return NextResponse.json(
        {
          error:
            'Compliance verification is incomplete. Upload and verify all required compliance documents before updating products.',
          code: 'compliance_not_verified',
          overallStatus: complianceSnapshot.overallStatus,
          missingDocuments: complianceSnapshot.missingDocuments,
        },
        { status: 409 }
      );
    }
    const body = (await request.json()) as UpdateMerchantProductRequest;

    const { data: existing, error: existingError } = await admin
      .from('merchant_products')
      .select(
        'id,merchant_id,product_name,face_value,total_discount_pct,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_active,is_special,special_title,special_end_at,display_priority'
      )
      .eq('id', params.id)
      .eq('merchant_id', merchant.id)
      .maybeSingle();

    if (existingError && !isMissingSpecialsColumn(existingError)) throw existingError;
    if (existingError && isMissingSpecialsColumn(existingError)) {
      const fallbackExisting = await admin
        .from('merchant_products')
        .select(
          'id,merchant_id,product_name,face_value,total_discount_pct,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_active'
        )
        .eq('id', params.id)
        .eq('merchant_id', merchant.id)
        .maybeSingle();
      if (fallbackExisting.error) throw fallbackExisting.error;
      if (!fallbackExisting.data) {
        return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
      }
      const current = fallbackExisting.data as any;
      const nextFaceValue = Number(body.faceValue ?? current.face_value);
      const nextTotalDiscountPct = Number(
        body.totalDiscountPct ??
          current.total_discount_pct ??
          merchant.default_total_discount_pct ??
          DEFAULT_TOTAL_DISCOUNT_PCT
      );
      const pricing = calculateDiscountPricing(nextFaceValue, nextTotalDiscountPct);
      const { validateAllCriticalRules } = require('@/server/utils/business-rules-validator');
      const ruleCheck = validateAllCriticalRules(pricing);
      if (!ruleCheck.isValid) {
        return NextResponse.json(
          {
            error: 'Business rule violation',
            violations: ruleCheck.violations.map((v: any) => v.message),
          },
          { status: 400 }
        );
      }
      const fallbackUpdate = await admin
        .from('merchant_products')
        .update({
          product_name: body.productName?.trim() || current.product_name,
          parent_brand: current.parent_brand || merchant.parent_brand || merchant.business_name,
          redemption_scope: body.redemptionScope ?? current.redemption_scope ?? 'all_branches',
          valid_provinces: body.validProvinces ?? current.valid_provinces ?? [],
          valid_branch_ids: body.validBranchIds ?? current.valid_branch_ids ?? [],
          face_value: pricing.faceValue,
          total_discount_pct: pricing.totalDiscountPct,
          consumer_benefit_pct: pricing.consumerBenefitPct,
          evoucher_benefit_pct: pricing.evoucherBenefitPct,
          total_discount_amount: pricing.totalDiscountAmount,
          consumer_benefit_amount: pricing.consumerBenefitAmount,
          evoucher_benefit_amount: pricing.evoucherBenefitAmount,
          consumer_price: pricing.consumerPrice,
          merchant_receivable_after_total_discount: pricing.merchantReceivableAfterTotalDiscount,
          merchant_receivable_after_evoucher_benefit:
            pricing.merchantReceivableAfterEvoucherBenefit,
          is_active: body.isActive ?? current.is_active,
        })
        .eq('id', params.id)
        .eq('merchant_id', merchant.id)
        .select(
          'id,product_name,face_value,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,total_discount_amount,consumer_benefit_amount,evoucher_benefit_amount,consumer_price,merchant_receivable_after_total_discount,merchant_receivable_after_evoucher_benefit,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_active,created_at,updated_at'
        )
        .single();
      if (fallbackUpdate.error) throw fallbackUpdate.error;
      await safeAuditProductEvent(admin, {
        actorId: user.id,
        merchantId: merchant.id,
        productId: String(params.id),
        action: 'merchant_product_updated',
        metadata: {
          usedSpecialsFallback: true,
        },
      });
      return NextResponse.json({
        message: 'Product updated.',
        product: {
          ...fallbackUpdate.data,
          is_special: false,
          special_title: null,
          special_end_at: null,
          display_priority: 0,
        },
      });
    }
    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    if (
      body.redemptionScope &&
      !['all_branches', 'specific_branch', 'province_wide', 'national'].includes(
        body.redemptionScope
      )
    ) {
      return NextResponse.json({ error: 'Redemption scope is invalid.' }, { status: 400 });
    }
    if (body.validProvinces !== undefined && !Array.isArray(body.validProvinces)) {
      return NextResponse.json({ error: 'validProvinces must be an array.' }, { status: 400 });
    }
    if (body.validBranchIds !== undefined && !Array.isArray(body.validBranchIds)) {
      return NextResponse.json({ error: 'validBranchIds must be an array.' }, { status: 400 });
    }
    const nextScope = body.redemptionScope ?? existing.redemption_scope ?? 'all_branches';
    const nextBranchIds = body.validBranchIds ?? existing.valid_branch_ids ?? [];
    const nextProvinces = body.validProvinces ?? existing.valid_provinces ?? [];
    if (nextScope === 'specific_branch' && nextBranchIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one branch must be selected for specific_branch scope.' },
        { status: 400 }
      );
    }
    if (nextScope === 'province_wide' && nextProvinces.length === 0) {
      return NextResponse.json(
        { error: 'At least one province must be selected for province_wide scope.' },
        { status: 400 }
      );
    }
    if (
      body.displayPriority !== undefined &&
      (!Number.isFinite(body.displayPriority) || body.displayPriority < 0)
    ) {
      return NextResponse.json(
        { error: 'displayPriority must be a number greater than or equal to 0.' },
        { status: 400 }
      );
    }
    if (
      body.totalDiscountPct !== undefined &&
      (!Number.isFinite(body.totalDiscountPct) ||
        body.totalDiscountPct < MIN_TOTAL_DISCOUNT_PCT ||
        body.totalDiscountPct > MAX_TOTAL_DISCOUNT_PCT)
    ) {
      return NextResponse.json(
        {
          error: `Total discount percentage must be between ${MIN_TOTAL_DISCOUNT_PCT} and ${MAX_TOTAL_DISCOUNT_PCT}.`,
        },
        { status: 400 }
      );
    }

    const nextFaceValue = Number(body.faceValue ?? existing.face_value);
    const nextTotalDiscountPct = Number(
      body.totalDiscountPct ??
        existing.total_discount_pct ??
        merchant.default_total_discount_pct ??
        DEFAULT_TOTAL_DISCOUNT_PCT
    );
    if (
      body.totalDiscountPct !== undefined &&
      Number(existing.total_discount_pct ?? nextTotalDiscountPct) !== nextTotalDiscountPct
    ) {
      return NextResponse.json(
        {
          error:
            'Total discount is immutable after product creation. Create a new product to change discount.',
          code: 'immutable_discount',
        },
        { status: 409 }
      );
    }
    const nextIsSpecial = body.isSpecial ?? existing.is_special ?? false;
    const nextSpecialTitle = nextIsSpecial
      ? String(body.specialTitle ?? existing.special_title ?? '').trim()
      : null;
    const nextSpecialEndAtRaw = nextIsSpecial
      ? body.specialEndAt !== undefined
        ? String(body.specialEndAt).trim()
        : String(existing.special_end_at ?? '').trim()
      : null;
    if (nextIsSpecial && !nextSpecialTitle) {
      return NextResponse.json(
        { error: 'specialTitle is required when isSpecial is true.' },
        { status: 400 }
      );
    }
    const isUpdatingSpecialConfig =
      body.specialEndAt !== undefined ||
      body.specialTitle !== undefined ||
      body.isSpecial !== undefined ||
      body.displayPriority !== undefined;
    if (nextIsSpecial && isUpdatingSpecialConfig) {
      if (!nextSpecialEndAtRaw) {
        return NextResponse.json(
          { error: 'specialEndAt is required when isSpecial is true.' },
          { status: 400 }
        );
      }
      const endAt = new Date(nextSpecialEndAtRaw);
      if (Number.isNaN(endAt.getTime()) || endAt.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: 'specialEndAt must be a valid future date/time.' },
          { status: 400 }
        );
      }
    }
    const nextSpecialEndAt = nextIsSpecial
      ? new Date(String(nextSpecialEndAtRaw)).toISOString()
      : null;
    const nextDisplayPriority = Number(
      body.displayPriority ?? existing.display_priority ?? (nextIsSpecial ? 100 : 0)
    );

    const pricing = calculateDiscountPricing(nextFaceValue, nextTotalDiscountPct);
    const { validateAllCriticalRules } = require('@/server/utils/business-rules-validator');
    const ruleCheck = validateAllCriticalRules(pricing);
    if (!ruleCheck.isValid) {
      return NextResponse.json(
        {
          error: 'Business rule violation',
          violations: ruleCheck.violations.map((v: any) => v.message),
        },
        { status: 400 }
      );
    }

    const { data: product, error: updateError } = await admin
      .from('merchant_products')
      .update({
        product_name: body.productName?.trim() || existing.product_name,
        parent_brand: existing.parent_brand || merchant.parent_brand || merchant.business_name,
        redemption_scope: body.redemptionScope ?? existing.redemption_scope ?? 'all_branches',
        valid_provinces: body.validProvinces ?? existing.valid_provinces ?? [],
        valid_branch_ids: body.validBranchIds ?? existing.valid_branch_ids ?? [],
        is_special: nextIsSpecial,
        special_title: nextSpecialTitle,
        special_end_at: nextSpecialEndAt,
        display_priority: nextDisplayPriority,
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
        'id,product_name,face_value,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,total_discount_amount,consumer_benefit_amount,evoucher_benefit_amount,consumer_price,merchant_receivable_after_total_discount,merchant_receivable_after_evoucher_benefit,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_active,is_special,special_title,special_end_at,display_priority,created_at,updated_at'
      )
      .single();

    if (updateError && !isMissingSpecialsColumn(updateError)) throw updateError;
    if (updateError && isMissingSpecialsColumn(updateError)) {
      const fallbackUpdate = await admin
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
          merchant_receivable_after_evoucher_benefit:
            pricing.merchantReceivableAfterEvoucherBenefit,
          is_active: body.isActive ?? existing.is_active,
        })
        .eq('id', params.id)
        .eq('merchant_id', merchant.id)
        .select(
          'id,product_name,face_value,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,total_discount_amount,consumer_benefit_amount,evoucher_benefit_amount,consumer_price,merchant_receivable_after_total_discount,merchant_receivable_after_evoucher_benefit,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_active,created_at,updated_at'
        )
        .single();
      if (fallbackUpdate.error) throw fallbackUpdate.error;
      await safeAuditProductEvent(admin, {
        actorId: user.id,
        merchantId: merchant.id,
        productId: String(params.id),
        action: 'merchant_product_updated',
        metadata: {
          usedSpecialsFallback: true,
        },
      });
      return NextResponse.json({
        message: 'Product updated.',
        product: {
          ...fallbackUpdate.data,
          is_special: false,
          special_title: null,
          special_end_at: null,
          display_priority: 0,
        },
      });
    }

    await safeAuditProductEvent(admin, {
      actorId: user.id,
      merchantId: merchant.id,
      productId: String(params.id),
      action: 'merchant_product_updated',
      metadata: {
        usedSpecialsFallback: false,
      },
    });
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

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<any>(admin, user, 'id,user_id,status');
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    }
    if (!canOperateMerchantProducts(role, merchant, user.id)) {
      return NextResponse.json(
        { error: 'Merchant product management is merchant-only.', code: 'merchant_only' },
        { status: 403 }
      );
    }
    if (!isMerchantStatusOperable(merchant.status)) {
      return NextResponse.json(
        {
          error:
            'Merchant is not approved for product operations yet. Complete onboarding approval first.',
          code: 'merchant_not_approved',
          merchantStatus: merchant.status,
        },
        { status: 409 }
      );
    }
    const complianceSnapshot = await getMerchantComplianceSnapshot(
      admin,
      merchant.id,
      merchant.status
    );
    if (!complianceSnapshot.canIssueVouchers) {
      return NextResponse.json(
        {
          error:
            'Compliance verification is incomplete. Upload and verify all required compliance documents before managing products.',
          code: 'compliance_not_verified',
          overallStatus: complianceSnapshot.overallStatus,
          missingDocuments: complianceSnapshot.missingDocuments,
        },
        { status: 409 }
      );
    }

    const { error } = await admin
      .from('merchant_products')
      .update({ is_active: false })
      .eq('id', params.id)
      .eq('merchant_id', merchant.id);

    if (error) throw error;
    await safeAuditProductEvent(admin, {
      actorId: user.id,
      merchantId: merchant.id,
      productId: String(params.id),
      action: 'merchant_product_deactivated',
    });

    return NextResponse.json({ message: 'Product deactivated.' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to deactivate merchant product.' },
      { status: 500 }
    );
  }
}
