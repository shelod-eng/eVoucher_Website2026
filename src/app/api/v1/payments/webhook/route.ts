import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MockPaymentProvider } from '@/server/services/payment/mock-payment-provider';
import { recordWalletCredit } from '@/server/services/wallet/ledger';
import { writeAuditEvent } from '@/server/utils/audit';
import { sha256 } from '@/server/utils/security';
import {
  calculateDiscountPricing,
  CONSUMER_DISCOUNT_SHARE,
  DEFAULT_TOTAL_DISCOUNT_PCT,
} from '@/lib/pricing';
import { ensureCompletedPurchaseArtifacts } from '@/server/services/billing/purchase-completion';

interface WebhookPayload {
  eventId?: string;
  transactionReference?: string;
  status?: string;
  amount?: number | string;
  settledAmount?: number | string;
}

export async function POST(request: Request) {
  try {
    const payloadText = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');
    const provider = request.headers.get('x-payment-provider') || 'mock';
    const paymentProvider = new MockPaymentProvider();
    const admin = createAdminClient();

    const verified = await paymentProvider.verifyWebhook({
      payload: payloadText,
      signature,
      timestamp,
    });

    if (!verified) {
      await writeAuditEvent(admin, {
        actorId: null,
        actorRole: null,
        entityType: 'payment_webhook',
        action: 'webhook_rejected_invalid_signature',
        metadata: { provider },
      });
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
    }

    const payload = JSON.parse(payloadText) as WebhookPayload;
    if (!payload.eventId || !payload.transactionReference || !payload.status) {
      return NextResponse.json({ error: 'Missing required webhook fields.' }, { status: 400 });
    }

    const { error: webhookInsertError } = await admin.from('payment_webhook_events').insert({
      provider,
      provider_event_id: payload.eventId,
      payload_hash: sha256(payloadText),
    });

    if (webhookInsertError) {
      if (webhookInsertError.message?.toLowerCase().includes('duplicate')) {
        return NextResponse.json({ status: 'ignored_duplicate' });
      }
      throw webhookInsertError;
    }

    const normalizedStatus = paymentProvider.normalizeStatus(payload.status);
    const { data: transaction, error: transactionError } = await admin
      .from('payment_transactions')
      .select('*')
      .eq('transaction_reference', payload.transactionReference)
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    }
    const previousStatus = String(transaction.payment_status ?? '')
      .toLowerCase()
      .trim();
    const settledAmountCandidate = Number(
      payload.settledAmount ?? payload.amount ?? transaction.amount ?? 0
    );
    const settledAmount =
      Number.isFinite(settledAmountCandidate) && settledAmountCandidate > 0
        ? Number(settledAmountCandidate.toFixed(2))
        : Number(transaction.amount ?? 0);
    const isWalletTopupTransaction = !transaction.merchant_id && !transaction.voucher_code;

    const faceValue = Number(transaction.face_value ?? settledAmount);
    const rawTotalDiscountPct = transaction.total_discount_pct ?? null;
    const rawConsumerBenefitPct = transaction.consumer_benefit_pct ?? null;
    const rawEvoucherBenefitPct = transaction.evoucher_benefit_pct ?? null;
    const derivedTotalDiscountPct =
      rawTotalDiscountPct !== null && rawTotalDiscountPct !== undefined
        ? Number(rawTotalDiscountPct)
        : rawConsumerBenefitPct !== null &&
            rawConsumerBenefitPct !== undefined &&
            rawEvoucherBenefitPct !== null &&
            rawEvoucherBenefitPct !== undefined
          ? Number(rawConsumerBenefitPct) + Number(rawEvoucherBenefitPct)
          : rawConsumerBenefitPct !== null && rawConsumerBenefitPct !== undefined
            ? Number(rawConsumerBenefitPct) / CONSUMER_DISCOUNT_SHARE
            : DEFAULT_TOTAL_DISCOUNT_PCT;
    const totalDiscountPct = Number.isFinite(derivedTotalDiscountPct)
      ? derivedTotalDiscountPct
      : DEFAULT_TOTAL_DISCOUNT_PCT;
    const pricing = calculateDiscountPricing(faceValue, totalDiscountPct);

    let voucherCode: string | null = transaction.voucher_code;
    if (normalizedStatus === 'completed' && isWalletTopupTransaction) {
      if (previousStatus !== 'completed') {
        await recordWalletCredit(admin, {
          customerId: transaction.customer_id,
          userEmail: null,
          amount: settledAmount,
          description: `Wallet top-up ${payload.transactionReference}`,
        });
      }
    } else if (normalizedStatus === 'completed') {
      const { data: merchant, error: merchantError } = await admin
        .from('merchants')
        .select('id,business_name,parent_brand')
        .eq('id', transaction.merchant_id)
        .single();

      if (merchantError || !merchant) {
        throw merchantError ?? new Error('Merchant not found for transaction.');
      }
      const completed = await ensureCompletedPurchaseArtifacts(admin, {
        merchant: {
          id: String(merchant.id),
          business_name: String(merchant.business_name),
          parent_brand: merchant.parent_brand ?? merchant.business_name,
        },
        transaction: {
          customer_id: String(transaction.customer_id),
          merchant_id: String(transaction.merchant_id),
          product_id: transaction.product_id ?? null,
          transaction_reference: String(payload.transactionReference),
          voucher_code: transaction.voucher_code ?? null,
          face_value: faceValue,
          total_discount_pct: totalDiscountPct,
          consumer_price: Number(transaction.consumer_price ?? transaction.amount ?? settledAmount),
          amount: settledAmount,
        },
        occurredAt: new Date().toISOString(),
        metadata: {
          provider,
          source: 'payment_webhook',
          webhookEventId: payload.eventId,
        },
      });
      voucherCode = String(completed.voucherCode ?? '').trim() || null;
    }

    await admin
      .from('payment_transactions')
      .update({
        amount: settledAmount,
        payment_status: normalizedStatus,
        voucher_code: voucherCode,
      })
      .eq('transaction_reference', payload.transactionReference);

    await writeAuditEvent(admin, {
      actorId: transaction.customer_id,
      actorRole: 'customer',
      entityType: 'payment_transaction',
      entityId: payload.transactionReference,
      action: 'payment_webhook_processed',
      metadata: {
        provider,
        normalizedStatus,
        settledAmount,
        isWalletTopupTransaction,
        voucherCode,
        faceValue: pricing.faceValue,
        consumerPrice: pricing.consumerPrice,
        totalDiscountPct: pricing.totalDiscountPct,
      },
      requestId: payload.eventId,
    });

    return NextResponse.json({
      status: normalizedStatus,
      transactionReference: payload.transactionReference,
      voucherCode,
      pricing,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
