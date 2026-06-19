import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import {
  appendSandboxEftProof,
  getSandboxTransaction,
  updateSandboxTransaction,
} from '@/server/services/payment/sandbox-transaction-store';
import { applyEftReview } from '@/server/services/payment/sandbox-state-machine';

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
  const proofName = String(body.proofName ?? 'eft-proof').trim();

  if (!transactionReference) {
    return NextResponse.json({ error: 'transactionReference is required.' }, { status: 400 });
  }
  if (outcome !== 'approved' && outcome !== 'rejected') {
    return NextResponse.json({ error: 'outcome must be approved or rejected.' }, { status: 400 });
  }

  const transaction = await getSandboxTransaction(transactionReference);
  if (!transaction) {
    return NextResponse.json({ error: 'Sandbox transaction not found.' }, { status: 404 });
  }

  await appendSandboxEftProof({
    transactionReference,
    proofName,
    status: outcome === 'approved' ? 'approved' : 'rejected',
    submittedBy: null,
    reviewedBy: access.user.id,
    submittedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    metadata: { reviewOutcome: outcome },
  });

  const updated = await updateSandboxTransaction(transactionReference, (current) =>
    applyEftReview(current, outcome === 'approved' ? 'approved' : 'rejected', {
      reviewedBy: access.role,
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
