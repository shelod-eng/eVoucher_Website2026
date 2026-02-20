-- Introduce explicit discount-budget pricing fields for merchants, purchases, and vouchers.
-- New default model:
-- total_discount_pct defaults to 5%
-- consumer_benefit_pct = total_discount_pct / 2
-- evoucher_benefit_pct = total_discount_pct / 2

ALTER TABLE public.merchants
    ADD COLUMN IF NOT EXISTS default_total_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 5;

UPDATE public.merchants
SET default_total_discount_pct = 5
WHERE default_total_discount_pct IS NULL;

CREATE TABLE IF NOT EXISTS public.merchant_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    face_value NUMERIC(10,2) NOT NULL,
    total_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 5,
    consumer_benefit_pct NUMERIC(5,2) NOT NULL,
    evoucher_benefit_pct NUMERIC(5,2) NOT NULL,
    total_discount_amount NUMERIC(10,2) NOT NULL,
    consumer_benefit_amount NUMERIC(10,2) NOT NULL,
    evoucher_benefit_amount NUMERIC(10,2) NOT NULL,
    consumer_price NUMERIC(10,2) NOT NULL,
    merchant_receivable_after_total_discount NUMERIC(10,2) NOT NULL,
    merchant_receivable_after_evoucher_benefit NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merchant_products_merchant_id ON public.merchant_products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_products_active ON public.merchant_products(is_active);

ALTER TABLE public.merchant_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchants_manage_own_products" ON public.merchant_products;
CREATE POLICY "merchants_manage_own_products"
ON public.merchant_products
FOR ALL
TO authenticated
USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id::text = auth.uid()::text)
)
WITH CHECK (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id::text = auth.uid()::text)
);

DROP POLICY IF EXISTS "customers_view_active_merchant_products" ON public.merchant_products;
CREATE POLICY "customers_view_active_merchant_products"
ON public.merchant_products
FOR SELECT
TO authenticated
USING (is_active = true);

DROP TRIGGER IF EXISTS update_merchant_products_updated_at ON public.merchant_products;
CREATE TRIGGER update_merchant_products_updated_at
BEFORE UPDATE ON public.merchant_products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payment_transactions
    ADD COLUMN IF NOT EXISTS product_id UUID,
    ADD COLUMN IF NOT EXISTS face_value NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS total_discount_pct NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS consumer_benefit_pct NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS evoucher_benefit_pct NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS total_discount_amount NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS consumer_benefit_amount NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS evoucher_benefit_amount NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS consumer_price NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS merchant_receivable_after_total_discount NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS merchant_receivable_after_evoucher_benefit NUMERIC(10,2);

ALTER TABLE public.customer_vouchers
    ADD COLUMN IF NOT EXISTS product_id UUID,
    ADD COLUMN IF NOT EXISTS total_discount_pct NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS consumer_benefit_pct NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS evoucher_benefit_pct NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS total_discount_amount NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS consumer_benefit_amount NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS evoucher_benefit_amount NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS consumer_price NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS merchant_receivable_after_total_discount NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS merchant_receivable_after_evoucher_benefit NUMERIC(10,2);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'payment_transactions_product_id_fkey'
          AND table_name = 'payment_transactions'
    ) THEN
        ALTER TABLE public.payment_transactions
        ADD CONSTRAINT payment_transactions_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public.merchant_products(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'customer_vouchers_product_id_fkey'
          AND table_name = 'customer_vouchers'
    ) THEN
        ALTER TABLE public.customer_vouchers
        ADD CONSTRAINT customer_vouchers_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public.merchant_products(id) ON DELETE SET NULL;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_product_id ON public.payment_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_product_id ON public.customer_vouchers(product_id);

UPDATE public.payment_transactions
SET
    face_value = COALESCE(face_value, amount),
    total_discount_pct = COALESCE(total_discount_pct, 5),
    consumer_benefit_pct = COALESCE(consumer_benefit_pct, COALESCE(total_discount_pct, 5) / 2),
    evoucher_benefit_pct = COALESCE(evoucher_benefit_pct, COALESCE(total_discount_pct, 5) / 2),
    total_discount_amount = COALESCE(total_discount_amount, ROUND(COALESCE(face_value, amount) * (COALESCE(total_discount_pct, 5) / 100), 2)),
    consumer_benefit_amount = COALESCE(consumer_benefit_amount, ROUND(COALESCE(face_value, amount) * (COALESCE(consumer_benefit_pct, COALESCE(total_discount_pct, 5) / 2) / 100), 2)),
    evoucher_benefit_amount = COALESCE(evoucher_benefit_amount, ROUND(COALESCE(face_value, amount) * (COALESCE(evoucher_benefit_pct, COALESCE(total_discount_pct, 5) / 2) / 100), 2)),
    consumer_price = COALESCE(consumer_price, amount),
    merchant_receivable_after_total_discount = COALESCE(
        merchant_receivable_after_total_discount,
        ROUND(COALESCE(face_value, amount) - (COALESCE(face_value, amount) * (COALESCE(total_discount_pct, 5) / 100)), 2)
    ),
    merchant_receivable_after_evoucher_benefit = COALESCE(
        merchant_receivable_after_evoucher_benefit,
        ROUND(COALESCE(face_value, amount) - (COALESCE(face_value, amount) * (COALESCE(evoucher_benefit_pct, COALESCE(total_discount_pct, 5) / 2) / 100)), 2)
    )
