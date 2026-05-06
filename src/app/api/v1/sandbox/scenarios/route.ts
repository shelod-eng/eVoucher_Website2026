import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import { listSandboxScenarios } from '@/server/services/payment/sandbox-scenario-engine';

export async function GET() {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  return NextResponse.json({
    scenarios: listSandboxScenarios(),
  });
}
