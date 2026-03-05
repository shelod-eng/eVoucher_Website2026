-- Merchant specials lifecycle fields for product studio and consumer feed ranking.
ALTER TABLE public.merchant_products
    ADD COLUMN IF NOT EXISTS is_special BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS special_title TEXT,
    ADD COLUMN IF NOT EXISTS special_end_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS display_priority INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_merchant_products_is_special
    ON public.merchant_products(is_special);

CREATE INDEX IF NOT EXISTS idx_merchant_products_special_end_at
    ON public.merchant_products(special_end_at);
