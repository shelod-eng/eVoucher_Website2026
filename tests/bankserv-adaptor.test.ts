import { describe, expect, it } from 'vitest';
import {
  deriveSettlementAmount,
  mapPaymentMethodToBankservRail,
} from '@/server/services/bankserv/adaptor';

describe('BankServ adaptor helpers', () => {
  it('maps platform payment methods to BankServ rails', () => {
    expect(mapPaymentMethodToBankservRail('visa_secure')).toBe('CARD');
    expect(mapPaymentMethodToBankservRail('debit_credit')).toBe('CARD');
    expect(mapPaymentMethodToBankservRail('eft')).toBe('EFT');
    expect(mapPaymentMethodToBankservRail('payfast')).toBe('PAYFAST');
    expect(mapPaymentMethodToBankservRail('wallet')).toBe('WALLET');
    expect(mapPaymentMethodToBankservRail('unknown')).toBe('UNKNOWN');
  });

  it('prefers explicit merchant receivable when deriving settlement amount', () => {
    expect(
      deriveSettlementAmount({
        merchantReceivableAfterTotalDiscount: 95,
        merchantReceivableAfterEvoucherBenefit: 97.5,
        faceValue: 100,
        totalDiscountAmount: 5,
        amount: 97.5,
      })
    ).toBe(95);
  });

  it('falls back to face value minus discount amount when receivable fields are absent', () => {
    expect(
      deriveSettlementAmount({
        faceValue: 250,
        totalDiscountAmount: 12.5,
        amount: 237.5,
      })
    ).toBe(237.5);
  });
});
