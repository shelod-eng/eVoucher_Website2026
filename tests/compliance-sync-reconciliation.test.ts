import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrubPII, generateHMACSignature, generateServiceJWT } from '../src/lib/platform-events';
import { validateServiceJWT } from '../src/app/api/billing/events/route';
import { runDailyReconciliation } from '../src/server/services/billing/reconciliation-engine';
import { createAdminClient } from '../src/lib/supabase/admin';

vi.mock('../src/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

describe('Compliance & Outbox Sync Tests', () => {
  describe('POPIA PII Redaction', () => {
    it('should recursively redact PII fields but preserve non-PII keys', () => {
      const payload = {
        voucher_id: 'v-123',
        customer_email: 'customer@example.com',
        user: {
          first_name: 'John',
          last_name: 'Doe',
          phone_number: '+27821234567',
          details: {
            physical_address: '123 Main St, Johannesburg',
            is_active: true,
          }
        },
        items: [
          { item_id: 'i-1', price: 100, billing_account: '123456789' }
        ]
      };

      const cleaned = scrubPII(payload);

      expect(cleaned.voucher_id).toBe('v-123');
      expect(cleaned.customer_email).toBe('[REDACTED]');
      expect(cleaned.user.first_name).toBe('[REDACTED]');
      expect(cleaned.user.last_name).toBe('[REDACTED]');
      expect(cleaned.user.phone_number).toBe('[REDACTED]');
      expect(cleaned.user.details.physical_address).toBe('[REDACTED]');
      expect(cleaned.user.details.is_active).toBe(true);
      expect(cleaned.items[0].item_id).toBe('i-1');
      expect(cleaned.items[0].price).toBe(100);
      expect(cleaned.items[0].billing_account).toBe('[REDACTED]');
    });
  });

  describe('JWT and Signature Verification', () => {
    it('should generate identical HMAC signatures for matching parameters', () => {
      const sig1 = generateHMACSignature('evt-1', '2026-08-04T12:00:00Z', 150.00);
      const sig2 = generateHMACSignature('evt-1', '2026-08-04T12:00:00Z', 150.00);
      const sig3 = generateHMACSignature('evt-1', '2026-08-04T12:00:00Z', 150.01);

      expect(sig1).toBe(sig2);
      expect(sig1).not.toBe(sig3);
    });

    it('should sign and validate service-to-service JWTs', () => {
      const token = generateServiceJWT();
      const isValid = validateServiceJWT(token);
      expect(isValid).toBe(true);

      const invalidToken = token + 'tampered';
      expect(validateServiceJWT(invalidToken)).toBe(false);
    });
  });

  describe('Reconciliation Engine', () => {
    let mockSupabase: any;

    beforeEach(() => {
      mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: { id: 'run-1' }, error: null }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'run-1' }, error: null }),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockReturnThis(),
      };
      (createAdminClient as any).mockReturnValue(mockSupabase);
    });

    it('should run reconciliation and correctly identify exceptions', async () => {
      // Mock data returns
      // purchases: 1 matching, 1 missing, 1 amount mismatch
      const mockPurchases = [
        { transaction_reference: 'ref-match', amount: 100, face_value: 100, created_at: '2026-08-04T10:00:00Z' },
        { transaction_reference: 'ref-missing', amount: 200, face_value: 200, created_at: '2026-08-04T10:00:00Z' },
        { transaction_reference: 'ref-mismatch', amount: 300, face_value: 300, created_at: '2026-08-04T10:00:00Z' },
      ];

      const mockLedger = [
        { source_id: 'ref-match', debit_account: 'asset:cash', credit_account: 'liability:voucher_outstanding', amount: 100 },
        { source_id: 'ref-mismatch', debit_account: 'asset:cash', credit_account: 'liability:voucher_outstanding', amount: 290 }, // 10 ZAR mismatch
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'payment_transactions') {
          return {
            select: () => ({
              eq: () => ({
                gte: () => ({
                  lte: () => Promise.resolve({ data: mockPurchases, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'wallet_transactions') {
          return {
            select: () => ({
              eq: () => ({
                gte: () => ({
                  lte: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'billing_ledger_entries') {
          return {
            select: () => ({
              gte: () => ({
                lte: () => Promise.resolve({ data: mockLedger, error: null }),
              }),
            }),
          };
        }
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'run-1' }, error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: {}, error: null }),
              }),
            }),
          }),
        };
      });

      const summary = await runDailyReconciliation('2026-08-04');

      expect(summary.status).toBe('exceptions');
      expect(summary.exceptionCount).toBe(2); // 1 missing, 1 mismatch
      expect(summary.ws1TxCount).toBe(3);
    });
  });
});
