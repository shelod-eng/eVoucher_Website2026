import { describe, expect, it } from 'vitest';
import { computeRedemptionBreakdown } from '@/lib/billing/redemption-breakdown';

describe('computeRedemptionBreakdown', () => {
  it('computes payout + discount + 70/30 split', () => {
    const result = computeRedemptionBreakdown({ grossAmount: 1000, totalDiscountPct: 5 });
    expect(result.grossAmount).toBe(1000);
    expect(result.merchantPayoutAmount).toBe(950);
    expect(result.totalDiscountAmount).toBe(50);
    expect(result.consumerBenefitAmount).toBe(35);
    expect(result.platformBenefitAmount).toBe(15);
  });

  it('rejects invalid inputs', () => {
    expect(() => computeRedemptionBreakdown({ grossAmount: 0, totalDiscountPct: 5 })).toThrow();
    expect(() => computeRedemptionBreakdown({ grossAmount: 100, totalDiscountPct: -1 })).toThrow();
    expect(() => computeRedemptionBreakdown({ grossAmount: 100, totalDiscountPct: 101 })).toThrow();
  });
});

