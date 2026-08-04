-- =============================================================================
-- Repair: canonical platform_events contract used by website transactions,
-- billing outbox, realtime billing portal, and reconciliation APIs.
--
-- Production symptom fixed:
--   relation "public.platform_events" does not exist
--
-- This migration is deliberately self-healing because the August compliance
-- migrations and triggers assume platform_events already exists. If a database
-- missed the June migration, inserts into payment_transactions/customer_vouchers
-- fail inside the trigger and block purchases/redemptions.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.platform_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        text UNIQUE NOT NULL,
  event_type      text NOT NULL,
  event_version   text NOT NULL DEFAULT '1.0',
  source_system   text NOT NULL DEFAULT 'ws1',
  correlation_id  text,
  merchant_id     uuid,
  customer_id     uuid,
  voucher_id      uuid,
  transaction_ref text,
  amount          numeric(15,2),
  face_value      numeric(15,2),
  discount_pct    numeric(6,4),
  currency        text NOT NULL DEFAULT 'ZAR',
  payload         jsonb NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'received',
  processed_at    timestamptz,
  error_message   text,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_events
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS event_id text,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS event_version text NOT NULL DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS source_system text NOT NULL DEFAULT 'ws1',
  ADD COLUMN IF NOT EXISTS correlation_id text,
  ADD COLUMN IF NOT EXISTS merchant_id uuid,
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS voucher_id uuid,
  ADD COLUMN IF NOT EXISTS transaction_ref text,
  ADD COLUMN IF NOT EXISTS amount numeric(15,2),
  ADD COLUMN IF NOT EXISTS face_value numeric(15,2),
  ADD COLUMN IF NOT EXISTS discount_pct numeric(6,4),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'ZAR',
  ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'received',
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

UPDATE public.platform_events
SET id = gen_random_uuid()
WHERE id IS NULL;

UPDATE public.platform_events
SET event_id = gen_random_uuid()::text
WHERE event_id IS NULL OR btrim(event_id) = '';

UPDATE public.platform_events
SET event_type = 'UNKNOWN'
WHERE event_type IS NULL OR btrim(event_type) = '';

