import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import {
  getSandboxTransaction,
  updateSandboxTransaction,
} from '@/server/services/payment/sandbox-transaction-store';
import { applyPayShapResponse } from '@/server/services/payment/sandbox-state-machine';

export async function POST(request: Request) {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const body = await request.json();
  const transactionReference = String(body.transactionReference ?? '').trim();
  const outcome = String(body.outcome ?? '')
    .trim()
    .toLowerCase();

  if (!transactionReference) {
    return NextResponse.json({ error: 'transactionReference is required.' }, { status: 400 });
  }
  if (!['accepted', 'declined', 'expired'].includes(outcome)) {
    return NextResponse.json(
      { error: 'outcome must be accepted, declined, or expired.' },
      { status: 400 }
    );
  }

  const transaction = await getSandboxTransaction(transactionReference);
  if (!transaction) {
    return NextResponse.json({ error: 'Sandbox transaction not found.' }, { status: 404 });
  }

  const updated = await updateSandboxTransaction(transactionReference, (current) =>
    applyPayShapResponse(current, outcome as 'accepted' | 'declined' | 'expired', {
      operatorRole: access.role,
    })
  );

  return NextResponse.json({
    sandbox: true,
    transactionReference,
    outcome,
    status: updated?.currentStatus ?? transaction.currentStatus,
    detailedState: updated?.detailedState ?? transaction.detailedState,
    stateHistory: updated?.stateHistory ?? transaction.stateHistory,
  });
}
