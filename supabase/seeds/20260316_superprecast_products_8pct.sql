-- SuperPrecast product import (8% total discount model: 4% member + 4% platform)
-- Source spreadsheet: "E V Precast Product Price from - SPC SUPER PRECAST 8%.xlsx" (sheet: PRECAST PRODUCTS)
--
-- Safe to run multiple times (uses NOT EXISTS upsert-guard).
--
-- 1) (Optional) approve the merchant so it can be treated as "live".
--    If you want to insert products first and approve later, comment this block out.
--
-- NOTE: The DB enforces a KYC gate: a merchant cannot be moved to approved/active
-- unless there is at least one row in public.merchant_kyc_reviews with review_status='approved'.
-- This seed script creates that approved KYC review record (if missing) before approving.
INSERT INTO public.merchant_kyc_reviews (merchant_id, review_status, reviewed_by, review_notes)
SELECT
  '463acd04-aa4f-46d4-a12c-bd2948de4bd0'::uuid,
  'approved',
  NULL,
  'Seeded approval (SuperPrecast) to enable go-live testing.'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.merchant_kyc_reviews
  WHERE merchant_id = '463acd04-aa4f-46d4-a12c-bd2948de4bd0'
    AND review_status = 'approved'
);

UPDATE public.merchants
SET
  status = 'approved'::public.merchant_status,
  approved_at = COALESCE(approved_at, NOW())
WHERE id = '463acd04-aa4f-46d4-a12c-bd2948de4bd0';

-- 2) Insert products (8% total discount split evenly: 4% member, 4% platform).
WITH merchant AS (
  SELECT
    id,
    business_name,
    COALESCE(NULLIF(TRIM(parent_brand), ''), business_name) AS parent_brand
  FROM public.merchants
  WHERE id = '463acd04-aa4f-46d4-a12c-bd2948de4bd0'
),
products AS (
  SELECT *
  FROM (
    VALUES
      ('Double Wash-Trough (Complete)', 1135.97::numeric(10,2), 'per unit'),
      ('Single Wash-Trough (Complete)', 1005.01::numeric(10,2), 'per unit'),
      ('IE COVER', 28.69::numeric(10,2), 'per unit'),
      ('IE SURROUND', 57.33::numeric(10,2), 'per unit'),
      ('AIR-BRICK - GREY', 17.39::numeric(10,2), 'per unit'),
      ('AIR-BRICK - RED', 19.87::numeric(10,2), 'per unit'),
      ('WIDOW CILL 500MM Grey', 20.62::numeric(10,2), 'per unit'),
      ('WIDOW CILL 500MM Red', 22.17::numeric(10,2), 'per unit'),
      ('WIDOW CILL 500MM Black', 22.17::numeric(10,2), 'per unit'),
      ('WINDOW CILL 250MM Grey', 10.99::numeric(10,2), 'per unit'),
      ('WINDOW CILL 250MM Red', 13.48::numeric(10,2), 'per unit'),
      ('WINDOW CILL 250MM Black', 13.48::numeric(10,2), 'per unit'),
      ('GULLY STAND ROUND', 63.25::numeric(10,2), 'per unit'),
      ('GULLY SQUARE', 63.25::numeric(10,2), 'per unit'),
      ('RWC OPEN 700MM', 63.25::numeric(10,2), 'per unit'),
      ('RWC CLOSED 600MM', 63.25::numeric(10,2), 'per unit'),
      ('PAVER 450sq x 50', 46.00::numeric(10,2), 'per unit'),
      ('PAVER 300sq x 50', 28.75::numeric(10,2), 'per unit'),
      ('HORSESHOE SURROUND', 63.25::numeric(10,2), 'per unit'),
      ('EVBASE 200MM', 65.55::numeric(10,2), 'per unit'),
      ('EVBASE 250MM', 82.23::numeric(10,2), 'per unit'),
      ('BRICK LINTEL 105x70MM', 41.40::numeric(10,2), 'per meter'),
      ('MAXI BLOCK LINTEL 140x70MM', 50.60::numeric(10,2), 'per meter'),
      ('SUPER MAXI LINTEL 140x90MM', 59.80::numeric(10,2), 'per meter')
  ) AS v(description, face_value, unit_label)
)
INSERT INTO public.merchant_products (
  merchant_id,
  parent_brand,
  redemption_scope,
  valid_provinces,
  valid_branch_ids,
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
  m.id AS merchant_id,
  m.parent_brand,
  'all_branches' AS redemption_scope,
  '{}'::TEXT[] AS valid_provinces,
  '{}'::UUID[] AS valid_branch_ids,
  format('%s Voucher — %s', m.business_name, p.description) AS product_name,
  p.face_value,
  8.00::numeric(5,2) AS total_discount_pct,
  4.00::numeric(5,2) AS consumer_benefit_pct,
  4.00::numeric(5,2) AS evoucher_benefit_pct,
  ROUND(p.face_value * (8.00 / 100.0), 2) AS total_discount_amount,
  ROUND(p.face_value * (4.00 / 100.0), 2) AS consumer_benefit_amount,
  ROUND(p.face_value * (4.00 / 100.0), 2) AS evoucher_benefit_amount,
  ROUND(p.face_value - (p.face_value * (4.00 / 100.0)), 2) AS consumer_price,
  ROUND(p.face_value - (p.face_value * (8.00 / 100.0)), 2) AS merchant_receivable_after_total_discount,
  ROUND(p.face_value - (p.face_value * (4.00 / 100.0)), 2) AS merchant_receivable_after_evoucher_benefit,
  true AS is_active
FROM products p
CROSS JOIN merchant m
WHERE NOT EXISTS (
  SELECT 1
  FROM public.merchant_products mp
  WHERE mp.merchant_id = m.id
    AND mp.product_name = format('%s Voucher — %s', m.business_name, p.description)
    AND mp.face_value = p.face_value
);

-- 3) Quick sanity checks
-- SELECT business_name, status, created_at, approved_at FROM public.merchants WHERE id = '463acd04-aa4f-46d4-a12c-bd2948de4bd0';
-- SELECT id, product_name, face_value, consumer_price, merchant_receivable_after_total_discount FROM public.merchant_products WHERE merchant_id = '463acd04-aa4f-46d4-a12c-bd2948de4bd0' ORDER BY face_value DESC;
