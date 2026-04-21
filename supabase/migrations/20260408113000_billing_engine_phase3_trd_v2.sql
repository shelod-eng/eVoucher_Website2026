-- Phase 3: Billing Engine TRD v2.0 alignment
-- Adds:
-- - bank linkages (encrypted at rest)
-- - engine runs/job tracking
-- - settlement reconciliation + BankServ metadata fields

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) Bank linkages (encrypted account numbers)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.billing_bank_linkages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  sponsor_bank_name TEXT NOT NULL DEFAULT 'FNB',
  merchant_bank_name TEXT,
  account_number_enc TEXT NOT NULL,
  account_number_last4 TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  branch_code TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('business_cheque', 'business_savings', 'current', 'savings')),
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'failed', 'mismatched')),
  verification_method TEXT NOT NULL DEFAULT 'avs'
    CHECK (verification_method IN ('avs', 'manual')),
  avs_match_code TEXT,
  avs_notes TEXT,
  encryption_key_id TEXT NOT NULL DEFAULT 'v1',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_bank_linkages_merchant_id
  ON public.billing_bank_linkages(merchant_id);
CREATE INDEX IF NOT EXISTS idx_billing_bank_linkages_status
  ON public.billing_bank_linkages(verification_status);
CREATE INDEX IF NOT EXISTS idx_billing_bank_linkages_active
  ON public.billing_bank_linkages(is_active);

ALTER TABLE public.billing_bank_linkages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_bank_linkages" ON public.billing_bank_linkages;
CREATE POLICY "portal_read_bank_linkages"
ON public.billing_bank_linkages
FOR SELECT
TO authenticated
USING (public.is_portal_user());

-- Merchants: can read their own linkages but never decrypted (stored encrypted).
DROP POLICY IF EXISTS "merchants_read_own_bank_linkages" ON public.billing_bank_linkages;
CREATE POLICY "merchants_read_own_bank_linkages"
ON public.billing_bank_linkages
FOR SELECT
TO authenticated
USING (
  merchant_id IN (SELECT id FROM public.merchants WHERE user_id::text = auth.uid()::text)
);

-- ---------------------------------------------------------------------------
-- 2) Engine runs (job tracking)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.billing_engine_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_by UUID,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'failed', 'completed')),
  step INT NOT NULL DEFAULT 0,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_billing_engine_runs_created_at
  ON public.billing_engine_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_engine_runs_status
  ON public.billing_engine_runs(status);

ALTER TABLE public.billing_engine_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_engine_runs" ON public.billing_engine_runs;
CREATE POLICY "portal_read_engine_runs"
ON public.billing_engine_runs
FOR SELECT
TO authenticated
USING (public.is_portal_user());

-- ---------------------------------------------------------------------------
-- 3) Settlements TRD fields (reconciliation + BankServ metadata)
-- ---------------------------------------------------------------------------

ALTER TABLE public.billing_settlements
  ADD COLUMN IF NOT EXISTS settlement_reference TEXT,
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.billing_invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bank_linkage_id UUID REFERENCES public.billing_bank_linkages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ZAR',
  ADD COLUMN IF NOT EXISTS reconciliation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (reconciliation_status IN ('pending', 'matched', 'unmatched', 'disputed')),
  ADD COLUMN IF NOT EXISTS bankserv_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS bankserv_batch_id TEXT,
  ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS instruction_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status_history_json JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: keep historical rows readable.
UPDATE public.billing_settlements
SET settlement_reference = COALESCE(settlement_reference, reference),
    initiated_at = COALESCE(initiated_at, created_at)
WHERE settlement_reference IS NULL OR initiated_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_settlements_settlement_reference
  ON public.billing_settlements(settlement_reference)
  WHERE settlement_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_billing_settlements_reconciliation_status
  ON public.billing_settlements(reconciliation_status);

