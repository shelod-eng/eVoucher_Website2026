import type { PaymentProvider } from '@/server/services/payment-provider';
import { ProductionPaymentProvider } from '@/server/services/payment/production-provider';
import { SandboxPaymentProvider } from '@/server/services/payment/sandbox-provider';

export type PaymentProviderMode = 'production' | 'sandbox';

export function getPaymentModeFromEnv(): PaymentProviderMode {
  return String(process.env.PAYMENT_MODE ?? 'production')
    .trim()
    .toLowerCase() === 'sandbox'
    ? 'sandbox'
    : 'production';
}

export function isPaymentSandboxEnabled() {
  return ['true', '1', 'yes', 'on'].includes(
    String(process.env.PAYMENT_SANDBOX_ENABLED ?? 'false')
      .trim()
      .toLowerCase()
  );
}

export function createPaymentProvider(mode?: PaymentProviderMode): PaymentProvider {
  const resolvedMode = mode ?? getPaymentModeFromEnv();
  if (resolvedMode === 'sandbox' && isPaymentSandboxEnabled()) {
    return new SandboxPaymentProvider();
  }
  return new ProductionPaymentProvider();
}
