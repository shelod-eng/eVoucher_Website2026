import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import {
  appendSandboxEftProof,
  getSandboxTransaction,
  updateSandboxTransaction,
} from '@/server/services/payment/sandbox-transaction-store';
import { applyEftProofSubmitted } from '@/server/services/payment/sandbox-state-machine';

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

  const transaction = await getSandboxTransaction(transactionReference);
  if (!transaction) {
    return NextResponse.json({ error: 'Sandbox transaction not found.' }, { status: 404 });
  }

  await appendSandboxEftProof({
    transactionReference,
    proofName,
    status: 'pending_review',
    submittedBy: access.user.id,
    reviewedBy: null,
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    metadata: {
      scenarioKey: transaction.scenarioKey,
    },
  });
  const updated = await updateSandboxTransaction(transactionReference, (current) =>
    applyEftProofSubmitted(current, proofName)
  );

  return NextResponse.json({
    sandbox: true,
    transactionReference,
    proofName,
    status: 'pending_review',
    reviewedBy: access.role,
    submittedAt: new Date().toISOString(),
    transactionStatus: updated?.currentStatus ?? transaction.currentStatus,
    detailedState: updated?.detailedState ?? transaction.detailedState,
    stateHistory: updated?.stateHistory ?? transaction.stateHistory,
  });
}
