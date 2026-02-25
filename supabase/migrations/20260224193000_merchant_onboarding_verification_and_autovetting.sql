-- Merchant onboarding verification workflow:
-- - Email token confirmation
-- - SMS OTP verification
-- - Auto-vetting state for private vs chain merchants
-- - Temporary credential lifecycle controls

ALTER TABLE public.merchants
    ADD COLUMN IF NOT EXISTS merchant_type TEXT NOT NULL DEFAULT 'chain',
    ADD COLUMN IF NOT EXISTS vetting_status TEXT NOT NULL DEFAULT 'pending_chain_approval',
    ADD COLUMN IF NOT EXISTS pharmacy_license_number TEXT,
    ADD COLUMN IF NOT EXISTS responsible_pharmacist_name TEXT,
    ADD COLUMN IF NOT EXISTS owner_id_number TEXT,
    ADD COLUMN IF NOT EXISTS proof_of_premises TEXT,
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS temporary_password_issued_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

UPDATE public.merchants
SET merchant_type = CASE
    WHEN LOWER(COALESCE(business_type, '')) LIKE '%pharmacy%' THEN 'private'
    ELSE 'chain'
END
WHERE merchant_type IS NULL
   OR TRIM(merchant_type) = ''
   OR merchant_type NOT IN ('chain', 'private');

UPDATE public.merchants
SET vetting_status = CASE
    WHEN merchant_type = 'private' THEN 'pending_private_approval'
    ELSE 'pending_chain_approval'
END
WHERE vetting_status IS NULL OR TRIM(vetting_status) = '';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'merchants_merchant_type_valid'
    ) THEN
        ALTER TABLE public.merchants
        ADD CONSTRAINT merchants_merchant_type_valid
        CHECK (merchant_type IN ('chain', 'private'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'merchants_vetting_status_valid'
    ) THEN
        ALTER TABLE public.merchants
        ADD CONSTRAINT merchants_vetting_status_valid
        CHECK (
            vetting_status IN (
                'pending_private_approval',
                'pending_chain_approval',
                'manual_review',
                'auto_approved',
                'approved',
                'rejected'
            )
        );
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_merchants_merchant_type ON public.merchants(merchant_type);
CREATE INDEX IF NOT EXISTS idx_merchants_vetting_status ON public.merchants(vetting_status);
CREATE INDEX IF NOT EXISTS idx_merchants_verification_flags ON public.merchants(email_verified, phone_verified);

CREATE TABLE IF NOT EXISTS public.merchant_onboarding_verifications (
    merchant_id UUID PRIMARY KEY REFERENCES public.merchants(id) ON DELETE CASCADE,
    email_token_hash TEXT,
    email_token_expires_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    sms_otp_hash TEXT,
    sms_otp_expires_at TIMESTAMPTZ,
    sms_verified_at TIMESTAMPTZ,
    otp_attempts INTEGER NOT NULL DEFAULT 0,
    credentials_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'set_updated_at'
          AND pg_function_is_visible(oid)
    ) THEN
        CREATE OR REPLACE FUNCTION public.set_updated_at()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        AS $fn$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $fn$;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS update_merchant_onboarding_verifications_updated_at ON public.merchant_onboarding_verifications;
CREATE TRIGGER update_merchant_onboarding_verifications_updated_at
BEFORE UPDATE ON public.merchant_onboarding_verifications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

