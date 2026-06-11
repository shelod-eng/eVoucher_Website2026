-- BankServ adaptor foundation
-- Adds:
-- - post-checkout settlement ingestion queue
-- - richer settlement batch metadata for adaptor workflows

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) Adaptor transaction queue
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.bankserv_adaptor_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference TEXT NOT NULL UNIQUE,
  payment_transaction_id UUID,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  voucher_code TEXT,
  payment_method TEXT NOT NULL,
  payment_rail TEXT NOT NULL
    CHECK (payment_rail IN ('CARD', 'EFT', 'PAYFAST', 'WALLET', 'RTC', 'NAEDO', 'SAMOS', 'UNKNOWN')),
  settlement_amount NUMERIC(12,2) NOT NULL CHECK (settlement_amount >= 0),
  gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (gross_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'batched', 'submitted', 'clearing', 'settled', 'rejected', 'ignored')),
  status_reason TEXT,
  batch_id UUID REFERENCES public.billing_settlement_batches(id) ON DELETE SET NULL,
  merchant_bank_linkage_id UUID REFERENCES public.billing_bank_linkages(id) ON DELETE SET NULL,
  source_event_key TEXT,
  source_channel TEXT,
  completion_source TEXT NOT NULL DEFAULT 'unknown',
  submitted_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bankserv_adaptor_transactions_merchant_id
  ON public.bankserv_adaptor_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_bankserv_adaptor_transactions_status
  ON public.bankserv_adaptor_transactions(status);
CREATE INDEX IF NOT EXISTS idx_bankserv_adaptor_transactions_payment_rail
  ON public.bankserv_adaptor_transactions(payment_rail);
CREATE INDEX IF NOT EXISTS idx_bankserv_adaptor_transactions_batch_id
  ON public.bankserv_adaptor_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_bankserv_adaptor_transactions_created_at
  ON public.bankserv_adaptor_transactions(created_at DESC);

ALTER TABLE public.bankserv_adaptor_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_bankserv_adaptor_transactions" ON public.bankserv_adaptor_transactions;
CREATE POLICY "portal_read_bankserv_adaptor_transactions"
ON public.bankserv_adaptor_transactions
FOR SELECT
TO authenticated
USING (public.is_portal_user());

DROP POLICY IF EXISTS "merchants_read_own_bankserv_adaptor_transactions" ON public.bankserv_adaptor_transactions;
CREATE POLICY "merchants_read_own_bankserv_adaptor_transactions"
ON public.bankserv_adaptor_transactions
FOR SELECT
TO authenticated
USING (
  merchant_id IN (SELECT id FROM public.merchants WHERE user_id::text = auth.uid()::text)
);

DROP TRIGGER IF EXISTS update_bankserv_adaptor_transactions_updated_at ON public.bankserv_adaptor_transactions;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at' AND pg_function_is_visible(oid)) THEN
    CREATE TRIGGER update_bankserv_adaptor_transactions_updated_at
    BEFORE UPDATE ON public.bankserv_adaptor_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2) Settlement batch metadata enhancements
-- ---------------------------------------------------------------------------

ALTER TABLE public.billing_settlement_batches
  ADD COLUMN IF NOT EXISTS settlement_rail TEXT
    CHECK (settlement_rail IN ('CARD', 'EFT', 'PAYFAST', 'WALLET', 'RTC', 'NAEDO', 'SAMOS', 'MIXED')),
  ADD COLUMN IF NOT EXISTS source_channel TEXT,
  ADD COLUMN IF NOT EXISTS control_sum_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS transaction_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bankserv_file_ref TEXT,
  ADD COLUMN IF NOT EXISTS pch_ack_ref TEXT,
  ADD COLUMN IF NOT EXISTS last_state_change_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS state_history_json JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_billing_settlement_batches_settlement_rail
  ON public.billing_settlement_batches(settlement_rail);

UPDATE public.billing_settlement_batches
SET last_state_change_at = COALESCE(last_state_change_at, submitted_at, approved_at, created_at)
WHERE last_state_change_at IS NULL;
