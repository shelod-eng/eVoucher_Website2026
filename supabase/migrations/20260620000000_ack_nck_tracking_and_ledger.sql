-- ACK/NCK tracking and ledger accuracy verification
-- Date: 2026-06-20

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) ACK/NCK tracking table for retry logic with exponential backoff
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.bankserv_ack_nck_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('batch', 'transaction', 'file')),
  entity_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('acked', 'nacked', 'pending', 'retrying', 'failed', 'escalated')),
  attempt_count INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  ack_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ack_nck_tracking_status
  ON public.bankserv_ack_nck_tracking(status);
CREATE INDEX IF NOT EXISTS idx_ack_nck_tracking_next_retry
  ON public.bankserv_ack_nck_tracking(next_retry_at)
  WHERE status IN ('pending', 'retrying');
CREATE INDEX IF NOT EXISTS idx_ack_nck_tracking_entity
  ON public.bankserv_ack_nck_tracking(entity_type, entity_id);

ALTER TABLE public.bankserv_ack_nck_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_ack_nck_tracking" ON public.bankserv_ack_nck_tracking;
CREATE POLICY "portal_read_ack_nck_tracking"
ON public.bankserv_ack_nck_tracking
FOR SELECT
TO authenticated
USING (public.is_portal_user());

DROP POLICY IF EXISTS "portal_manage_ack_nck_tracking" ON public.bankserv_ack_nck_tracking;
CREATE POLICY "portal_manage_ack_nck_tracking"
ON public.bankserv_ack_nck_tracking
FOR ALL
TO authenticated
USING (public.is_portal_user())
WITH CHECK (public.is_portal_user());

-- ---------------------------------------------------------------------------
-- 2) Ledger accuracy verification table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ledger_verification_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL CHECK (check_type IN (
    'revenue_split',
    'merchant_settlement',
    'consumer_benefit',
    'platform_revenue',
    'total_reconciliation'
  )),
  voucher_face_value NUMERIC(12,2) NOT NULL,
  expected_merchant_payout NUMERIC(12,2) NOT NULL,
  expected_consumer_benefit NUMERIC(12,2) NOT NULL,
  expected_platform_revenue NUMERIC(12,2) NOT NULL,
  expected_bank_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_merchant_payout NUMERIC(12,2),
  actual_consumer_benefit NUMERIC(12,2),
  actual_platform_revenue NUMERIC(12,2),
  actual_bank_fee NUMERIC(12,2) DEFAULT 0,
  discrepancy_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'passed'
    CHECK (status IN ('passed', 'failed', 'pending', 'excluded')),
  notes TEXT,
  checked_by TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_verification_checks_status
  ON public.ledger_verification_checks(status);
CREATE INDEX IF NOT EXISTS idx_ledger_verification_checks_type
  ON public.ledger_verification_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_ledger_verification_checks_face_value
  ON public.ledger_verification_checks(voucher_face_value);

ALTER TABLE public.ledger_verification_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_ledger_verification" ON public.ledger_verification_checks;
CREATE POLICY "portal_read_ledger_verification"
ON public.ledger_verification_checks
FOR SELECT
TO authenticated
USING (public.is_portal_user());

-- ---------------------------------------------------------------------------
-- 3) Monitoring alerts configuration
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'settlement_failure',
    'batch_nack',
    'ledger_discrepancy',
    'invoice_failure',
    'reconciliation_breach',
    'api_latency',
    'system_error'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  slack_notified BOOLEAN NOT NULL DEFAULT FALSE,
  email_notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status
  ON public.monitoring_alerts(status);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity
  ON public.monitoring_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_created_at
  ON public.monitoring_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_type_status
  ON public.monitoring_alerts(alert_type, status);

ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_monitoring_alerts" ON public.monitoring_alerts;
CREATE POLICY "portal_read_monitoring_alerts"
ON public.monitoring_alerts
FOR SELECT
TO authenticated
USING (public.is_portal_user());

