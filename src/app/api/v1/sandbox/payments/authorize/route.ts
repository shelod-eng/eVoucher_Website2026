import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import { applyAuthorizationOutcome } from '@/server/services/payment/sandbox-state-machine';
import {
  getSandboxTransaction,
  updateSandboxTransaction,
} from '@/server/services/payment/sandbox-transaction-store';

export async function POST(request: Request) {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const body = await request.json();
  const reference = String(body.transactionReference ?? '').trim();
  const otp = String(body.otp ?? '').trim();

  if (!reference) {
    return NextResponse.json({ error: 'transactionReference is required.' }, { status: 400 });
  }

  const transaction = await getSandboxTransaction(reference);
  if (!transaction) {
    return NextResponse.json({ error: 'Sandbox transaction not found.' }, { status: 404 });
  }

  const outcome =
    transaction.finalStatus === 'failed'
      ? transaction.scenarioKey === 'visa_3ds_timeout'
        ? 'expired'
        : 'failed'
      : otp === '000000'
        ? 'failed'
        : 'completed';
  const updated = await updateSandboxTransaction(reference, (current) =>
    applyAuthorizationOutcome(current, outcome, {
      otp,
      operatorRole: access.role,
    })
  );

  return NextResponse.json({
    sandbox: true,
    transactionReference: reference,
    scenarioKey: transaction.scenarioKey,
    status: updated?.currentStatus ?? transaction.currentStatus,
    detailedState: updated?.detailedState ?? transaction.detailedState,
    authorizedAt: new Date().toISOString(),
    metadata: updated?.metadata ?? transaction.metadata,
    stateHistory: updated?.stateHistory ?? transaction.stateHistory,
  });
}
