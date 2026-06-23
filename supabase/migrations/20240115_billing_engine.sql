-- ============================================================================
-- BILLING ENGINE TABLES - eVoucher Platform
-- Implements complete transaction lifecycle with BankServ integration
-- ============================================================================

-- ============================================================================
-- 1. TRANSACTIONS TABLE - Master transaction ledger with full pricing breakdown
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference TEXT UNIQUE NOT NULL,
  
  -- Parties
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Voucher
  voucher_code TEXT,
  voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
  
  -- Pricing Breakdown (IMMUTABLE 50/50 split)
  face_value DECIMAL(10,2) NOT NULL,
  total_discount_pct DECIMAL(5,2) NOT NULL,
  total_discount_amount DECIMAL(10,2) NOT NULL,
  consumer_savings_pct DECIMAL(5,2) NOT NULL,
  consumer_savings_amount DECIMAL(10,2) NOT NULL,
  platform_fee_pct DECIMAL(5,2) NOT NULL,
  platform_fee_amount DECIMAL(10,2) NOT NULL,
  consumer_paid_amount DECIMAL(10,2) NOT NULL,
  merchant_receivable_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment Details
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'cash_voucher', 'ussd', 'airtime', 'wallet', 
    'visa_secure', 'debit_credit', 'payfast', 'eft'
  )),
  payment_provider TEXT,
  payment_provider_reference TEXT,
  card_last_four TEXT,
  card_brand TEXT,
  
  -- PASA Compliance (5-year retention)
  pasa_email TEXT NOT NULL,
  pasa_phone TEXT NOT NULL,
  pasa_consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  popia_consent_version TEXT DEFAULT 'v1.0',
  ip_address INET,
  user_agent TEXT,
  
  -- BankServ Integration
  bankserv_ack_status TEXT DEFAULT 'PENDING' CHECK (bankserv_ack_status IN ('PENDING', 'ACK', 'NCK', 'RETRY')),
  bankserv_reference TEXT,
  bankserv_batch_id TEXT,
  bankserv_ack_timestamp TIMESTAMPTZ,
  bankserv_nck_reason TEXT,
  
  -- Settlement
  settlement_status TEXT DEFAULT 'queued' CHECK (settlement_status IN ('queued', 'processing', 'paid', 'failed')),
  settlement_date DATE,
  settlement_batch_id TEXT,
  
  -- Status & Timestamps
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- PASA 5-year retention
  retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 years'),
  
  -- Indexes for performance
  CONSTRAINT fk_merchant FOREIGN KEY (merchant_id) REFERENCES user_profiles(id)
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_settlement_status ON transactions(settlement_status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_settlement_date ON transactions(settlement_date);
CREATE INDEX idx_transactions_bankserv_ack ON transactions(bankserv_ack_status);
CREATE INDEX idx_transactions_reference ON transactions(transaction_reference);

COMMENT ON TABLE transactions IS 'Master transaction ledger with full pricing breakdown and BankServ integration';

-- ============================================================================
-- 2. MERCHANT_LEDGER TABLE - Merchant-side accounting
-- ============================================================================
CREATE TABLE IF NOT EXISTS merchant_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  
  -- Amounts
  credit_amount DECIMAL(10,2) NOT NULL, -- merchant_receivable_amount
  settlement_amount DECIMAL(10,2), -- Actual amount settled (may differ due to adjustments)
  
  -- Settlement tracking
  settlement_status TEXT DEFAULT 'queued' CHECK (settlement_status IN ('queued', 'processing', 'paid', 'failed', 'disputed')),
  settlement_date DATE,
  settlement_batch_id TEXT,
  bankserv_reference TEXT,
  
  -- Reconciliation
  reconciled BOOLEAN DEFAULT FALSE,
  reconciled_at TIMESTAMPTZ,
  reconciliation_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(transaction_id)
);

CREATE INDEX idx_merchant_ledger_merchant_id ON merchant_ledger(merchant_id);
CREATE INDEX idx_merchant_ledger_settlement_status ON merchant_ledger(settlement_status);
CREATE INDEX idx_merchant_ledger_settlement_date ON merchant_ledger(settlement_date);
CREATE INDEX idx_merchant_ledger_reconciled ON merchant_ledger(reconciled);

COMMENT ON TABLE merchant_ledger IS 'Merchant-side ledger for payouts and reconciliation';

-- ============================================================================
-- 3. PLATFORM_REVENUE TABLE - Platform fee tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  
  -- Revenue amounts
  platform_fee_amount DECIMAL(10,2) NOT NULL,
  merchant_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Recognition
  recognized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revenue_month DATE NOT NULL, -- For monthly aggregation
  
  -- Payment method (for cost analysis)
  payment_method TEXT NOT NULL,
  payment_processing_cost DECIMAL(10,2) DEFAULT 0.00, -- Gateway fees
  net_revenue DECIMAL(10,2) NOT NULL, -- platform_fee_amount - processing_cost
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(transaction_id)
);

CREATE INDEX idx_platform_revenue_merchant_id ON platform_revenue(merchant_id);
CREATE INDEX idx_platform_revenue_revenue_month ON platform_revenue(revenue_month);
CREATE INDEX idx_platform_revenue_recognized_at ON platform_revenue(recognized_at DESC);

COMMENT ON TABLE platform_revenue IS 'Platform fee revenue tracking and cost analysis';

