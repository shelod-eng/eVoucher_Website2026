import { createAdminClient } from '@/lib/supabase/admin';
import {
  RedeemVoucherInput,
  IssueVoucherInput,
  RedemptionScope,
  VoucherService,
} from '@/server/services/voucher-service';
import { sha256 } from '@/server/utils/security';

function normalizeText(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function normalizeTextArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => normalizeText(entry)).filter((entry) => entry.length > 0);
}

function normalizeUuidArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry)).filter((entry) => entry.length > 0);
}

function resolveVoucherScope(voucher: any): RedemptionScope {
  const scope = String(voucher?.redemption_scope ?? '')
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

function validateVoucherScopeForMerchant(voucher: any, input: RedeemVoucherInput) {
  const voucherBrand = normalizeText(voucher?.parent_brand || voucher?.merchant_name);
  const merchantBrand = normalizeText(input.merchantParentBrand || input.merchantName);

  if (voucherBrand && merchantBrand && voucherBrand !== merchantBrand) {
    return { valid: false, message: 'Voucher is not valid for this brand.' };
  }

  const scope = resolveVoucherScope(voucher);
  if (scope === 'all_branches' || scope === 'national') {
    return { valid: true };
  }

  if (scope === 'specific_branch') {
    const allowedBranchIds = normalizeUuidArray(voucher?.valid_branch_ids);
    if (allowedBranchIds.length === 0) {
      if (voucher?.merchant_id && String(voucher.merchant_id) !== input.merchantId) {
        return { valid: false, message: 'Voucher is not valid for this branch.' };
      }
      return { valid: true };
    }

    if (!allowedBranchIds.includes(input.merchantId)) {
      return { valid: false, message: 'Voucher is not valid for this branch.' };
    }
    return { valid: true };
  }

  if (scope === 'province_wide') {
    const allowedProvinces = normalizeTextArray(voucher?.valid_provinces);
    if (allowedProvinces.length === 0) {
      return { valid: true };
    }

    const merchantProvince = normalizeText(input.merchantProvince);
    if (!merchantProvince || !allowedProvinces.includes(merchantProvince)) {
      return { valid: false, message: 'Voucher is not valid in this province.' };
    }
    return { valid: true };
  }

  return {
    valid: voucher?.merchant_name === input.merchantName,
    message: 'Voucher is not valid for this merchant.',
  };
}

export class DefaultVoucherService implements VoucherService {
  async issueVoucher(input: IssueVoucherInput): Promise<{ voucherId: string }> {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('customer_vouchers')
      .insert({
        customer_id: input.customerId,
        merchant_id: input.merchantId ?? null,
        product_id: input.productId ?? null,
        merchant_name: input.merchantName,
        parent_brand: input.parentBrand ?? input.merchantName,
        redemption_scope: input.redemptionScope ?? 'all_branches',
        valid_provinces: input.validProvinces ?? [],
        valid_branch_ids: input.validBranchIds ?? [],
        qr_code_url: input.qrCodeUrl ?? null,
        voucher_code: input.voucherCode,
        face_value: input.faceValue,
        discount_percent: input.discountPercent,
        total_discount_pct: input.pricing.totalDiscountPct,
        consumer_benefit_pct: input.pricing.consumerBenefitPct,
        evoucher_benefit_pct: input.pricing.evoucherBenefitPct,
        total_discount_amount: input.pricing.totalDiscountAmount,
        consumer_benefit_amount: input.pricing.consumerBenefitAmount,
        evoucher_benefit_amount: input.pricing.evoucherBenefitAmount,
        consumer_price: input.pricing.consumerPrice,
        merchant_receivable_after_total_discount:
          input.pricing.merchantReceivableAfterTotalDiscount,
        merchant_receivable_after_evoucher_benefit:
          input.pricing.merchantReceivableAfterEvoucherBenefit,
        current_balance: input.faceValue,
        is_active: true,
        expires_at: input.expiresAt,
      })
      .select('id')
      .single();

    if (error) throw error;
    return { voucherId: data.id as string };
  }

  async redeemVoucher(
    input: RedeemVoucherInput
  ): Promise<{ redemptionId: string; remainingBalance: number }> {
    const admin = createAdminClient();

    const { data: existingIdempotency } = await admin
      .from('voucher_redemption_idempotency')
      .select('response_payload')
      .eq('customer_id', input.customerId)
      .eq('idempotency_key', input.idempotencyKey)
      .maybeSingle();

    if (existingIdempotency?.response_payload) {
      const response = existingIdempotency.response_payload as {
        redemptionId: string;
        remainingBalance: number;
      };
      return response;
    }

    const { data: voucher, error: voucherError } = await admin
      .from('customer_vouchers')
      .select('*')
      .eq('voucher_code', input.voucherCode)
      .eq('customer_id', input.customerId)
      .eq('is_active', true)
      .single();

    if (voucherError || !voucher) {
      throw new Error('Voucher not found or inactive.');
    }

    const validation = validateVoucherScopeForMerchant(voucher, input);
    if (!validation.valid) {
      throw new Error(validation.message ?? 'Voucher is not valid for this merchant.');
    }

    if (voucher.expires_at && new Date(voucher.expires_at).getTime() < Date.now()) {
      throw new Error('Voucher has expired.');
    }

    const currentBalance = Number(voucher.current_balance);
    if (input.amount <= 0 || input.amount > currentBalance) {
      throw new Error('Invalid redemption amount.');
    }

    const remainingBalance = Number((currentBalance - input.amount).toFixed(2));
    const shouldStayActive = remainingBalance > 0;
    const redeemedAt = new Date().toISOString();

    const { error: updateError } = await admin
      .from('customer_vouchers')
      .update({
        current_balance: remainingBalance,
        is_active: shouldStayActive,
        redeemed_at_merchant_id: input.merchantId,
        redeemed_at_branch: input.merchantBranchName || input.merchantName,
        redeemed_at: redeemedAt,
      })
      .eq('id', voucher.id);

    if (updateError) throw updateError;

    const { data: redemption, error: redemptionError } = await admin
      .from('redemption_history')
      .insert({
        customer_id: input.customerId,
        voucher_id: voucher.id,
        merchant_name: input.merchantName || voucher.merchant_name,
        amount: input.amount,
        transaction_type: 'redemption',
      })
      .select('id')
      .single();

    if (redemptionError || !redemption) throw redemptionError ?? new Error('Redemption failed.');

    const idempotencyPayload = {
      redemptionId: redemption.id as string,
      remainingBalance,
    };

    await admin.from('voucher_redemption_idempotency').insert({
      customer_id: input.customerId,
      voucher_id: voucher.id,
      idempotency_key: input.idempotencyKey,
      request_hash: sha256(
        JSON.stringify({
          voucherCode: input.voucherCode,
          merchantId: input.merchantId,
          merchantName: input.merchantName,
          amount: input.amount,
        })
      ),
      response_payload: idempotencyPayload,
    });

    return idempotencyPayload;
  }

  async expireVouchers(): Promise<{ expiredCount: number }> {
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await admin
      .from('customer_vouchers')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('expires_at', nowIso)
      .select('id');

    if (error) throw error;
    return { expiredCount: data?.length ?? 0 };
  }
}
