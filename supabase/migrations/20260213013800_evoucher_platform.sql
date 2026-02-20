-- eVoucher Platform Database Schema
-- Customer and Merchant Portal with Voucher Management

-- 1. Types
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('customer', 'merchant', 'admin');

DROP TYPE IF EXISTS public.merchant_status CASCADE;
CREATE TYPE public.merchant_status AS ENUM ('pending', 'approved', 'active', 'suspended');

DROP TYPE IF EXISTS public.transaction_type CASCADE;
CREATE TYPE public.transaction_type AS ENUM ('purchase', 'redemption', 'refund');

-- 2. Core Tables
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role public.user_role DEFAULT 'customer'::public.user_role,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    branch_code TEXT,
    status public.merchant_status DEFAULT 'pending'::public.merchant_status,
    onboarding_fee_paid BOOLEAN DEFAULT false,
    charity_donation_amount NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.customer_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    voucher_code TEXT NOT NULL UNIQUE,
    face_value NUMERIC(10,2) NOT NULL,
    discount_percent NUMERIC(5,2) NOT NULL,
    current_balance NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.redemption_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    voucher_id UUID REFERENCES public.customer_vouchers(id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    transaction_type public.transaction_type DEFAULT 'redemption'::public.transaction_type,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.merchant_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    payout_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON public.merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON public.merchants(status);
CREATE INDEX IF NOT EXISTS idx_customer_vouchers_customer_id ON public.customer_vouchers(customer_id);
CREATE INDEX IF NOT EXISTS idx_redemption_history_customer_id ON public.redemption_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payouts_merchant_id ON public.merchant_payouts(merchant_id);

-- 4. Functions (BEFORE RLS policies)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, phone, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer'::public.user_role)
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 5. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_payouts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;
CREATE POLICY "users_manage_own_profile"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "merchants_manage_own_data" ON public.merchants;
CREATE POLICY "merchants_manage_own_data"
ON public.merchants
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "merchants_insert_on_signup" ON public.merchants;
CREATE POLICY "merchants_insert_on_signup"
ON public.merchants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "customers_view_own_vouchers" ON public.customer_vouchers;
CREATE POLICY "customers_view_own_vouchers"
ON public.customer_vouchers
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "customers_view_own_history" ON public.redemption_history;
CREATE POLICY "customers_view_own_history"
ON public.redemption_history
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "merchants_view_own_payouts" ON public.merchant_payouts;
CREATE POLICY "merchants_view_own_payouts"
ON public.merchant_payouts
FOR SELECT
TO authenticated
USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- 7. Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- 8. Mock Data
-- Note: user_profiles are automatically created via trigger when users sign up through Supabase Auth
-- This section only creates sample data for existing authenticated users