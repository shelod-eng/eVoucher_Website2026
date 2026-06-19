-- Add business detail columns to the merchants table for compliance and reporting.
-- Use IF NOT EXISTS to make the script idempotent and safe to re-run.

-- Define the timestamp update function, which is a common pattern in this project.
-- This will safely do nothing if the function already exists.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS tax_clearance_pin TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add a comment to describe the purpose of the new columns.
-- Comments can be re-applied safely.
COMMENT ON COLUMN public.merchants.address IS 'Physical business location for compliance and sponsor visibility.';
COMMENT ON COLUMN public.merchants.registration_number IS 'Company registration / CIPC number for KYB validation.';
COMMENT ON COLUMN public.merchants.tax_clearance_pin IS 'SARS tax clearance PIN for verification.';
COMMENT ON COLUMN public.merchants.updated_at IS 'Timestamp for last modification, ensuring audit-proof tracking.';

-- Create a trigger to automatically update the updated_at timestamp on any change.
-- This uses the project's standard `set_updated_at` function.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_merchants_updated_at' AND tgrelid = 'public.merchants'::regclass) THEN
    CREATE TRIGGER handle_merchants_updated_at BEFORE UPDATE ON public.merchants FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
  END IF;
END;
$$;