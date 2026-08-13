import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock external dependencies ───────────────────────────────────────────────
// All module mocks must be hoisted by vitest before the route under test is
// imported. Every external service and the Supabase admin client are replaced
// with controlled fakes so the test focuses solely on the route handler.

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/server/services/payment/payment-provider-factory', () => ({
  createPaymentProvider: vi.fn(),
}));

vi.mock('@/server/services/bankserv/adaptor', () => ({
  deriveSettlementAmount: vi.fn().mockReturnValue(1000),
  isBankservAdaptorCompatibilityError: vi.fn().mockReturnValue(false),
  queueBankservSettlementTransaction: vi.fn(),
}));

vi.mock('@/server/services/voucher/default-voucher-service', () => ({
  DefaultVoucherService: vi.fn().mockImplementation(() => ({
    issueVoucher: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@/server/services/wallet/ledger', () => ({
  recordWalletCredit: vi.fn(),
}));

vi.mock('@/server/utils/audit', () => ({
  writeAuditEvent: vi.fn(),
}));

vi.mock('@/server/services/billing/billing-events', () => ({
  recordVoucherPurchaseBillingEvent: vi.fn(),
  recordVoucherRedemptionBillingEvent: vi.fn(),
}));

vi.mock('@/lib/platform-events', () => ({
  publishPlatformEvent: vi.fn(),
}));

// ─── Imports (after mocks are hoisted) ────────────────────────────────────────
import { POST } from '@/app/api/v1/payments/webhook/route';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPaymentProvider } from '@/server/services/payment/payment-provider-factory';
import { recordVoucherPurchaseBillingEvent } from '@/server/services/billing/billing-events';
import { publishPlatformEvent } from '@/lib/platform-events';
import { writeAuditEvent } from '@/server/utils/audit';
import { queueBankservSettlementTransaction } from '@/server/services/bankserv/adaptor';

// ─── Test fixtures ────────────────────────────────────────────────────────────

/**
 * A pre-completed non-wallet purchase transaction row.
 * - merchant_id + voucher_code present → NOT a wallet top-up
 * - voucher_code present → skips voucher issuance branch
 * This routes execution directly to the billing + platform-event block.
 */
const mockTransaction = {
  id: 'txn-1',
  merchant_id: 'merch-1',
  customer_id: 'cust-1',
  voucher_code: 'VCH-ABCDEF12',
  amount: 1000,
  face_value: 1000,
  payment_status: 'pending',
  payment_method: 'card',
  access_channel: 'web',
  total_discount_pct: null,
  consumer_benefit_pct: null,
  evoucher_benefit_pct: null,
  merchant_receivable_after_total_discount: null,
  merchant_receivable_after_evoucher_benefit: null,
};

const BASELINE_PAYLOAD = {
  eventId: 'evt-123',
  transactionReference: 'TXN-test-001',
  status: 'completed',
  amount: 1000,
  settledAmount: 1000,
};

/**
 * Builds a mock Supabase admin client whose `.from(table)` returns chainable
 * builders mirroring the subset of the Supabase JS API used by the payment
 * webhook route:
 *   - payment_webhook_events → .insert()
 *   - payment_transactions → .select().eq().single() / .update().eq()
 */
function createMockAdminClient(transaction: any) {
  const singleFn = vi.fn().mockResolvedValue({ data: transaction, error: null });
  const eqAfterSelectFn = vi.fn().mockReturnValue({ single: singleFn });
  const selectFn = vi.fn().mockReturnValue({ eq: eqAfterSelectFn });
  const eqAfterUpdateFn = vi.fn().mockResolvedValue({ error: null });
  const updateFn = vi.fn().mockReturnValue({ eq: eqAfterUpdateFn });
  const insertWebhookFn = vi.fn().mockResolvedValue({ error: null });

  const fromFn = vi.fn((table: string) => {
    if (table === 'payment_webhook_events') {
      return { insert: insertWebhookFn };
    }
    if (table === 'payment_transactions') {
      return { select: selectFn, update: updateFn };
    }
    return { insert: vi.fn().mockResolvedValue({ error: null }) };
  });

  return { from: fromFn } as any;
}

function createMockPaymentProvider() {
  return {
    verifyWebhook: vi.fn().mockResolvedValue(true),
    normalizeStatus: vi.fn().mockReturnValue('completed'),
    createPayment: vi.fn(),
  };
}

function buildWebhookRequest(payload: any) {
  return new Request('http://localhost/api/v1/payments/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-signature': 'sig',
      'x-webhook-timestamp': '1234567890',
      'x-payment-provider': 'production',
    },
    body: JSON.stringify(payload),
  });
}

