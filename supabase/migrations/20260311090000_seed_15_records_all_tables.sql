-- Seed 15 records in core tables for demo readiness

-- NOTE: This seed migration is now guarded to run only when the Postgres setting
-- `app.seed_demo` is explicitly set to `true` (e.g. for local demo/staging).
-- In production it will no-op, keeping the database clean for real onboarding.

-- 1) Create 15 auth users (customers) if auth schema exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    INSERT INTO auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    SELECT
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      format('demo.customer%02s@evoucher.co.za', gs),
      crypt('demo123', gen_salt('bf')),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('full_name', format('Demo Customer %02s', gs), 'role', 'customer'),
      NOW(),
      NOW()
    FROM generate_series(1, 15) gs
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.email = format('demo.customer%02s@evoucher.co.za', gs)
    )
    AND COALESCE(current_setting('app.seed_demo', true), '') = 'true';
  END IF;
END $$;

-- 2) Ensure user_profiles for those 15 users
INSERT INTO public.user_profiles (id, email, full_name, phone, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  format('+27 10 200 %04s', row_number() OVER (ORDER BY u.email)),
  'customer'::public.user_role
FROM auth.users u
WHERE u.email LIKE 'demo.customer%'
  AND COALESCE(current_setting('app.seed_demo', true), '') = 'true'
ON CONFLICT (id) DO NOTHING;

-- 3) Ensure Shoprite merchant exists (demo-only)
WITH merchant_seed AS (
  SELECT
    'Shoprite' AS business_name,
    'Shoprite Onboarding' AS contact_name,
    'onboarding@shoprite.example' AS email,
    '+27 10 001 0001' AS phone,
    'retail' AS business_type,
    'Shoprite' AS parent_brand,
    'Shoprite Main' AS branch_name,
    'Johannesburg' AS city,
    'Gauteng' AS province
)
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
  'chain',
  'active'::public.merchant_status,
  'approved',
  5,
  true,
  true,
  true,
  NOW()
FROM merchant_seed m
WHERE COALESCE(current_setting('app.seed_demo', true), '') = 'true'
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
  approved_at = EXCLUDED.approved_at;

-- 4) Seed 15 Shoprite products
WITH merchants AS (
  SELECT id, business_name, default_total_discount_pct
  FROM public.merchants
  WHERE business_name = 'Shoprite'
  ORDER BY approved_at DESC NULLS LAST, created_at DESC
  LIMIT 1
),
products_seed AS (
  SELECT
    m.id AS merchant_id,
    format('%s Voucher R%03s', m.business_name, gs * 50) AS product_name,
    (gs * 50)::numeric(10,2) AS face_value,
    m.default_total_discount_pct AS total_discount_pct
  FROM merchants m
  CROSS JOIN generate_series(1, 15) gs
  WHERE COALESCE(current_setting('app.seed_demo', true), '') = 'true'
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
  p.merchant_id,
  p.product_name,
  p.face_value,
  p.total_discount_pct,
  ROUND(p.total_discount_pct / 2.0, 2),
  ROUND(p.total_discount_pct / 2.0, 2),
  ROUND(p.face_value * (p.total_discount_pct / 100.0), 2),
  ROUND(p.face_value * ((p.total_discount_pct / 2.0) / 100.0), 2),
  ROUND(p.face_value * ((p.total_discount_pct / 2.0) / 100.0), 2),
  ROUND(p.face_value - (p.face_value * ((p.total_discount_pct / 2.0) / 100.0)), 2),
  ROUND(p.face_value - (p.face_value * (p.total_discount_pct / 100.0)), 2),
  ROUND(p.face_value - (p.face_value * ((p.total_discount_pct / 2.0) / 100.0)), 2),
  true
FROM products_seed p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.merchant_products mp
  WHERE mp.merchant_id = p.merchant_id
    AND mp.product_name = p.product_name
    AND mp.face_value = p.face_value
);

