-- Phase 4: Finance-grade ledger source-of-truth
-- Adds:
-- - idempotent billing events (billing_events)
-- - invoice line items tied to events (billing_invoice_lines)
-- - invoice settlement linkage + payment reference

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) Idempotent billing events (source of truth for billing)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE, -- idempotency key / external event id
  event_type TEXT NOT NULL CHECK (event_type IN ('voucher_redemption', 'payment_transaction', 'manual_adjustment')),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  voucher_id UUID REFERENCES public.customer_vouchers(id) ON DELETE SET NULL,
  gross_amount NUMERIC(12,2) NOT NULL CHECK (gross_amount >= 0),
  merchant_payout_amount NUMERIC(12,2) NOT NULL CHECK (merchant_payout_amount >= 0),
  total_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (total_discount_pct >= 0 AND total_discount_pct <= 100),
  total_discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_discount_amount >= 0),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  invoice_id UUID REFERENCES public.billing_invoices(id) ON DELETE SET NULL,
  settlement_id UUID REFERENCES public.billing_settlements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_billing_events_merchant_id ON public.billing_events(merchant_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_occurred_at ON public.billing_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_invoice_id ON public.billing_events(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_settlement_id ON public.billing_events(settlement_id);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_billing_events" ON public.billing_events;
CREATE POLICY "portal_read_billing_events"
ON public.billing_events
FOR SELECT
TO authenticated
USING (public.is_portal_user());

DROP POLICY IF EXISTS "merchants_read_own_billing_events" ON public.billing_events;
CREATE POLICY "merchants_read_own_billing_events"
ON public.billing_events
FOR SELECT
TO authenticated
USING (
  merchant_id IN (SELECT id FROM public.merchants WHERE user_id::text = auth.uid()::text)
);

-- updated_at trigger (reuse existing helper if present)
DROP TRIGGER IF EXISTS update_billing_events_updated_at ON public.billing_events;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at' AND pg_function_is_visible(oid)) THEN
    CREATE TRIGGER update_billing_events_updated_at
    BEFORE UPDATE ON public.billing_events
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2) Invoice line items tied to events
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.billing_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.billing_events(id) ON DELETE RESTRICT,
  occurred_at TIMESTAMPTZ NOT NULL,
  gross_amount NUMERIC(12,2) NOT NULL CHECK (gross_amount >= 0),
  merchant_payout_amount NUMERIC(12,2) NOT NULL CHECK (merchant_payout_amount >= 0),
  total_discount_amount NUMERIC(12,2) NOT NULL CHECK (total_discount_amount >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (invoice_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_invoice_lines_invoice_id
  ON public.billing_invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoice_lines_event_id
  ON public.billing_invoice_lines(event_id);

ALTER TABLE public.billing_invoice_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_billing_invoice_lines" ON public.billing_invoice_lines;
CREATE POLICY "portal_read_billing_invoice_lines"
ON public.billing_invoice_lines
FOR SELECT
TO authenticated
USING (public.is_portal_user());

-- ---------------------------------------------------------------------------
-- 3) Invoice bookkeeping enhancements
-- ---------------------------------------------------------------------------

ALTER TABLE public.billing_invoices
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS settlement_batch_id UUID REFERENCES public.billing_settlement_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_billing_invoices_settlement_batch_id
  ON public.billing_invoices(settlement_batch_id);

