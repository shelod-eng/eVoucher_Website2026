# Billing Engine E2E Real-Transaction Integration — Implementation Report

**Date:** 2026-08-23 · **Commits:** `f66d647`, `445abc4`, `6565f92` (main)

---

## A. Root Cause

Real website transactions were reaching most of the billing spine but the portal
showed nothing, and invoices never existed. Three independent breaks:

1. **Portal dead feed (why nothing displayed):** The Vercel project env var was
   set to `"portal "` (trailing space). It was baked into the deployed bundle as
   `g="portal ".toLowerCase()`, which matched neither `'portal'` nor `'mock'`,
   so every live-data query (`enabled: usePortalApi && session?.email`) was
   permanently disabled. Evidence: minified bundle contained
   `g="portal ".toLowerCase()`; backend API returned data fine via curl.
2. **Invoice stage break (first lifecycle break):**
   `recordVoucherPurchaseBillingEvent()` inserted `billing_invoices.customer_id`,
   a column that did not exist on the deployed table → PostgREST PGRST204 on
   EVERY invoice insert, silently swallowed → `billing_invoices` had 0 rows ever.
3. **DB trigger contract break:** the `enqueue_platform_event_outbox()` trigger
   on `billing_invoices` referenced non-existent columns (`total_amount`,
   `invoice_type`) → any insert that got past (2) still failed with
   `record "new" has no field "total_amount"`.
4. **Same-day invoice collisions:** `UNIQUE(merchant_id, period_start,
   period_end)` plus 12-char invoice-number prefixes silently dropped invoices
   for same-day purchases sharing prefixes.

## B. Changes Made

| File | Why |
|---|---|
| `billing-engine-portal/src/api/data-mode.js` (new) | Hardened resolver: trims whitespace, strips quotes, lowercases, defaults to portal |
| `billing-engine-portal/src/pages/{BillingEngine,AdminDashboard,AuditLog,BankServ,UserRoles,SettlementPayouts}.jsx`, `src/api/base44Client.js` | Use shared resolver; portal mode never falls back to mock; "No real billing records found" empty state; Overview transactions poll live (10s) |
| `src/server/services/billing/billing-events.ts` | Invoice insert retries without `customer_id` when the live schema lags (case-insensitive PGRST204 match); full-reference invoice numbers |
| `src/app/api/billing/invoices/route.ts` | Application-level period-invoice idempotency (replaces dropped DB constraint) |
| `supabase/migrations/20260823020000_fix_invoice_trigger_contract.sql` | Repairs outbox trigger column references |
| `supabase/migrations/20260823020000_billing_invoice_transaction_spine.sql` | Adds `customer_id`; replaces same-day UNIQUE with plain index |
| `scripts/backfill-missing-billing-invoices.mjs` (new) | Idempotent per-transaction invoice backfill (TRD v2.0 model) |
| `scripts/backfill-missing-billing-events.mjs` | Ran: backfilled 78 historical billing events + 234 ledger rows |
| `scripts/forensic-trace-golden.mjs` | Accepts any golden txn ref via CLI arg |
| `scripts/apply-migrations-via-mgmt.mjs` (new) | Applies SQL via Management API using CLI-stored token (env-only, never printed) |
| `tests/billing-events-recorder.test.ts` (new) | Propagation, idempotency, schema-gap fallback, validation |
| `tests/billing-data-mode.test.ts` (new) | Env-config hardening incl. exact `"portal "` regression case |
| `vitest.config.ts`, `tsconfig.vitest.json` | `@portal` alias; allowJs for tests |

## C. Database Changes (APPLIED to production)

1. `enqueue_platform_event_outbox()` recreated with valid column references.
2. `billing_invoices`: +`customer_id UUID` (+index); UNIQUE(merchant, period)
   replaced by plain index; source_id unique index retained.

## D. Transaction Spine — Golden Transaction

**Reference:** `TXN-1786958158916-C4127F5E5978` (R129.99 Pick n Pay, 2026-08-17)

```
payment_transactions        ✅
platform_events             ✅  (+outbox sent)
billing_events              ✅
billing_ledger_entries      ✅  3 postings (129.99 / 3.64 / 1.56)
merchant_payouts            ✅  net R124.17 pending
billing_invoices            ✅  INV-TXN-1786958158916-C4127F5E5978 approved
billing_settlements         ✅  R124.17 pending
bankserv_adaptor            ✅  status=ignored (no verified bank linkage — boundary)
audit_events                ✅  billing_event_created
reconciliation_exceptions   ✅  none
```

**Live E2E during verification:** purchase `TXN-1787450169271-DC8BAF98227B`
made on www.evoucher.co.za mid-session produced the identical complete spine
automatically — all 11 stages ✅.

Financial consistency checks (lifecycle API): payment_vs_billing OK,
payment_vs_ledger OK, payout_vs_invoice OK, invoice_vs_settlement OK;
settlement_vs_bankserv MISMATCH is the documented no-bank-linkage boundary.

## E. Portal

https://evoucher-billing-portal.vercel.app — new bundle verified live
(`index-CGx1SSvP.js`, hardened resolver present, broken literal gone).
Sign in with admin passcode → Overview KPIs, Recent Website Transactions,
Billing Events, Invoices (94), Settlements, Live Events all render real data;
Lifecycle search returns the full stage map above.

## F. Quality Gates

Lint ✅ (0 errors) · Type-check ✅ · Tests ✅ 65/65 · Root build ✅ · Portal build ✅
GitHub Actions ✅ (runs 32609797302, 32609993759 green; 6565f92 run completed post-report)
Vercel ✅ auto-deployed from main · Production E2E ✅ (live purchase traced)

## G. Remaining Gaps

- **IMPLEMENTED:** web purchase → full financial spine; portal live read-only
  dashboards; lifecycle search; idempotent recorder; backfills.
- **CONTROLLED MOCK/SANDBOX:** payment provider is mock_sandbox (external
  provider pending sponsor/legal approval) — labelled as such everywhere.
- **PENDING DEPENDENCY:** BankServ adaptor rows stay `ignored` until merchant
  bank linkages are verified; settlement_vs_bankserv check reports MISMATCH by design.
- **DOCUMENTED / FOLLOW-UP:** mobile app (EVoucherMobileExpo) uses its own local
  server — to track mobile purchases, publish VOUCHER_PURCHASED to
  `/api/billing/events` from its checkout-complete flow (separate repo task).
- **HOUSEKEEPING:** optionally correct the Vercel env value to `portal` without
  trailing space (non-blocking; resolver tolerates it).