-- 5) Seed 15 customer vouchers (1 per customer)
WITH customers AS (
  SELECT id, email
  FROM auth.users
  WHERE email LIKE 'demo.customer%'
  ORDER BY email
  LIMIT 15
),
products AS (
  SELECT mp.*, m.business_name, m.parent_brand
  FROM public.merchant_products mp
  JOIN public.merchants m ON m.id = mp.merchant_id
  ORDER BY mp.face_value
  LIMIT 15
),
voucher_seed AS (
  SELECT
    c.id AS customer_id,
    p.merchant_id,
    p.business_name AS merchant_name,
    p.parent_brand,
    p.id AS product_id,
    p.face_value,
    p.total_discount_pct,
    p.consumer_benefit_pct,
    p.evoucher_benefit_pct,
    p.total_discount_amount,
    p.consumer_benefit_amount,
    p.evoucher_benefit_amount,
    p.consumer_price,
    p.merchant_receivable_after_total_discount,
    p.merchant_receivable_after_evoucher_benefit,
    format('DEMO-%s-%s', replace(upper(p.business_name), ' ', ''), right(c.id::text, 6)) AS voucher_code
  FROM customers c
  JOIN products p ON true
  ORDER BY c.email, p.face_value
  LIMIT 15
)
INSERT INTO public.customer_vouchers (
  customer_id,
  merchant_id,
  merchant_name,
  parent_brand,
  voucher_code,
  face_value,
  discount_percent,
  current_balance,
  is_active,
  product_id,
  total_discount_pct,
  consumer_benefit_pct,
  evoucher_benefit_pct,
  total_discount_amount,
  consumer_benefit_amount,
  evoucher_benefit_amount,
  consumer_price,
  merchant_receivable_after_total_discount,
  merchant_receivable_after_evoucher_benefit,
  issued_at
)
SELECT
  v.customer_id,
  v.merchant_id,
  v.merchant_name,
  v.parent_brand,
  v.voucher_code,
  v.face_value,
  v.consumer_benefit_pct,
  v.face_value,
  true,
  v.product_id,
  v.total_discount_pct,
  v.consumer_benefit_pct,
  v.evoucher_benefit_pct,
  v.total_discount_amount,
  v.consumer_benefit_amount,
  v.evoucher_benefit_amount,
  v.consumer_price,
  v.merchant_receivable_after_total_discount,
  v.merchant_receivable_after_evoucher_benefit,
  NOW()
FROM voucher_seed v
WHERE NOT EXISTS (
  SELECT 1 FROM public.customer_vouchers cv WHERE cv.voucher_code = v.voucher_code
)
AND COALESCE(current_setting('app.seed_demo', true), '') = 'true';

-- 6) Seed 15 redemption history rows
INSERT INTO public.redemption_history (
  customer_id,
  voucher_id,
  merchant_name,
  amount,
  transaction_type,
  created_at
)
SELECT
  cv.customer_id,
  cv.id,
  cv.merchant_name,
  LEAST(25, cv.current_balance),
  'redemption'::public.transaction_type,
  NOW()
FROM public.customer_vouchers cv
WHERE COALESCE(current_setting('app.seed_demo', true), '') = 'true'
ORDER BY cv.issued_at DESC
LIMIT 15
ON CONFLICT DO NOTHING;

-- 7) Seed 15 payment transactions
INSERT INTO public.payment_transactions (
  customer_id,
  merchant_id,
  amount,
  card_last_four,
  card_brand,
  payment_status,
  voucher_code,
  transaction_reference,
  created_at
)
SELECT
  cv.customer_id,
  cv.merchant_id,
  cv.face_value,
  LPAD((1000 + (row_number() OVER (ORDER BY cv.issued_at))::int)::text, 4, '0'),
  'VISA',
  'completed',
  cv.voucher_code,
  format('TXN-%s-%s', to_char(NOW(), 'YYYYMMDDHH24MISS'), right(cv.id::text, 6)),
  NOW()
FROM public.customer_vouchers cv
WHERE COALESCE(current_setting('app.seed_demo', true), '') = 'true'
ORDER BY cv.issued_at DESC
LIMIT 15
ON CONFLICT (transaction_reference) DO NOTHING;

-- 8) Seed 15 merchant payouts
INSERT INTO public.merchant_payouts (
  merchant_id,
  amount,
  status,
  payout_date,
  created_at
)
SELECT
  m.id,
  100 + (gs * 10),
  'pending',
  NOW() + INTERVAL '7 days',
  NOW()
FROM (SELECT id FROM public.merchants WHERE business_name = 'Shoprite' ORDER BY approved_at DESC NULLS LAST, created_at DESC LIMIT 1) m
CROSS JOIN generate_series(1, 15) gs
WHERE COALESCE(current_setting('app.seed_demo', true), '') = 'true';

-- 9) Seed 15 FNB distribution schedule rows
INSERT INTO public.fnb_distribution_schedule (
  merchant_id,
  scheduled_date,
  total_amount,
  status,
  fnb_reference,
  processed_at,
  created_at
)
SELECT
  m.id,
  NOW() + INTERVAL '3 days',
  200 + (gs * 15),
  'scheduled',
  format('FNB-%s-%s', right(m.id::text, 8), gs),
  NULL,
  NOW()
FROM (SELECT id FROM public.merchants WHERE business_name = 'Shoprite' ORDER BY approved_at DESC NULLS LAST, created_at DESC LIMIT 1) m
CROSS JOIN generate_series(1, 15) gs
WHERE COALESCE(current_setting('app.seed_demo', true), '') = 'true';
