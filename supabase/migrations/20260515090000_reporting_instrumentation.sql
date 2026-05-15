-- KPI / BI reporting instrumentation for sponsor-ready dashboards
-- Adds explicit channel, segment, and consent dimensions used by the May 2026 BI spec.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS acquisition_channel TEXT
    CHECK (acquisition_channel IN ('web', 'app', 'ussd', 'sms', 'agent', 'unknown')),
  ADD COLUMN IF NOT EXISTS primary_access_channel TEXT
    CHECK (primary_access_channel IN ('web', 'app', 'ussd', 'sms', 'agent', 'unknown')),
  ADD COLUMN IF NOT EXISTS consumer_segment TEXT
    CHECK (consumer_segment IN ('sassa', 'union', 'private_sector', 'student', 'community', 'unknown')),
  ADD COLUMN IF NOT EXISTS popia_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS popia_consent_version TEXT,
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT false;

UPDATE public.user_profiles
SET
  acquisition_channel = COALESCE(acquisition_channel, 'web'),
  primary_access_channel = COALESCE(primary_access_channel, acquisition_channel, 'web'),
  consumer_segment = COALESCE(consumer_segment, 'unknown')
WHERE acquisition_channel IS NULL
   OR primary_access_channel IS NULL
   OR consumer_segment IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_acquisition_channel
  ON public.user_profiles(acquisition_channel);

CREATE INDEX IF NOT EXISTS idx_user_profiles_primary_access_channel
  ON public.user_profiles(primary_access_channel);

CREATE INDEX IF NOT EXISTS idx_user_profiles_consumer_segment
  ON public.user_profiles(consumer_segment);

CREATE INDEX IF NOT EXISTS idx_user_profiles_popia_consent_at
  ON public.user_profiles(popia_consent_at);

ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS access_channel TEXT
    CHECK (access_channel IN ('web', 'app', 'ussd', 'sms', 'agent', 'unknown'));

UPDATE public.payment_transactions
SET
  payment_method = COALESCE(
    payment_method,
    CASE
      WHEN LOWER(COALESCE(card_brand, '')) IN ('visa', 'mastercard', 'master card', 'card') THEN 'card'
      WHEN LOWER(COALESCE(card_brand, '')) = 'wallet' THEN 'wallet'
      WHEN LOWER(COALESCE(card_brand, '')) = 'eft' THEN 'eft'
      WHEN card_brand IS NULL OR card_brand = '' THEN 'unknown'
      ELSE LOWER(card_brand)
    END
  ),
  access_channel = COALESCE(access_channel, 'web')
WHERE payment_method IS NULL
   OR access_channel IS NULL;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_method
  ON public.payment_transactions(payment_method);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_access_channel
  ON public.payment_transactions(access_channel);
