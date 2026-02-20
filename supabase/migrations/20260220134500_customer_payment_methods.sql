-- Customer payment methods for wallet management UX.

CREATE TABLE IF NOT EXISTS public.customer_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    method_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    masked_reference TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_customer_id
    ON public.customer_payment_methods(customer_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_payment_methods_reference
    ON public.customer_payment_methods(customer_id, provider, masked_reference);

ALTER TABLE public.customer_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_view_own_payment_methods" ON public.customer_payment_methods;
CREATE POLICY "customers_view_own_payment_methods"
ON public.customer_payment_methods
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "customers_insert_own_payment_methods" ON public.customer_payment_methods;
CREATE POLICY "customers_insert_own_payment_methods"
ON public.customer_payment_methods
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "customers_update_own_payment_methods" ON public.customer_payment_methods;
CREATE POLICY "customers_update_own_payment_methods"
ON public.customer_payment_methods
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "customers_delete_own_payment_methods" ON public.customer_payment_methods;
CREATE POLICY "customers_delete_own_payment_methods"
ON public.customer_payment_methods
FOR DELETE
TO authenticated
USING (customer_id = auth.uid());

DROP TRIGGER IF EXISTS update_customer_payment_methods_updated_at ON public.customer_payment_methods;
CREATE TRIGGER update_customer_payment_methods_updated_at
BEFORE UPDATE ON public.customer_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customer_payment_methods_method_type_valid'
    ) THEN
        ALTER TABLE public.customer_payment_methods
        ADD CONSTRAINT customer_payment_methods_method_type_valid
        CHECK (method_type IN ('card', 'eft', 'wallet', 'other'));
    END IF;
END;
$$;

