import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';

export async function GET() {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  return NextResponse.json({
    status: 'ok',
    sandbox: true,
    role: access.role,
  });
}
