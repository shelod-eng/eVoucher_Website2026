-- Normalize merchants schema to canonical public.merchants
-- Add integrity constraints and migrate legacy merchant table data when present.

-- 1) Migration log table
CREATE TABLE IF NOT EXISTS public.migration_logs (
    id BIGSERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL,
    migrated_rows INTEGER NOT NULL DEFAULT 0,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2) Normalize merchants columns
ALTER TABLE public.merchants
    ADD COLUMN IF NOT EXISTS registration_number TEXT,
    ADD COLUMN IF NOT EXISTS tax_number TEXT,
    ADD COLUMN IF NOT EXISTS physical_address TEXT,
    ADD COLUMN IF NOT EXISTS business_type TEXT,
    ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_merchants_registration_number ON public.merchants(registration_number);
CREATE INDEX IF NOT EXISTS idx_merchants_business_type ON public.merchants(business_type);

-- Ensure one merchant profile per auth user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchants_user_id_unique
ON public.merchants(user_id)
WHERE user_id IS NOT NULL;

-- 3) Shared updated_at function and merchant trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_merchants_updated_at ON public.merchants;
CREATE TRIGGER update_merchants_updated_at
BEFORE UPDATE ON public.merchants
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4) Voucher integrity constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customer_vouchers_face_value_non_negative'
    ) THEN
        ALTER TABLE public.customer_vouchers
        ADD CONSTRAINT customer_vouchers_face_value_non_negative
        CHECK (face_value >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customer_vouchers_current_balance_non_negative'
    ) THEN
        ALTER TABLE public.customer_vouchers
        ADD CONSTRAINT customer_vouchers_current_balance_non_negative
        CHECK (current_balance >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customer_vouchers_current_balance_lte_face_value'
    ) THEN
        ALTER TABLE public.customer_vouchers
        ADD CONSTRAINT customer_vouchers_current_balance_lte_face_value
        CHECK (current_balance <= face_value);
    END IF;
END;
$$;

