import { describe, expect, it } from 'vitest';
import { calculateRevenue } from '@/lib/billing/revenue-calculator';
import { verifyLedgerSplit } from '@/server/services/billing/ledger-verification';

describe('calculateRevenue', () => {
  it.each([
    [100, 96, 2.8, 1.2, 0.48, 95.52],
    [1000, 960, 28, 12, 4.8, 955.2],
    [1234.56, 1185.18, 34.57, 14.81, 5.93, 1179.25],
  ])(
    'applies the TRD split for R%s',
    (faceValue, merchantGross, consumerBenefit, platformRevenue, bankFee, merchantNet) => {
      expect(calculateRevenue(faceValue)).toEqual({
        faceValue,
        merchantGrossPayout: merchantGross,
        consumerBenefit,
        platformRevenue,
        bankFee,
        merchantNetPayout: merchantNet,
      });
    }
  );

  it('rejects invalid voucher values', () => {
    expect(() => calculateRevenue(0)).toThrow('Face value must be a positive number.');
    expect(() => calculateRevenue(Number.NaN)).toThrow('Face value must be a positive number.');
  });
});

describe('verifyLedgerSplit', () => {
  it('passes when actual ledger amounts match the required split', () => {
    const result = verifyLedgerSplit({
      faceValue: 1000,
      merchantPayout: 960,
      consumerBenefit: 28,
      platformRevenue: 12,
      bankFee: 4.8,
    });

    expect(result.passed).toBe(true);
    expect(result.discrepancies).toEqual({
      merchantPayout: 0,
      consumerBenefit: 0,
      platformRevenue: 0,
      bankFee: 0,
    });
  });

  it('fails when a split deviates beyond tolerance', () => {
    const result = verifyLedgerSplit({
      faceValue: 1000,
      merchantPayout: 950,
      consumerBenefit: 28,
      platformRevenue: 12,
      bankFee: 4.8,
    });

    expect(result.passed).toBe(false);
    expect(result.discrepancies.merchantPayout).toBe(-10);
  });
});
