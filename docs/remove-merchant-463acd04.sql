BEGIN;

DO $$
DECLARE
  v_merchant_id UUID := '463acd04-aa4f-46d4-a12c-bd2948de4bd0'::uuid;
  v_user_id UUID;
  v_email TEXT;
  v_business_name TEXT;
BEGIN
  SELECT user_id, email, business_name
  INTO v_user_id, v_email, v_business_name
  FROM public.merchants
  WHERE id = v_merchant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Merchant % was not found in public.merchants', v_merchant_id;
  END IF;

  RAISE NOTICE 'Removing merchant % (%), email=% user_id=%',
    v_merchant_id,
    COALESCE(v_business_name, '<null>'),
    COALESCE(v_email, '<null>'),
    COALESCE(v_user_id::text, '<null>');

  IF to_regclass('public.merchant_onboarding_verifications') IS NOT NULL THEN
    DELETE FROM public.merchant_onboarding_verifications WHERE merchant_id = v_merchant_id;
  END IF;

  IF to_regclass('public.merchant_kyc_documents') IS NOT NULL THEN
    DELETE FROM public.merchant_kyc_documents WHERE merchant_id = v_merchant_id;
  END IF;

  IF to_regclass('public.merchant_kyc_reviews') IS NOT NULL THEN
    DELETE FROM public.merchant_kyc_reviews WHERE merchant_id = v_merchant_id;
  END IF;

  IF to_regclass('public.merchant_products') IS NOT NULL THEN
    DELETE FROM public.merchant_products WHERE merchant_id = v_merchant_id;
  END IF;

  IF to_regclass('public.merchant_payouts') IS NOT NULL THEN
    DELETE FROM public.merchant_payouts WHERE merchant_id = v_merchant_id;
  END IF;

  IF to_regclass('public.fnb_distribution_schedule') IS NOT NULL THEN
    DELETE FROM public.fnb_distribution_schedule WHERE merchant_id = v_merchant_id;
  END IF;

  IF to_regclass('public.billing_bank_linkages') IS NOT NULL THEN
    DELETE FROM public.billing_bank_linkages WHERE merchant_id = v_merchant_id;
  END IF;

  IF to_regclass('public.billing_events') IS NOT NULL THEN
    DELETE FROM public.billing_events WHERE merchant_id = v_merchant_id;
  END IF;

  IF to_regclass('public.billing_invoices') IS NOT NULL THEN
    DELETE FROM public.billing_invoices WHERE merchant_id = v_merchant_id;
  END IF;

  IF to_regclass('public.billing_settlements') IS NOT NULL THEN
    DELETE FROM public.billing_settlements WHERE merchant_id = v_merchant_id;
  END IF;

  IF to_regclass('public.payment_transactions') IS NOT NULL THEN
    UPDATE public.payment_transactions
    SET merchant_id = NULL
    WHERE merchant_id = v_merchant_id;
  END IF;

  IF to_regclass('public.billing_ledger_entries') IS NOT NULL THEN
    UPDATE public.billing_ledger_entries
    SET merchant_id = NULL
    WHERE merchant_id = v_merchant_id;
  END IF;

  IF to_regclass('public.customer_vouchers') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'customer_vouchers'
        AND column_name = 'merchant_id'
    ) THEN
      UPDATE public.customer_vouchers
      SET merchant_id = NULL
      WHERE merchant_id = v_merchant_id;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'customer_vouchers'
        AND column_name = 'redeemed_at_merchant_id'
    ) THEN
      UPDATE public.customer_vouchers
      SET redeemed_at_merchant_id = NULL
      WHERE redeemed_at_merchant_id = v_merchant_id;
    END IF;
  END IF;

  DELETE FROM public.merchants WHERE id = v_merchant_id;

  RAISE NOTICE 'Merchant row removed for %, email=% user_id=%',
    COALESCE(v_business_name, '<null>'),
    COALESCE(v_email, '<null>'),
    COALESCE(v_user_id::text, '<null>');
