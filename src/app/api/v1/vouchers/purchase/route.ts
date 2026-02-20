import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PurchaseVoucherRequest } from '@/types/domain';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { MockPaymentProvider } from '@/server/services/payment/mock-payment-provider';
import { DefaultVoucherService } from '@/server/services/voucher/default-voucher-service';
import { writeAuditEvent } from '@/server/utils/audit';
import { generateSecureVoucherCode, generateTransactionReference } from '@/server/utils/security';
import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';

function validate(body: PurchaseVoucherRequest): string | null {
  if (!body.merchantId?.trim()) return 'Merchant is required.';
  if (body.faceValue !== undefined && (!Number.isFinite(body.faceValue) || body.faceValue <= 0)) {
    return 'Face value must be > 0.';
  }
  if (body.faceValue !== undefined && body.faceValue > 10000) return 'Face value exceeds the allowed limit.';
  if (!body.productId && body.faceValue === undefined) return 'Either product or face value is required.';
  if (!body.paymentMethod) return 'Payment method is required.';
  return null;
}

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as PurchaseVoucherRequest;
    const validationError = validate(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const admin = createAdminClient();
    const paymentProvider = new MockPaymentProvider();
    const voucherService = new DefaultVoucherService();
    const transactionReference = generateTransactionReference();

    const { data: merchant, error: merchantError } = await admin
      .from('merchants')
      .select('id,business_name,status,default_total_discount_pct')
      .eq('id', body.merchantId)
      .in('status', ['active', 'approved'])
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not available.' }, { status: 404 });
    }

    let productId: string | null = null;
    let pricing: ReturnType<typeof calculateDiscountPricing>;

    if (body.productId) {
      const { data: product, error: productError } = await admin
        .from('merchant_products')
        .select(
          'id,merchant_id,face_value,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,total_discount_amount,consumer_benefit_amount,evoucher_benefit_amount,consumer_price,merchant_receivable_after_total_discount,merchant_receivable_after_evoucher_benefit,is_active'
        )
        .eq('id', body.productId)
        .eq('merchant_id', merchant.id)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        return NextResponse.json({ error: 'Selected product is not available.' }, { status: 404 });
      }

      productId = product.id;
      pricing = {
        faceValue: Number(product.face_value),
        totalDiscountPct: Number(product.total_discount_pct),
        consumerBenefitPct: Number(product.consumer_benefit_pct),
        evoucherBenefitPct: Number(product.evoucher_benefit_pct),
        totalDiscountAmount: Number(product.total_discount_amount),
        consumerBenefitAmount: Number(product.consumer_benefit_amount),
        evoucherBenefitAmount: Number(product.evoucher_benefit_amount),
        consumerPrice: Number(product.consumer_price),
        merchantReceivableAfterTotalDiscount: Number(
          product.merchant_receivable_after_total_discount
        ),
        merchantReceivableAfterEvoucherBenefit: Number(
          product.merchant_receivable_after_evoucher_benefit
        ),
      };
    } else {
      if (body.faceValue === undefined) {
        return NextResponse.json({ error: 'Face value is required when no product is selected.' }, { status: 400 });
      }
      pricing = calculateDiscountPricing(
        body.faceValue,
        Number(merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT)
      );
    }

    const payment = await paymentProvider.createPayment({
      amount: pricing.consumerPrice,
      paymentMethod: body.paymentMethod,
      reference: transactionReference,
    });

    let voucherCode: string | null = null;
    if (payment.status === 'completed') {
      voucherCode = generateSecureVoucherCode();
    }

    const { error: transactionError } = await admin.from('payment_transactions').insert({
      customer_id: user.id,
      merchant_id: merchant.id,
      product_id: productId,
      amount: pricing.consumerPrice,
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
      card_last_four: '0000',
      card_brand: body.paymentMethod,
      payment_status: payment.status,
      voucher_code: voucherCode,
      transaction_reference: transactionReference,
    });

    if (transactionError) throw transactionError;

    if (payment.status === 'completed' && voucherCode) {
      await voucherService.issueVoucher({
        customerId: user.id,
        merchantId: merchant.id,
        productId: productId ?? undefined,
        merchantName: merchant.business_name,
        faceValue: pricing.faceValue,
        discountPercent: pricing.consumerBenefitPct,
        pricing,
        voucherCode,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    await writeAuditEvent(admin, {
      actorId: user.id,
      actorRole: 'customer',
      entityType: 'payment_transaction',
      entityId: transactionReference,
      action: payment.status === 'completed' ? 'voucher_purchase_completed' : 'voucher_purchase_pending',
      metadata: {
        merchantId: merchant.id,
        faceValue: pricing.faceValue,
        consumerPrice: pricing.consumerPrice,
        totalDiscountPct: pricing.totalDiscountPct,
        consumerBenefitPct: pricing.consumerBenefitPct,
        evoucherBenefitPct: pricing.evoucherBenefitPct,
        paymentMethod: body.paymentMethod,
        voucherCode,
      },
      requestId: transactionReference,
    });

    return NextResponse.json({
      transactionReference,
      status: payment.status,
      checkoutUrl: payment.checkoutUrl ?? null,
      voucherCode,
      pricing,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process voucher purchase.' },
      { status: 500 }
    );
  }
}
