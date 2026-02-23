-- Brand-level aggregation + voucher redemption scope metadata

ALTER TABLE public.merchants
    ADD COLUMN IF NOT EXISTS parent_brand TEXT,
    ADD COLUMN IF NOT EXISTS branch_name TEXT,
    ADD COLUMN IF NOT EXISTS location_lat NUMERIC(10,7),
    ADD COLUMN IF NOT EXISTS location_lng NUMERIC(10,7),
    ADD COLUMN IF NOT EXISTS province TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT;

UPDATE public.merchants
SET parent_brand = COALESCE(NULLIF(TRIM(parent_brand), ''), business_name)
WHERE parent_brand IS NULL OR TRIM(parent_brand) = '';

UPDATE public.merchants
SET branch_name = COALESCE(NULLIF(TRIM(branch_name), ''), business_name)
WHERE branch_name IS NULL OR TRIM(branch_name) = '';

CREATE INDEX IF NOT EXISTS idx_merchants_parent_brand ON public.merchants(parent_brand);
CREATE INDEX IF NOT EXISTS idx_merchants_city_province ON public.merchants(city, province);

ALTER TABLE public.merchant_products
    ADD COLUMN IF NOT EXISTS parent_brand TEXT,
    ADD COLUMN IF NOT EXISTS redemption_scope TEXT NOT NULL DEFAULT 'all_branches',
    ADD COLUMN IF NOT EXISTS valid_provinces TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    ADD COLUMN IF NOT EXISTS valid_branch_ids UUID[] NOT NULL DEFAULT '{}'::UUID[];

UPDATE public.merchant_products mp
SET parent_brand = COALESCE(NULLIF(TRIM(mp.parent_brand), ''), m.parent_brand, m.business_name)
FROM public.merchants m
WHERE m.id = mp.merchant_id
  AND (mp.parent_brand IS NULL OR TRIM(mp.parent_brand) = '');

UPDATE public.merchant_products
SET redemption_scope = 'all_branches'
WHERE redemption_scope IS NULL OR TRIM(redemption_scope) = '';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'merchant_products_redemption_scope_valid'
    ) THEN
        ALTER TABLE public.merchant_products
        ADD CONSTRAINT merchant_products_redemption_scope_valid
        CHECK (redemption_scope IN ('all_branches', 'specific_branch', 'province_wide', 'national'));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_merchant_products_parent_brand ON public.merchant_products(parent_brand);
CREATE INDEX IF NOT EXISTS idx_merchant_products_redemption_scope ON public.merchant_products(redemption_scope);

ALTER TABLE public.customer_vouchers
    ADD COLUMN IF NOT EXISTS parent_brand TEXT,
    ADD COLUMN IF NOT EXISTS redemption_scope TEXT NOT NULL DEFAULT 'all_branches',
    ADD COLUMN IF NOT EXISTS valid_provinces TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    ADD COLUMN IF NOT EXISTS valid_branch_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
    ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
    ADD COLUMN IF NOT EXISTS redeemed_at_merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS redeemed_at_branch TEXT,
    ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ;

UPDATE public.customer_vouchers cv
SET parent_brand = COALESCE(NULLIF(TRIM(cv.parent_brand), ''), m.parent_brand, m.business_name)
FROM public.merchants m
WHERE m.id = cv.merchant_id
  AND (cv.parent_brand IS NULL OR TRIM(cv.parent_brand) = '');

UPDATE public.customer_vouchers cv
SET
    redemption_scope = COALESCE(mp.redemption_scope, cv.redemption_scope, 'all_branches'),
    valid_provinces = COALESCE(mp.valid_provinces, cv.valid_provinces, '{}'::TEXT[]),
    valid_branch_ids = COALESCE(mp.valid_branch_ids, cv.valid_branch_ids, '{}'::UUID[])
FROM public.merchant_products mp
WHERE mp.id = cv.product_id;

UPDATE public.customer_vouchers
SET redemption_scope = 'all_branches'
WHERE redemption_scope IS NULL OR TRIM(redemption_scope) = '';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customer_vouchers_redemption_scope_valid'
    ) THEN
        ALTER TABLE public.customer_vouchers
        ADD CONSTRAINT customer_vouchers_redemption_scope_valid
        CHECK (redemption_scope IN ('all_branches', 'specific_branch', 'province_wide', 'national'));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_customer_vouchers_parent_brand ON public.customer_vouchers(parent_brand);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_redemption_scope ON public.customer_vouchers(redemption_scope);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_redeemed_at_merchant_id
    ON public.customer_vouchers(redeemed_at_merchant_id);
