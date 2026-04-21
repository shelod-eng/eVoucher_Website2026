import { describe, expect, it, vi } from 'vitest';
import { encryptSensitive } from '@/lib/billing/encryption';
import { formatBankServBatch, serialiseBatchToFlatFile } from '@/lib/billing/bankserv-formatter';

describe('BankServ formatter', () => {
  it('formats and serialises a flat-file line', () => {
    process.env.BILLING_ENCRYPTION_KEY =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.BILLING_ENCRYPTION_KEY_ID = 'v1';

    const { ciphertext } = encryptSensitive('1234567890');
    const instructions = formatBankServBatch([
      {
        settlementId: 's1',
        settlementReference: 'EVS-INV-202604-AAAA',
        amount: 955.2,
        invoiceId: 'i1',
        invoiceNumber: 'INV-202604-AAAA',
        merchantId: 'm1',
        linkage: {
          branchCode: '250655',
          accountType: 'business_cheque',
          accountHolderName: 'Test Merchant Pty Ltd',
          accountNumberEnc: ciphertext,
        },
      },
    ]);

    expect(instructions).toHaveLength(1);
    expect(instructions[0].transactionCode).toBe('40');
    expect(instructions[0].destinationAccount).toBe('1234567890');
    expect(instructions[0].amountInCents).toBe(95520);

    const text = serialiseBatchToFlatFile(instructions);
    expect(text).toContain('40');
    expect(text).toContain('250655');
    expect(text).toContain('00000095520');
  });
});

