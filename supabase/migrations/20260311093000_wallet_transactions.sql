-- Wallet transactions (consumer activity ledger)

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    voucher_id UUID REFERENCES public.customer_vouchers(id) ON DELETE SET NULL,
    user_email TEXT,
    type TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    merchant_name TEXT,
    voucher_code TEXT,
    savings NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_customer_id
ON public.wallet_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_voucher_code
ON public.wallet_transactions(voucher_code);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at
ON public.wallet_transactions(created_at DESC);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_view_own_wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "customers_view_own_wallet_transactions"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "customers_insert_own_wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "customers_insert_own_wallet_transactions"
ON public.wallet_transactions
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());