WHERE
    face_value IS NULL
    OR total_discount_pct IS NULL
    OR consumer_benefit_pct IS NULL
    OR evoucher_benefit_pct IS NULL
    OR total_discount_amount IS NULL
    OR consumer_benefit_amount IS NULL
    OR evoucher_benefit_amount IS NULL
    OR consumer_price IS NULL
    OR merchant_receivable_after_total_discount IS NULL
    OR merchant_receivable_after_evoucher_benefit IS NULL;

UPDATE public.customer_vouchers
SET
    total_discount_pct = COALESCE(total_discount_pct, LEAST(discount_percent * 2, 100)),
    consumer_benefit_pct = COALESCE(consumer_benefit_pct, discount_percent),
    evoucher_benefit_pct = COALESCE(evoucher_benefit_pct, LEAST(discount_percent, 100 - COALESCE(consumer_benefit_pct, discount_percent))),
    total_discount_amount = COALESCE(total_discount_amount, ROUND(face_value * (COALESCE(total_discount_pct, LEAST(discount_percent * 2, 100)) / 100), 2)),
    consumer_benefit_amount = COALESCE(consumer_benefit_amount, ROUND(face_value * (COALESCE(consumer_benefit_pct, discount_percent) / 100), 2)),
    evoucher_benefit_amount = COALESCE(evoucher_benefit_amount, ROUND(face_value * (COALESCE(evoucher_benefit_pct, LEAST(discount_percent, 100 - COALESCE(consumer_benefit_pct, discount_percent))) / 100), 2)),
    consumer_price = COALESCE(consumer_price, ROUND(face_value - (face_value * (COALESCE(consumer_benefit_pct, discount_percent) / 100)), 2)),
    merchant_receivable_after_total_discount = COALESCE(
        merchant_receivable_after_total_discount,
        ROUND(face_value - (face_value * (COALESCE(total_discount_pct, LEAST(discount_percent * 2, 100)) / 100)), 2)
    ),
    merchant_receivable_after_evoucher_benefit = COALESCE(
        merchant_receivable_after_evoucher_benefit,
        ROUND(face_value - (face_value * (COALESCE(evoucher_benefit_pct, LEAST(discount_percent, 100 - COALESCE(consumer_benefit_pct, discount_percent))) / 100)), 2)
    )
WHERE
    total_discount_pct IS NULL
    OR consumer_benefit_pct IS NULL
    OR evoucher_benefit_pct IS NULL
    OR total_discount_amount IS NULL
    OR consumer_benefit_amount IS NULL
    OR evoucher_benefit_amount IS NULL
    OR consumer_price IS NULL
    OR merchant_receivable_after_total_discount IS NULL
    OR merchant_receivable_after_evoucher_benefit IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'merchants_default_total_discount_pct_valid'
    ) THEN
        ALTER TABLE public.merchants
        ADD CONSTRAINT merchants_default_total_discount_pct_valid
        CHECK (default_total_discount_pct >= 0 AND default_total_discount_pct <= 100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payment_transactions_total_discount_pct_valid'
    ) THEN
        ALTER TABLE public.payment_transactions
        ADD CONSTRAINT payment_transactions_total_discount_pct_valid
        CHECK (total_discount_pct IS NULL OR (total_discount_pct >= 0 AND total_discount_pct <= 100));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customer_vouchers_total_discount_pct_valid'
    ) THEN
        ALTER TABLE public.customer_vouchers
        ADD CONSTRAINT customer_vouchers_total_discount_pct_valid
        CHECK (total_discount_pct IS NULL OR (total_discount_pct >= 0 AND total_discount_pct <= 100));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'merchant_products_face_value_positive'
    ) THEN
        ALTER TABLE public.merchant_products
        ADD CONSTRAINT merchant_products_face_value_positive
        CHECK (face_value > 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'merchant_products_total_discount_pct_valid'
    ) THEN
        ALTER TABLE public.merchant_products
        ADD CONSTRAINT merchant_products_total_discount_pct_valid
        CHECK (total_discount_pct >= 0 AND total_discount_pct <= 100);
    END IF;
END;
$$;
