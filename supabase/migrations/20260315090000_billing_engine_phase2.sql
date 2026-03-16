-- Phase 2: Billing Engine backend scaffolding (revenue + controls)
-- Supabase Postgres (RLS-first) schema to support:
-- - Versioned pricing rules
-- - Double-entry ledger (append-only)
-- - Invoices
-- - Settlement batches + export/submit/confirm lifecycle
-- - Maker-checker controls via portal roles

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) Portal roles (Admin / Finance Approver / Auditor)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.portal_user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'finance_approver', 'auditor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.portal_user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helper: portal role check (owner bypasses RLS).
CREATE OR REPLACE FUNCTION public.has_portal_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.portal_user_roles
    WHERE user_id = auth.uid()
      AND role = required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_portal_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.portal_user_roles
    WHERE user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 2) Versioned pricing rules (revenue split controls)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.billing_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  merchant_discount_pct NUMERIC(5,2) NOT NULL CHECK (merchant_discount_pct >= 0 AND merchant_discount_pct <= 100),
  consumer_benefit_pct NUMERIC(5,2) NOT NULL CHECK (consumer_benefit_pct >= 0 AND consumer_benefit_pct <= 100),
  platform_benefit_pct NUMERIC(5,2) NOT NULL CHECK (platform_benefit_pct >= 0 AND platform_benefit_pct <= 100),
  bank_fee_pct NUMERIC(5,2) NOT NULL CHECK (bank_fee_pct >= 0 AND bank_fee_pct <= 100),
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'retired')),
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_billing_pricing_rules_status ON public.billing_pricing_rules(status);
CREATE INDEX IF NOT EXISTS idx_billing_pricing_rules_effective_from ON public.billing_pricing_rules(effective_from DESC);

ALTER TABLE public.billing_pricing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_pricing_rules" ON public.billing_pricing_rules;
CREATE POLICY "portal_read_pricing_rules"
ON public.billing_pricing_rules
FOR SELECT
TO authenticated
USING (public.is_portal_user());

-- ---------------------------------------------------------------------------
-- 3) Ledger (append-only)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.billing_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_group_id UUID, -- links all entries from the same source event
  source_type TEXT NOT NULL CHECK (source_type IN ('transaction', 'invoice', 'settlement', 'reversal', 'manual')),
  source_id TEXT,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'ZAR',
  pricing_rule_id UUID REFERENCES public.billing_pricing_rules(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_ledger_entries_merchant_id ON public.billing_ledger_entries(merchant_id);
CREATE INDEX IF NOT EXISTS idx_billing_ledger_entries_created_at ON public.billing_ledger_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_ledger_entries_entry_group ON public.billing_ledger_entries(entry_group_id);

ALTER TABLE public.billing_ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_ledger_entries" ON public.billing_ledger_entries;
CREATE POLICY "portal_read_ledger_entries"
ON public.billing_ledger_entries
FOR SELECT
TO authenticated
USING (public.is_portal_user());

-- Merchants: read their own ledger entries.
DROP POLICY IF EXISTS "merchants_read_own_ledger_entries" ON public.billing_ledger_entries;
CREATE POLICY "merchants_read_own_ledger_entries"
ON public.billing_ledger_entries
FOR SELECT
TO authenticated
USING (
  merchant_id IN (SELECT id FROM public.merchants WHERE user_id::text = auth.uid()::text)
);

-- ---------------------------------------------------------------------------
-- 4) Invoices
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'exported', 'paid', 'void')),
  pricing_rule_id UUID REFERENCES public.billing_pricing_rules(id) ON DELETE SET NULL,
  total_face_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_consumer_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  merchant_payout_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_revenue_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  consumer_benefit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  bank_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_payable_to_merchant NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (merchant_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_merchant_id ON public.billing_invoices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON public.billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_created_at ON public.billing_invoices(created_at DESC);

ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_invoices" ON public.billing_invoices;
CREATE POLICY "portal_read_invoices"
ON public.billing_invoices
FOR SELECT
TO authenticated
USING (public.is_portal_user());

DROP POLICY IF EXISTS "merchants_read_own_invoices" ON public.billing_invoices;
CREATE POLICY "merchants_read_own_invoices"
ON public.billing_invoices
FOR SELECT
TO authenticated
USING (
  merchant_id IN (SELECT id FROM public.merchants WHERE user_id::text = auth.uid()::text)
);

-- ---------------------------------------------------------------------------
-- 5) Settlement batches + settlement lines
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.billing_settlement_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN ('pending_approval', 'approved', 'exported', 'submitted_to_bank', 'confirmed', 'failed', 'cancelled')),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  merchant_count INT NOT NULL DEFAULT 0,
  created_by UUID,
  approved_by UUID,
  exported_by UUID,
  submitted_by UUID,
  confirmed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMPTZ,
  exported_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_billing_settlement_batches_status ON public.billing_settlement_batches(status);
CREATE INDEX IF NOT EXISTS idx_billing_settlement_batches_created_at ON public.billing_settlement_batches(created_at DESC);

ALTER TABLE public.billing_settlement_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_settlement_batches" ON public.billing_settlement_batches;
CREATE POLICY "portal_read_settlement_batches"
ON public.billing_settlement_batches
FOR SELECT
TO authenticated
USING (public.is_portal_user());

CREATE TABLE IF NOT EXISTS public.billing_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.billing_settlement_batches(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  bank_name TEXT,
  branch_code TEXT,
  account_number TEXT,
  account_holder TEXT,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'exported', 'submitted_to_bank', 'confirmed', 'failed', 'held')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_billing_settlements_batch_id ON public.billing_settlements(batch_id);
CREATE INDEX IF NOT EXISTS idx_billing_settlements_merchant_id ON public.billing_settlements(merchant_id);
CREATE INDEX IF NOT EXISTS idx_billing_settlements_status ON public.billing_settlements(status);

ALTER TABLE public.billing_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_settlements" ON public.billing_settlements;
CREATE POLICY "portal_read_settlements"
ON public.billing_settlements
FOR SELECT
TO authenticated
USING (public.is_portal_user());

DROP POLICY IF EXISTS "merchants_read_own_settlements" ON public.billing_settlements;
CREATE POLICY "merchants_read_own_settlements"
ON public.billing_settlements
FOR SELECT
TO authenticated
USING (
  merchant_id IN (SELECT id FROM public.merchants WHERE user_id::text = auth.uid()::text)
);

-- updated_at trigger (reuse existing helper if present)
DROP TRIGGER IF EXISTS update_billing_settlements_updated_at ON public.billing_settlements;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at' AND pg_function_is_visible(oid)) THEN
    CREATE TRIGGER update_billing_settlements_updated_at
    BEFORE UPDATE ON public.billing_settlements
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

