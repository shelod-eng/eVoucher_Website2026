import { createAdminClient } from '@/lib/supabase/admin';
import { RedeemVoucherInput, IssueVoucherInput, VoucherService } from '@/server/services/voucher-service';
import { sha256 } from '@/server/utils/security';

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
        merchant_receivable_after_total_discount: input.pricing.merchantReceivableAfterTotalDiscount,
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

    if (voucher.merchant_name !== input.merchantName) {
      throw new Error('Voucher is not valid for this merchant.');
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

    const { error: updateError } = await admin
      .from('customer_vouchers')
      .update({
        current_balance: remainingBalance,
        is_active: shouldStayActive,
      })
      .eq('id', voucher.id);

    if (updateError) throw updateError;

    const { data: redemption, error: redemptionError } = await admin
      .from('redemption_history')
      .insert({
        customer_id: input.customerId,
        voucher_id: voucher.id,
        merchant_name: input.merchantName,
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
