-- Payment System Migration
-- Customer card payments and FNB distribution tracking

-- 1. Payment Transactions Table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    merchant_id UUID,
    amount NUMERIC(10,2) NOT NULL,
    card_last_four TEXT NOT NULL,
    card_brand TEXT NOT NULL,
    payment_status TEXT DEFAULT 'completed',
    voucher_code TEXT,
    transaction_reference TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. FNB Distribution Schedule Table
CREATE TABLE IF NOT EXISTS public.fnb_distribution_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID,
    scheduled_date TIMESTAMPTZ NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'scheduled',
    fnb_reference TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add Foreign Key Constraints (only if merchants table exists)
DO $$
BEGIN
    -- Check if merchants table exists before adding foreign keys
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'merchants'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'merchants'
        AND column_name = 'id'
    ) THEN
        -- Add foreign key for payment_transactions.merchant_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'payment_transactions_merchant_id_fkey'
            AND table_name = 'payment_transactions'
        ) THEN
            ALTER TABLE public.payment_transactions
            ADD CONSTRAINT payment_transactions_merchant_id_fkey
            FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE SET NULL;
        END IF;

        -- Add foreign key for fnb_distribution_schedule.merchant_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fnb_distribution_schedule_merchant_id_fkey'
            AND table_name = 'fnb_distribution_schedule'
        ) THEN
            ALTER TABLE public.fnb_distribution_schedule
            ADD CONSTRAINT fnb_distribution_schedule_merchant_id_fkey
            FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_id ON public.payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_merchant_id ON public.payment_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_fnb_distribution_merchant_id ON public.fnb_distribution_schedule(merchant_id);
CREATE INDEX IF NOT EXISTS idx_fnb_distribution_status ON public.fnb_distribution_schedule(status);

-- 5. Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fnb_distribution_schedule ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS "customers_view_own_payments" ON public.payment_transactions;
CREATE POLICY "customers_view_own_payments"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "customers_insert_payments" ON public.payment_transactions;
CREATE POLICY "customers_insert_payments"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "merchants_view_distribution" ON public.fnb_distribution_schedule;
CREATE POLICY "merchants_view_distribution"
ON public.fnb_distribution_schedule
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.merchants 
        WHERE merchants.id = fnb_distribution_schedule.merchant_id 
        AND merchants.user_id::text = auth.uid()::text
    )
);

-- 7. Mock Data
-- Note: Payment transactions and distribution schedules will be created when actual transactions occur
-- No hardcoded user_profiles references to avoid foreign key constraint errors
