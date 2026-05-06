import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import { appendSandboxWebhookEvent, getSandboxTransaction, updateSandboxTransaction } from '@/server/services/payment/sandbox-transaction-store';
import { applyWebhookDelivery, getWebhookAttemptTargetStatus } from '@/server/services/payment/sandbox-state-machine';

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

  const attempt = 1;
  const targetStatus = getWebhookAttemptTargetStatus(transaction, attempt);
  const eventId = `sandbox-${transactionReference.toLowerCase()}-attempt-${attempt}`;
  const scheduledFor = new Date(Date.now() + transaction.callbackDelayMs).toISOString();
  const deliveryStatus = targetStatus === 'pending' ? 'failed' : 'delivered';
  await appendSandboxWebhookEvent({
    transactionReference,
    eventId,
    attempt,
    targetStatus,
    deliveryStatus,
    scheduledFor,
    deliveredAt: deliveryStatus === 'delivered' ? new Date().toISOString() : null,
    payload: {
      transactionReference,
      scenarioKey: transaction.scenarioKey,
      status: targetStatus,
    },
    metadata: {
      provider: 'sandbox',
      operatorRole: access.role,
    },
    createdAt: new Date().toISOString(),
  });

  const updated =
    deliveryStatus === 'delivered'
      ? await updateSandboxTransaction(transactionReference, (current) =>
          applyWebhookDelivery(current, targetStatus, { attempt, eventId })
        )
      : transaction;

  return NextResponse.json({
    sandbox: true,
    provider: 'sandbox',
    transactionReference,
    webhook: {
      eventId,
      status: targetStatus,
      retries: transaction.webhookRetries,
      delayMs: transaction.callbackDelayMs,
      deliveryStatus,
      attempt,
      headers: {
        'x-payment-provider': 'sandbox',
        'x-webhook-signature': 'PAYMENT_SANDBOX_WEBHOOK_SECRET',
        'x-webhook-timestamp': new Date().toISOString(),
      },
    },
    transactionStatus: updated?.currentStatus ?? transaction.currentStatus,
    detailedState: updated?.detailedState ?? transaction.detailedState,
  });
}
