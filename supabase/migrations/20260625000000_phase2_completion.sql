-- Phase 2 Completion: BankServ ACK/NCK tracking for reconciliation
-- Complete operational reconciliation with failure tracking

CREATE TABLE IF NOT EXISTS public.bankserv_ack_nck_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.billing_settlement_batches(id) ON DELETE CASCADE,
  settlement_id UUID NOT NULL REFERENCES public.billing_settlements(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('ack', 'nck', 'pending', 'failed')),
  failure_code TEXT,
  failure_reason TEXT,
  amount_processed NUMERIC(12,2),
  bank_reference TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (settlement_id)
);

CREATE INDEX IF NOT EXISTS idx_bankserv_ack_nck_batch_id ON public.bankserv_ack_nck_tracking(batch_id);
CREATE INDEX IF NOT EXISTS idx_bankserv_ack_nck_status ON public.bankserv_ack_nck_tracking(status);
CREATE INDEX IF NOT EXISTS idx_bankserv_ack_nck_processed_at ON public.bankserv_ack_nck_tracking(processed_at DESC);

ALTER TABLE public.bankserv_ack_nck_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_ack_nck_tracking" ON public.bankserv_ack_nck_tracking;
CREATE POLICY "portal_read_ack_nck_tracking"
ON public.bankserv_ack_nck_tracking
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.portal_user_roles
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "portal_write_ack_nck_tracking" ON public.bankserv_ack_nck_tracking;
CREATE POLICY "portal_write_ack_nck_tracking"
ON public.bankserv_ack_nck_tracking
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.portal_user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'finance_approver')
  )
);

-- Add branch admin roles to merchants table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'merchants' 
    AND column_name = 'branch_admin_role'
  ) THEN
    ALTER TABLE public.merchants 
    ADD COLUMN branch_admin_role TEXT CHECK (branch_admin_role IN ('branch_admin', 'branch_manager'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'merchants' 
    AND column_name = 'branch_admin_permissions'
  ) THEN
    ALTER TABLE public.merchants 
    ADD COLUMN branch_admin_permissions TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;

-- Add specials performance tracking
CREATE TABLE IF NOT EXISTS public.merchant_product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.merchant_products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  purchases INT NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id, date)
);

CREATE INDEX IF NOT EXISTS idx_merchant_product_analytics_product_id ON public.merchant_product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_merchant_product_analytics_date ON public.merchant_product_analytics(date DESC);

ALTER TABLE public.merchant_product_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchants_read_own_product_analytics" ON public.merchant_product_analytics;
CREATE POLICY "merchants_read_own_product_analytics"
ON public.merchant_product_analytics
FOR SELECT
TO authenticated
USING (
  product_id IN (
    SELECT id FROM public.merchant_products
    WHERE merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id::text = auth.uid()::text
    )
  )
);

-- Add reconciliation events to audit log
CREATE TABLE IF NOT EXISTS public.reconciliation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.billing_settlement_batches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('reconciliation_started', 'reconciliation_completed', 'discrepancy_found', 'failure_detected', 'manual_entry_created', 'retry_initiated')),
  actor_id UUID REFERENCES auth.users(id),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_log_batch_id ON public.reconciliation_audit_log(batch_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_log_created_at ON public.reconciliation_audit_log(created_at DESC);

ALTER TABLE public.reconciliation_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_reconciliation_audit_log" ON public.reconciliation_audit_log;
CREATE POLICY "portal_read_reconciliation_audit_log"
ON public.reconciliation_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.portal_user_roles
    WHERE user_id = auth.uid()
  )
);

COMMENT ON TABLE public.bankserv_ack_nck_tracking IS 'Tracks BankServ acknowledgments and negative acknowledgments for settlement reconciliation';
COMMENT ON TABLE public.merchant_product_analytics IS 'Daily analytics for merchant product performance tracking';
COMMENT ON TABLE public.reconciliation_audit_log IS 'Audit trail for all reconciliation operations';