END
$$;

COMMIT;

SELECT id, user_id, email, business_name, status
FROM public.merchants
WHERE id = '463acd04-aa4f-46d4-a12c-bd2948de4bd0'::uuid;

-- Full "never registered" reset:
-- Run this INSTEAD OF the first block if you also want to remove the linked
-- auth.users and public.user_profiles identity for this merchant.
--
-- BEGIN;
--
-- DO $$
-- DECLARE
--   v_merchant_id UUID := '463acd04-aa4f-46d4-a12c-bd2948de4bd0'::uuid;
--   v_user_id UUID;
-- BEGIN
--   SELECT user_id
--   INTO v_user_id
--   FROM public.merchants
--   WHERE id = v_merchant_id;
--
--   IF NOT FOUND THEN
--     RAISE EXCEPTION 'Merchant % was not found in public.merchants', v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.merchant_onboarding_verifications') IS NOT NULL THEN
--     DELETE FROM public.merchant_onboarding_verifications WHERE merchant_id = v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.merchant_kyc_documents') IS NOT NULL THEN
--     DELETE FROM public.merchant_kyc_documents WHERE merchant_id = v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.merchant_kyc_reviews') IS NOT NULL THEN
--     DELETE FROM public.merchant_kyc_reviews WHERE merchant_id = v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.merchant_products') IS NOT NULL THEN
--     DELETE FROM public.merchant_products WHERE merchant_id = v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.merchant_payouts') IS NOT NULL THEN
--     DELETE FROM public.merchant_payouts WHERE merchant_id = v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.fnb_distribution_schedule') IS NOT NULL THEN
--     DELETE FROM public.fnb_distribution_schedule WHERE merchant_id = v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.billing_bank_linkages') IS NOT NULL THEN
--     DELETE FROM public.billing_bank_linkages WHERE merchant_id = v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.billing_events') IS NOT NULL THEN
--     DELETE FROM public.billing_events WHERE merchant_id = v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.billing_invoices') IS NOT NULL THEN
--     DELETE FROM public.billing_invoices WHERE merchant_id = v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.billing_settlements') IS NOT NULL THEN
--     DELETE FROM public.billing_settlements WHERE merchant_id = v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.payment_transactions') IS NOT NULL THEN
--     UPDATE public.payment_transactions
--     SET merchant_id = NULL
--     WHERE merchant_id = v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.billing_ledger_entries') IS NOT NULL THEN
--     UPDATE public.billing_ledger_entries
--     SET merchant_id = NULL
--     WHERE merchant_id = v_merchant_id;
--   END IF;
--
--   IF to_regclass('public.customer_vouchers') IS NOT NULL THEN
--     IF EXISTS (
--       SELECT 1
--       FROM information_schema.columns
--       WHERE table_schema = 'public'
--         AND table_name = 'customer_vouchers'
--         AND column_name = 'merchant_id'
--     ) THEN
--       UPDATE public.customer_vouchers
--       SET merchant_id = NULL
--       WHERE merchant_id = v_merchant_id;
--     END IF;
--
--     IF EXISTS (
--       SELECT 1
--       FROM information_schema.columns
--       WHERE table_schema = 'public'
--         AND table_name = 'customer_vouchers'
--         AND column_name = 'redeemed_at_merchant_id'
--     ) THEN
--       UPDATE public.customer_vouchers
--       SET redeemed_at_merchant_id = NULL
--       WHERE redeemed_at_merchant_id = v_merchant_id;
--     END IF;
--   END IF;
--
--   DELETE FROM public.merchants WHERE id = v_merchant_id;
--
--   IF v_user_id IS NOT NULL THEN
--     DELETE FROM public.user_profiles
--     WHERE id = v_user_id;
--
--     DELETE FROM auth.users
--     WHERE id = v_user_id;
--   END IF;
-- END
-- $$;
--
-- COMMIT;
