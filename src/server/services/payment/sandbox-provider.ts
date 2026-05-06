import {
  PaymentCreateInput,
  PaymentCreateResult,
  PaymentProvider,
  PaymentWebhookVerificationInput,
} from '@/server/services/payment-provider';
import {
  getDefaultSandboxScenario,
  getSandboxScenario,
  type SandboxScenarioDefinition,
} from '@/server/services/payment/sandbox-scenario-engine';

function buildCheckoutUrl(reference: string, scenario: SandboxScenarioDefinition) {
  if (!scenario.redirectFlow && !scenario.requiresAuthorization) return null;
  return `/sandbox-payments?ref=${encodeURIComponent(reference)}&scenario=${encodeURIComponent(
    scenario.key
  )}`;
}

export class SandboxPaymentProvider implements PaymentProvider {
  async createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult> {
    const requestedScenario = String(input.metadata?.scenarioKey ?? '').trim();
    const scenario = getSandboxScenario(requestedScenario) ?? getDefaultSandboxScenario();

    return {
      status: scenario.initialStatus,
      checkoutUrl: buildCheckoutUrl(input.reference, scenario),
      provider: 'sandbox',
      metadata: {
        scenarioKey: scenario.key,
        label: scenario.label,
        flowType: scenario.flowType,
        stateTimeline: scenario.stateTimeline,
        finalStatus: scenario.finalStatus,
        requiresAuthorization: Boolean(scenario.requiresAuthorization),
        redirectFlow: Boolean(scenario.redirectFlow),
        callbackDelayMs: scenario.callbackDelayMs ?? 0,
        webhookRetries: scenario.webhookRetries ?? 0,
      },
    };
  }

  async verifyWebhook(input: PaymentWebhookVerificationInput): Promise<boolean> {
    const webhookSecret = String(process.env.PAYMENT_SANDBOX_WEBHOOK_SECRET ?? '').trim();
    if (!webhookSecret) return false;
    return (
      input.signature === webhookSecret &&
      String(input.timestamp ?? '').trim().length > 0 &&
      String(input.payload ?? '').trim().length > 0
    );
  }

  normalizeStatus(rawStatus: string): 'pending' | 'completed' | 'failed' {
    const normalized = String(rawStatus ?? '')
      .trim()
      .toLowerCase();
    if (normalized === 'completed' || normalized === 'success' || normalized === 'paid') {
      return 'completed';
    }
    if (
      normalized === 'pending' ||
      normalized === 'processing' ||
      normalized === 'pending_authentication'
    ) {
      return 'pending';
    }
    return 'failed';
  }
}
