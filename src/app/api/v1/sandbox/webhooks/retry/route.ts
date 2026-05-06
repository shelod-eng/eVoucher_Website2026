import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';

export async function POST(request: Request) {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const body = await request.json();
  const transactionReference = String(body.transactionReference ?? '').trim();
  const attempt = Number(body.attempt ?? 2);

  if (!transactionReference) {
    return NextResponse.json({ error: 'transactionReference is required.' }, { status: 400 });
  }

  return NextResponse.json({
    sandbox: true,
    transactionReference,
    retryAttempt: Number.isFinite(attempt) && attempt > 0 ? attempt : 2,
    status: 'scheduled',
    scheduledAt: new Date().toISOString(),
  });
}
