-- Align all pricing records to the 70/30 discount split model:
-- consumer_benefit_pct = total_discount_pct * 70%
-- evoucher_benefit_pct = total_discount_pct * 30%

-- Merchant products
UPDATE public.merchant_products mp
SET
    total_discount_pct = calc.total_discount_pct,
    consumer_benefit_pct = calc.consumer_benefit_pct,
    evoucher_benefit_pct = calc.evoucher_benefit_pct,
    total_discount_amount = ROUND(calc.face_value * (calc.total_discount_pct / 100), 2),
    consumer_benefit_amount = ROUND(calc.face_value * (calc.consumer_benefit_pct / 100), 2),
    evoucher_benefit_amount = ROUND(calc.face_value * (calc.evoucher_benefit_pct / 100), 2),
    consumer_price = ROUND(calc.face_value - (calc.face_value * (calc.consumer_benefit_pct / 100)), 2),
    merchant_receivable_after_total_discount = ROUND(calc.face_value - (calc.face_value * (calc.total_discount_pct / 100)), 2),
    merchant_receivable_after_evoucher_benefit = ROUND(calc.face_value - (calc.face_value * (calc.evoucher_benefit_pct / 100)), 2),
    updated_at = CURRENT_TIMESTAMP
FROM (
    SELECT
        id,
        face_value,
        COALESCE(total_discount_pct, 5)::NUMERIC(5,2) AS total_discount_pct,
        ROUND(COALESCE(total_discount_pct, 5) * 0.70, 2)::NUMERIC(5,2) AS consumer_benefit_pct,
        ROUND(
            COALESCE(total_discount_pct, 5) - ROUND(COALESCE(total_discount_pct, 5) * 0.70, 2),
            2
        )::NUMERIC(5,2) AS evoucher_benefit_pct
    FROM public.merchant_products
) calc
WHERE mp.id = calc.id;

-- Payment transactions
UPDATE public.payment_transactions pt
SET
    face_value = calc.face_value,
    total_discount_pct = calc.total_discount_pct,
    consumer_benefit_pct = calc.consumer_benefit_pct,
    evoucher_benefit_pct = calc.evoucher_benefit_pct,
    total_discount_amount = ROUND(calc.face_value * (calc.total_discount_pct / 100), 2),
    consumer_benefit_amount = ROUND(calc.face_value * (calc.consumer_benefit_pct / 100), 2),
    evoucher_benefit_amount = ROUND(calc.face_value * (calc.evoucher_benefit_pct / 100), 2),
    consumer_price = ROUND(calc.face_value - (calc.face_value * (calc.consumer_benefit_pct / 100)), 2),
    merchant_receivable_after_total_discount = ROUND(calc.face_value - (calc.face_value * (calc.total_discount_pct / 100)), 2),
    merchant_receivable_after_evoucher_benefit = ROUND(calc.face_value - (calc.face_value * (calc.evoucher_benefit_pct / 100)), 2)
FROM (
    SELECT
        id,
        COALESCE(face_value, amount)::NUMERIC(10,2) AS face_value,
        COALESCE(total_discount_pct, 5)::NUMERIC(5,2) AS total_discount_pct,
        ROUND(COALESCE(total_discount_pct, 5) * 0.70, 2)::NUMERIC(5,2) AS consumer_benefit_pct,
        ROUND(
            COALESCE(total_discount_pct, 5) - ROUND(COALESCE(total_discount_pct, 5) * 0.70, 2),
            2
        )::NUMERIC(5,2) AS evoucher_benefit_pct
    FROM public.payment_transactions
) calc
WHERE pt.id = calc.id;

-- Customer vouchers
UPDATE public.customer_vouchers cv
SET
    total_discount_pct = calc.total_discount_pct,
    consumer_benefit_pct = calc.consumer_benefit_pct,
    evoucher_benefit_pct = calc.evoucher_benefit_pct,
    total_discount_amount = ROUND(calc.face_value * (calc.total_discount_pct / 100), 2),
    consumer_benefit_amount = ROUND(calc.face_value * (calc.consumer_benefit_pct / 100), 2),
    evoucher_benefit_amount = ROUND(calc.face_value * (calc.evoucher_benefit_pct / 100), 2),
    consumer_price = ROUND(calc.face_value - (calc.face_value * (calc.consumer_benefit_pct / 100)), 2),
    merchant_receivable_after_total_discount = ROUND(calc.face_value - (calc.face_value * (calc.total_discount_pct / 100)), 2),
    merchant_receivable_after_evoucher_benefit = ROUND(calc.face_value - (calc.face_value * (calc.evoucher_benefit_pct / 100)), 2),
    discount_percent = calc.consumer_benefit_pct
FROM (
    SELECT
        id,
        face_value,
        COALESCE(total_discount_pct, LEAST(discount_percent / 0.70, 100), 5)::NUMERIC(5,2) AS total_discount_pct,
        ROUND(COALESCE(total_discount_pct, LEAST(discount_percent / 0.70, 100), 5) * 0.70, 2)::NUMERIC(5,2) AS consumer_benefit_pct,
        ROUND(
            COALESCE(total_discount_pct, LEAST(discount_percent / 0.70, 100), 5) - ROUND(COALESCE(total_discount_pct, LEAST(discount_percent / 0.70, 100), 5) * 0.70, 2),
            2
        )::NUMERIC(5,2) AS evoucher_benefit_pct
    FROM public.customer_vouchers
) calc
WHERE cv.id = calc.id;
