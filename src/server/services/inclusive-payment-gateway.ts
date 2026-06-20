/**
 * Inclusive Payment Gateway Service
 * Supports multiple payment methods with focus on accessibility for all income levels
 * Including rural areas, grant recipients, and unbanked populations
 */

export type PaymentMethod =
  | 'payfast'
  | 'ozow'
  | 'cash_voucher'
  | 'ussd'
  | 'airtime'
  | 'sassa_card'
  | 'eft'
  | 'qr_code';

export type TransactionTier = 'micro' | 'small' | 'medium' | 'large';

export interface PaymentGatewayConfig {
  method: PaymentMethod;
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  feePercentage: number;
  feeFixed: number;
  requiresInternet: boolean;
  requiresSmartphone: boolean;
  supportedLanguages: string[];
}

export interface PaymentRequest {
  amount: number;
  method: PaymentMethod;
  productId: string;
  userId: string;
  phoneNumber?: string;
  language?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  voucherCode?: string;
  smsDelivery?: boolean;
  ussdReference?: string;
  message: string;
}

// Payment gateway configurations with inclusive options
const PAYMENT_CONFIGS: Record<PaymentMethod, PaymentGatewayConfig> = {
  cash_voucher: {
    method: 'cash_voucher',
    enabled: true,
    minAmount: 5,
    maxAmount: 1000,
    feePercentage: 0,
    feeFixed: 0,
    requiresInternet: false,
    requiresSmartphone: false,
    supportedLanguages: ['en', 'zu', 'xh', 'af', 'st', 'tn', 'nso', 'ts', 'ss', 've', 'nr'],
  },
  ussd: {
    method: 'ussd',
    enabled: true,
    minAmount: 10,
    maxAmount: 500,
    feePercentage: 0.5,
    feeFixed: 0,
    requiresInternet: false,
    requiresSmartphone: false,
    supportedLanguages: ['en', 'zu', 'xh', 'af', 'st'],
  },
  airtime: {
    method: 'airtime',
    enabled: true,
    minAmount: 5,
    maxAmount: 200,
    feePercentage: 3,
    feeFixed: 0,
    requiresInternet: false,
    requiresSmartphone: false,
    supportedLanguages: ['en', 'zu', 'xh'],
  },
  sassa_card: {
    method: 'sassa_card',
    enabled: true,
    minAmount: 10,
    maxAmount: 350,
    feePercentage: 0,
    feeFixed: 0,
    requiresInternet: true,
    requiresSmartphone: false,
    supportedLanguages: ['en', 'zu', 'xh', 'af', 'st', 'tn'],
  },
  qr_code: {
    method: 'qr_code',
    enabled: true,
    minAmount: 5,
    maxAmount: 5000,
    feePercentage: 0,
    feeFixed: 0,
    requiresInternet: false,
    requiresSmartphone: true,
    supportedLanguages: ['en', 'zu', 'xh', 'af'],
  },
  payfast: {
    method: 'payfast',
    enabled: true,
    minAmount: 10,
    maxAmount: 50000,
    feePercentage: 2.9,
    feeFixed: 2.0,
    requiresInternet: true,
    requiresSmartphone: false,
    supportedLanguages: ['en', 'af'],
  },
  ozow: {
    method: 'ozow',
    enabled: true,
    minAmount: 20,
    maxAmount: 100000,
    feePercentage: 1.5,
    feeFixed: 3.5,
    requiresInternet: true,
    requiresSmartphone: false,
    supportedLanguages: ['en', 'af'],
  },
  eft: {
    method: 'eft',
    enabled: true,
    minAmount: 50,
    maxAmount: 1000000,
    feePercentage: 0,
    feeFixed: 5.0,
    requiresInternet: true,
    requiresSmartphone: false,
    supportedLanguages: ['en', 'af'],
  },
};

export function getTransactionTier(amount: number): TransactionTier {
  if (amount < 50) return 'micro';
  if (amount < 200) return 'small';
  if (amount < 1000) return 'medium';
  return 'large';
}

export function calculateFee(amount: number, method: PaymentMethod): number {
  const config = PAYMENT_CONFIGS[method];
  if (!config) return 0;

  const tier = getTransactionTier(amount);

  // Waive fees for micro transactions to support grant recipients
  if (tier === 'micro') return 0;

  // Reduce fees for small transactions
  let feePercentage = config.feePercentage;
  if (tier === 'small') {
    feePercentage = feePercentage * 0.5;
  }

  return amount * (feePercentage / 100) + config.feeFixed;
}

export function getAvailablePaymentMethods(
  amount: number,
  hasInternet: boolean = true,
  hasSmartphone: boolean = true,
  language: string = 'en'
): PaymentGatewayConfig[] {
  return Object.values(PAYMENT_CONFIGS).filter((config) => {
    if (!config.enabled) return false;
    if (amount < config.minAmount || amount > config.maxAmount) return false;
    if (config.requiresInternet && !hasInternet) return false;
    if (config.requiresSmartphone && !hasSmartphone) return false;
    if (!config.supportedLanguages.includes(language)) return false;
    return true;
  });
}

