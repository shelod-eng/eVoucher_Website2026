import { DiscountPricingBreakdown } from '@/lib/pricing';

export type RedemptionScope = 'all_branches' | 'specific_branch' | 'province_wide' | 'national';

export interface IssueVoucherInput {
  customerId: string;
  merchantId?: string;
  productId?: string;
  merchantName: string;
  parentBrand?: string | null;
  redemptionScope?: RedemptionScope;
  validProvinces?: string[];
  validBranchIds?: string[];
  qrCodeUrl?: string | null;
  faceValue: number;
  discountPercent: number;
  pricing: DiscountPricingBreakdown;
  voucherCode: string;
  expiresAt: string;
}

export interface RedeemVoucherInput {
  voucherCode: string;
  customerId: string;
  merchantId: string;
  merchantName: string;
  merchantParentBrand?: string | null;
  merchantBranchName?: string | null;
  merchantProvince?: string | null;
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
