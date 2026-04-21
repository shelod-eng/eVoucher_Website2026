export type RedemptionBreakdown = {
  grossAmount: number;
  totalDiscountPct: number;
  merchantPayoutAmount: number;
  totalDiscountAmount: number;
  consumerBenefitAmount: number; // 70% of total discount amount
  platformBenefitAmount: number; // 30% of total discount amount
};

function round2(value: number) {
  return Number(value.toFixed(2));
}

/**
 * Current discount model used across pricing migrations:
 * - merchant payout = gross * (1 - totalDiscountPct/100)
 * - total discount = gross - payout
 * - split discount into consumer/platform as 70/30 for reporting
 */
export function computeRedemptionBreakdown(input: {
  grossAmount: number;
  totalDiscountPct: number;
}): RedemptionBreakdown {
  const grossAmount = Number(input.grossAmount);
  const totalDiscountPct = Number(input.totalDiscountPct);

  if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
    throw new Error('grossAmount must be a positive number.');
  }
  if (!Number.isFinite(totalDiscountPct) || totalDiscountPct < 0 || totalDiscountPct > 100) {
    throw new Error('totalDiscountPct must be between 0 and 100.');
  }

  const payoutMultiplier = Math.max(0, 1 - totalDiscountPct / 100);
  const merchantPayoutAmount = round2(grossAmount * payoutMultiplier);
  const totalDiscountAmount = round2(grossAmount - merchantPayoutAmount);

  const consumerBenefitAmount = round2(totalDiscountAmount * 0.7);
  const platformBenefitAmount = round2(totalDiscountAmount - consumerBenefitAmount);

  return {
    grossAmount: round2(grossAmount),
    totalDiscountPct: round2(totalDiscountPct),
    merchantPayoutAmount,
    totalDiscountAmount,
    consumerBenefitAmount,
    platformBenefitAmount,
  };
}
