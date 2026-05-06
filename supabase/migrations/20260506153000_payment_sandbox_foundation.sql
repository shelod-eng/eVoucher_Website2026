-- Payment Sandbox Foundation
-- Persistent sandbox transaction storage, webhook replay history, EFT proof records,
-- and wallet reflection tracking for isolated near-live payment simulation.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.sandbox_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference TEXT NOT NULL UNIQUE,
  scenario_key TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  provider TEXT NOT NULL DEFAULT 'sandbox' CHECK (provider IN ('sandbox')),
  initial_status TEXT NOT NULL CHECK (initial_status IN ('pending', 'completed', 'failed')),
  current_status TEXT NOT NULL CHECK (current_status IN ('pending', 'completed', 'failed')),
  final_status TEXT NOT NULL CHECK (final_status IN ('completed', 'failed')),
  detailed_state TEXT NOT NULL,
  requires_authorization BOOLEAN NOT NULL DEFAULT false,
  redirect_flow BOOLEAN NOT NULL DEFAULT false,
  callback_delay_ms INTEGER NOT NULL DEFAULT 0,
  webhook_retries INTEGER NOT NULL DEFAULT 0,
  checkout_url TEXT,
  operator_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  phone_number TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  state_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sandbox_payment_transactions_scenario_key
  ON public.sandbox_payment_transactions(scenario_key);
CREATE INDEX IF NOT EXISTS idx_sandbox_payment_transactions_current_status
  ON public.sandbox_payment_transactions(current_status);
CREATE INDEX IF NOT EXISTS idx_sandbox_payment_transactions_operator_user_id
  ON public.sandbox_payment_transactions(operator_user_id);

CREATE TABLE IF NOT EXISTS public.sandbox_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference TEXT NOT NULL REFERENCES public.sandbox_payment_transactions(transaction_reference) ON DELETE CASCADE,
  event_id TEXT NOT NULL UNIQUE,
  attempt INTEGER NOT NULL DEFAULT 1,
  target_status TEXT NOT NULL CHECK (target_status IN ('pending', 'completed', 'failed')),
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('scheduled', 'failed', 'delivered')),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMPTZ,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sandbox_webhook_events_transaction_reference
  ON public.sandbox_webhook_events(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_sandbox_webhook_events_attempt
  ON public.sandbox_webhook_events(transaction_reference, attempt);

CREATE TABLE IF NOT EXISTS public.sandbox_eft_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference TEXT NOT NULL REFERENCES public.sandbox_payment_transactions(transaction_reference) ON DELETE CASCADE,
  proof_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'pending_review', 'approved', 'rejected')),
  submitted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sandbox_eft_proofs_transaction_reference
  ON public.sandbox_eft_proofs(transaction_reference);

CREATE TABLE IF NOT EXISTS public.sandbox_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference TEXT NOT NULL REFERENCES public.sandbox_payment_transactions(transaction_reference) ON DELETE CASCADE,
  operator_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('topup', 'reflection', 'reversal')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sandbox_wallet_transactions_transaction_reference
  ON public.sandbox_wallet_transactions(transaction_reference);

ALTER TABLE public.sandbox_payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_eft_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_sandbox_payment_transactions" ON public.sandbox_payment_transactions;
CREATE POLICY "portal_read_sandbox_payment_transactions"
ON public.sandbox_payment_transactions
FOR SELECT
TO authenticated
USING (public.is_portal_user());

DROP POLICY IF EXISTS "portal_read_sandbox_webhook_events" ON public.sandbox_webhook_events;
CREATE POLICY "portal_read_sandbox_webhook_events"
ON public.sandbox_webhook_events
FOR SELECT
TO authenticated
USING (public.is_portal_user());

DROP POLICY IF EXISTS "portal_read_sandbox_eft_proofs" ON public.sandbox_eft_proofs;
CREATE POLICY "portal_read_sandbox_eft_proofs"
ON public.sandbox_eft_proofs
FOR SELECT
TO authenticated
USING (public.is_portal_user());

DROP POLICY IF EXISTS "portal_read_sandbox_wallet_transactions" ON public.sandbox_wallet_transactions;
CREATE POLICY "portal_read_sandbox_wallet_transactions"
ON public.sandbox_wallet_transactions
FOR SELECT
TO authenticated
USING (public.is_portal_user());