export async function processCashVoucherPayment(request: PaymentRequest): Promise<PaymentResponse> {
  // Generate unique voucher code for cash payment at retailer
  const voucherCode = `CV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  return {
    success: true,
    transactionId: `TXN-CASH-${Date.now()}`,
    voucherCode,
    message: `Take this code to any Shoprite, Pick n Pay, or Boxer till: ${voucherCode}. Pay R${request.amount} cash to activate.`,
  };
}

export async function processUSSDPayment(request: PaymentRequest): Promise<PaymentResponse> {
  // Generate USSD reference
  const ussdRef = `${Date.now().toString().slice(-8)}`;

  return {
    success: true,
    transactionId: `TXN-USSD-${Date.now()}`,
    ussdReference: ussdRef,
    smsDelivery: true,
    message: `Dial *120*8682#, select option 1, enter reference: ${ussdRef}. Voucher will be sent via SMS.`,
  };
}

export async function processAirtimePayment(request: PaymentRequest): Promise<PaymentResponse> {
  if (!request.phoneNumber) {
    return {
      success: false,
      transactionId: '',
      message: 'Phone number required for airtime payment',
    };
  }

  // Process airtime deduction
  const airtimeAmount = request.amount + calculateFee(request.amount, 'airtime');

  return {
    success: true,
    transactionId: `TXN-AIR-${Date.now()}`,
    smsDelivery: true,
    message: `R${airtimeAmount} airtime will be deducted. Voucher sent via SMS to ${request.phoneNumber}.`,
  };
}

export async function processSASSACardPayment(request: PaymentRequest): Promise<PaymentResponse> {
  // SASSA card integration (mock for now - requires bank integration)
  if (request.amount > 350) {
    return {
      success: false,
      transactionId: '',
      message: 'SASSA card payments limited to R350 per transaction',
    };
  }

  return {
    success: true,
    transactionId: `TXN-SASSA-${Date.now()}`,
    smsDelivery: true,
    message: `Payment of R${request.amount} approved from SASSA card. Voucher sent via SMS.`,
  };
}

export async function processQRCodePayment(request: PaymentRequest): Promise<PaymentResponse> {
  // Generate offline-compatible QR code
  const qrPayload = {
    amount: request.amount,
    productId: request.productId,
    timestamp: Date.now(),
    userId: request.userId,
  };

  return {
    success: true,
    transactionId: `TXN-QR-${Date.now()}`,
    voucherCode: Buffer.from(JSON.stringify(qrPayload)).toString('base64'),
    message: 'QR code generated. Show at till or scan at merchant location.',
  };
}

export async function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  const config = PAYMENT_CONFIGS[request.method];

  if (!config || !config.enabled) {
    return {
      success: false,
      transactionId: '',
      message: 'Payment method not available',
    };
  }

  if (request.amount < config.minAmount || request.amount > config.maxAmount) {
    return {
      success: false,
      transactionId: '',
      message: `Amount must be between R${config.minAmount} and R${config.maxAmount}`,
    };
  }

  switch (request.method) {
    case 'cash_voucher':
      return processCashVoucherPayment(request);
    case 'ussd':
      return processUSSDPayment(request);
    case 'airtime':
      return processAirtimePayment(request);
    case 'sassa_card':
      return processSASSACardPayment(request);
    case 'qr_code':
      return processQRCodePayment(request);
    default:
      return {
        success: false,
        transactionId: '',
        message: 'Payment method not yet implemented',
      };
  }
}

export async function sendVoucherViaSMS(
  phoneNumber: string,
  voucherCode: string,
  amount: number,
  language: string = 'en'
): Promise<boolean> {
  // SMS delivery service integration
  const messages: Record<string, string> = {
    en: `Your eVoucher code: ${voucherCode}. Value: R${amount}. Show at till. Valid 90 days.`,
    zu: `Ikhodi yakho ye-eVoucher: ${voucherCode}. Inani: R${amount}. Bonisa esikhwameni. Isebenza izinsuku ezingu-90.`,
    xh: `Ikhowudi yakho ye-eVoucher: ${voucherCode}. Ixabiso: R${amount}. Bonisa kwivenkile. Isebenza iintsuku ezingu-90.`,
  };

  const message = messages[language] || messages.en;

  // Mock SMS sending - integrate with SMS gateway (e.g., Clickatell, Africa's Talking)
  console.log(`SMS to ${phoneNumber}: ${message}`);

  return true;
}

export function generateUSSDMenu(language: string = 'en'): string {
  const menus: Record<string, string> = {
    en: `*120*8682#
1. Buy Voucher
2. Check Balance
3. My Vouchers
4. Help`,
    zu: `*120*8682#
1. Thenga i-Voucher
2. Bheka Ibhalansi
3. Ama-Voucher Ami
4. Usizo`,
    xh: `*120*8682#
1. Thenga i-Voucher
2. Khangela Ibhalansi
3. Ii-Voucher Zam
4. Uncedo`,
  };

  return menus[language] || menus.en;
}
