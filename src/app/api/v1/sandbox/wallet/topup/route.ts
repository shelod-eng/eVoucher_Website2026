import { NextResponse } from 'next/server';
import { createPaymentProvider } from '@/server/services/payment/payment-provider-factory';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import { getInitialStateHistory } from '@/server/services/payment/sandbox-state-machine';
import { createSandboxTransaction } from '@/server/services/payment/sandbox-transaction-store';

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
  const now = new Date().toISOString();
  const record = await createSandboxTransaction({
    transactionReference: reference,
    scenarioKey: 'wallet_topup_success',
    paymentMethod: 'wallet',
    amount,
    provider: 'sandbox',
    initialStatus: payment.status,
    currentStatus: 'completed',
    finalStatus: 'completed',
    detailedState: 'completed',
    requiresAuthorization: false,
    redirectFlow: false,
    callbackDelayMs: 0,
    webhookRetries: 0,
    checkoutUrl: payment.checkoutUrl ?? null,
    operatorUserId: access.user.id,
    metadata: {
      label: 'Wallet Top-Up Success',
      flowType: 'wallet_topup',
      stateTimeline: ['initiated', 'wallet_reflected', 'completed'],
    },
    stateHistory: [
      ...getInitialStateHistory({
        key: 'wallet_topup_success',
        label: 'Wallet Top-Up Success',
        flowType: 'wallet_topup',
        paymentMethod: 'wallet',
        initialStatus: 'completed',
        finalStatus: 'completed',
        stateTimeline: ['initiated', 'wallet_reflected', 'completed'],
        description: 'Simulates wallet credit reflected immediately.',
      }),
      {
        state: 'completed',
        status: 'completed',
        message: 'Sandbox wallet top-up completed successfully.',
        at: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    sandbox: true,
    transactionReference: record.transactionReference,
    amount: record.amount,
    walletBalancePreview: amount,
    status: record.currentStatus,
    detailedState: record.detailedState,
    metadata: record.metadata,
    stateHistory: record.stateHistory,
  });
}
