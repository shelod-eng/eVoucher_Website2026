import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/services/billing/portal-guard', () => ({
  requirePortalUser: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/server/services/payment/payment-provider-factory', () => ({
  getPaymentModeFromEnv: vi.fn(() => 'production'),
  isPaymentSandboxEnabled: vi.fn(() => false),
}));

vi.mock('@/server/services/bankserv/adaptor', () => ({
  getBankservAdaptorOverview: vi.fn(),
  isBankservAdaptorCompatibilityError: vi.fn(() => false),
}));

import { GET } from '@/app/api/command-center/route';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import { getBankservAdaptorOverview } from '@/server/services/bankserv/adaptor';

const VALID_STATUSES = new Set([
  'LIVE',
  'SANDBOX',
  'CONTROLLED MOCK',
  'EVIDENCE PENDING',
  'GAP / NOT READY',
]);

function tableCount(table: string, status?: string) {
  if (table === 'reconciliation_exceptions') return 1;
  if (table === 'platform_events' && status === 'failed') return 2;
  if (table === 'platform_event_outbox' && status === 'dead_letter') return 1;
  return 3;
}

function createQuery(table: string) {
  const state: { column?: string; status?: string; latest?: boolean } = {};
  const query: any = {
    eq(column: string, value: string) {
      state.column = column;
      state.status = value;
      return query;
    },
    in(column: string, values: string[]) {
      state.column = column;
      state.status = values.join(',');
      return query;
    },
    order() {
      state.latest = true;
      return query;
    },
    limit() {
      return query;
    },
    then(resolve: (value: any) => unknown, reject: (reason: unknown) => unknown) {
      if (state.latest && table === 'reconciliation_runs') {
        return Promise.resolve({
          data: [
            {
              status: 'completed',
              completed_at: '2026-08-16T07:00:00.000Z',
              created_at: '2026-08-16T06:58:00.000Z',
            },
          ],
          error: null,
        }).then(resolve, reject);
      }

      return Promise.resolve({
        count: tableCount(table, state.status),
        error: null,
      }).then(resolve, reject);
    },
  };

  return query;
}

function createMockAdminClient() {
  return {
    from(table: string) {
      return {
        select() {
          return createQuery(table);
        },
      };
    },
  };
}

function collectEvidenceStatuses(value: unknown, out = new Set<string>()) {
  if (!value || typeof value !== 'object') return out;
  const record = value as Record<string, unknown>;
  for (const key of ['sourceAvailability', 'businessCapability']) {
    const status = record[key];
    if (typeof status === 'string') out.add(status);
  }
  Object.values(record).forEach((child) => collectEvidenceStatuses(child, out));
  return out;
}

describe('Command Centre route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (createAdminClient as any).mockReturnValue(createMockAdminClient());
    (getBankservAdaptorOverview as any).mockResolvedValue({
      summary: {},
      rails: [],
      recentBatches: [],
    });
  });

  it('returns Forbidden for unauthenticated requests', async () => {
    (requirePortalUser as any).mockResolvedValue({ allowed: false });

    const response = await GET(new Request('http://localhost/api/command-center'));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('returns the hardened read-only contract for authorized portal users', async () => {
    (requirePortalUser as any).mockResolvedValue({ allowed: true });

    const response = await GET(new Request('http://localhost/api/command-center'));
    const body = await response.json();
    const serialized = JSON.stringify(body).toLowerCase();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.dimensions.customer.consumerRegistrations.sourceAvailability).toBe('LIVE');
    expect(body.dimensions.customer.consumerRegistrations.businessCapability).toBe(
      'EVIDENCE PENDING'
    );
    expect(body.dimensions.customer.paymentTransactions.source).toBe('public.payment_transactions');
    expect(body.dimensions.commerce.issuedVouchers.source).toBe('public.customer_vouchers');
    expect(body.dimensions.financial.reconciliationFreshness.latestRunStatus).toBe('completed');
    expect(body.dimensions.governance.platformOutboxStatus.values.dead_letter).toBe(1);

    for (const status of collectEvidenceStatuses(body)) {
      expect(VALID_STATUSES.has(status)).toBe(true);
    }

    expect(serialized).not.toContain('service_role');
    expect(serialized).not.toContain('supabase_service_role_key');
    expect(serialized).not.toContain('account_number');
    expect(serialized).not.toContain('webhook_secret');
    expect(serialized).not.toContain('token');
  });
});
