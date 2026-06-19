-- Seed launch merchants and starter voucher products

-- Ensure a UNIQUE constraint exists on merchants.email for ON CONFLICT to work.
-- This is idempotent and safe to re-run.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'merchants_email_key' AND conrelid = 'public.merchants'::regclass
    ) THEN
        ALTER TABLE public.merchants ADD CONSTRAINT merchants_email_key UNIQUE (email);
    END IF;
END;
$$;

WITH merchants_seed AS (
    SELECT * FROM (VALUES
        ('Shoprite', 'Shoprite Onboarding', 'onboarding@shoprite.example', '+27 10 001 0001', 'retail', 'Shoprite', 'Shoprite Main', 'Johannesburg', 'Gauteng', 'chain', 'active', 'approved', 5)
    ) AS t(
        business_name,
        contact_name,
        email,
        phone,
        business_type,
        parent_brand,
        branch_name,
        city,
        province,
        merchant_type,
        status,
        vetting_status,
        default_total_discount_pct
    )
),
upserted_merchants AS (
    INSERT INTO public.merchants (
        business_name,
        contact_name,
        email,
        phone,
        business_type,
        parent_brand,
        branch_name,
        city,
        province,
        merchant_type,
        status,
        vetting_status,
        default_total_discount_pct,
        onboarding_fee_paid,
        email_verified,
        phone_verified,
        approved_at
    )
    SELECT
        m.business_name,
        m.contact_name,
        m.email,
        m.phone,
        m.business_type,
        m.parent_brand,
        m.branch_name,
        m.city,
        m.province,
        m.merchant_type,
        m.status::public.merchant_status,
        m.vetting_status,
        m.default_total_discount_pct,
        true,
        true,
        true,
        NOW()
    FROM merchants_seed m
    ON CONFLICT (email) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        contact_name = EXCLUDED.contact_name,
        phone = EXCLUDED.phone,
        business_type = EXCLUDED.business_type,
        parent_brand = EXCLUDED.parent_brand,
        branch_name = EXCLUDED.branch_name,
        city = EXCLUDED.city,
        province = EXCLUDED.province,
        merchant_type = EXCLUDED.merchant_type,
        status = EXCLUDED.status,
        vetting_status = EXCLUDED.vetting_status,
        default_total_discount_pct = EXCLUDED.default_total_discount_pct,
        onboarding_fee_paid = EXCLUDED.onboarding_fee_paid,
        email_verified = EXCLUDED.email_verified,
        phone_verified = EXCLUDED.phone_verified,
        approved_at = EXCLUDED.approved_at
    RETURNING id, business_name, default_total_discount_pct
),
products_seed AS (
    SELECT * FROM (VALUES
        ('Standard Voucher R100', 100.00),
        ('Standard Voucher R250', 250.00),
        ('Standard Voucher R500', 500.00)
    ) AS p(product_name, face_value)
)
INSERT INTO public.merchant_products (
    merchant_id,
    product_name,
    face_value,
    total_discount_pct,
    consumer_benefit_pct,
    evoucher_benefit_pct,
    total_discount_amount,
    consumer_benefit_amount,
    evoucher_benefit_amount,
    consumer_price,
    merchant_receivable_after_total_discount,
    merchant_receivable_after_evoucher_benefit,
    is_active
)
SELECT
    um.id,
    ps.product_name,
    ps.face_value,
    um.default_total_discount_pct,
    ROUND(um.default_total_discount_pct / 2.0, 2),
    ROUND(um.default_total_discount_pct / 2.0, 2),
    ROUND(ps.face_value * (um.default_total_discount_pct / 100.0), 2),
    ROUND(ps.face_value * ((um.default_total_discount_pct / 2.0) / 100.0), 2),
    ROUND(ps.face_value * ((um.default_total_discount_pct / 2.0) / 100.0), 2),
    ROUND(ps.face_value - (ps.face_value * ((um.default_total_discount_pct / 2.0) / 100.0)), 2),
    ROUND(ps.face_value - (ps.face_value * (um.default_total_discount_pct / 100.0)), 2),
    ROUND(ps.face_value - (ps.face_value * ((um.default_total_discount_pct / 2.0) / 100.0)), 2),
    true
FROM upserted_merchants um
CROSS JOIN products_seed ps
WHERE NOT EXISTS (
    SELECT 1
    FROM public.merchant_products mp
    WHERE mp.merchant_id = um.id
      AND mp.product_name = ps.product_name
      AND mp.face_value = ps.face_value
);
