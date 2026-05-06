import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import { getInitialStateHistory } from '@/server/services/payment/sandbox-state-machine';
import { createSandboxTransaction } from '@/server/services/payment/sandbox-transaction-store';

function buildReference() {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `SBX-PS-${Date.now()}-${random}`;
}

export async function POST(request: Request) {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const body = await request.json();
  const amount = Number(body.amount ?? 0);
  const phoneNumber = String(body.phoneNumber ?? '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'amount must be greater than zero.' }, { status: 400 });
  }
  if (!phoneNumber) {
    return NextResponse.json({ error: 'phoneNumber is required.' }, { status: 400 });
  }

  const reference = buildReference();
  const now = new Date().toISOString();
  const record = await createSandboxTransaction({
    transactionReference: reference,
    scenarioKey: 'payshap_success',
    paymentMethod: 'debit_credit',
    amount,
    provider: 'sandbox',
    initialStatus: 'pending',
    currentStatus: 'pending',
    finalStatus: 'completed',
    detailedState: 'awaiting_customer_action',
    requiresAuthorization: false,
    redirectFlow: false,
    callbackDelayMs: 1000,
    webhookRetries: 0,
    checkoutUrl: null,
    operatorUserId: access.user.id,
    phoneNumber,
    metadata: {
      label: 'PayShap Success',
      flowType: 'payshap_rtp',
      stateTimeline: ['initiated', 'request_to_pay_sent', 'awaiting_customer_action', 'completed'],
    },
    stateHistory: getInitialStateHistory({
      key: 'payshap_success',
      label: 'PayShap Success',
      flowType: 'payshap_rtp',
      paymentMethod: 'debit_credit',
      initialStatus: 'pending',
      finalStatus: 'completed',
      callbackDelayMs: 1000,
      stateTimeline: ['initiated', 'request_to_pay_sent', 'awaiting_customer_action', 'completed'],
      description: 'Simulates a near-instant request-to-pay acceptance.',
    }),
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    sandbox: true,
    transactionReference: reference,
    amount,
    phoneNumber,
    status: record.currentStatus,
    detailedState: record.detailedState,
    finalStatus: record.finalStatus,
    callbackDelayMs: 1000,
    message: 'PayShap request-to-pay simulated successfully.',
    stateHistory: record.stateHistory,
  });
}
