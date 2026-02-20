import { DiscountPricingBreakdown } from '@/lib/pricing';

export interface IssueVoucherInput {
  customerId: string;
  merchantId?: string;
  productId?: string;
  merchantName: string;
  faceValue: number;
  discountPercent: number;
  pricing: DiscountPricingBreakdown;
  voucherCode: string;
  expiresAt: string;
}

export interface RedeemVoucherInput {
  voucherCode: string;
  customerId: string;
  merchantName: string;
  amount: number;
  idempotencyKey: string;
}

export interface VoucherService {
  issueVoucher(input: IssueVoucherInput): Promise<{ voucherId: string }>;
  redeemVoucher(
    input: RedeemVoucherInput
  ): Promise<{ redemptionId: string; remainingBalance: number }>;
  expireVouchers(): Promise<{ expiredCount: number }>;
}
