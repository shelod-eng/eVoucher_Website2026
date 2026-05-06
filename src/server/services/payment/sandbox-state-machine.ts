import type {
  SandboxDetailedState,
  SandboxStateTransition,
  SandboxTransactionRecord,
} from '@/server/services/payment/sandbox-transaction-store';
import type { SandboxScenarioDefinition } from '@/server/services/payment/sandbox-scenario-engine';

function atNow() {
  return new Date().toISOString();
}

function buildTransition(
  state: SandboxDetailedState,
  status: 'pending' | 'completed' | 'failed',
  message: string,
  metadata?: Record<string, unknown>
): SandboxStateTransition {
  return {
    state,
    status,
    message,
    at: atNow(),
    ...(metadata ? { metadata } : {}),
  };
}

export function getInitialDetailedState(scenario: SandboxScenarioDefinition): SandboxDetailedState {
  switch (scenario.key) {
    case 'visa_3ds_success':
    case 'visa_3ds_failure':
    case 'visa_3ds_timeout':
      return 'pending_authentication';
    case 'payfast_redirect_success':
    case 'payfast_redirect_cancelled':
    case 'webhook_retry_delayed_success':
      return 'redirect_issued';
    case 'eft_pending_review':
      return 'initiated';
    case 'payshap_success':
      return 'request_to_pay_sent';
    case 'wallet_topup_success':
      return 'wallet_reflected';
    case 'card_failure':
      return 'failed';
    case 'card_success':
    default:
      return 'completed';
  }
}

export function getInitialStateHistory(scenario: SandboxScenarioDefinition) {
  const transitions: SandboxStateTransition[] = [
    buildTransition('initiated', 'pending', `${scenario.label} started.`),
  ];

  const detailedState = getInitialDetailedState(scenario);
  if (detailedState !== 'initiated') {
    const messageMap: Record<SandboxDetailedState, string> = {
      initiated: 'Sandbox transaction initiated.',
      pending_authentication: 'Waiting for OTP or 3DS challenge completion.',
      authorized: 'Sandbox transaction authorized.',
      redirect_issued: 'Hosted redirect URL issued to tester.',
      customer_returned: 'Tester returned from redirect flow.',
      awaiting_callback: 'Waiting for simulated callback delivery.',
      proof_submitted: 'EFT proof submitted for review.',
      pending_review: 'Waiting for EFT proof review.',
      request_to_pay_sent: 'PayShap request-to-pay sent.',
      awaiting_customer_action: 'Waiting for customer action in bank app.',
      wallet_reflected: 'Wallet balance reflected in sandbox.',
      completed: 'Sandbox transaction completed.',
      failed: 'Sandbox transaction failed.',
      expired: 'Sandbox transaction expired.',
      cancelled: 'Sandbox transaction cancelled.',
    };
    transitions.push(
      buildTransition(detailedState, scenario.initialStatus, messageMap[detailedState] ?? scenario.label)
    );
  }

  if (scenario.redirectFlow) {
    transitions.push(
      buildTransition('awaiting_callback', 'pending', 'Waiting for simulated callback processing.')
    );
  }
  if (scenario.key === 'payshap_success') {
    transitions.push(
      buildTransition(
        'awaiting_customer_action',
        'pending',
        'Waiting for request-to-pay acceptance in sandbox.'
      )
    );
  }

  return transitions;
}

export function applyAuthorizationOutcome(
  transaction: SandboxTransactionRecord,
  outcome: 'completed' | 'failed' | 'expired',
  metadata?: Record<string, unknown>
) {
  const transitions = [...transaction.stateHistory];
  if (outcome === 'completed') {
    transitions.push(buildTransition('authorized', 'pending', 'OTP accepted.', metadata));
    if (transaction.redirectFlow) {
      transitions.push(
        buildTransition('awaiting_callback', 'pending', 'Authorization succeeded. Awaiting callback.')
      );
    } else {
      transitions.push(buildTransition('completed', 'completed', 'Sandbox payment completed.', metadata));
    }
  } else if (outcome === 'expired') {
    transitions.push(buildTransition('expired', 'failed', 'OTP challenge expired.', metadata));
  } else {
    transitions.push(buildTransition('failed', 'failed', 'OTP challenge failed.', metadata));
  }

  const nextDetailedState: SandboxDetailedState =
    outcome === 'completed'
      ? transaction.redirectFlow
        ? 'awaiting_callback'
        : 'completed'
      : outcome === 'expired'
        ? 'expired'
        : 'failed';
  const nextStatus: SandboxTransactionRecord['currentStatus'] =
    outcome === 'completed'
      ? transaction.redirectFlow
        ? 'pending'
        : 'completed'
      : 'failed';

  return {
    ...transaction,
    currentStatus: nextStatus,
    detailedState: nextDetailedState,
    stateHistory: transitions,
  };
}

