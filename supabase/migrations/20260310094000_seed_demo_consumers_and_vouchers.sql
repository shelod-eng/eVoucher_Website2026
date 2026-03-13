-- Seed demo customers and sample vouchers for launch demo

DO $$
DECLARE
  v_emails TEXT[] := ARRAY[
    'demo.consumer1@evoucher.co.za',
    'demo.consumer2@evoucher.co.za',
    'demo.consumer3@evoucher.co.za'
  ];
BEGIN
  IF COALESCE(current_setting('app.seed_demo', true), '') <> 'true' THEN
    RAISE NOTICE 'Skipping demo customer/voucher seed because app.seed_demo is not true.';
    RETURN;
  END IF;

  -- Create demo auth users if auth schema is available.
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
      email,
      crypt('demo123', gen_salt('bf')),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('full_name', split_part(email, '@', 1), 'role', 'customer'),
      NOW(),
      NOW()
    FROM unnest(v_emails) AS email
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.email = email
    );
  END IF;

  -- Create identities when the table exists (needed for some auth flows).
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'identities'
  ) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    SELECT
      gen_random_uuid(),
      u.id,
      jsonb_build_object('sub', u.id::text, 'email', u.email),
      'email',
      NOW(),
      NOW(),
      NOW()
    FROM auth.users u
    WHERE u.email = ANY(v_emails)
      AND NOT EXISTS (
        SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
      );
  END IF;
END $$;

-- Ensure user_profiles exist (trigger should already handle this, but keep idempotent safety).
INSERT INTO public.user_profiles (id, email, full_name, phone, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  '',
  'customer'::public.user_role
FROM auth.users u
WHERE u.email IN (
  'demo.consumer1@evoucher.co.za',
  'demo.consumer2@evoucher.co.za',
  'demo.consumer3@evoucher.co.za'
)
AND COALESCE(current_setting('app.seed_demo', true), '') = 'true'
ON CONFLICT (id) DO NOTHING;

WITH customers AS (
  SELECT id, email
  FROM auth.users
  WHERE email IN (
    'demo.consumer1@evoucher.co.za',
    'demo.consumer2@evoucher.co.za',
    'demo.consumer3@evoucher.co.za'
  )
  AND COALESCE(current_setting('app.seed_demo', true), '') = 'true'
),
launch_merchants AS (
  SELECT id, business_name, parent_brand, default_total_discount_pct
  FROM public.merchants
  WHERE business_name IN ('Shoprite')
    AND COALESCE(current_setting('app.seed_demo', true), '') = 'true'
),
merchant_products AS (
  SELECT mp.*
  FROM public.merchant_products mp
  JOIN launch_merchants lm ON lm.id = mp.merchant_id
  WHERE mp.is_active = true
),
seed_vouchers AS (
  SELECT
    c.id AS customer_id,
    m.id AS merchant_id,
    m.business_name AS merchant_name,
    m.parent_brand,
    p.id AS product_id,
    p.product_name,
    p.face_value,
    p.total_discount_pct,
    p.consumer_benefit_pct,
    p.evoucher_benefit_pct,
    p.total_discount_amount,
    p.consumer_benefit_amount,
    p.evoucher_benefit_amount,
    p.consumer_price,
    p.merchant_receivable_after_total_discount,
    p.merchant_receivable_after_evoucher_benefit
  FROM customers c
  JOIN launch_merchants m ON TRUE
  JOIN LATERAL (
    SELECT *
    FROM merchant_products mp
    WHERE mp.merchant_id = m.id
    ORDER BY mp.face_value ASC
    LIMIT 1
  ) p ON TRUE
),
voucher_rows AS (
  SELECT
    customer_id,
    merchant_id,
    merchant_name,
    parent_brand,
    product_id,
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
    format('DEMO-%s-%s', replace(upper(merchant_name), ' ', ''), right(customer_id::text, 6)) AS voucher_code
  FROM seed_vouchers
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
  vr.customer_id,
  vr.merchant_id,
  vr.merchant_name,
  vr.parent_brand,
  vr.voucher_code,
  vr.face_value,
  vr.consumer_benefit_pct,
  vr.face_value,
  true,
  vr.product_id,
  vr.total_discount_pct,
  vr.consumer_benefit_pct,
  vr.evoucher_benefit_pct,
  vr.total_discount_amount,
  vr.consumer_benefit_amount,
  vr.evoucher_benefit_amount,
  vr.consumer_price,
  vr.merchant_receivable_after_total_discount,
  vr.merchant_receivable_after_evoucher_benefit,
  NOW()
FROM voucher_rows vr
WHERE NOT EXISTS (
  SELECT 1 FROM public.customer_vouchers cv WHERE cv.voucher_code = vr.voucher_code
)
AND COALESCE(current_setting('app.seed_demo', true), '') = 'true';

-- Seed a small redemption history sample for the first demo customer.
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
  LEAST(50, cv.current_balance),
  'redemption'::public.transaction_type,
  NOW()
FROM public.customer_vouchers cv
JOIN auth.users u ON u.id = cv.customer_id
WHERE u.email = 'demo.consumer1@evoucher.co.za'
  AND COALESCE(current_setting('app.seed_demo', true), '') = 'true'
  AND NOT EXISTS (
    SELECT 1 FROM public.redemption_history rh WHERE rh.voucher_id = cv.id
  )
LIMIT 1;
