-- =============================================================================
-- platform_events — canonical immutable event log for the eVoucher platform
-- Every completed action in WS1 writes here. Billing Engine subscribes via
-- Supabase Realtime. Never update or delete rows — use reversal events only.
-- =============================================================================

create table if not exists public.platform_events (
  id              uuid primary key default gen_random_uuid(),
  event_id        text unique not null,          -- UUID from WS1, globally unique
  event_type      text not null,                 -- e.g. VOUCHER_PURCHASED
  event_version   text not null default '1.0',
  source_system   text not null default 'ws1',
  correlation_id  text,                          -- links related events
  merchant_id     uuid,
  customer_id     uuid,
  voucher_id      uuid,
  transaction_ref text,
  amount          numeric(15,2),
  face_value      numeric(15,2),
  discount_pct    numeric(6,4),
  currency        text not null default 'ZAR',
  payload         jsonb not null default '{}',
  status          text not null default 'received',  -- received|processed|failed
  processed_at    timestamptz,
  error_message   text,
  occurred_at     timestamptz not null,
  created_at      timestamptz not null default now()
);

-- Indexes for common query patterns
create index if not exists idx_platform_events_event_type  on public.platform_events (event_type);
create index if not exists idx_platform_events_merchant_id on public.platform_events (merchant_id);
create index if not exists idx_platform_events_customer_id on public.platform_events (customer_id);
create index if not exists idx_platform_events_occurred_at on public.platform_events (occurred_at desc);
create index if not exists idx_platform_events_status      on public.platform_events (status);

-- RLS: service role can write; anon/authenticated can read (portal uses service role anyway)
alter table public.platform_events enable row level security;

create policy "service role full access" on public.platform_events
  for all using (auth.role() = 'service_role');

create policy "authenticated read" on public.platform_events
  for select using (auth.role() = 'authenticated');

-- Enable Supabase Realtime on this table
alter publication supabase_realtime add table public.platform_events;
