import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import {
  appendSandboxWebhookEvent,
  getSandboxTransaction,
  listSandboxWebhookEvents,
  updateSandboxTransaction,
} from '@/server/services/payment/sandbox-transaction-store';
import {
  applyWebhookDelivery,
  getWebhookAttemptTargetStatus,
} from '@/server/services/payment/sandbox-state-machine';

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

  const existing = await listSandboxWebhookEvents(transactionReference);
  const explicitAttempt = Number(body.attempt ?? 0);
  const attempt =
    Number.isFinite(explicitAttempt) && explicitAttempt > 0 ? explicitAttempt : existing.length + 1;
  const targetStatus = getWebhookAttemptTargetStatus(transaction, attempt);
  const deliveryStatus = targetStatus === 'pending' ? 'failed' : 'delivered';
  const eventId = `sandbox-${transactionReference.toLowerCase()}-attempt-${attempt}`;

  await appendSandboxWebhookEvent({
    transactionReference,
    eventId,
    attempt,
    targetStatus,
    deliveryStatus,
    scheduledFor: new Date(Date.now() + transaction.callbackDelayMs).toISOString(),
    deliveredAt: deliveryStatus === 'delivered' ? new Date().toISOString() : null,
    payload: {
      transactionReference,
      scenarioKey: transaction.scenarioKey,
      status: targetStatus,
      retryAttempt: attempt,
    },
    metadata: {
      operatorRole: access.role,
      retry: true,
    },
    createdAt: new Date().toISOString(),
  });

  const updated =
    deliveryStatus === 'delivered'
      ? await updateSandboxTransaction(transactionReference, (current) =>
          applyWebhookDelivery(current, targetStatus, { attempt, eventId, retry: true })
        )
      : transaction;

  return NextResponse.json({
    sandbox: true,
    transactionReference,
    retryAttempt: attempt,
    status: deliveryStatus === 'delivered' ? 'processed' : 'scheduled',
    scheduledAt: new Date().toISOString(),
    targetStatus,
    deliveryStatus,
    transactionStatus: updated?.currentStatus ?? transaction.currentStatus,
    detailedState: updated?.detailedState ?? transaction.detailedState,
  });
}
