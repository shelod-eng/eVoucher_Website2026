export const DEFAULT_TOTAL_DISCOUNT_PCT = 5;
export const CONSUMER_DISCOUNT_SHARE = 0.7;
export const PLATFORM_DISCOUNT_SHARE = 0.3;

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

  if (!Number.isFinite(totalDiscountPct) || totalDiscountPct < 0 || totalDiscountPct > 100) {
    throw new Error('Total discount percentage must be between 0 and 100.');
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
