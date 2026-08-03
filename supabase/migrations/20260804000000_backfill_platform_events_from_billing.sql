-- =============================================================================
-- Backfill platform_events from existing billing_events
-- Covers purchases and redemptions that completed before the publisher was fixed.
-- Safe to run multiple times (ON CONFLICT DO NOTHING on event_id).
-- =============================================================================

insert into public.platform_events (
  event_id,
  event_type,
  source_system,
  correlation_id,
  merchant_id,
  customer_id,
  voucher_id,
  transaction_ref,
  amount,
  face_value,
  discount_pct,
  payload,
  status,
  processed_at,
  occurred_at,
  created_at
)
select
  -- Use billing_events.id as a stable deterministic event_id for backfill
  'backfill-' || be.id::text                                    as event_id,
  case
    when be.event_type = 'payment_transaction' then 'VOUCHER_PURCHASED'
    when be.event_type = 'voucher_redemption'  then 'VOUCHER_REDEEMED'
    else upper(be.event_type)
  end                                                           as event_type,
  'ws1'                                                         as source_system,
  be.event_key                                                  as correlation_id,
  be.merchant_id,
  be.customer_id,
  be.voucher_id,
  be.event_key                                                  as transaction_ref,
  be.gross_amount                                               as amount,
  be.gross_amount                                               as face_value,
  be.total_discount_pct                                         as discount_pct,
  coalesce(be.metadata, '{}'::jsonb)                            as payload,
  'processed'                                                   as status,
  be.occurred_at                                                as processed_at,
  be.occurred_at,
  be.created_at
from public.billing_events be
where be.event_type in ('payment_transaction', 'voucher_redemption')
on conflict (event_id) do nothing;