DROP POLICY IF EXISTS "portal_manage_monitoring_alerts" ON public.monitoring_alerts;
CREATE POLICY "portal_manage_monitoring_alerts"
ON public.monitoring_alerts
FOR ALL
TO authenticated
USING (public.is_portal_user())
WITH CHECK (public.is_portal_user());

-- ---------------------------------------------------------------------------
-- 4) Error classification registry for structured error metadata
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.error_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN (
    'validation',
    'authentication',
    'authorization',
    'not_found',
    'conflict',
    'rate_limit',
    'integration',
    'internal',
    'timeout',
    'bankserv',
    'payment',
    'settlement'
  )),
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  title TEXT NOT NULL,
  message_template TEXT NOT NULL,
  http_status INT NOT NULL DEFAULT 400,
  resolution_hint TEXT,
  retryable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.error_classifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_error_classifications" ON public.error_classifications;
CREATE POLICY "portal_read_error_classifications"
ON public.error_classifications
FOR SELECT
TO authenticated
USING (public.is_portal_user());

-- Seed standard error classifications
INSERT INTO public.error_classifications (error_code, category, severity, title, message_template, http_status, resolution_hint, retryable) VALUES
  ('BATCH_NOT_FOUND', 'not_found', 'medium', 'Batch Not Found', 'Settlement batch with ID {batchId} was not found.', 404, 'Verify the batch ID and try again.', FALSE),
  ('BATCH_INVALID_STATE', 'validation', 'high', 'Invalid Batch State', 'Batch {batchId} is in state {state} and cannot be transitioned.', 400, 'Ensure the batch is in the correct state for this operation.', FALSE),
  ('BATCH_VALIDATION_FAILED', 'validation', 'high', 'Batch Validation Failed', 'Batch {batchId} failed validation: {reason}.', 400, 'Check batch contents and resolve the validation errors.', FALSE),
  ('SETTLEMENT_REJECTED', 'bankserv', 'critical', 'Settlement Rejected', 'Settlement {settlementId} was rejected by BankServ: {reason}.', 500, 'Review the rejection reason from the ACK/NCK log and resubmit.', TRUE),
  ('ACK_NACK_TIMEOUT', 'timeout', 'high', 'ACK/NCK Timeout', 'ACK/NCK for {entityType} {entityId} timed out after {attempts} attempts.', 408, 'Check BankServ connectivity and retry manually if needed.', TRUE),
  ('LEDGER_DISCREPANCY', 'settlement', 'critical', 'Ledger Discrepancy', 'Ledger verification failed for {checkType}: expected {expected}, actual {actual}, difference {discrepancy}.', 500, 'Investigate the mismatch between expected and actual ledger values.', FALSE),
  ('INVOICE_GENERATION_FAILED', 'internal', 'high', 'Invoice Generation Failed', 'Failed to generate invoice for merchant {merchantId}: {reason}.', 500, 'Check the invoice generation service and retry.', TRUE),
  ('RECONCILIATION_BREACH', 'settlement', 'high', 'Reconciliation Breach', 'Reconciliation discrepancy of R{amount} exceeds threshold of R{threshold} for {entityType} {entityId}.', 500, 'Review the reconciliation details and resolve the discrepancy.', FALSE),
  ('API_RATE_LIMITED', 'rate_limit', 'medium', 'API Rate Limited', 'Rate limit exceeded for {clientId}. Retry after {retryAfter} seconds.', 429, 'Reduce request rate and respect Retry-After header.', FALSE),
  ('INVALID_MERCHANT_LINKAGE', 'validation', 'high', 'Invalid Merchant Bank Linkage', 'Merchant {merchantId} has no active verified bank linkage.', 400, 'Merchant must complete bank account verification before settlement.', FALSE),
  ('PAYMENT_RAIL_UNSUPPORTED', 'integration', 'medium', 'Unsupported Payment Rail', 'Payment rail {rail} is not supported for BankServ settlement.', 400, 'Use a supported payment rail (EFT, CARD).', FALSE)
