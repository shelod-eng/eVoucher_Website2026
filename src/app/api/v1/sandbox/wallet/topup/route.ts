import { NextResponse } from 'next/server';
import { createPaymentProvider } from '@/server/services/payment/payment-provider-factory';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';

function buildReference() {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `SBX-WALLET-${Date.now()}-${random}`;
}

export async function POST(request: Request) {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const body = await request.json();
  const amount = Number(body.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'amount must be greater than zero.' }, { status: 400 });
  }

  const provider = createPaymentProvider('sandbox');
  const reference = buildReference();
  const payment = await provider.createPayment({
    amount,
    paymentMethod: 'wallet',
    reference,
    metadata: { scenarioKey: 'wallet_topup_success', operatorId: access.user.id },
  });

  return NextResponse.json({
    sandbox: true,
    transactionReference: reference,
    amount,
    walletBalancePreview: amount,
    status: payment.status,
    metadata: payment.metadata ?? {},
  });
}
