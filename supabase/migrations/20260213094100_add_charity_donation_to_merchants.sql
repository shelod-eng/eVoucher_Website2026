-- Add charity_donation_amount column to existing merchants table
-- This migration alters the existing merchants table instead of creating a new one

-- Add the charity_donation_amount column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'merchants'
        AND column_name = 'charity_donation_amount'
    ) THEN
        ALTER TABLE public.merchants
        ADD COLUMN charity_donation_amount NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_merchants_charity_donation ON public.merchants(charity_donation_amount);