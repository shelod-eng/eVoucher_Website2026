import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import { getSandboxScenario } from '@/server/services/payment/sandbox-scenario-engine';

export async function POST(request: Request) {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const body = await request.json();
  const reference = String(body.transactionReference ?? '').trim();
  const scenarioKey = String(body.scenarioKey ?? '').trim();
  const otp = String(body.otp ?? '').trim();
  const scenario = getSandboxScenario(scenarioKey);

  if (!reference) {
    return NextResponse.json({ error: 'transactionReference is required.' }, { status: 400 });
  }
  if (!scenario) {
    return NextResponse.json({ error: 'Unknown sandbox scenario.' }, { status: 400 });
  }

  const isFailure = scenario.finalStatus === 'failed' || otp === '000000';
  return NextResponse.json({
    sandbox: true,
    transactionReference: reference,
    scenarioKey: scenario.key,
    status: isFailure ? 'failed' : 'completed',
    authorizedAt: new Date().toISOString(),
    metadata: {
      requiresAuthorization: Boolean(scenario.requiresAuthorization),
      operatorRole: access.role,
    },
  });
}
