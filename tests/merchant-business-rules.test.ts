import { describe, expect, it } from 'vitest';
import { calculateDiscountPricing } from '@/lib/pricing';
import {
  validateAllCriticalRules,
  validateR6_DiscountRangeEnforcement,
} from '@/server/utils/business-rules-validator';

describe('merchant business rules', () => {
  it('passes critical rules for a valid product pricing setup', () => {
    const pricing = calculateDiscountPricing(100, 5);
    const result = validateAllCriticalRules(pricing);
    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('flags out-of-range discount values', () => {
    const low = validateR6_DiscountRangeEnforcement(2);
    const high = validateR6_DiscountRangeEnforcement(16);
    expect(low.isValid).toBe(false);
    expect(high.isValid).toBe(false);
  });
});