ON CONFLICT (error_code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5) API linkage registry for OpenAPI-spec awareness
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.api_endpoint_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  path TEXT NOT NULL,
  description TEXT,
  auth_required BOOLEAN NOT NULL DEFAULT TRUE,
  required_roles TEXT[] DEFAULT '{}',
  rate_limit_per_min INT DEFAULT 60,
  deprecated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (method, path)
);

ALTER TABLE public.api_endpoint_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_read_api_endpoint_registry" ON public.api_endpoint_registry;
CREATE POLICY "portal_read_api_endpoint_registry"
ON public.api_endpoint_registry
FOR SELECT
TO authenticated
USING (public.is_portal_user());

-- Seed API endpoint registry
INSERT INTO public.api_endpoint_registry (method, path, description, auth_required, required_roles, rate_limit_per_min) VALUES
  ('GET',    '/api/v1/admin/settlements/batches',                    'List settlement batches',                        TRUE,  ARRAY['admin','finance_approver','auditor'], 60),
  ('POST',   '/api/v1/admin/settlements/batches',                    'Create a new settlement batch',                  TRUE,  ARRAY['admin','finance_approver'],           30),
  ('POST',   '/api/v1/admin/settlements/batches/{id}/approve',       'Approve a settlement batch',                     TRUE,  ARRAY['admin','finance_approver'],           10),
  ('POST',   '/api/v1/admin/settlements/batches/{id}/submit',        'Submit a batch to BankServ',                     TRUE,  ARRAY['admin'],                              10),
  ('POST',   '/api/v1/admin/settlements/batches/{id}/confirm',       'Confirm batch settlement',                       TRUE,  ARRAY['admin','finance_approver'],           10),
  ('POST',   '/api/v1/admin/settlements/batches/{id}/export',        'Export batch as BankServ file',                  TRUE,  ARRAY['admin','finance_approver'],           20),
  ('GET',    '/api/v1/admin/settlements/batches/{id}/ack-nck',       'Get ACK/NCK status for a batch',                 TRUE,  ARRAY['admin','finance_approver','auditor'], 30),
  ('POST',   '/api/v1/admin/settlements/batches/{id}/ack-nck/retry', 'Retry ACK/NCK processing for a batch',           TRUE,  ARRAY['admin'],                              10),
  ('GET',    '/api/v1/admin/ledger/verify',                          'Run ledger accuracy verification',               TRUE,  ARRAY['admin','auditor'],                    10),
  ('GET',    '/api/v1/admin/monitoring/alerts',                      'List monitoring alerts',                         TRUE,  ARRAY['admin','finance_approver','auditor'], 30),
  ('POST',   '/api/v1/admin/monitoring/alerts/{id}/acknowledge',     'Acknowledge a monitoring alert',                 TRUE,  ARRAY['admin'],                              10),
  ('POST',   '/api/v1/admin/monitoring/alerts/{id}/resolve',         'Resolve a monitoring alert',                     TRUE,  ARRAY['admin'],                              10),
  ('GET',    '/api/v1/admin/errors/classifications',                 'List error classifications',                     FALSE, ARRAY[]::TEXT[],                              120),
  ('GET',    '/api/v1/admin/api/endpoints',                          'List registered API endpoints',                  FALSE, ARRAY[]::TEXT[],                              60),
  ('GET',    '/api/billing/bankserv/status',                         'Get BankServ adaptor status overview',           TRUE,  ARRAY['admin','finance_approver','auditor'], 20),
  ('POST',   '/api/billing/bankserv/ack-nck/process',                'Process all due ACK/NCK records',                TRUE,  ARRAY['admin'],                              20)
ON CONFLICT (method, path) DO NOTHING;
