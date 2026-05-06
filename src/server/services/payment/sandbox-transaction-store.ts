import { createAdminClient } from '@/lib/supabase/admin';

export type SandboxDetailedState =
  | 'initiated'
  | 'pending_authentication'
  | 'authorized'
  | 'redirect_issued'
  | 'customer_returned'
  | 'awaiting_callback'
  | 'proof_submitted'
  | 'pending_review'
  | 'request_to_pay_sent'
  | 'awaiting_customer_action'
  | 'wallet_reflected'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export type SandboxStateTransition = {
  state: SandboxDetailedState;
  status: 'pending' | 'completed' | 'failed';
  message: string;
  at: string;
  metadata?: Record<string, unknown>;
};

export type SandboxTransactionRecord = {
  transactionReference: string;
  scenarioKey: string;
  paymentMethod: string;
  amount: number;
  provider: 'sandbox';
  initialStatus: 'pending' | 'completed' | 'failed';
  currentStatus: 'pending' | 'completed' | 'failed';
  finalStatus: 'completed' | 'failed';
  detailedState: SandboxDetailedState;
  requiresAuthorization: boolean;
  redirectFlow: boolean;
  callbackDelayMs: number;
  webhookRetries: number;
  checkoutUrl: string | null;
  operatorUserId: string | null;
  phoneNumber?: string | null;
  metadata: Record<string, unknown>;
  stateHistory: SandboxStateTransition[];
  createdAt: string;
  updatedAt: string;
};

export type SandboxWebhookEventRecord = {
  transactionReference: string;
  eventId: string;
  attempt: number;
  targetStatus: 'pending' | 'completed' | 'failed';
  deliveryStatus: 'scheduled' | 'failed' | 'delivered';
  scheduledFor: string;
  deliveredAt: string | null;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type SandboxEftProofRecord = {
  transactionReference: string;
  proofName: string;
  status: 'submitted' | 'pending_review' | 'approved' | 'rejected';
  submittedBy: string | null;
  reviewedBy: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  metadata: Record<string, unknown>;
};

type AdminClient = ReturnType<typeof createAdminClient>;

const memoryTransactions = new Map<string, SandboxTransactionRecord>();
const memoryWebhookEvents = new Map<string, SandboxWebhookEventRecord[]>();
const memoryEftProofs = new Map<string, SandboxEftProofRecord[]>();

function getAdminClient(): AdminClient | null {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const relation = relationName.toLowerCase();
  const bareRelation = relation.includes('.') ? (relation.split('.').at(-1) ?? relation) : relation;
  return (
    message.includes(`relation "${relation}" does not exist`) ||
    message.includes(`relation "${bareRelation}" does not exist`) ||
    message.includes(`could not find the table '${relation}' in the schema cache`) ||
    message.includes(`could not find the table '${bareRelation}' in the schema cache`)
  );
}

function toRecord(row: any): SandboxTransactionRecord {
  return {
    transactionReference: String(row.transaction_reference),
    scenarioKey: String(row.scenario_key),
    paymentMethod: String(row.payment_method),
    amount: Number(row.amount ?? 0),
    provider: 'sandbox',
    initialStatus: String(row.initial_status) as SandboxTransactionRecord['initialStatus'],
    currentStatus: String(row.current_status) as SandboxTransactionRecord['currentStatus'],
    finalStatus: String(row.final_status) as SandboxTransactionRecord['finalStatus'],
    detailedState: String(row.detailed_state) as SandboxDetailedState,
    requiresAuthorization: Boolean(row.requires_authorization),
    redirectFlow: Boolean(row.redirect_flow),
    callbackDelayMs: Number(row.callback_delay_ms ?? 0),
    webhookRetries: Number(row.webhook_retries ?? 0),
    checkoutUrl: row.checkout_url ?? null,
    operatorUserId: row.operator_user_id ?? null,
    phoneNumber: row.phone_number ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    stateHistory: (row.state_history as SandboxStateTransition[] | null) ?? [],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at ?? row.created_at),
  };
}

function fromRecord(record: SandboxTransactionRecord) {
  return {
    transaction_reference: record.transactionReference,
    scenario_key: record.scenarioKey,
    payment_method: record.paymentMethod,
    amount: Number(record.amount.toFixed(2)),
    provider: record.provider,
    initial_status: record.initialStatus,
    current_status: record.currentStatus,
    final_status: record.finalStatus,
    detailed_state: record.detailedState,
    requires_authorization: record.requiresAuthorization,
    redirect_flow: record.redirectFlow,
    callback_delay_ms: record.callbackDelayMs,
    webhook_retries: record.webhookRetries,
    checkout_url: record.checkoutUrl,
    operator_user_id: record.operatorUserId,
    phone_number: record.phoneNumber ?? null,
    metadata: record.metadata,
    state_history: record.stateHistory,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

export async function createSandboxTransaction(record: SandboxTransactionRecord) {
  const admin = getAdminClient();
  if (!admin) {
    memoryTransactions.set(record.transactionReference, record);
    return record;
  }

  const row = fromRecord(record);
  const { data, error } = await admin
    .from('sandbox_payment_transactions')
    .upsert(row, { onConflict: 'transaction_reference' })
    .select('*')
    .single();

  if (error) {
    if (isMissingRelation(error, 'public.sandbox_payment_transactions')) {
      memoryTransactions.set(record.transactionReference, record);
      return record;
    }
    throw error;
  }

  return toRecord(data);
}

export async function getSandboxTransaction(transactionReference: string) {
  const admin = getAdminClient();
  if (!admin) {
    return memoryTransactions.get(transactionReference) ?? null;
  }

  const { data, error } = await admin
    .from('sandbox_payment_transactions')
    .select('*')
    .eq('transaction_reference', transactionReference)
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error, 'public.sandbox_payment_transactions')) {
      return memoryTransactions.get(transactionReference) ?? null;
    }
    throw error;
  }

  return data ? toRecord(data) : null;
}

