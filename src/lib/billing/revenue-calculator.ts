export type RevenueBreakdown = {
  faceValue: number;
  merchantGrossPayout: number; // 96% of face value
  bankFee: number; // 0.5% of merchant gross payout
  merchantNetPayout: number; // gross - bank fee
  consumerBenefit: number; // 2.8% of face value
  platformRevenue: number; // 1.2% of face value
};

function round2(value: number) {
  return Number(value.toFixed(2));
}

/**
 * TRD v2.0 revenue split.
 * - Merchant gross payout: 96%
 * - Bank fee: 0.5% of merchant gross payout
 * - Consumer benefit: 2.8%
 * - Platform revenue: 1.2%
 */
export function calculateRevenue(faceValue: number): RevenueBreakdown {
  const amount = Number(faceValue);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Face value must be a positive number.');
  }

  const merchantGrossPayout = round2(amount * 0.96);
  const bankFee = round2(merchantGrossPayout * 0.005);
  const merchantNetPayout = round2(merchantGrossPayout - bankFee);
  const consumerBenefit = round2(amount * 0.028);
  const platformRevenue = round2(amount * 0.012);

  return {
    faceValue: round2(amount),
    merchantGrossPayout,
    bankFee,
    merchantNetPayout,
    consumerBenefit,
    platformRevenue,
  };
}
