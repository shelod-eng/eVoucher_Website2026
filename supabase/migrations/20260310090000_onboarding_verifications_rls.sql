-- RLS for merchant onboarding verification records

ALTER TABLE public.merchant_onboarding_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchant_verifications_select_own" ON public.merchant_onboarding_verifications;
CREATE POLICY "merchant_verifications_select_own"
ON public.merchant_onboarding_verifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = merchant_onboarding_verifications.merchant_id
      AND m.user_id::text = auth.uid()::text
  )
);