ALTER TABLE public.platform_events
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN event_id SET NOT NULL,
  ALTER COLUMN event_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.platform_events'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.platform_events
      ADD CONSTRAINT platform_events_pkey PRIMARY KEY (id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_events_event_id_unique
  ON public.platform_events (event_id);
CREATE INDEX IF NOT EXISTS idx_platform_events_event_type
  ON public.platform_events (event_type);
CREATE INDEX IF NOT EXISTS idx_platform_events_merchant_id
  ON public.platform_events (merchant_id);
CREATE INDEX IF NOT EXISTS idx_platform_events_customer_id
  ON public.platform_events (customer_id);
CREATE INDEX IF NOT EXISTS idx_platform_events_occurred_at
  ON public.platform_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_events_status
  ON public.platform_events (status);
CREATE INDEX IF NOT EXISTS idx_platform_events_transaction_ref
  ON public.platform_events (transaction_ref);

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.scrub_platform_event_jsonb(value jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result jsonb;
  item jsonb;
  v_key text;
  v_value jsonb;
  lower_key text;
BEGIN
  IF value IS NULL THEN
    RETURN NULL;
  END IF;

  IF jsonb_typeof(value) = 'object' THEN
    result := '{}'::jsonb;
    FOR v_key, v_value IN SELECT key, val FROM jsonb_each(value) AS e(key, val) LOOP
      lower_key := lower(v_key);
      IF lower_key IN (
        'email',
        'user_email',
        'customer_email',
        'phone',
        'phone_number',
        'contact_number',
        'cell_number',
        'name',
        'full_name',
        'contact_name',
        'first_name',
        'last_name',
        'account_number',
        'bank_account',
        'account_number_enc',
        'address',
        'physical_address',
        'street_address'
      )
      OR lower_key LIKE '%email%'
      OR lower_key LIKE '%phone%'
      OR lower_key LIKE '%address%'
      OR lower_key LIKE '%account%' THEN
        result := result || jsonb_build_object(v_key, '[REDACTED]');
      ELSE
        result := result || jsonb_build_object(v_key, public.scrub_platform_event_jsonb(v_value));
      END IF;
    END LOOP;
    RETURN result;
  END IF;

  IF jsonb_typeof(value) = 'array' THEN
    result := '[]'::jsonb;
    FOR item IN SELECT jsonb_array_elements(value) LOOP
      result := result || jsonb_build_array(public.scrub_platform_event_jsonb(item));
    END LOOP;
    RETURN result;
  END IF;

  RETURN value;
END;
$$;

CREATE OR REPLACE FUNCTION public.scrub_platform_events_before_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.payload := public.scrub_platform_event_jsonb(coalesce(NEW.payload, '{}'::jsonb));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scrub_platform_events_payload ON public.platform_events;
CREATE TRIGGER trg_scrub_platform_events_payload
  BEFORE INSERT OR UPDATE OF payload ON public.platform_events
  FOR EACH ROW
  EXECUTE FUNCTION public.scrub_platform_events_before_write();

UPDATE public.platform_events
SET payload = public.scrub_platform_event_jsonb(payload)
WHERE payload IS NOT NULL;

DROP POLICY IF EXISTS "service role full access" ON public.platform_events;
CREATE POLICY "service role full access"
  ON public.platform_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "authenticated read" ON public.platform_events;
CREATE POLICY "authenticated read"
  ON public.platform_events
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "anon read scrubbed platform events" ON public.platform_events;
CREATE POLICY "anon read scrubbed platform events"
  ON public.platform_events
  FOR SELECT
  USING (auth.role() = 'anon');

-- Keep the outbox contract available too; the publisher writes both tables.
CREATE TABLE IF NOT EXISTS public.platform_event_outbox (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        text UNIQUE NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'pending',
  retries         integer NOT NULL DEFAULT 0,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_event_outbox
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS event_id text,
  ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS retries integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.platform_event_outbox
SET id = gen_random_uuid()
WHERE id IS NULL;

UPDATE public.platform_event_outbox
SET event_id = gen_random_uuid()::text
WHERE event_id IS NULL OR btrim(event_id) = '';

ALTER TABLE public.platform_event_outbox
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN event_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.platform_event_outbox'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.platform_event_outbox
      ADD CONSTRAINT platform_event_outbox_pkey PRIMARY KEY (id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_event_outbox_event_id_unique
  ON public.platform_event_outbox (event_id);
CREATE INDEX IF NOT EXISTS idx_platform_event_outbox_status
  ON public.platform_event_outbox (status)
  WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_platform_event_outbox_created_at
  ON public.platform_event_outbox (created_at);

ALTER TABLE public.platform_event_outbox ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.scrub_platform_event_outbox_before_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.payload := public.scrub_platform_event_jsonb(coalesce(NEW.payload, '{}'::jsonb));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scrub_platform_event_outbox_payload ON public.platform_event_outbox;
CREATE TRIGGER trg_scrub_platform_event_outbox_payload
  BEFORE INSERT OR UPDATE OF payload ON public.platform_event_outbox
  FOR EACH ROW
  EXECUTE FUNCTION public.scrub_platform_event_outbox_before_write();

UPDATE public.platform_event_outbox
SET payload = public.scrub_platform_event_jsonb(payload)
WHERE payload IS NOT NULL;

DROP POLICY IF EXISTS "service role full access outbox" ON public.platform_event_outbox;
CREATE POLICY "service role full access outbox"
  ON public.platform_event_outbox
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Register realtime only when not already registered. Re-running ALTER
-- PUBLICATION directly can fail with duplicate table membership.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'platform_events'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_events;
  END IF;
END $$;
