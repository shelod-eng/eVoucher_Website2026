-- Billing Engine transaction-spine repair (invoices)
--
-- ROOT CAUSE (forensic evidence, live DB probe 2026-08-23):
--   recordVoucherPurchaseBillingEvent() inserts billing_invoices rows that
--   include a customer_id column. The deployed billing_invoices table has no
--   customer_id column, so PostgREST rejects EVERY invoice insert (PGRST204)
--   and the recorder silently swallows the error. Result: billing_invoices
--   always has 0 rows and the purchase lifecycle breaks at the invoice stage.
--
-- SECONDARY HAZARD:
--   billing_invoices carries UNIQUE (merchant_id, period_start, period_end).
--   Per-transaction spine invoices use period_start = period_end = txn date,
--   so a second same-day purchase by the same merchant violates the unique
--   constraint and would be silently dropped. The per-period uniqueness moves
--   to application level (see src/app/api/billing/invoices/route.ts), and a
--   plain index keeps query performance.
--
-- This migration is additive/idempotent and does NOT touch financial data.

-- 1) customer_id on billing_invoices (nullable UUID, no FK by design:
--    customers may be anonymised/deleted independently of invoices).
ALTER TABLE public.billing_invoices
  ADD COLUMN IF NOT EXISTS customer_id UUID;

CREATE INDEX IF NOT EXISTS idx_billing_invoices_customer_id
  ON public.billing_invoices(customer_id);

-- 2) Replace UNIQUE (merchant_id, period_start, period_end) with a plain
--    index so multiple per-transaction spine invoices can coexist for the
--    same merchant/day while period invoices remain indexed for lookups.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'billing_invoices'
    AND c.contype = 'u'
    AND (
      SELECT array_agg(a.attname ORDER BY k.ordinality)
      FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, ordinality)
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
    ) = ARRAY['merchant_id'::TEXT, 'period_start'::TEXT, 'period_end'::TEXT];

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.billing_invoices DROP CONSTRAINT %I', constraint_name);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_billing_invoices_merchant_period
  ON public.billing_invoices(merchant_id, period_start, period_end);