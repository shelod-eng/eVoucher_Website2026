/**
 * CRITICAL: These constants are governed by Merchant Business Logic Portal Technical Specification v2.0
 * Rule R1: ALL discount splits MUST be exactly 50/50 (immutable)
 * Rule R6: Discount range MUST be enforced (3-15%, default 5%)
 */

export const DEFAULT_TOTAL_DISCOUNT_PCT = 5;
export const MIN_TOTAL_DISCOUNT_PCT = 3;
export const MAX_TOTAL_DISCOUNT_PCT = 15;

// Rule R1: IMMUTABLE 50/50 discount split
export const CONSUMER_DISCOUNT_SHARE = 0.5;
export const PLATFORM_DISCOUNT_SHARE = 0.5;

export interface DiscountPricingBreakdown {
  faceValue: number;
  totalDiscountPct: number;
  consumerBenefitPct: number;
  evoucherBenefitPct: number;
  totalDiscountAmount: number;
  consumerBenefitAmount: number;
  evoucherBenefitAmount: number;
  consumerPrice: number;
  merchantReceivableAfterTotalDiscount: number;
  merchantReceivableAfterEvoucherBenefit: number;
  /** Timestamp when pricing was calculated (for Rule R3: Price Snapshot) */
  snapshotTimestamp?: Date;
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

export function calculateDiscountPricing(
  faceValue: number,
  totalDiscountPct: number = DEFAULT_TOTAL_DISCOUNT_PCT
): DiscountPricingBreakdown {
  if (!Number.isFinite(faceValue) || faceValue <= 0) {
    throw new Error('Face value must be greater than 0.');
  }

  if (
    !Number.isFinite(totalDiscountPct) ||
    totalDiscountPct < MIN_TOTAL_DISCOUNT_PCT ||
    totalDiscountPct > MAX_TOTAL_DISCOUNT_PCT
  ) {
    throw new Error(
      `Total discount percentage must be between ${MIN_TOTAL_DISCOUNT_PCT} and ${MAX_TOTAL_DISCOUNT_PCT}.`
    );
  }

  const consumerBenefitPct = roundCurrency(totalDiscountPct * CONSUMER_DISCOUNT_SHARE);
  const evoucherBenefitPct = roundCurrency(totalDiscountPct - consumerBenefitPct);

  const totalDiscountAmount = roundCurrency(faceValue * (totalDiscountPct / 100));
  const consumerBenefitAmount = roundCurrency(faceValue * (consumerBenefitPct / 100));
  const evoucherBenefitAmount = roundCurrency(totalDiscountAmount - consumerBenefitAmount);

  return {
    faceValue: roundCurrency(faceValue),
    totalDiscountPct: roundCurrency(totalDiscountPct),
    consumerBenefitPct: roundCurrency(consumerBenefitPct),
    evoucherBenefitPct: roundCurrency(evoucherBenefitPct),
    totalDiscountAmount,
    consumerBenefitAmount,
    evoucherBenefitAmount,
    consumerPrice: roundCurrency(faceValue - consumerBenefitAmount),
    merchantReceivableAfterTotalDiscount: roundCurrency(faceValue - totalDiscountAmount),
    merchantReceivableAfterEvoucherBenefit: roundCurrency(faceValue - evoucherBenefitAmount),
  };
}
