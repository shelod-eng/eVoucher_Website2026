/**
 * Instant Wallet Settlement Service
 * Same-day payouts via wallet or EFT - matching Yoco's instant promise
 * Strategic advantage: Digital wallet + traditional banking combined
 */

export type SettlementMethod = 'instant_wallet' | 'same_day_eft' | 'next_day_eft' | 'weekly_eft';
export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';
export type WalletTransactionType = 'credit' | 'debit' | 'transfer' | 'withdrawal' | 'refund';

export interface MerchantWallet {
  merchantId: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  currency: 'ZAR';
  lastUpdated: string;
}

export interface InstantSettlement {
  id: string;
  merchantId: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: SettlementMethod;
  status: SettlementStatus;
  initiatedAt: string;
  completedAt?: string;
  reference: string;
  transactionIds: string[];
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  merchantId: string;
  type: WalletTransactionType;
  amount: number;
  balance: number;
  description: string;
  reference: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Competitive fee structure (lower than Yoco)
const SETTLEMENT_FEES = {
  instant_wallet: 0, // FREE - competitive advantage
  same_day_eft: 0, // FREE up to R5000, then 0.5%
  next_day_eft: 0, // FREE
  weekly_eft: 0, // FREE - standard option
};

// Yoco charges 2.95% + R1.50 per transaction
// eVoucher charges ZERO for wallet settlements - MASSIVE ADVANTAGE

/**
 * Get merchant wallet balance
 */
export async function getMerchantWallet(merchantId: string): Promise<MerchantWallet> {
  // Mock implementation - integrate with actual database
  return {
    merchantId,
    balance: 5420.5,
    availableBalance: 5420.5,
    pendingBalance: 0,
    currency: 'ZAR',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Calculate settlement fees
 */
export function calculateSettlementFee(amount: number, method: SettlementMethod): number {
  const baseFee = SETTLEMENT_FEES[method];

  if (method === 'same_day_eft' && amount > 5000) {
    return amount * 0.005; // 0.5% for amounts over R5000
  }

  return baseFee;
}

/**
 * Instant wallet settlement (ZERO FEES - Beat Yoco)
 */
export async function processInstantWalletSettlement(
  merchantId: string,
  transactionIds: string[]
): Promise<InstantSettlement> {
  // Calculate total amount from transactions
  const totalAmount = 1250.75; // Mock - sum from actual transactions

  const fee = calculateSettlementFee(totalAmount, 'instant_wallet');
  const netAmount = totalAmount - fee;

  const settlement: InstantSettlement = {
    id: `IST-${Date.now()}`,
    merchantId,
    amount: totalAmount,
    fee,
    netAmount,
    method: 'instant_wallet',
    status: 'processing',
    initiatedAt: new Date().toISOString(),
    reference: `WALLET-${Date.now()}`,
    transactionIds,
  };

  // Credit merchant wallet immediately
  await creditMerchantWallet(merchantId, netAmount, settlement.id);

  settlement.status = 'completed';
  settlement.completedAt = new Date().toISOString();

  return settlement;
}

/**
 * Same-day EFT settlement
 */
export async function processSameDayEFT(
  merchantId: string,
  transactionIds: string[],
  bankDetails: {
    accountNumber: string;
    branchCode: string;
    accountType: string;
  }
): Promise<InstantSettlement> {
  const totalAmount = 3500.0; // Mock
  const fee = calculateSettlementFee(totalAmount, 'same_day_eft');
  const netAmount = totalAmount - fee;

  const settlement: InstantSettlement = {
    id: `EFT-SD-${Date.now()}`,
    merchantId,
    amount: totalAmount,
    fee,
    netAmount,
    method: 'same_day_eft',
    status: 'processing',
    initiatedAt: new Date().toISOString(),
    reference: `SEFT-${Date.now()}`,
    transactionIds,
  };

  // Process EFT payment (integrate with BankServ)
  // For same-day, must be initiated before 2PM
  const currentHour = new Date().getHours();
  if (currentHour < 14) {
    // Will be processed today
    settlement.completedAt = new Date().toISOString();
  } else {
    // Will be processed tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    settlement.completedAt = tomorrow.toISOString();
  }

  settlement.status = 'completed';
  return settlement;
}

/**
 * Credit merchant wallet
 */
async function creditMerchantWallet(
  merchantId: string,
  amount: number,
  reference: string
): Promise<WalletTransaction> {
  const wallet = await getMerchantWallet(merchantId);

  const transaction: WalletTransaction = {
    id: `TXN-${Date.now()}`,
    walletId: `WALLET-${merchantId}`,
    merchantId,
    type: 'credit',
    amount,
    balance: wallet.balance + amount,
    description: 'Instant settlement',
    reference,
    timestamp: new Date().toISOString(),
  };

  // Update wallet balance in database
  return transaction;
}

/**
 * Withdraw from wallet to bank account
 */
export async function withdrawFromWallet(
  merchantId: string,
  amount: number,
  bankDetails: {
    accountNumber: string;
    branchCode: string;
    accountType: string;
  }
): Promise<WalletTransaction> {
  const wallet = await getMerchantWallet(merchantId);

  if (amount > wallet.availableBalance) {
    throw new Error('Insufficient wallet balance');
  }

  const transaction: WalletTransaction = {
    id: `WD-${Date.now()}`,
    walletId: `WALLET-${merchantId}`,
    merchantId,
    type: 'withdrawal',
    amount: -amount,
    balance: wallet.balance - amount,
    description: 'Withdrawal to bank account',
    reference: `WD-${Date.now()}`,
    timestamp: new Date().toISOString(),
    metadata: bankDetails,
  };

  // Process EFT withdrawal
  return transaction;
}

/**
 * Get wallet transaction history
 */
export async function getWalletTransactions(
  merchantId: string,
  limit: number = 50
): Promise<WalletTransaction[]> {
  // Mock implementation
  return [];
}

/**
 * Auto-settlement configuration
 */
export interface AutoSettlementConfig {
  merchantId: string;
  enabled: boolean;
  threshold: number; // Minimum amount to trigger auto-settlement
  method: SettlementMethod;
  schedule: 'instant' | 'daily' | 'weekly';
  preferredTime?: string; // HH:MM format for scheduled settlements
}

/**
 * Configure auto-settlement
 */
export async function configureAutoSettlement(
  config: AutoSettlementConfig
): Promise<AutoSettlementConfig> {
  // Save configuration to database
  return config;
}

/**
 * Get settlement speed comparison (vs Yoco)
 */
export function getSettlementComparison(): {
  eVoucher: string;
  yoco: string;
  advantage: string;
} {
  return {
    eVoucher: 'Instant (wallet) or Same-day (EFT)',
    yoco: 'Next business day',
    advantage:
      'eVoucher settles SAME DAY with ZERO fees. Yoco charges 2.95% + R1.50 and settles next day.',
  };
}

/**
 * Calculate savings vs Yoco
 */
export function calculateSavingsVsYoco(monthlyVolume: number): {
  yocoFees: number;
  evoucherFees: number;
  savings: number;
  savingsPercentage: number;
} {
  // Yoco: 2.95% + R1.50 per transaction
  // Assume average transaction of R100
  const avgTransaction = 100;
  const transactionCount = monthlyVolume / avgTransaction;

  const yocoFees = monthlyVolume * 0.0295 + transactionCount * 1.5;
  const evoucherFees = 0; // FREE for wallet settlements

  return {
    yocoFees,
    evoucherFees,
    savings: yocoFees,
    savingsPercentage: 100,
  };
}

/**
 * Get instant settlement eligibility
 */
export async function checkInstantSettlementEligibility(
  merchantId: string,
  amount: number
): Promise<{
  eligible: boolean;
  reason?: string;
  alternatives: SettlementMethod[];
}> {
  // Mock eligibility checks
  const merchantAge = 60; // days
  const totalVolume = 50000; // total processed

  if (merchantAge < 30) {
    return {
      eligible: false,
      reason: 'Account must be 30+ days old for instant settlements',
      alternatives: ['next_day_eft', 'weekly_eft'],
    };
  }

  if (amount > 50000) {
    return {
      eligible: false,
      reason: 'Instant settlements limited to R50,000 per day',
      alternatives: ['same_day_eft', 'next_day_eft'],
    };
  }

  return {
    eligible: true,
    alternatives: ['instant_wallet', 'same_day_eft'],
  };
}

/**
 * Notify merchant of instant settlement
 */
export async function notifyInstantSettlement(
  merchantId: string,
  settlement: InstantSettlement
): Promise<void> {
  // Send SMS, email, and push notification
  const message = `💰 R${settlement.netAmount.toFixed(2)} instantly credited to your eVoucher wallet! Available now for withdrawal or use. Ref: ${settlement.reference}`;

  // SMS
  console.log(`SMS to merchant ${merchantId}: ${message}`);

  // Push notification
  console.log(`Push notification to merchant ${merchantId}`);
}
