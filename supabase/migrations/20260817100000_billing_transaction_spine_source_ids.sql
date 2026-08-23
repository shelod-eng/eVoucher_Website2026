-- Billing Engine Golden Transaction spine repair
-- Adds canonical transactionReference linkage to downstream financial records.
-- This does not create transactions or connect live external banking.

ALTER TABLE public.merchant_payouts
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS bank_fee_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS consumer_benefit_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS platform_revenue_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS settlement_target TEXT,
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS uq_merchant_payouts_source_id
  ON public.merchant_payouts(source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_merchant_payouts_source_id
  ON public.merchant_payouts(source_id);

ALTER TABLE public.billing_invoices
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS face_value NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS consumer_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS total_discount_amount NUMERIC(12,2);

CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_invoices_source_id
  ON public.billing_invoices(source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_billing_invoices_source_id
  ON public.billing_invoices(source_id);

ALTER TABLE public.billing_settlements
  ALTER COLUMN batch_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS bank_fee_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS consumer_benefit_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS platform_revenue_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS settlement_target TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_settlements_source_id
  ON public.billing_settlements(source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_billing_settlements_source_id
  ON public.billing_settlements(source_id);
