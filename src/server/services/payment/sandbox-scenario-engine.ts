export type SandboxScenarioKey =
  | 'visa_3ds_success'
  | 'visa_3ds_failure'
  | 'visa_3ds_timeout'
  | 'card_success'
  | 'card_failure'
  | 'payfast_redirect_success'
  | 'payfast_redirect_cancelled'
  | 'eft_pending_review'
  | 'payshap_success'
  | 'wallet_topup_success'
  | 'webhook_retry_delayed_success';

export type SandboxScenarioDefinition = {
  key: SandboxScenarioKey;
  label: string;
  paymentMethod:
    | 'visa_secure'
    | 'debit_credit'
    | 'payfast'
    | 'eft'
    | 'wallet';
  initialStatus: 'pending' | 'completed' | 'failed';
  finalStatus: 'completed' | 'failed';
  requiresAuthorization?: boolean;
  redirectFlow?: boolean;
  callbackDelayMs?: number;
  webhookRetries?: number;
  description: string;
};

const SANDBOX_SCENARIOS: SandboxScenarioDefinition[] = [
  {
    key: 'visa_3ds_success',
    label: 'VISA Secure 3DS Success',
    paymentMethod: 'visa_secure',
    initialStatus: 'pending',
    finalStatus: 'completed',
    requiresAuthorization: true,
    callbackDelayMs: 1500,
    description: 'Requires OTP challenge, then completes successfully.',
  },
  {
    key: 'visa_3ds_failure',
    label: 'VISA Secure 3DS Failure',
    paymentMethod: 'visa_secure',
    initialStatus: 'pending',
    finalStatus: 'failed',
    requiresAuthorization: true,
    description: 'Requires OTP challenge and ends with a failed outcome.',
  },
  {
    key: 'visa_3ds_timeout',
    label: 'VISA Secure 3DS Timeout',
    paymentMethod: 'visa_secure',
    initialStatus: 'pending',
    finalStatus: 'failed',
    requiresAuthorization: true,
    callbackDelayMs: 5000,
    description: 'OTP challenge expires before completion.',
  },
  {
    key: 'card_success',
    label: 'Debit/Credit Card Success',
    paymentMethod: 'debit_credit',
    initialStatus: 'completed',
    finalStatus: 'completed',
    description: 'Simulates an immediate card approval.',
  },
  {
    key: 'card_failure',
    label: 'Debit/Credit Card Failure',
    paymentMethod: 'debit_credit',
    initialStatus: 'failed',
    finalStatus: 'failed',
    description: 'Simulates issuer decline or insufficient funds.',
  },
  {
    key: 'payfast_redirect_success',
    label: 'PayFast Redirect Success',
    paymentMethod: 'payfast',
    initialStatus: 'pending',
    finalStatus: 'completed',
    redirectFlow: true,
    callbackDelayMs: 2000,
    description: 'Redirects to hosted page and completes via callback.',
  },
  {
    key: 'payfast_redirect_cancelled',
    label: 'PayFast Redirect Cancelled',
    paymentMethod: 'payfast',
    initialStatus: 'pending',
    finalStatus: 'failed',
    redirectFlow: true,
    description: 'Redirect is cancelled before payment completion.',
  },
  {
    key: 'eft_pending_review',
    label: 'EFT Pending Proof Review',
    paymentMethod: 'eft',
    initialStatus: 'pending',
    finalStatus: 'completed',
    callbackDelayMs: 10000,
    description: 'Simulates EFT proof upload and delayed approval.',
  },
  {
    key: 'payshap_success',
    label: 'PayShap Success',
    paymentMethod: 'debit_credit',
    initialStatus: 'pending',
    finalStatus: 'completed',
    callbackDelayMs: 1000,
    description: 'Simulates a near-instant request-to-pay acceptance.',
  },
  {
    key: 'wallet_topup_success',
    label: 'Wallet Top-Up Success',
    paymentMethod: 'wallet',
    initialStatus: 'completed',
    finalStatus: 'completed',
    description: 'Simulates wallet credit reflected immediately.',
  },
  {
    key: 'webhook_retry_delayed_success',
    label: 'Webhook Retry Delayed Success',
    paymentMethod: 'payfast',
    initialStatus: 'pending',
    finalStatus: 'completed',
    redirectFlow: true,
    callbackDelayMs: 5000,
    webhookRetries: 2,
    description: 'Initial callback fails and later retry succeeds.',
  },
];

export function listSandboxScenarios() {
  return SANDBOX_SCENARIOS;
}

export function getSandboxScenario(key: string | null | undefined) {
  return SANDBOX_SCENARIOS.find((scenario) => scenario.key === key) ?? null;
}

export function getDefaultSandboxScenario() {
  return getSandboxScenario(process.env.PAYMENT_SANDBOX_DEFAULT_SCENARIO) ?? SANDBOX_SCENARIOS[0];
}
