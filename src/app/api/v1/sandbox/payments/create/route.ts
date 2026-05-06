import { NextResponse } from 'next/server';
import { createPaymentProvider } from '@/server/services/payment/payment-provider-factory';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import { getSandboxScenario } from '@/server/services/payment/sandbox-scenario-engine';

function buildReference() {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `SBX-${Date.now()}-${random}`;
}

export async function POST(request: Request) {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const body = await request.json();
  const amount = Number(body.amount ?? 0);
  const paymentMethod = String(body.paymentMethod ?? '').trim();
  const scenarioKey = String(body.scenarioKey ?? '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'amount must be greater than zero.' }, { status: 400 });
  }
  if (!paymentMethod) {
    return NextResponse.json({ error: 'paymentMethod is required.' }, { status: 400 });
  }

  const scenario = getSandboxScenario(scenarioKey);
  if (!scenario) {
    return NextResponse.json({ error: 'Unknown sandbox scenario.' }, { status: 400 });
  }

  const provider = createPaymentProvider('sandbox');
  const reference = buildReference();
  const payment = await provider.createPayment({
    amount,
    paymentMethod,
    reference,
    metadata: {
      scenarioKey,
      operatorId: access.user.id,
    },
  });

  return NextResponse.json({
    sandbox: true,
    transactionReference: reference,
    amount,
    paymentMethod,
    scenario,
    status: payment.status,
    finalStatus: payment.metadata?.finalStatus ?? scenario.finalStatus,
    checkoutUrl: payment.checkoutUrl ?? null,
    metadata: payment.metadata ?? {},
  });
}
