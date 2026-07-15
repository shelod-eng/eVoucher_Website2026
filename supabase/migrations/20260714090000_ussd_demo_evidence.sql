-- USSD sponsor demo evidence tables.
-- Creates an audit-ready, append-only trail for feature-phone voucher journeys.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.evoucher_shops (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  branch_count INTEGER NOT NULL DEFAULT 0 CHECK (branch_count >= 0),
  menu_order INTEGER NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evoucher_wallets (
  msisdn TEXT PRIMARY KEY,
  encrypted_balance TEXT NOT NULL,
  balance_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance_amount >= 0),
  last_case_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evoucher_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  msisdn TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started',
  shop_id TEXT REFERENCES public.evoucher_shops(id),
  shop_name TEXT,
  encrypted_voucher_code TEXT,
  voucher_code_last4 TEXT,
  encrypted_wallet_balance TEXT,
  wallet_balance_amount NUMERIC(12,2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.evoucher_audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type TEXT NOT NULL,
  msisdn TEXT NOT NULL,
  session_id TEXT,
  case_id UUID REFERENCES public.evoucher_cases(id),
  shop_id TEXT REFERENCES public.evoucher_shops(id),
  shop_name TEXT,
  encrypted_voucher_code TEXT,
  voucher_code_last4 TEXT,
  encrypted_wallet_balance TEXT,
  wallet_balance_amount NUMERIC(12,2),
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'evoucher_cases_status_valid'
      AND conrelid = 'public.evoucher_cases'::regclass
  ) THEN
    ALTER TABLE public.evoucher_cases
      ADD CONSTRAINT evoucher_cases_status_valid
      CHECK (status IN ('started', 'registered', 'purchase_pending', 'purchased', 'redeemed', 'closed', 'timeout'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'evoucher_audit_logs_event_type_valid'
      AND conrelid = 'public.evoucher_audit_logs'::regclass
  ) THEN
    ALTER TABLE public.evoucher_audit_logs
      ADD CONSTRAINT evoucher_audit_logs_event_type_valid
      CHECK (event_type IN (
        'ussd_session_started',
        'shop_selected',
        'voucher_purchased',
        'wallet_updated',
        'voucher_redeemed',
        'session_closed'
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_evoucher_cases_msisdn_updated
  ON public.evoucher_cases (msisdn, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_evoucher_cases_session_id
  ON public.evoucher_cases (session_id);

CREATE INDEX IF NOT EXISTS idx_evoucher_audit_logs_msisdn_created
  ON public.evoucher_audit_logs (msisdn, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evoucher_audit_logs_event_created
  ON public.evoucher_audit_logs (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evoucher_shops_active_order
  ON public.evoucher_shops (is_active, menu_order);

CREATE OR REPLACE FUNCTION public.prevent_evoucher_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'evoucher_audit_logs is append-only';
END;
$$;

DROP TRIGGER IF EXISTS evoucher_audit_logs_append_only_update ON public.evoucher_audit_logs;
CREATE TRIGGER evoucher_audit_logs_append_only_update
  BEFORE UPDATE ON public.evoucher_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_evoucher_audit_mutation();

DROP TRIGGER IF EXISTS evoucher_audit_logs_append_only_delete ON public.evoucher_audit_logs;
CREATE TRIGGER evoucher_audit_logs_append_only_delete
  BEFORE DELETE ON public.evoucher_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_evoucher_audit_mutation();

INSERT INTO public.evoucher_shops (id, display_name, branch_count, menu_order, metadata)
VALUES
  ('shoprite', 'Shoprite', 560, 1, '{"source":"sponsor_demo"}'),
  ('pick-n-pay', 'Pick n Pay', 1200, 2, '{"source":"sponsor_demo"}'),
  ('pep', 'Pep', 2200, 3, '{"source":"sponsor_demo"}'),
  ('mr-price', 'Mr Price', 1900, 4, '{"source":"sponsor_demo"}'),
  ('woolworths', 'Woolworths', 490, 5, '{"source":"sponsor_demo"}'),
  ('boxer', 'Boxer', 470, 6, '{"source":"sponsor_demo"}'),
  ('checkers', 'Checkers', 1, 7, '{"source":"sponsor_demo"}'),
  ('clicks', 'Clicks', 1, 8, '{"source":"sponsor_demo"}'),
  ('game', 'Game', 150, 9, '{"source":"sponsor_demo"}'),
  ('engen', 'Engen', 1, 10, '{"source":"sponsor_demo"}'),
  ('usave', 'uSave', 340, 11, '{"source":"sponsor_demo"}'),
  ('kalapeng-pharmacy-group', 'Kalapeng Pharmacy Group', 35, 12, '{"source":"sponsor_demo"}'),
  ('super-precast-concrete', 'Super Precast Concrete', 1, 13, '{"source":"sponsor_demo","sponsor":"Gerald"}')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  branch_count = EXCLUDED.branch_count,
  menu_order = EXCLUDED.menu_order,
  metadata = public.evoucher_shops.metadata || EXCLUDED.metadata,
  is_active = true,
  updated_at = now();

ALTER TABLE public.evoucher_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evoucher_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evoucher_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evoucher_audit_logs ENABLE ROW LEVEL SECURITY;
