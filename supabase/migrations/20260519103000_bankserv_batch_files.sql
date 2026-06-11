-- BankServ batch file metadata
-- Persists SOD, EFT, CARD, and EOD file lifecycle rows for dashboarding and audit.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.batch_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_ref VARCHAR(32) UNIQUE NOT NULL,
  file_type VARCHAR(16) NOT NULL
    CHECK (file_type IN ('SOD', 'EFT', 'CARD', 'EOD')),
  transaction_count INT NOT NULL DEFAULT 0,
  total_value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) NOT NULL
    CHECK (status IN ('ACK_RECEIVED', 'ACK_PENDING', 'ACK_FAILED')),
  ack_ref VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cutoff_time TIME,
  control_hash VARCHAR(128),
  ops_user VARCHAR(64),
  remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_batch_files_file_type
  ON public.batch_files(file_type);
CREATE INDEX IF NOT EXISTS idx_batch_files_status
  ON public.batch_files(status);
CREATE INDEX IF NOT EXISTS idx_batch_files_created_at
  ON public.batch_files(created_at DESC);

ALTER TABLE public.batch_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_batch_files" ON public.batch_files;
CREATE POLICY "portal_read_batch_files"
ON public.batch_files
FOR SELECT
TO authenticated
USING (public.is_portal_user());

DROP POLICY IF EXISTS "portal_manage_batch_files" ON public.batch_files;
CREATE POLICY "portal_manage_batch_files"
ON public.batch_files
FOR ALL
TO authenticated
USING (public.is_portal_user())
WITH CHECK (public.is_portal_user());

DROP TRIGGER IF EXISTS update_batch_files_updated_at ON public.batch_files;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at' AND pg_function_is_visible(oid)) THEN
    CREATE TRIGGER update_batch_files_updated_at
    BEFORE UPDATE ON public.batch_files
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS batch_file_id UUID REFERENCES public.batch_files(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_batch_file_id
  ON public.payment_transactions(batch_file_id);

ALTER TABLE public.bankserv_adaptor_transactions
  ADD COLUMN IF NOT EXISTS batch_file_id UUID REFERENCES public.batch_files(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bankserv_adaptor_transactions_batch_file_id
  ON public.bankserv_adaptor_transactions(batch_file_id);
