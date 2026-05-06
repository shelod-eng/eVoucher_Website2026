import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import { getSandboxScenario } from '@/server/services/payment/sandbox-scenario-engine';

export async function POST(request: Request) {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const body = await request.json();
  const transactionReference = String(body.transactionReference ?? '').trim();
  const scenarioKey = String(body.scenarioKey ?? '').trim();
  const scenario = getSandboxScenario(scenarioKey);

  if (!transactionReference) {
    return NextResponse.json({ error: 'transactionReference is required.' }, { status: 400 });
  }
  if (!scenario) {
    return NextResponse.json({ error: 'Unknown sandbox scenario.' }, { status: 400 });
  }

  return NextResponse.json({
    sandbox: true,
    provider: 'sandbox',
    transactionReference,
    webhook: {
      eventId: `sandbox-${transactionReference.toLowerCase()}`,
      status: scenario.finalStatus,
      retries: scenario.webhookRetries ?? 0,
      delayMs: scenario.callbackDelayMs ?? 0,
      headers: {
        'x-payment-provider': 'sandbox',
        'x-webhook-signature': 'PAYMENT_SANDBOX_WEBHOOK_SECRET',
        'x-webhook-timestamp': new Date().toISOString(),
      },
    },
  });
}
