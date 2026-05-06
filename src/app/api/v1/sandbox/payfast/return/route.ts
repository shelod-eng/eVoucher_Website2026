import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import { getSandboxTransaction, updateSandboxTransaction } from '@/server/services/payment/sandbox-transaction-store';
import { applyPayfastReturn } from '@/server/services/payment/sandbox-state-machine';

export async function POST(request: Request) {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const body = await request.json();
  const transactionReference = String(body.transactionReference ?? '').trim();

  if (!transactionReference) {
    return NextResponse.json({ error: 'transactionReference is required.' }, { status: 400 });
  }

  const transaction = await getSandboxTransaction(transactionReference);
  if (!transaction) {
    return NextResponse.json({ error: 'Sandbox transaction not found.' }, { status: 404 });
  }

  const updated = await updateSandboxTransaction(transactionReference, (current) =>
    applyPayfastReturn(current)
  );

  return NextResponse.json({
    sandbox: true,
    transactionReference,
    status: updated?.currentStatus ?? transaction.currentStatus,
    detailedState: updated?.detailedState ?? transaction.detailedState,
    stateHistory: updated?.stateHistory ?? transaction.stateHistory,
  });
}