-- ============================================================================
-- 4. PASA_AUDIT_LOG TABLE - Compliance audit trail (5-year retention)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pasa_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  
  -- PASA Required Fields
  pasa_email TEXT NOT NULL,
  pasa_phone TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  
  -- User Context
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  ip_address INET NOT NULL,
  user_agent TEXT,
  
  -- POPIA Compliance
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  popia_consent_version TEXT DEFAULT 'v1.0',
  consent_source TEXT DEFAULT 'registration', -- 'registration' | 'checkout'
  
  -- Transaction Context
  transaction_amount DECIMAL(10,2) NOT NULL,
  merchant_name TEXT NOT NULL,
  
  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 years'),
  
  -- Prevent deletion before retention period
  CONSTRAINT prevent_early_deletion CHECK (retention_until > NOW())
);

CREATE INDEX idx_pasa_audit_transaction_id ON pasa_audit_log(transaction_id);
CREATE INDEX idx_pasa_audit_user_id ON pasa_audit_log(user_id);
CREATE INDEX idx_pasa_audit_created_at ON pasa_audit_log(created_at DESC);
CREATE INDEX idx_pasa_audit_retention_until ON pasa_audit_log(retention_until);

COMMENT ON TABLE pasa_audit_log IS 'PASA compliance audit trail with 5-year retention policy';

-- ============================================================================
-- 5. SETTLEMENT_BATCHES TABLE - Daily/weekly merchant payout batches
-- ============================================================================
CREATE TABLE IF NOT EXISTS settlement_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_reference TEXT UNIQUE NOT NULL,
  
  -- Batch details
  settlement_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  transaction_count INTEGER NOT NULL,
  merchant_count INTEGER NOT NULL,
  
  -- BankServ integration
  bankserv_batch_id TEXT,
  bankserv_file_path TEXT,
  bankserv_status TEXT DEFAULT 'pending' CHECK (bankserv_status IN ('pending', 'submitted', 'ack', 'nck', 'completed')),
  bankserv_submitted_at TIMESTAMPTZ,
  bankserv_ack_timestamp TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'processing', 'completed', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

CREATE INDEX idx_settlement_batches_settlement_date ON settlement_batches(settlement_date DESC);
CREATE INDEX idx_settlement_batches_status ON settlement_batches(status);
CREATE INDEX idx_settlement_batches_bankserv_status ON settlement_batches(bankserv_status);

COMMENT ON TABLE settlement_batches IS 'Daily/weekly merchant payout batches for BankServ submission';

-- ============================================================================
-- 6. SETTLEMENT_BATCH_ITEMS TABLE - Individual merchant payouts in batch
-- ============================================================================
CREATE TABLE IF NOT EXISTS settlement_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES settlement_batches(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  
  -- Payout details
  merchant_account_number TEXT NOT NULL,
  merchant_bank_code TEXT NOT NULL,
  merchant_account_type TEXT DEFAULT 'cheque',
  payout_amount DECIMAL(10,2) NOT NULL,
  transaction_count INTEGER NOT NULL,
  
  -- Reference
  payout_reference TEXT NOT NULL,
  voucher_codes TEXT[], -- Array of voucher codes included
  
  -- Status
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'paid', 'failed', 'bounced')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  
  UNIQUE(batch_id, merchant_id)
);

CREATE INDEX idx_settlement_batch_items_batch_id ON settlement_batch_items(batch_id);
CREATE INDEX idx_settlement_batch_items_merchant_id ON settlement_batch_items(merchant_id);
CREATE INDEX idx_settlement_batch_items_status ON settlement_batch_items(status);

COMMENT ON TABLE settlement_batch_items IS 'Individual merchant payouts within settlement batches';

-- ============================================================================
-- 7. BANKSERV_RESPONSES TABLE - ACK/NCK response tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS bankserv_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES settlement_batches(id) ON DELETE SET NULL,
  bankserv_reference TEXT NOT NULL,
  
  -- Response type
  response_type TEXT NOT NULL CHECK (response_type IN ('ACK', 'NCK')),
  response_code TEXT,
  response_message TEXT,
  
  -- Raw data
  raw_response JSONB,
  
  -- Timestamps
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_bankserv_responses_transaction_id ON bankserv_responses(transaction_id);
CREATE INDEX idx_bankserv_responses_batch_id ON bankserv_responses(batch_id);
CREATE INDEX idx_bankserv_responses_received_at ON bankserv_responses(received_at DESC);
CREATE INDEX idx_bankserv_responses_processed ON bankserv_responses(processed);

COMMENT ON TABLE bankserv_responses IS 'BankServ ACK/NCK response tracking and processing';

-- ============================================================================
-- TRIGGERS - Auto-update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_ledger_updated_at BEFORE UPDATE ON merchant_ledger
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE pasa_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bankserv_responses ENABLE ROW LEVEL SECURITY;

-- Consumers can see their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Merchants can see transactions for their business
CREATE POLICY "Merchants can view their transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'merchant'
      AND id = transactions.merchant_id
    )
  );

-- Merchants can view their ledger
CREATE POLICY "Merchants can view own ledger" ON merchant_ledger
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'merchant'
      AND id = merchant_ledger.merchant_id
    )
  );

-- Admin full access to all billing tables
CREATE POLICY "Admin full access transactions" ON transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access merchant_ledger" ON merchant_ledger
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access platform_revenue" ON platform_revenue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access pasa_audit_log" ON pasa_audit_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access settlement_batches" ON settlement_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access settlement_batch_items" ON settlement_batch_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access bankserv_responses" ON bankserv_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

COMMENT ON SCHEMA public IS 'eVoucher Billing Engine - Complete transaction lifecycle with BankServ integration';