// ─── Shared setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();

  // Admin client — returns a fresh chainable mock each test
  (createAdminClient as any).mockReturnValue(createMockAdminClient(mockTransaction));

  // Payment provider — signature verifies, status normalizes to 'completed'
  (createPaymentProvider as any).mockReturnValue(createMockPaymentProvider());

  // Defaults: all downstream calls succeed unless a test overrides
  (writeAuditEvent as any).mockResolvedValue(undefined);
  (publishPlatformEvent as any).mockResolvedValue('platform-event-id');
  (queueBankservSettlementTransaction as any).mockResolvedValue({ queued: true });
  (recordVoucherPurchaseBillingEvent as any).mockResolvedValue({
    event: {},
    breakdown: {},
  });
});

// ─── GAP-011 observability tests ──────────────────────────────────────────────

describe('Payment webhook route — GAP-011 observability', () => {
  /**
   * Test A — Billing failure does not break webhook
   *
   * Simulates recordVoucherPurchaseBillingEvent() throwing, then verifies the
   * webhook still returns its normal successful 200 response with no error
   * propagated to the payment-provider response.
   */
  it('A — billing failure does not break the webhook response', async () => {
    (recordVoucherPurchaseBillingEvent as any).mockRejectedValue(
      new Error('Billing DB failure')
    );

    const req = buildWebhookRequest(BASELINE_PAYLOAD);
    const res = await POST(req as any);
    const json = await res.json();

    // Normal successful payment-provider response
    expect(res.status).toBe(200);
    expect(json.status).toBe('completed');
    expect(json.transactionReference).toBe('TXN-test-001');
  });

  /**
   * Test B — Error is observable
   *
   * Verifies that the billing failure produces the expected console.error log
   * output so it is no longer completely silent.
   */
  it('B — billing failure is observable via console.error', async () => {
    (recordVoucherPurchaseBillingEvent as any).mockRejectedValue(
      new Error('Billing DB failure')
    );

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = buildWebhookRequest(BASELINE_PAYLOAD);
    await POST(req as any);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Webhook] Direct billing event recording failed'),
      'Billing DB failure'
    );
  });

  /**
   * Test C — Existing platform event / outbox path remains intact
   *
   * Verifies that publishPlatformEvent() is still invoked after the direct
   * billing failure, preserving the durable outbox retry architecture.
   */
  it('C — publishPlatformEvent is still invoked after billing failure', async () => {
    (recordVoucherPurchaseBillingEvent as any).mockRejectedValue(
      new Error('Billing DB failure')
    );

    const req = buildWebhookRequest(BASELINE_PAYLOAD);
    await POST(req as any);

    expect(publishPlatformEvent).toHaveBeenCalledTimes(1);
    expect(publishPlatformEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'VOUCHER_PURCHASED',
        transactionRef: 'TXN-test-001',
        merchantId: 'merch-1',
        customerId: 'cust-1',
      })
    );
  });

  /**
   * Control — Normal happy path (billing succeeds).
   * Confirms the standard flow is unaffected by the observability change.
   */
  it('control — billing succeeds and webhook returns normal response', async () => {
    (recordVoucherPurchaseBillingEvent as any).mockResolvedValue({
      event: {},
      breakdown: {},
    });

    const req = buildWebhookRequest(BASELINE_PAYLOAD);
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('completed');
    expect(publishPlatformEvent).toHaveBeenCalledTimes(1);
    expect(publishPlatformEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'VOUCHER_PURCHASED' })
    );
  });

  /**
   * Edge — Billing error with no .message property is still logged safely.
   */
  it('edge — billing error without .message is still logged without throwing', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (recordVoucherPurchaseBillingEvent as any).mockRejectedValue('string error');

    const req = buildWebhookRequest(BASELINE_PAYLOAD);
    const res = await POST(req as any);
    const json = await res.json();

    // Webhook still succeeds
    expect(res.status).toBe(200);
    expect(json.status).toBe('completed');

    // Error is logged observably
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(publishPlatformEvent).toHaveBeenCalledTimes(1);
  });
});
