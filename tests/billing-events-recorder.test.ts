import { beforeEach, describe, expect, it, vi } from 'vitest';

// The recorder writes audit events through this helper — isolate it so the
// unit tests never depend on real audit plumbing.
vi.mock('@/server/utils/audit', () => ({
  writeAuditEvent: vi.fn(async () => ({ id: 'audit-stub-id' })),
}));

import { writeAuditEvent } from '@/server/utils/audit';
import { recordVoucherPurchaseBillingEvent } from '@/server/services/billing/billing-events';

type Row = Record<string, any>;

/**
 * Minimal in-memory Supabase client fake covering the exact query patterns the
 * billing recorder uses (select/eq/limit/maybeSingle/single/insert/update).
 */
function createFakeSupabase(options?: { missingInvoiceCustomerIdColumn?: boolean }) {
  const tables: Record<string, Row[]> = {
    billing_events: [],
    billing_ledger_entries: [],
    merchant_payouts: [],
    billing_settlements: [],
    billing_invoices: [],
  };
  const invoiceInsertPayloads: Row[] = [];
  let idCounter = 0;
  const nextId = () => `fake-id-${++idCounter}`;

  function makeBuilder(table: string) {
    let filters: Array<(r: Row) => boolean> = [];
    let op: 'select' | 'insert' | 'update' = 'select';
    let payload: any = null;
    let limitVal: number | null = null;

    const matchingRows = () => tables[table].filter((r) => filters.every((fn) => fn(r)));

    const runInsert = (): { data: any; error: any } => {
      const list: Row[] = Array.isArray(payload) ? payload : [payload];
      if (table === 'billing_invoices') invoiceInsertPayloads.push(...list);
      // Simulate the live production schema gap: billing_invoices without a
      // customer_id column rejects payloads that include it (PGRST204).
      if (
        table === 'billing_invoices' &&
        options?.missingInvoiceCustomerIdColumn &&
        list.some((p) => 'customer_id' in p)
      ) {
        return {
          data: null,
          error: {
            message:
              "Could not find the 'customer_id' column of 'billing_invoices' in the schema cache",
          },
        };
      }
      const inserted = list.map((p) => ({ ...p, id: p.id ?? nextId() }));
      tables[table].push(...inserted);
      return { data: Array.isArray(payload) ? inserted : inserted[0], error: null };
    };

    const runUpdate = () => {
      const out = matchingRows();
      for (const r of out) Object.assign(r, payload);
      return { data: out, error: null };
    };

    const runSelect = () => {
      let out = matchingRows();
      if (limitVal != null) out = out.slice(0, limitVal);
      return out;
    };

    const builder: any = {
      select() {
        // PostgREST-style chaining: .insert(...).select(...).single() keeps the
        // pending insert/update operation and returns the affected rows.
        return builder;
      },
      eq(col: string, val: any) {
        filters.push((r) => r[col] === val);
        return builder;
      },
      is(col: string, val: any) {
        filters.push((r) => r[col] === val);
        return builder;
      },
      neq(col: string, val: any) {
        filters.push((r) => r[col] !== val);
        return builder;
      },
      gte(col: string, v: any) {
        filters.push((r) => String(r[col]) >= String(v));
        return builder;
      },
      lte(col: string, v: any) {
        filters.push((r) => String(r[col]) <= String(v));
        return builder;
      },
      order() {
        return builder;
      },
      range() {
        return builder;
      },
      limit(n: number) {
        limitVal = n;
        return builder;
      },
      insert(p: any) {
        op = 'insert';
        payload = p;
        return builder;
      },
      update(p: any) {
        op = 'update';
        payload = p;
        return builder;
      },
      async maybeSingle() {
        if (op === 'insert') return runInsert();
        if (op === 'update') return runUpdate();
        const out = runSelect();
        return { data: out[0] ?? null, error: null };
      },
      async single() {
        if (op === 'insert') return runInsert();
        const out = runSelect();
        return { data: out[0] ?? null, error: null };
      },
      then(onFulfilled?: any, onRejected?: any) {
        let result: any;
        if (op === 'insert') result = runInsert();
        else if (op === 'update') result = runUpdate();
        else result = { data: runSelect(), error: null };
        return Promise.resolve(result).then(onFulfilled, onRejected);
      },
    };
    return builder;
  }

  return {
    tables,
    invoiceInsertPayloads,
    from(table: string) {
      if (!tables[table]) tables[table] = [];
      return makeBuilder(table);
    },
  };
}