export async function updateSandboxTransaction(
  transactionReference: string,
  updater: (current: SandboxTransactionRecord) => SandboxTransactionRecord
) {
  const current = await getSandboxTransaction(transactionReference);
  if (!current) return null;

  const next = updater({
    ...current,
    metadata: { ...current.metadata },
    stateHistory: [...current.stateHistory],
    updatedAt: new Date().toISOString(),
  });

  const admin = getAdminClient();
  if (!admin) {
    memoryTransactions.set(transactionReference, next);
    return next;
  }

  const { data, error } = await admin
    .from('sandbox_payment_transactions')
    .update(fromRecord(next))
    .eq('transaction_reference', transactionReference)
    .select('*')
    .single();

  if (error) {
    if (isMissingRelation(error, 'public.sandbox_payment_transactions')) {
      memoryTransactions.set(transactionReference, next);
      return next;
    }
    throw error;
  }

  return toRecord(data);
}

export async function appendSandboxWebhookEvent(record: SandboxWebhookEventRecord) {
  const admin = getAdminClient();
  if (!admin) {
    const current = memoryWebhookEvents.get(record.transactionReference) ?? [];
    current.push(record);
    memoryWebhookEvents.set(record.transactionReference, current);
    return record;
  }

  const row = {
    transaction_reference: record.transactionReference,
    event_id: record.eventId,
    attempt: record.attempt,
    target_status: record.targetStatus,
    delivery_status: record.deliveryStatus,
    scheduled_for: record.scheduledFor,
    delivered_at: record.deliveredAt,
    payload: record.payload,
    metadata: record.metadata,
    created_at: record.createdAt,
  };

  const { error } = await admin.from('sandbox_webhook_events').insert(row);
  if (error) {
    if (isMissingRelation(error, 'public.sandbox_webhook_events')) {
      const current = memoryWebhookEvents.get(record.transactionReference) ?? [];
      current.push(record);
      memoryWebhookEvents.set(record.transactionReference, current);
      return record;
    }
    throw error;
  }

  return record;
}

export async function listSandboxWebhookEvents(transactionReference: string) {
  const admin = getAdminClient();
  if (!admin) {
    return memoryWebhookEvents.get(transactionReference) ?? [];
  }

  const { data, error } = await admin
    .from('sandbox_webhook_events')
    .select('*')
    .eq('transaction_reference', transactionReference)
    .order('attempt', { ascending: true });

  if (error) {
    if (isMissingRelation(error, 'public.sandbox_webhook_events')) {
      return memoryWebhookEvents.get(transactionReference) ?? [];
    }
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    transactionReference: String(row.transaction_reference),
    eventId: String(row.event_id),
    attempt: Number(row.attempt ?? 0),
    targetStatus: String(row.target_status) as SandboxWebhookEventRecord['targetStatus'],
    deliveryStatus: String(row.delivery_status) as SandboxWebhookEventRecord['deliveryStatus'],
    scheduledFor: String(row.scheduled_for),
    deliveredAt: row.delivered_at ?? null,
    payload: (row.payload as Record<string, unknown> | null) ?? {},
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    createdAt: String(row.created_at),
  }));
}

export async function appendSandboxEftProof(record: SandboxEftProofRecord) {
  const admin = getAdminClient();
  if (!admin) {
    const current = memoryEftProofs.get(record.transactionReference) ?? [];
    current.push(record);
    memoryEftProofs.set(record.transactionReference, current);
    return record;
  }

  const row = {
    transaction_reference: record.transactionReference,
    proof_name: record.proofName,
    status: record.status,
    submitted_by: record.submittedBy,
    reviewed_by: record.reviewedBy,
    submitted_at: record.submittedAt,
    reviewed_at: record.reviewedAt,
    metadata: record.metadata,
  };
  const { error } = await admin.from('sandbox_eft_proofs').insert(row);
  if (error) {
    if (isMissingRelation(error, 'public.sandbox_eft_proofs')) {
      const current = memoryEftProofs.get(record.transactionReference) ?? [];
      current.push(record);
      memoryEftProofs.set(record.transactionReference, current);
      return record;
    }
    throw error;
  }

  return record;
}

export async function listSandboxEftProofs(transactionReference: string) {
  const admin = getAdminClient();
  if (!admin) {
    return memoryEftProofs.get(transactionReference) ?? [];
  }

  const { data, error } = await admin
    .from('sandbox_eft_proofs')
    .select('*')
    .eq('transaction_reference', transactionReference)
    .order('submitted_at', { ascending: true });

  if (error) {
    if (isMissingRelation(error, 'public.sandbox_eft_proofs')) {
      return memoryEftProofs.get(transactionReference) ?? [];
    }
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    transactionReference: String(row.transaction_reference),
    proofName: String(row.proof_name),
    status: String(row.status) as SandboxEftProofRecord['status'],
    submittedBy: row.submitted_by ?? null,
    reviewedBy: row.reviewed_by ?? null,
    submittedAt: String(row.submitted_at),
    reviewedAt: row.reviewed_at ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
  }));
}
