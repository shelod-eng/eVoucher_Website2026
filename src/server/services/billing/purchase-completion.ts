import type { SupabaseClient } from '@supabase/supabase-js';
import {
  calculateDiscountPricing,
  DEFAULT_TOTAL_DISCOUNT_PCT,
} from '@/lib/pricing';
import { recordVoucherPurchaseBillingEvent } from '@/server/services/billing/billing-events';
import { DefaultVoucherService } from '@/server/services/voucher/default-voucher-service';
import { generateSecureVoucherCode } from '@/server/utils/security';

type MerchantSnapshot = {
  id: string;
  business_name: string;
  parent_brand?: string | null;
};

type TransactionSnapshot = {
  customer_id: string;
  merchant_id: string;
  product_id?: string | null;
  transaction_reference: string;
  voucher_code?: string | null;
  face_value?: number | null;
  total_discount_pct?: number | null;
  consumer_price?: number | null;
  amount?: number | null;
};

function round2(value: number) {
  return Number(value.toFixed(2));
}

function safeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function deriveTotalDiscountPct(faceValue: number, consumerPrice: number, fallback: number) {
  if (faceValue > 0 && consumerPrice >= 0 && consumerPrice <= faceValue) {
    return round2(((faceValue - consumerPrice) / faceValue) * 100);
  }
  return fallback;
}

export async function ensureCompletedPurchaseArtifacts(
  admin: SupabaseClient,
  input: {
    merchant: MerchantSnapshot;
    transaction: TransactionSnapshot;
    occurredAt: string;
    metadata?: Record<string, unknown>;
  }
) {
  const faceValue = safeNumber(
    input.transaction.face_value ?? input.transaction.amount ?? input.transaction.consumer_price
  );
  const consumerPrice = safeNumber(
    input.transaction.consumer_price ?? input.transaction.amount ?? faceValue
  );
  const totalDiscountPct = deriveTotalDiscountPct(
    faceValue,
    consumerPrice,
    safeNumber(input.transaction.total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT)
  );
  const pricing = calculateDiscountPricing(faceValue, totalDiscountPct || DEFAULT_TOTAL_DISCOUNT_PCT);

  let voucherCode = String(input.transaction.voucher_code ?? '').trim() || null;
  let voucherId: string | null = null;

  if (voucherCode) {
    const { data: existingVoucher } = await admin
      .from('customer_vouchers')
      .select('id')
      .eq('customer_id', input.transaction.customer_id)
      .eq('voucher_code', voucherCode)
      .maybeSingle();
    voucherId = String(existingVoucher?.id ?? '').trim() || null;
  }

  if (!voucherId) {
    voucherCode = voucherCode || generateSecureVoucherCode();
    const voucherService = new DefaultVoucherService();
    const issued = await voucherService.issueVoucher({
      customerId: input.transaction.customer_id,
      merchantId: input.merchant.id,
      productId: input.transaction.product_id ?? undefined,
      merchantName: input.merchant.business_name,
      parentBrand: input.merchant.parent_brand ?? input.merchant.business_name,
      faceValue: faceValue || pricing.faceValue,
      discountPercent: pricing.consumerBenefitPct,
      pricing,
      voucherCode,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    });
    voucherId = issued.voucherId;
  }

  await admin
    .from('payment_transactions')
    .update({
      amount: consumerPrice || pricing.consumerPrice,
      payment_status: 'completed',
      voucher_code: voucherCode,
    })
    .eq('transaction_reference', input.transaction.transaction_reference);

  await recordVoucherPurchaseBillingEvent(admin, {
    eventKey: input.transaction.transaction_reference,
    merchantId: input.merchant.id,
    customerId: input.transaction.customer_id,
    voucherId: voucherId ?? undefined,
    consumerPrice: consumerPrice || pricing.consumerPrice,
    faceValue: faceValue || pricing.faceValue,
    totalDiscountPct: totalDiscountPct || pricing.totalDiscountPct,
    occurredAt: input.occurredAt,
    metadata: {
      paymentStatus: 'completed',
      voucherCode,
      source: 'payment_completion',
      ...(input.metadata ?? {}),
    },
  });

  return {
    voucherCode,
    voucherId,
    pricing,
  };
}
