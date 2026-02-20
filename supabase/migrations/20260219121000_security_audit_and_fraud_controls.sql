-- Security, compliance, and fraud control scaffolding.

-- 1) Auditability
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    actor_role TEXT,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    action TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id ON public.audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity_type ON public.audit_events(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON public.audit_events(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_events_request_id_unique
ON public.audit_events(request_id)
WHERE request_id IS NOT NULL;

-- 2) Fraud controls
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    related_entity_type TEXT NOT NULL,
    related_entity_id TEXT,
    risk_score NUMERIC(5,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    rule_hit TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'dismissed', 'resolved')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    escalated_to UUID,
    escalated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON public.fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_risk_score ON public.fraud_alerts(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_actor_id ON public.fraud_alerts(actor_id);

-- 3) KYC/KYB scaffolding
CREATE TABLE IF NOT EXISTS public.merchant_kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (verification_status IN ('submitted', 'under_review', 'approved', 'rejected')),
    uploaded_by UUID,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_merchant_kyc_documents_merchant_id
ON public.merchant_kyc_documents(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_kyc_documents_status
ON public.merchant_kyc_documents(verification_status);

CREATE TABLE IF NOT EXISTS public.merchant_kyc_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    review_status TEXT NOT NULL CHECK (review_status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merchant_kyc_reviews_merchant_id
ON public.merchant_kyc_reviews(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_kyc_reviews_status
ON public.merchant_kyc_reviews(review_status);

-- 4) Redemption idempotency and anti-replay tracking
CREATE TABLE IF NOT EXISTS public.voucher_redemption_idempotency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    voucher_id UUID REFERENCES public.customer_vouchers(id) ON DELETE SET NULL,
    idempotency_key TEXT NOT NULL,
    request_hash TEXT,
    response_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_voucher_redemption_idempotency_customer_key
ON public.voucher_redemption_idempotency(customer_id, idempotency_key);

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    provider_event_id TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_webhook_events_provider_event
ON public.payment_webhook_events(provider, provider_event_id);

-- 5) Merchant status transition enforcement (KYC gate)
CREATE OR REPLACE FUNCTION public.enforce_merchant_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_approved_reviews INTEGER := 0;
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status IN ('approved', 'active') THEN
        SELECT COUNT(*) INTO v_approved_reviews
        FROM public.merchant_kyc_reviews
        WHERE merchant_id = NEW.id
          AND review_status = 'approved';

        IF v_approved_reviews = 0 THEN
            RAISE EXCEPTION 'Merchant cannot be moved to % without approved KYC review', NEW.status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_merchant_status_transition_trigger ON public.merchants;
CREATE TRIGGER enforce_merchant_status_transition_trigger
BEFORE UPDATE OF status ON public.merchants
FOR EACH ROW
EXECUTE FUNCTION public.enforce_merchant_status_transition();

-- 6) Update timestamps
DROP TRIGGER IF EXISTS update_fraud_alerts_updated_at ON public.fraud_alerts;
CREATE TRIGGER update_fraud_alerts_updated_at
BEFORE UPDATE ON public.fraud_alerts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_merchant_kyc_reviews_updated_at ON public.merchant_kyc_reviews;
CREATE TRIGGER update_merchant_kyc_reviews_updated_at
BEFORE UPDATE ON public.merchant_kyc_reviews
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 7) RLS
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_kyc_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_redemption_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_audit_events" ON public.audit_events;
CREATE POLICY "users_view_own_audit_events"
ON public.audit_events
FOR SELECT
TO authenticated
USING (actor_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own_audit_events" ON public.audit_events;
CREATE POLICY "users_insert_own_audit_events"
ON public.audit_events
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own_fraud_alerts" ON public.fraud_alerts;
CREATE POLICY "users_insert_own_fraud_alerts"
ON public.fraud_alerts
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS "users_view_own_fraud_alerts" ON public.fraud_alerts;
CREATE POLICY "users_view_own_fraud_alerts"
ON public.fraud_alerts
FOR SELECT
TO authenticated
USING (actor_id = auth.uid());

DROP POLICY IF EXISTS "merchants_manage_own_kyc_documents" ON public.merchant_kyc_documents;
CREATE POLICY "merchants_manage_own_kyc_documents"
ON public.merchant_kyc_documents
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.merchants
        WHERE merchants.id = merchant_kyc_documents.merchant_id
          AND merchants.user_id::text = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.merchants
        WHERE merchants.id = merchant_kyc_documents.merchant_id
          AND merchants.user_id::text = auth.uid()::text
    )
);

DROP POLICY IF EXISTS "merchants_view_own_kyc_reviews" ON public.merchant_kyc_reviews;
CREATE POLICY "merchants_view_own_kyc_reviews"
ON public.merchant_kyc_reviews
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.merchants
        WHERE merchants.id = merchant_kyc_reviews.merchant_id
          AND merchants.user_id::text = auth.uid()::text
    )
);

DROP POLICY IF EXISTS "customers_manage_own_redemption_idempotency" ON public.voucher_redemption_idempotency;
CREATE POLICY "customers_manage_own_redemption_idempotency"
ON public.voucher_redemption_idempotency
FOR ALL
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());
