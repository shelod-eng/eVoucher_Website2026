export interface PaymentCreateInput {
  amount: number;
  paymentMethod: string;
  reference: string;
}

export interface PaymentCreateResult {
  status: 'pending' | 'completed' | 'failed';
  checkoutUrl?: string | null;
}

export interface PaymentWebhookVerificationInput {
  payload: string;
  signature: string | null;
  timestamp: string | null;
}

export interface PaymentProvider {
  createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult>;
  verifyWebhook(input: PaymentWebhookVerificationInput): Promise<boolean>;
  normalizeStatus(rawStatus: string): 'pending' | 'completed' | 'failed';
}
