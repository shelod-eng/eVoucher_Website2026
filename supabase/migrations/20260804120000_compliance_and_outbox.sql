-- =============================================================================
-- Migration: Compliance, Outbox, Reconciliation and Audit Logging
-- =============================================================================

-- 1. platform_event_outbox
CREATE TABLE IF NOT EXISTS public.platform_event_outbox (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        text UNIQUE NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'pending', -- pending|processing|sent|failed|dead_letter
  retries         integer NOT NULL DEFAULT 0,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for outbox polling
CREATE INDEX IF NOT EXISTS idx_platform_event_outbox_status ON public.platform_event_outbox (status) WHERE status IN ('pending', 'failed');

-- RLS
ALTER TABLE public.platform_event_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access outbox" ON public.platform_event_outbox
  FOR ALL USING (auth.role() = 'service_role');

-- 2. reconciliation_runs
CREATE TABLE IF NOT EXISTS public.reconciliation_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date        date NOT NULL,
  status          text NOT NULL DEFAULT 'running', -- running|completed|exceptions
  ws1_tx_count    integer NOT NULL DEFAULT 0,
  ledger_count    integer NOT NULL DEFAULT 0,
  gateway_count   integer NOT NULL DEFAULT 0,
  bank_count      integer NOT NULL DEFAULT 0,
  matched_count   integer NOT NULL DEFAULT 0,
  exception_count integer NOT NULL DEFAULT 0,
  total_ws1_value numeric(15,2) NOT NULL DEFAULT 0.00,
  total_ledger_value numeric(15,2) NOT NULL DEFAULT 0.00,
  variance        numeric(15,2) NOT NULL DEFAULT 0.00,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.reconciliation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access runs" ON public.reconciliation_runs
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "authenticated read runs" ON public.reconciliation_runs
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. reconciliation_exceptions
CREATE TABLE IF NOT EXISTS public.reconciliation_exceptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          uuid REFERENCES public.reconciliation_runs(id) ON DELETE CASCADE,
  exception_type  text NOT NULL, -- missing_ledger|amount_mismatch|duplicate|orphan_payment
  transaction_ref text,
  ws1_amount      numeric(15,2) NOT NULL DEFAULT 0.00,
  ledger_amount   numeric(15,2) NOT NULL DEFAULT 0.00,
  gateway_amount  numeric(15,2) NOT NULL DEFAULT 0.00,
  bank_amount     numeric(15,2) NOT NULL DEFAULT 0.00,
  variance        numeric(15,2) NOT NULL DEFAULT 0.00,
  status          text NOT NULL DEFAULT 'open', -- open|investigating|resolved|waived
  resolved_by     uuid,
  resolved_at     timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.reconciliation_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access exceptions" ON public.reconciliation_exceptions
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "authenticated read exceptions" ON public.reconciliation_exceptions
  FOR SELECT USING (auth.role() = 'authenticated');

-- 4. event_replay_log
CREATE TABLE IF NOT EXISTS public.event_replay_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  replay_run_id   uuid NOT NULL,
  event_id        text NOT NULL,
  event_type      text NOT NULL,
  status          text NOT NULL DEFAULT 'pending', -- pending|success|failed
  error_message   text,
  replayed_by     uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.event_replay_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access replay" ON public.event_replay_log
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "authenticated read replay" ON public.event_replay_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- 5. popia_access_log
CREATE TABLE IF NOT EXISTS public.popia_access_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        uuid,
  actor_email     text,
  actor_role      text,
  action          text NOT NULL,          -- e.g. view_bank_linkages, export_merchant_report
  target_entity   text NOT NULL,          -- e.g. billing_bank_linkages, merchant_profile
  target_id       uuid,
  pii_fields      text[],                 -- e.g. ['account_number_enc', 'account_holder_name']
  ip_address      text,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.popia_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access popia" ON public.popia_access_log
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "authenticated read popia" ON public.popia_access_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Add columns to billing_bank_linkages for dual control approvals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'billing_bank_linkages' 
      AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE public.billing_bank_linkages ADD COLUMN approved_by uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'billing_bank_linkages' 
      AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE public.billing_bank_linkages ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'billing_bank_linkages' 
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.billing_bank_linkages ADD COLUMN created_by uuid;
  END IF;
END $$;
