import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';

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

  return NextResponse.json({
    sandbox: true,
    transactionReference: buildReference(),
    amount,
    phoneNumber,
    status: 'pending',
    finalStatus: 'completed',
    callbackDelayMs: 1000,
    message: 'PayShap request-to-pay simulated successfully.',
  });
}