-- 5) Backfill from legacy table if available
DO $$
DECLARE
    v_rows INTEGER := 0;
    v_sql TEXT;
    v_user_id_expr TEXT;
    v_status_expr TEXT;
    v_merchants_user_id_udt_name TEXT;
    v_merchants_status_udt_name TEXT;
    v_has_user_id BOOLEAN;
    v_has_business_name BOOLEAN;
    v_has_name BOOLEAN;
    v_has_contact_name BOOLEAN;
    v_has_contact_person BOOLEAN;
    v_has_email BOOLEAN;
    v_has_phone BOOLEAN;
    v_has_bank_name BOOLEAN;
    v_has_account_number BOOLEAN;
    v_has_branch_code BOOLEAN;
    v_has_status BOOLEAN;
    v_has_is_active BOOLEAN;
    v_has_charity_donation_amount BOOLEAN;
    v_has_registration_number BOOLEAN;
    v_has_tax_number BOOLEAN;
    v_has_vat_number BOOLEAN;
    v_has_address BOOLEAN;
    v_has_physical_address BOOLEAN;
    v_has_business_type BOOLEAN;
    v_has_category BOOLEAN;
    v_has_account_holder_name BOOLEAN;
    v_has_onboarding_fee_paid BOOLEAN;
    v_has_approved_at BOOLEAN;
    v_has_created_at BOOLEAN;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'merchants_2025_11_10_12_00'
    ) THEN
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'user_id'
    ) INTO v_has_user_id;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'business_name'
    ) INTO v_has_business_name;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'name'
    ) INTO v_has_name;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'contact_name'
    ) INTO v_has_contact_name;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'contact_person'
    ) INTO v_has_contact_person;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'email'
    ) INTO v_has_email;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'phone'
    ) INTO v_has_phone;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'bank_name'
    ) INTO v_has_bank_name;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'account_number'
    ) INTO v_has_account_number;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'branch_code'
    ) INTO v_has_branch_code;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'status'
    ) INTO v_has_status;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'is_active'
    ) INTO v_has_is_active;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'charity_donation_amount'
    ) INTO v_has_charity_donation_amount;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'registration_number'
    ) INTO v_has_registration_number;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'tax_number'
    ) INTO v_has_tax_number;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'vat_number'
    ) INTO v_has_vat_number;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'address'
    ) INTO v_has_address;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'physical_address'
    ) INTO v_has_physical_address;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'business_type'
    ) INTO v_has_business_type;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'category'
    ) INTO v_has_category;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'account_holder_name'
    ) INTO v_has_account_holder_name;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'onboarding_fee_paid'
    ) INTO v_has_onboarding_fee_paid;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'approved_at'
    ) INTO v_has_approved_at;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants_2025_11_10_12_00' AND column_name = 'created_at'
    ) INTO v_has_created_at;

    SELECT udt_name
    INTO v_merchants_user_id_udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'merchants'
      AND column_name = 'user_id'
    LIMIT 1;

    SELECT udt_name
    INTO v_merchants_status_udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'merchants'
      AND column_name = 'status'
    LIMIT 1;

    IF v_has_user_id THEN
        IF v_merchants_user_id_udt_name = 'uuid' THEN
            v_user_id_expr := 'CASE WHEN NULLIF(TRIM(l.user_id::text), '''') ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN NULLIF(TRIM(l.user_id::text), '''')::uuid ELSE NULL END';
        ELSIF v_merchants_user_id_udt_name IN ('int4', 'int8') THEN
            v_user_id_expr := format(
                'CASE WHEN NULLIF(TRIM(l.user_id::text), '''') ~ ''^[0-9]+$'' THEN NULLIF(TRIM(l.user_id::text), '''')::%s ELSE NULL END',
                v_merchants_user_id_udt_name
            );
        ELSE
            v_user_id_expr := 'NULL';
        END IF;
    ELSE
        v_user_id_expr := 'NULL';
    END IF;

    IF v_merchants_status_udt_name = 'merchant_status' THEN
        v_status_expr := CASE
            WHEN v_has_status THEN
                'CASE WHEN l.status::text IN (''pending'', ''approved'', ''active'', ''suspended'') THEN l.status::public.merchant_status ELSE ''pending''::public.merchant_status END'
            WHEN v_has_is_active THEN
                'CASE WHEN COALESCE(l.is_active, false) THEN ''active''::public.merchant_status ELSE ''pending''::public.merchant_status END'
            ELSE
                '''pending''::public.merchant_status'
        END;
    ELSE
        v_status_expr := CASE
            WHEN v_has_status THEN
                'CASE WHEN l.status::text IN (''pending'', ''approved'', ''active'', ''suspended'') THEN l.status::text ELSE ''pending'' END'
            WHEN v_has_is_active THEN
                'CASE WHEN COALESCE(l.is_active, false) THEN ''active'' ELSE ''pending'' END'
            ELSE
                '''pending'''
        END;
    END IF;

    v_sql := format(
        $f$
        WITH migrated AS (
            INSERT INTO public.merchants (
                user_id,
                business_name,
                contact_name,
                email,
                phone,
                bank_name,
                account_number,
                branch_code,
                status,
                charity_donation_amount,
                registration_number,
                tax_number,
                physical_address,
                business_type,
                account_holder_name,
                onboarding_fee_paid,
                approved_at,
                created_at,
                updated_at
            )
            SELECT
                %1$s,
                %2$s,
                %3$s,
                %4$s,
                %5$s,
                %6$s,
                %7$s,
                %8$s,
                %9$s,
                %10$s,
                %11$s,
                %12$s,
                %13$s,
                %14$s,
                %15$s,
                %16$s,
                %17$s,
                %18$s,
                CURRENT_TIMESTAMP
            FROM public.merchants_2025_11_10_12_00 l
            WHERE %4$s IS NOT NULL
            ON CONFLICT (email) DO UPDATE
            SET
                user_id = COALESCE(EXCLUDED.user_id, merchants.user_id),
                business_name = EXCLUDED.business_name,
                contact_name = EXCLUDED.contact_name,
                phone = EXCLUDED.phone,
                bank_name = EXCLUDED.bank_name,
                account_number = EXCLUDED.account_number,
                branch_code = EXCLUDED.branch_code,
                status = EXCLUDED.status,
                charity_donation_amount = EXCLUDED.charity_donation_amount,
                registration_number = EXCLUDED.registration_number,
                tax_number = EXCLUDED.tax_number,
                physical_address = EXCLUDED.physical_address,
                business_type = EXCLUDED.business_type,
                account_holder_name = EXCLUDED.account_holder_name,
                onboarding_fee_paid = EXCLUDED.onboarding_fee_paid,
                approved_at = EXCLUDED.approved_at,
                updated_at = CURRENT_TIMESTAMP
            RETURNING 1
        )
        SELECT COUNT(*) FROM migrated
        $f$,
        v_user_id_expr,
        CASE
            WHEN v_has_business_name THEN 'COALESCE(NULLIF(TRIM(l.business_name), ''''), ''Legacy Merchant'')'
            WHEN v_has_name THEN 'COALESCE(NULLIF(TRIM(l.name), ''''), ''Legacy Merchant'')'
            ELSE '''Legacy Merchant'''
        END,
        CASE
            WHEN v_has_contact_name THEN 'COALESCE(NULLIF(TRIM(l.contact_name), ''''), ''Unknown'')'
            WHEN v_has_contact_person THEN 'COALESCE(NULLIF(TRIM(l.contact_person), ''''), ''Unknown'')'
            ELSE '''Unknown'''
        END,
        CASE WHEN v_has_email THEN 'NULLIF(TRIM(l.email), '''')' ELSE 'NULL' END,
        CASE WHEN v_has_phone THEN 'COALESCE(NULLIF(TRIM(l.phone), ''''), '''')' ELSE '''''' END,
        CASE WHEN v_has_bank_name THEN 'NULLIF(TRIM(l.bank_name), '''')' ELSE 'NULL' END,
        CASE WHEN v_has_account_number THEN 'NULLIF(TRIM(l.account_number), '''')' ELSE 'NULL' END,
        CASE WHEN v_has_branch_code THEN 'NULLIF(TRIM(l.branch_code), '''')' ELSE 'NULL' END,
        v_status_expr,
        CASE WHEN v_has_charity_donation_amount THEN 'COALESCE(l.charity_donation_amount, 0)' ELSE '0' END,
        CASE WHEN v_has_registration_number THEN 'NULLIF(TRIM(l.registration_number), '''')' ELSE 'NULL' END,
        CASE
            WHEN v_has_tax_number THEN 'NULLIF(TRIM(l.tax_number), '''')'
            WHEN v_has_vat_number THEN 'NULLIF(TRIM(l.vat_number), '''')'
            ELSE 'NULL'
        END,
        CASE
            WHEN v_has_physical_address THEN 'NULLIF(TRIM(l.physical_address), '''')'
            WHEN v_has_address THEN 'NULLIF(TRIM(l.address), '''')'
            ELSE 'NULL'
        END,
        CASE
            WHEN v_has_business_type THEN 'NULLIF(TRIM(l.business_type), '''')'
            WHEN v_has_category THEN 'NULLIF(TRIM(l.category), '''')'
            ELSE 'NULL'
        END,
        CASE WHEN v_has_account_holder_name THEN 'NULLIF(TRIM(l.account_holder_name), '''')' ELSE 'NULL' END,
        CASE WHEN v_has_onboarding_fee_paid THEN 'COALESCE(l.onboarding_fee_paid, false)' ELSE 'false' END,
        CASE WHEN v_has_approved_at THEN 'l.approved_at' ELSE 'NULL' END,
        CASE WHEN v_has_created_at THEN 'COALESCE(l.created_at, CURRENT_TIMESTAMP)' ELSE 'CURRENT_TIMESTAMP' END
    );

    EXECUTE v_sql INTO v_rows;

    INSERT INTO public.migration_logs (migration_name, migrated_rows)
    VALUES ('20260219120000_normalize_merchants_and_integrity', v_rows);
END;
$$;
