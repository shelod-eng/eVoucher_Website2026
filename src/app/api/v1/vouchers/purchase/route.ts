import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PurchaseVoucherRequest } from '@/types/domain';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { MockPaymentProvider } from '@/server/services/payment/mock-payment-provider';
import { DefaultVoucherService } from '@/server/services/voucher/default-voucher-service';
import { writeAuditEvent } from '@/server/utils/audit';
import { generateSecureVoucherCode, generateTransactionReference } from '@/server/utils/security';

function validate(body: PurchaseVoucherRequest): string | null {
  if (!body.merchantId?.trim()) return 'Merchant is required.';
  if (!Number.isFinite(body.faceValue) || body.faceValue <= 0) return 'Face value must be > 0.';
  if (body.faceValue > 10000) return 'Face value exceeds the allowed limit.';
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
      .select('id,business_name,status')
      .eq('id', body.merchantId)
      .in('status', ['active', 'approved'])
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not available.' }, { status: 404 });
    }

    const payment = await paymentProvider.createPayment({
      amount: body.faceValue,
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
      amount: body.faceValue,
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
        merchantName: merchant.business_name,
        faceValue: body.faceValue,
        discountPercent: 15,
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
        amount: body.faceValue,
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
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process voucher purchase.' },
      { status: 500 }
    );
  }
}