const GOLDEN_INPUT = {
  eventKey: 'TXN-1786958158916-C4127F5E5978',
  merchantId: '047b18d8-027d-4e22-b690-e9fffa9d20e4',
  customerId: 'd449c40d-3dc5-472f-9ea1-15e27c526d1a',
  voucherId: 'f67c3ce9-4d86-42f4-91e3-11d66e5f0e28',
  consumerPrice: 126.74,
  faceValue: 129.99,
  totalDiscountPct: 5,
  occurredAt: '2026-08-17T09:16:00.699+00:00',
  metadata: { source: 'voucher_purchase_route' },
};

describe('recordVoucherPurchaseBillingEvent — transaction spine propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates event, ledger, payout, settlement, invoice and audit records for one purchase', async () => {
    const db = createFakeSupabase();

    await recordVoucherPurchaseBillingEvent(db as any, GOLDEN_INPUT);

    // Billing event
    expect(db.tables.billing_events).toHaveLength(1);
    const event = db.tables.billing_events[0];
    expect(event.event_key).toBe(GOLDEN_INPUT.eventKey);
    expect(event.event_type).toBe('payment_transaction');
    expect(event.gross_amount).toBe(129.99);
    expect(event.metadata.transactionType).toBe('purchase');

    // Double-entry ledger postings keyed by canonical source_id
    expect(db.tables.billing_ledger_entries).toHaveLength(3);
    for (const entry of db.tables.billing_ledger_entries) {
      expect(entry.source_id).toBe(GOLDEN_INPUT.eventKey);
      expect(entry.entry_group_id).toBe(event.id);
    }
    const ledgerAmounts = db.tables.billing_ledger_entries.map((e) => e.amount).sort((a, b) => a - b);
    expect(ledgerAmounts).toEqual([1.56, 3.64, 129.99]);

    // Merchant payout (TRD v2.0: 96% gross − 0.5% bank fee)
    expect(db.tables.merchant_payouts).toHaveLength(1);
    const payout = db.tables.merchant_payouts[0];
    expect(payout.source_id).toBe(GOLDEN_INPUT.eventKey);
    expect(payout.gross_amount).toBe(124.79);
    expect(payout.bank_fee_amount).toBe(0.62);
    expect(payout.amount).toBe(124.17);
    expect(payout.status).toBe('pending');

    // Settlement
    expect(db.tables.billing_settlements).toHaveLength(1);
    expect(db.tables.billing_settlements[0].source_id).toBe(GOLDEN_INPUT.eventKey);
    expect(db.tables.billing_settlements[0].amount).toBe(124.17);

    // Per-transaction invoice
    expect(db.tables.billing_invoices).toHaveLength(1);
    const invoice = db.tables.billing_invoices[0];
    expect(invoice.source_id).toBe(GOLDEN_INPUT.eventKey);
    expect(invoice.status).toBe('approved');
    expect(invoice.net_payable_to_merchant).toBe(124.17);
    expect(invoice.total_face_value).toBe(129.99);

    // Audit evidence
    expect(writeAuditEvent).toHaveBeenCalledTimes(1);
  });

  it('is idempotent — replaying the same eventKey creates no duplicate financial records', async () => {
    const db = createFakeSupabase();

    await recordVoucherPurchaseBillingEvent(db as any, GOLDEN_INPUT);
    await recordVoucherPurchaseBillingEvent(db as any, GOLDEN_INPUT);

    expect(db.tables.billing_events).toHaveLength(1);
    expect(db.tables.billing_ledger_entries).toHaveLength(3);
    expect(db.tables.merchant_payouts).toHaveLength(1);
    expect(db.tables.billing_settlements).toHaveLength(1);
    expect(db.tables.billing_invoices).toHaveLength(1);
  });

  it('falls back to an insert without customer_id when the live table lacks the column', async () => {
    const db = createFakeSupabase({ missingInvoiceCustomerIdColumn: true });

    const result = await recordVoucherPurchaseBillingEvent(db as any, GOLDEN_INPUT);

    // Two attempts: full payload rejected, legacy payload accepted.
    expect(db.invoiceInsertPayloads).toHaveLength(2);
    expect('customer_id' in db.invoiceInsertPayloads[0]).toBe(true);
    expect('customer_id' in db.invoiceInsertPayloads[1]).toBe(false);

    // The invoice record still exists — the spine does not break.
    expect(db.tables.billing_invoices).toHaveLength(1);
    expect(db.tables.billing_invoices[0].source_id).toBe(GOLDEN_INPUT.eventKey);
    expect(result.breakdown.merchantNetPayout).toBe(124.17);
  });

  it('rejects input without an eventKey', async () => {
    const db = createFakeSupabase();
    await expect(
      recordVoucherPurchaseBillingEvent(db as any, { ...GOLDEN_INPUT, eventKey: '' })
    ).rejects.toThrow('eventKey is required.');
  });
});