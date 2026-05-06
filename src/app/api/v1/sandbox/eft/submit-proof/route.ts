import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';

export async function POST(request: Request) {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const body = await request.json();
  const transactionReference = String(body.transactionReference ?? '').trim();
  const proofName = String(body.proofName ?? '').trim();

  if (!transactionReference) {
    return NextResponse.json({ error: 'transactionReference is required.' }, { status: 400 });
  }
  if (!proofName) {
    return NextResponse.json({ error: 'proofName is required.' }, { status: 400 });
  }

  return NextResponse.json({
    sandbox: true,
    transactionReference,
    proofName,
    status: 'pending_review',
    reviewedBy: access.role,
    submittedAt: new Date().toISOString(),
  });
}
