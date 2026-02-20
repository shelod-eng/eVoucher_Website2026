import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MockPaymentProvider } from '@/server/services/payment/mock-payment-provider';
import { DefaultVoucherService } from '@/server/services/voucher/default-voucher-service';
import { writeAuditEvent } from '@/server/utils/audit';
import { generateSecureVoucherCode, sha256 } from '@/server/utils/security';

interface WebhookPayload {
  eventId?: string;
  transactionReference?: string;
  status?: string;
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

    let voucherCode: string | null = transaction.voucher_code;
    if (normalizedStatus === 'completed' && !voucherCode) {
      const { data: merchant, error: merchantError } = await admin
        .from('merchants')
        .select('id,business_name')
        .eq('id', transaction.merchant_id)
        .single();

      if (merchantError || !merchant) {
        throw merchantError ?? new Error('Merchant not found for transaction.');
      }

      const voucherService = new DefaultVoucherService();
      voucherCode = generateSecureVoucherCode();
      await voucherService.issueVoucher({
        customerId: transaction.customer_id,
        merchantId: merchant.id,
        merchantName: merchant.business_name,
        faceValue: Number(transaction.amount),
        discountPercent: 15,
        voucherCode,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    await admin
      .from('payment_transactions')
      .update({
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
        voucherCode,
      },
      requestId: payload.eventId,
    });

    return NextResponse.json({
      status: normalizedStatus,
      transactionReference: payload.transactionReference,
      voucherCode,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
