-- Add merchant_id reference to customer vouchers for deterministic redemption validation.

ALTER TABLE public.customer_vouchers
ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customer_vouchers_merchant_id ON public.customer_vouchers(merchant_id);

-- Best-effort backfill from merchant name.
UPDATE public.customer_vouchers cv
SET merchant_id = m.id
FROM public.merchants m
WHERE cv.merchant_id IS NULL
  AND lower(trim(cv.merchant_name)) = lower(trim(m.business_name));
