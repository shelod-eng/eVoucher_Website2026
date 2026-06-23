-- Add transaction_reference column to billing_events table
-- This column is essential for tracking and joining with payment_transactions

-- Add the column (nullable initially to handle existing rows)
ALTER TABLE billing_events 
ADD COLUMN IF NOT EXISTS transaction_reference TEXT;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_billing_events_transaction_reference 
ON billing_events(transaction_reference);

-- Backfill existing rows from metadata JSONB column
UPDATE billing_events 
SET transaction_reference = metadata->>'transactionReference'
WHERE transaction_reference IS NULL 
  AND metadata->>'transactionReference' IS NOT NULL;

-- Add comment
COMMENT ON COLUMN billing_events.transaction_reference IS 'Transaction reference for linking to payment_transactions table';

-- Verify
SELECT 
  COUNT(*) as total_events,
  COUNT(transaction_reference) as events_with_ref,
  COUNT(*) - COUNT(transaction_reference) as missing_refs
FROM billing_events;
