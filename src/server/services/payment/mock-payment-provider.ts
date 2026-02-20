import {
  PaymentCreateInput,
  PaymentCreateResult,
  PaymentProvider,
  PaymentWebhookVerificationInput,
} from '@/server/services/payment-provider';
import { isFreshTimestamp, verifyHmacSha256 } from '@/server/utils/security';

export class MockPaymentProvider implements PaymentProvider {
  async createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult> {
    const requiresAsync = input.paymentMethod === 'eft';

    if (requiresAsync) {
      return {
        status: 'pending',
        checkoutUrl: `https://payments.local/checkout/${encodeURIComponent(input.reference)}`,
      };
    }

    return {
      status: 'completed',
      checkoutUrl: null,
    };
  }

  async verifyWebhook(input: PaymentWebhookVerificationInput): Promise<boolean> {
    const webhookSecret = process.env.PAYMENTS_WEBHOOK_SECRET;
    if (!webhookSecret || !input.signature || !input.timestamp) {
      return false;
    }

    if (!isFreshTimestamp(input.timestamp, 300)) {
      return false;
    }

    const signedPayload = `${input.timestamp}.${input.payload}`;
    return verifyHmacSha256({
      payload: signedPayload,
      signature: input.signature,
      secret: webhookSecret,
    });
  }

  normalizeStatus(rawStatus: string): 'pending' | 'completed' | 'failed' {
    const normalized = rawStatus.toLowerCase();
    if (normalized === 'completed' || normalized === 'success' || normalized === 'paid') {
      return 'completed';
    }
    if (normalized === 'pending' || normalized === 'processing') {
      return 'pending';
    }
    return 'failed';
  }
}
