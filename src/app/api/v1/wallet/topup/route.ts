import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';
import { createSandboxTopup } from '@/server/services/payment/sandbox-gateway';
import { getWalletBalance } from '@/server/services/wallet/ledger';

const SUPPORTED_PAYMENT_METHODS = new Set(['visa_secure', 'debit_credit', 'payfast', 'eft']);

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
        {
          error: 'Only signed-in consumers can top up wallet.',
          code: 'consumer_only_wallet_topup',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationError = validate(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: 'invalid_wallet_topup' },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);
    const paymentMethod = String(body.paymentMethod).trim();
    const admin = createAdminClient();
    const sandboxTopup = await createSandboxTopup({
      customer_id: user.id,
      amount,
      paymentMethod,
      payment_method: paymentMethod,
      customer_email: user.email ?? null,
      origin: 'https://www.evoucher.co.za',
      webhook: 'https://www.evoucher.co.za/api/payment-callback',
    });
    const walletBalance = (await getWalletBalance(admin, user.id)) ?? 0;

    return NextResponse.json({
      transactionReference: String(sandboxTopup.ref ?? ''),
      status: String(sandboxTopup.status ?? 'pending'),
      checkoutUrl: sandboxTopup.checkout_url ?? null,
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
