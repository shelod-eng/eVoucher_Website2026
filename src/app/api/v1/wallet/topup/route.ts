import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';
import { MockPaymentProvider } from '@/server/services/payment/mock-payment-provider';
import { generateTransactionReference } from '@/server/utils/security';
import { getWalletBalance, recordWalletCredit } from '@/server/services/wallet/ledger';

const SUPPORTED_PAYMENT_METHODS = new Set([
  'visa_secure',
  'debit_credit',
  'payfast',
  'eft',
  'wallet',
]);

function validate(body: any): string | null {
  const amount = Number(body?.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Top-up amount must be greater than zero.';
  if (amount > 100000) return 'Top-up amount exceeds the allowed limit.';
  if (!body?.paymentMethod || !SUPPORTED_PAYMENT_METHODS.has(String(body.paymentMethod))) {
    return 'Unsupported payment method selected.';
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be signed in to top up wallet.', code: 'unauthenticated' },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return NextResponse.json(
        { error: 'Only signed-in consumers can top up wallet.', code: 'consumer_only_wallet_topup' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationError = validate(body);
    if (validationError) {
      return NextResponse.json({ error: validationError, code: 'invalid_wallet_topup' }, { status: 400 });
    }

    const amount = Number(body.amount);
    const paymentMethod = String(body.paymentMethod);
    const transactionReference = generateTransactionReference();
    const paymentProvider = new MockPaymentProvider();
    const payment = await paymentProvider.createPayment({
      amount,
      paymentMethod,
      reference: transactionReference,
    });

    const paymentStatus = payment.status;

    const admin = createAdminClient();
    const cardBrand =
      paymentMethod === 'visa_secure'
        ? 'VISA'
        : paymentMethod === 'debit_credit'
          ? String(body.cardBrand ?? 'CARD').slice(0, 20)
          : paymentMethod.toUpperCase();
    const cardLastFour =
      paymentMethod === 'visa_secure' || paymentMethod === 'debit_credit'
        ? String(body.cardLastFour ?? '0000')
            .slice(-4)
            .padStart(4, '0')
        : '0000';

    const txRes = await admin.from('payment_transactions').insert({
      customer_id: user.id,
      merchant_id: null,
      amount,
      card_last_four: cardLastFour,
      card_brand: cardBrand,
      payment_status: paymentStatus,
      voucher_code: null,
      transaction_reference: transactionReference,
    });
    if (txRes.error) throw txRes.error;

    if (paymentStatus === 'completed') {
      await recordWalletCredit(admin, {
        customerId: user.id,
        userEmail: user.email ?? null,
        amount,
        description: `Wallet top-up ${transactionReference}`,
      });
    }

    const walletBalance = (await getWalletBalance(admin, user.id)) ?? 0;

    return NextResponse.json({
      transactionReference,
      status: paymentStatus,
      checkoutUrl: payment.checkoutUrl ?? null,
      amount,
      walletBalance,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to top up wallet.',
        code: 'wallet_topup_failed',
      },
      { status: 500 }
    );
  }
}