export function applyWebhookDelivery(
  transaction: SandboxTransactionRecord,
  targetStatus: 'pending' | 'completed' | 'failed',
  metadata?: Record<string, unknown>
) {
  const transitions = [...transaction.stateHistory];
  const currentDetailedState: SandboxDetailedState =
    targetStatus === 'completed' ? 'completed' : targetStatus === 'failed' ? 'failed' : 'awaiting_callback';
  const message =
    targetStatus === 'completed'
      ? 'Webhook delivered and payment completed.'
      : targetStatus === 'failed'
        ? 'Webhook delivered and payment marked failed.'
        : 'Webhook retry scheduled, payment remains pending.';
  transitions.push(buildTransition(currentDetailedState, targetStatus, message, metadata));

  return {
    ...transaction,
    currentStatus: targetStatus,
    detailedState: currentDetailedState,
    stateHistory: transitions,
  };
}

export function applyPayfastReturn(transaction: SandboxTransactionRecord) {
  return {
    ...transaction,
    detailedState: 'customer_returned' as SandboxDetailedState,
    stateHistory: [
      ...transaction.stateHistory,
      buildTransition('customer_returned', 'pending', 'Tester returned from PayFast redirect.'),
      buildTransition('awaiting_callback', 'pending', 'Waiting for PayFast callback processing.'),
    ],
  };
}

export function applyEftProofSubmitted(transaction: SandboxTransactionRecord, proofName: string) {
  return {
    ...transaction,
    currentStatus: 'pending' as const,
    detailedState: 'pending_review' as SandboxDetailedState,
    stateHistory: [
      ...transaction.stateHistory,
      buildTransition('proof_submitted', 'pending', 'EFT proof uploaded.', { proofName }),
      buildTransition('pending_review', 'pending', 'EFT proof awaiting review.'),
    ],
  };
}

export function applyEftReview(
  transaction: SandboxTransactionRecord,
  outcome: 'approved' | 'rejected',
  metadata?: Record<string, unknown>
) {
  if (outcome === 'approved') {
    return {
      ...transaction,
      currentStatus: 'completed' as const,
      detailedState: 'completed' as SandboxDetailedState,
      stateHistory: [
        ...transaction.stateHistory,
        buildTransition('completed', 'completed', 'EFT proof approved and payment completed.', metadata),
      ],
    };
  }

  return {
    ...transaction,
    currentStatus: 'failed' as const,
    detailedState: 'failed' as SandboxDetailedState,
    stateHistory: [
      ...transaction.stateHistory,
      buildTransition('failed', 'failed', 'EFT proof rejected.', metadata),
    ],
  };
}

export function applyPayShapResponse(
  transaction: SandboxTransactionRecord,
  outcome: 'accepted' | 'declined' | 'expired',
  metadata?: Record<string, unknown>
) {
  if (outcome === 'accepted') {
    return {
      ...transaction,
      currentStatus: 'completed' as const,
      detailedState: 'completed' as SandboxDetailedState,
      stateHistory: [
        ...transaction.stateHistory,
        buildTransition('completed', 'completed', 'PayShap request accepted.', metadata),
      ],
    };
  }

  const state: SandboxDetailedState = outcome === 'expired' ? 'expired' : 'failed';
  return {
    ...transaction,
    currentStatus: 'failed' as const,
    detailedState: state,
    stateHistory: [
      ...transaction.stateHistory,
      buildTransition(
        state,
        'failed',
        outcome === 'expired' ? 'PayShap request expired.' : 'PayShap request declined.',
        metadata
      ),
    ],
  };
}

export function getWebhookAttemptTargetStatus(
  transaction: SandboxTransactionRecord,
  attempt: number
): 'pending' | 'completed' | 'failed' {
  if (
    transaction.scenarioKey === 'webhook_retry_delayed_success' &&
    attempt <= Math.max(transaction.webhookRetries, 1)
  ) {
    return 'pending';
  }
  return transaction.finalStatus;
}
