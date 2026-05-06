import { NextResponse } from 'next/server';
import { requireSandboxAccess } from '@/server/services/payment/sandbox-access';
import {
  getSandboxTransaction,
  listSandboxEftProofs,
  listSandboxWebhookEvents,
} from '@/server/services/payment/sandbox-transaction-store';

export async function GET(
  context: { params: Promise<{ ref: string }> | { ref: string } }
) {
  const access = await requireSandboxAccess();
  if (!access.allowed) {
    return NextResponse.json(access.body, { status: access.status });
  }

  const params = await Promise.resolve(context.params);
  const transaction = await getSandboxTransaction(params.ref);
  if (!transaction) {
    return NextResponse.json({ error: 'Sandbox transaction not found.' }, { status: 404 });
  }

  const [webhookEvents, eftProofs] = await Promise.all([
    listSandboxWebhookEvents(params.ref),
    listSandboxEftProofs(params.ref),
  ]);

  return NextResponse.json({
    sandbox: true,
    transactionReference: transaction.transactionReference,
    scenarioKey: transaction.scenarioKey,
    paymentMethod: transaction.paymentMethod,
    amount: transaction.amount,
    status: transaction.currentStatus,
    detailedState: transaction.detailedState,
    finalStatus: transaction.finalStatus,
    requiresAuthorization: transaction.requiresAuthorization,
    callbackDelayMs: transaction.callbackDelayMs,
    webhookRetries: transaction.webhookRetries,
    checkoutUrl: transaction.checkoutUrl,
    metadata: transaction.metadata,
    stateHistory: transaction.stateHistory,
    webhookEvents,
    eftProofs,
  });
}
