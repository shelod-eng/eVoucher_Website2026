-- =============================================================================
-- Migration: Platform Event Automatic Database Triggers
-- Automatically enqueues 20 lifecycle events directly into platform_event_outbox.
-- Ignores VOUCHER_PURCHASED and VOUCHER_REDEEMED as they are explicitly published in Next.js.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enqueue_platform_event_outbox()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id TEXT;
  v_event_type TEXT;
  v_payload JSONB;
  v_merchant_id UUID;
  v_customer_id UUID;
  v_voucher_id UUID;
  v_transaction_ref TEXT;
  v_amount NUMERIC(15,2);
  v_face_value NUMERIC(15,2);
  v_discount_pct NUMERIC(6,4);
  v_occurred_at TIMESTAMPTZ;
BEGIN
  v_event_id := gen_random_uuid()::text;
  v_occurred_at := now();

  -- 1. Map tables to events and extract metadata
  IF TG_TABLE_NAME = 'user_profiles' THEN
    IF TG_OP = 'INSERT' AND NEW.role = 'customer' THEN
      v_event_type := 'CONSUMER_REGISTERED';
      v_customer_id := NEW.id;
      v_payload := jsonb_build_object('customer_id', NEW.id, 'full_name', NEW.full_name);
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'users' AND TG_TABLE_SCHEMA = 'auth' THEN
    IF TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
      v_event_type := 'CONSUMER_VERIFIED';
      v_customer_id := NEW.id;
      v_payload := jsonb_build_object('customer_id', NEW.id, 'email', NEW.email);
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'merchants' THEN
    IF TG_OP = 'INSERT' THEN
      v_event_type := 'MERCHANT_REGISTERED';
      v_merchant_id := NEW.id;
      v_payload := jsonb_build_object('merchant_id', NEW.id, 'business_name', NEW.business_name);
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        v_event_type := 'MERCHANT_APPROVED';
      ELSIF OLD.status != 'suspended' AND NEW.status = 'suspended' THEN
        v_event_type := 'MERCHANT_SUSPENDED';
      ELSE
        RETURN NEW;
      END IF;
      v_merchant_id := NEW.id;
      v_payload := jsonb_build_object('merchant_id', NEW.id, 'business_name', NEW.business_name, 'status', NEW.status);
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'customer_vouchers' THEN
    IF TG_OP = 'INSERT' THEN
      v_event_type := 'VOUCHER_CREATED';
      v_voucher_id := NEW.id;
      v_merchant_id := NEW.merchant_id;
      v_customer_id := NEW.customer_id;
      v_face_value := NEW.face_value;
      v_payload := jsonb_build_object('voucher_code', NEW.voucher_code, 'merchant_name', NEW.merchant_name);
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        v_event_type := 'VOUCHER_CANCELLED';
      ELSIF OLD.status != 'expired' AND NEW.status = 'expired' THEN
        v_event_type := 'VOUCHER_EXPIRED';
      ELSE
        RETURN NEW;
      END IF;
      v_voucher_id := NEW.id;
      v_merchant_id := NEW.merchant_id;
      v_customer_id := NEW.customer_id;
      v_face_value := NEW.face_value;
      v_payload := jsonb_build_object('voucher_code', NEW.voucher_code, 'status', NEW.status);
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'payment_transactions' THEN
    IF TG_OP = 'INSERT' AND NEW.payment_status = 'authorised' THEN
      v_event_type := 'PAYMENT_AUTHORISED';
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.payment_status != 'failed' AND NEW.payment_status = 'failed' THEN
        v_event_type := 'PAYMENT_FAILED';
      ELSIF OLD.payment_status != 'refunded' AND NEW.payment_status = 'refunded' THEN
        v_event_type := 'PAYMENT_REFUNDED';
      ELSE
        -- PAYMENT_CAPTURED / VOUCHER_PURCHASED is explicitly published by the API route.
        RETURN NEW;
      END IF;
    ELSE
      RETURN NEW;
    END IF;
    v_merchant_id := NEW.merchant_id;
    v_customer_id := NEW.customer_id;
    v_transaction_ref := NEW.transaction_reference;
    v_amount := NEW.amount;
    v_payload := jsonb_build_object('payment_method', NEW.payment_method, 'card_brand', NEW.card_brand);

  ELSIF TG_TABLE_NAME = 'wallet_transactions' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.type = 'cashback' THEN
        v_event_type := 'CASHBACK_CREDITED';
      ELSIF NEW.amount > 0 THEN
        v_event_type := 'WALLET_CREDITED';
      ELSE
        v_event_type := 'WALLET_DEBITED';
      END IF;
      v_customer_id := NEW.customer_id;
      v_amount := abs(NEW.amount);
      v_payload := jsonb_build_object('description', NEW.description, 'type', NEW.type);
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'bankserv_adaptor_transactions' THEN
    IF TG_OP = 'INSERT' AND NEW.status = 'queued' THEN
      v_event_type := 'SETTLEMENT_QUEUED';
      v_merchant_id := NEW.merchant_id;
      v_customer_id := NEW.customer_id;
      v_transaction_ref := NEW.transaction_reference;
      v_amount := NEW.settlement_amount;
      v_payload := jsonb_build_object('payment_method', NEW.payment_method);
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'billing_settlement_batches' THEN
    IF TG_OP = 'UPDATE' THEN
      IF OLD.status != 'submitted' AND NEW.status = 'submitted' THEN
        v_event_type := 'SETTLEMENT_SUBMITTED';
      ELSIF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
        v_event_type := 'SETTLEMENT_CONFIRMED';
      ELSIF OLD.status != 'failed' AND NEW.status = 'failed' THEN
        v_event_type := 'SETTLEMENT_FAILED';
      ELSE
        RETURN NEW;
      END IF;
      v_amount := NEW.total_amount;
      v_payload := jsonb_build_object('batch_number', NEW.batch_number);
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'billing_invoices' THEN
    IF TG_OP = 'INSERT' THEN
      v_event_type := 'INVOICE_GENERATED';
      v_merchant_id := NEW.merchant_id;
      v_amount := NEW.total_amount;
      v_payload := jsonb_build_object('invoice_number', NEW.invoice_number, 'invoice_type', NEW.invoice_type);
    ELSE
      RETURN NEW;
    END IF;

  ELSE
    RETURN NEW;
  END IF;

  -- 2. Insert into platform_events (with status = 'processing')
  INSERT INTO public.platform_events (
    event_id, event_type, source_system, correlation_id, merchant_id, customer_id, voucher_id, transaction_ref, amount, face_value, discount_pct, payload, status, occurred_at
  ) VALUES (
    v_event_id, v_event_type, 'ws1', v_transaction_ref, v_merchant_id, v_customer_id, v_voucher_id, v_transaction_ref, v_amount, v_face_value, v_discount_pct, coalesce(v_payload, '{}'::jsonb), 'processing', v_occurred_at
  ) ON CONFLICT (event_id) DO NOTHING;

  -- 3. Insert into platform_event_outbox
  INSERT INTO public.platform_event_outbox (
    event_id, payload, status
  ) VALUES (
    v_event_id,
    jsonb_build_object(
      'event_id', v_event_id,
      'event_type', v_event_type,
      'source_system', 'ws1',
      'correlation_id', v_transaction_ref,
      'merchant_id', v_merchant_id,
      'customer_id', v_customer_id,
      'voucher_id', v_voucher_id,
      'transaction_ref', v_transaction_ref,
      'amount', v_amount,
      'face_value', v_face_value,
      'discount_pct', v_discount_pct,
      'occurred_at', v_occurred_at,
      'data', coalesce(v_payload, '{}'::jsonb)
    ),
    'pending'
  ) ON CONFLICT (event_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Setup Triggers ───────────────────────────────────────────────────────────

-- User Profiles (Consumer Registered)
DROP TRIGGER IF EXISTS trg_on_user_profile_created ON public.user_profiles;
CREATE TRIGGER trg_on_user_profile_created
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_platform_event_outbox();

-- Auth Users (Consumer Verified)
DROP TRIGGER IF EXISTS trg_on_auth_user_verified ON auth.users;
CREATE TRIGGER trg_on_auth_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_platform_event_outbox();

-- Merchants (Registered, Approved, Suspended)
DROP TRIGGER IF EXISTS trg_on_merchant_change ON public.merchants;
CREATE TRIGGER trg_on_merchant_change
  AFTER INSERT OR UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_platform_event_outbox();

-- Customer Vouchers (Created, Cancelled, Expired)
DROP TRIGGER IF EXISTS trg_on_voucher_change ON public.customer_vouchers;
CREATE TRIGGER trg_on_voucher_change
  AFTER INSERT OR UPDATE ON public.customer_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_platform_event_outbox();

-- Payment Transactions (Authorised, Failed, Refunded)
DROP TRIGGER IF EXISTS trg_on_payment_change ON public.payment_transactions;
CREATE TRIGGER trg_on_payment_change
  AFTER INSERT OR UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_platform_event_outbox();

-- Wallet Transactions (Credited, Debited, Cashback)
DROP TRIGGER IF EXISTS trg_on_wallet_transaction ON public.wallet_transactions;
CREATE TRIGGER trg_on_wallet_transaction
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_platform_event_outbox();

-- BankServ adaptor transactions (Settlement Queued)
DROP TRIGGER IF EXISTS trg_on_bankserv_adaptor_transaction ON public.bankserv_adaptor_transactions;
CREATE TRIGGER trg_on_bankserv_adaptor_transaction
  AFTER INSERT ON public.bankserv_adaptor_transactions
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_platform_event_outbox();

-- Settlement batches (Submitted, Confirmed, Failed)
DROP TRIGGER IF EXISTS trg_on_settlement_batch_change ON public.billing_settlement_batches;
CREATE TRIGGER trg_on_settlement_batch_change
  AFTER UPDATE ON public.billing_settlement_batches
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_platform_event_outbox();

-- Invoices (Invoice Generated)
DROP TRIGGER IF EXISTS trg_on_invoice_created ON public.billing_invoices;
CREATE TRIGGER trg_on_invoice_created
  AFTER INSERT ON public.billing_invoices
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_platform_event_outbox();
