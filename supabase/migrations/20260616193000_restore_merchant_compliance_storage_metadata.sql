-- Restore merchant compliance document metadata required by the merchant onboarding portal.
-- This migration is intentionally idempotent because some environments already received
-- the June 2026 hardening migration while production may still be on the legacy table.

CREATE TABLE IF NOT EXISTS public.merchant_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (verification_status IN ('submitted', 'under_review', 'approved', 'rejected')),
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT
);

ALTER TABLE public.merchant_kyc_documents
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS original_file_name TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS size_bytes INTEGER,
  ADD COLUMN IF NOT EXISTS checksum_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_merchant_kyc_documents_merchant_id
ON public.merchant_kyc_documents(merchant_id);

CREATE INDEX IF NOT EXISTS idx_merchant_kyc_documents_status
ON public.merchant_kyc_documents(verification_status);

CREATE INDEX IF NOT EXISTS idx_merchant_kyc_documents_storage_path
ON public.merchant_kyc_documents(storage_bucket, storage_path);

CREATE INDEX IF NOT EXISTS idx_merchant_kyc_documents_uploaded_at
ON public.merchant_kyc_documents(uploaded_at DESC);

ALTER TABLE public.merchant_kyc_documents
  DROP CONSTRAINT IF EXISTS merchant_kyc_documents_size_check;

ALTER TABLE public.merchant_kyc_documents
  ADD CONSTRAINT merchant_kyc_documents_size_check
  CHECK (size_bytes IS NULL OR (size_bytes > 0 AND size_bytes <= 10485760));

ALTER TABLE public.merchant_kyc_documents
  DROP CONSTRAINT IF EXISTS merchant_kyc_documents_mime_type_check;

ALTER TABLE public.merchant_kyc_documents
  ADD CONSTRAINT merchant_kyc_documents_mime_type_check
  CHECK (
    mime_type IS NULL OR mime_type IN (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    )
  );

ALTER TABLE public.merchant_kyc_documents ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-compliance-documents',
  'merchant-compliance-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "merchant_compliance_documents_private_read" ON storage.objects;
CREATE POLICY "merchant_compliance_documents_private_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'merchant-compliance-documents'
  AND EXISTS (
    SELECT 1
    FROM public.merchants
    WHERE merchants.id::text = split_part(storage.objects.name, '/', 1)
      AND merchants.user_id::text = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "merchant_compliance_documents_private_insert" ON storage.objects;
CREATE POLICY "merchant_compliance_documents_private_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'merchant-compliance-documents'
  AND EXISTS (
    SELECT 1
    FROM public.merchants
    WHERE merchants.id::text = split_part(storage.objects.name, '/', 1)
      AND merchants.user_id::text = auth.uid()::text
  )
);
