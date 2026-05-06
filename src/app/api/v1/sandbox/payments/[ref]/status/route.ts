import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import { getSandboxScenario } from '@/server/services/payment/sandbox-scenario-engine';

export async function GET(
  request: Request,
  context: { params: Promise<{ ref: string }> | { ref: string } }
) {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const params = await Promise.resolve(context.params);
  const { searchParams } = new URL(request.url);
  const scenarioKey = String(searchParams.get('scenario') ?? '').trim();
  const scenario = getSandboxScenario(scenarioKey);

  if (!scenario) {
    return NextResponse.json({ error: 'Unknown sandbox scenario.' }, { status: 400 });
  }

  return NextResponse.json({
    sandbox: true,
    transactionReference: params.ref,
    scenarioKey: scenario.key,
    status: scenario.initialStatus,
    finalStatus: scenario.finalStatus,
    requiresAuthorization: Boolean(scenario.requiresAuthorization),
    callbackDelayMs: scenario.callbackDelayMs ?? 0,
    webhookRetries: scenario.webhookRetries ?? 0,
  });
}
