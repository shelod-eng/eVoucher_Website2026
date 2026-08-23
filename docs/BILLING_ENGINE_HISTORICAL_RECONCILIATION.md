# 🔄 Billing Engine — Historical Report Reconciliation

**Date:** 2026-08-08  
**Baseline:** `BILLING_ENGINE_SYNC_REPORT.md` (Amazon Q-generated, dated 2026-01-XX)  
**Status:** ✅ RECONCILIATION COMPLETE — Current source code verified  
**Scope:** Reconcile every major claim in the historical report against the CURRENT source code. No code modified.

---

## 1. Executive Summary

The historical Amazon Q report described a billing synchronisation architecture where:

```
Consumer Checkout
  → /api/v1/vouchers/purchase
  → createBillingEvent()          ← OLD PATH
  → queueBankservSettlementTransaction()
  → Supabase tables
  → Billing Engine Portal APIs
```

**The current source code has SUPERSEDED this architecture.** The purchase flow now uses a **platform-event publisher** (`publishPlatformEvent()`) that writes to `platform_events` + `platform_event_outbox` and routes into the billing ledger via `recordVoucherPurchaseBillingEvent()`. The old `createBillingEvent()` helper is **orphaned** (0 imports).

**Key reconciliation outcomes:**

| Historical Claim | Status |
|---|---|
| Purchase flow uses `createBillingEvent()` | ❌ **SUPERSEDED** — now `publishPlatformEvent()` |
| Billing events written successfully | ✅ **STILL TRUE** — via `recordVoucherPurchaseBillingEvent()` |
| Portal reads `billing_events` | ⚠️ **PARTIALLY TRUE** — portal reads `platform_events` via Realtime + `billing_events` via API |
| Dashboard calculates real totals | ✅ **STILL TRUE** — `/api/billing/dashboard` |
| Settlement records visible | ✅ **STILL TRUE** — `billing_settlements` + `bankserv_adaptor_transactions` |
| BankServ ACK/NCK propagated | ⚠️ **PARTIALLY TRUE** — ACK/NCK tracking exists but not auto-linked to payout gating |
| Portal env config is the primary problem | ⚠️ **PARTIALLY TRUE** — still points to production URL, but Realtime bypasses it |
| CORS is required | ⚠️ **PARTIALLY TRUE** — per-route CORS exists, not global middleware |
| Portal auth headers are sufficient | ✅ **STILL TRUE** — `X-Portal-*` headers validated by `portal-guard.ts` |
| Portal receives real-time data | ✅ **STILL TRUE** — Supabase Realtime subscription on `platform_events` |

---

## 2. Historical Finding-by-Finding Reconciliation

### 2.1 "Purchase flow: Consumer Checkout → purchase route → createBillingEvent() → bankserv settlement → database → Portal APIs"

**Historical Finding:** The purchase route calls `createBillingEvent()`.

**Current Source-Code Evidence:**
- `src/app/api/v1/vouchers/purchase/route.ts` (line 683) calls **`publishPlatformEvent({ eventType: 'VOUCHER_PURCHASED', ... })`** — NOT `createBillingEvent()`.
- `src/lib/platform-events.ts` (line 176) `publishPlatformEvent()` writes `platform_events` + `platform_event_outbox`, then routes to `recordVoucherPurchaseBillingEvent()` (line 263).
- `src/lib/billing/billing-event-recorder.ts` (line 25) `createBillingEvent()` exists but has **0 imports** anywhere in the project.

**Status:** ❌ **SUPERSEDED BY NEWER ARCHITECTURE**

**Source Files:**
- `src/app/api/v1/vouchers/purchase/route.ts`
- `src/lib/platform-events.ts`
- `src/lib/billing/billing-event-recorder.ts` (orphaned)

**Current Architecture:**
```
Consumer Checkout
  → /api/v1/vouchers/purchase (POST)
  → publishPlatformEvent('VOUCHER_PURCHASED')
      → platform_events (immutable log)
      → platform_event_outbox (guaranteed delivery)
      → recordVoucherPurchaseBillingEvent()
          → billing_events
          → billing_ledger_entries
          → merchant_payouts
          → billing_settlements
          → billing_invoices
          → audit_events
  → queueBankservSettlementTransaction()
      → bankserv_adaptor_transactions
```

**Difference From Historical Architecture:** The single `createBillingEvent()` call was replaced by a two-phase platform-event publisher + outbox + billing ledger chain.

**Risk:** LOW — the new path is more robust (idempotent, outbox-backed). The orphaned `billing-event-recorder.ts` is dead code.

**Required Action:** None for correctness. Optionally remove the orphaned `billing-event-recorder.ts` in a future cleanup.

---

### 2.2 "Billing events are written successfully"

**Historical Finding:** `createBillingEvent()` successfully writes to `billing_events`.

**Current Source-Code Evidence:**
- `src/server/services/billing/billing-events.ts` (line 203) `recordVoucherPurchaseBillingEvent()` writes `billing_events` with idempotency via `event_key` (line 226-272).
- Called from `publishPlatformEvent()` (line 263), `purchase-completion.ts` (line 161), and `webhook/route.ts` (line 164).

**Status:** ✅ **STILL TRUE** (mechanism changed, outcome preserved)

**Source Files:**
- `src/server/services/billing/billing-events.ts`
- `src/lib/platform-events.ts`

**Current Architecture:** Billing events are written via `recordVoucherPurchaseBillingEvent()` with `event_type: 'payment_transaction'`, `gross_amount: faceValue`, and full split metadata.

**Difference From Historical Architecture:** Same table, new function name + richer metadata.

**Risk:** LOW.

**Required Action:** None.

---

### 2.3 "Portal reads billing_events"

**Historical Finding:** Portal reads `billing_events` table.

**Current Source-Code Evidence:**
- `billing-engine-portal/src/hooks/usePlatformEvents.js` (line 22) reads **`platform_events`** (not `billing_events`) via Supabase Realtime.
- `billing-engine-portal/src/api/portal-api.js` (line 1) calls `/api/billing/*` endpoints which read `billing_events` server-side.

**Status:** ⚠️ **PARTIALLY TRUE** — Portal reads `platform_events` via Realtime AND `billing_events` via API.

**Source Files:**
- `billing-engine-portal/src/hooks/usePlatformEvents.js`
- `billing-engine-portal/src/api/portal-api.js`
- `src/app/api/billing/events/route.ts`

**Current Architecture:** Dual consumption — Realtime feed for live events + API for dashboard/ledger views.

**Difference From Historical Architecture:** The historical report assumed API-only consumption. The portal now has a Realtime subscription.

**Risk:** LOW — Realtime requires RLS policies on `platform_events` to allow anon reads.

**Required Action:** Verify RLS allows the portal's anon key to read `platform_events`.

---

### 2.4 "Dashboard calculates real totals"

**Historical Finding:** Dashboard calculates totals from `billing_events`.

**Current Source-Code Evidence:**
- `src/app/api/billing/dashboard/route.ts` exists and aggregates billing data.
- `src/server/services/billing/ledger-verification.ts` verifies ledger splits.

**Status:** ✅ **STILL TRUE**

**Source Files:**
- `src/app/api/billing/dashboard/route.ts`
- `src/server/services/billing/ledger-verification.ts`

**Current Architecture:** Dashboard aggregates `billing_events` / `billing_ledger_entries` / `merchant_payouts` / `billing_settlements`.

**Difference From Historical Architecture:** None material.

**Risk:** LOW.

**Required Action:** None.

---

### 2.5 "Settlement records are visible"

**Historical Finding:** Settlements tab shows merchant payouts.

**Current Source-Code Evidence:**
- `src/server/services/billing/billing-events.ts` (line 382-409) creates `billing_settlements` with `status: 'pending'`.
- `src/server/services/bankserv/adaptor.ts` (line 231) `queueBankservSettlementTransaction()` writes `bankserv_adaptor_transactions`.
- `src/app/api/billing/settlements/route.ts` serves settlement data.

**Status:** ✅ **STILL TRUE**

**Source Files:**
- `src/server/services/billing/billing-events.ts`
- `src/server/services/bankserv/adaptor.ts`
- `src/app/api/billing/settlements/route.ts`

**Current Architecture:** Two settlement representations: `billing_settlements` (billing engine) + `bankserv_adaptor_transactions` (BankServ queue).

**Difference From Historical Architecture:** The historical report only mentioned `billing_settlements`. The current code also has `bankserv_adaptor_transactions`.

**Risk:** MEDIUM — two settlement tables could diverge.

**Required Action:** Verify reconciliation between `billing_settlements` and `bankserv_adaptor_transactions`.

---

### 2.6 "BankServ ACK/NCK information is propagated"

**Historical Finding:** BankServ ACK/NCK status is displayed in the portal.

**Current Source-Code Evidence:**
- `src/server/services/bankserv/ack-nck-retry.ts` exists (ACK/NCK retry with exponential backoff).
- `src/app/api/billing/bankserv/ack-nck/process/route.ts` processes ACK/NCK.
- `src/app/api/v1/admin/settlements/batches/[id]/ack-nck/route.ts` + `retry/route.ts` exist.
- `src/server/services/bankserv/adaptor.ts` (line 154) `buildLifecycleStatus()` derives ACKED/NACKED/PENDING.

**Status:** ⚠️ **PARTIALLY TRUE** — ACK/NCK tracking exists, but the handover doc notes "Connect ACK/NCK outcomes to settlement payout gating" is a **next priority** (not yet done).

**Source Files:**
- `src/server/services/bankserv/ack-nck-retry.ts`
- `src/app/api/billing/bankserv/ack-nck/process/route.ts`
- `src/app/api/v1/admin/settlements/batches/[id]/ack-nck/route.ts`
- `src/app/api/v1/admin/settlements/batches/[id]/ack-nck/retry/route.ts`

**Current Architecture:** ACK/NCK is tracked and retried, but does NOT gate settlement payouts.

**Difference From Historical Architecture:** Historical report implied ACK/NCK was fully propagated. Current code tracks it but payout gating is incomplete.

**Risk:** MEDIUM — payouts could proceed without ACK confirmation.

**Required Action:** Wire ACK/NCK outcomes into settlement payout gating.

---

### 2.7 "Portal environment configuration is the primary problem"

**Historical Finding:** Portal configured to call production URL when running locally.

**Current Source-Code Evidence:**
- `billing-engine-portal/.env.local` (line 15): `VITE_PORTAL_API_BASE_URL=https://www.evoucher.co.za` (production) — **STILL SET**.
- `billing-engine-portal/.env.local` (line 8): `VITE_MAIN_APP_URL=http://localhost:4028` (local).
- `billing-engine-portal/src/hooks/usePlatformEvents.js` uses Supabase Realtime — **bypasses API base URL entirely**.

**Status:** ⚠️ **PARTIALLY TRUE** — The env config is still pointing to production, but the Realtime subscription means the portal can receive live events regardless.

**Source Files:**
- `billing-engine-portal/.env.local`
- `billing-engine-portal/src/hooks/usePlatformEvents.js`
- `billing-engine-portal/src/api/portal-api.js`

**Current Architecture:** Portal uses Realtime for live events (no API base needed) + API for dashboard/ledger views (uses `VITE_PORTAL_API_BASE_URL`).

**Difference From Historical Architecture:** The historical report treated env config as the single root cause. Current architecture has a Realtime path that sidesteps it.

**Risk:** MEDIUM — API-based views (dashboard, settlements, invoices) will still hit production if running locally.

**Required Action:** For local dev, set `VITE_PORTAL_API_BASE_URL=http://localhost:4028`. For production, keep `https://www.evoucher.co.za`.

---

### 2.8 "CORS is required"

**Historical Finding:** CORS headers must be added to website API responses.

**Current Source-Code Evidence:**
- `src/middleware.ts` — **NO CORS headers** (verified, lines 1-153).
- `src/app/api/billing/events/route.ts` (line 13-18) — has its own `CORS_HEADERS` with `Access-Control-Allow-Origin: *`.
- Other billing routes (dashboard, settlements, etc.) — need verification of per-route CORS.

**Status:** ⚠️ **PARTIALLY TRUE** — CORS is handled per-route, not globally. `/api/billing/events` has it; others may not.

**Source Files:**
- `src/middleware.ts`
- `src/app/api/billing/events/route.ts`

**Current Architecture:** Per-route CORS headers on billing API routes.

**Difference From Historical Architecture:** The historical report recommended adding CORS to `middleware.ts`. Current code uses per-route headers instead.

**Risk:** MEDIUM — if any billing route lacks CORS headers, the portal's API calls will fail cross-origin.

**Required Action:** Audit all `/api/billing/*` routes for CORS headers.

---

### 2.9 "Portal authentication headers are sufficient"

**Historical Finding:** Portal sends `X-Portal-User`, `X-Portal-Role`, `X-Portal-Passcode` headers.

**Current Source-Code Evidence:**
- `billing-engine-portal/src/api/portal-api.js` (line 11-27) sends `X-Portal-User`, `X-Portal-Role`, `X-Portal-Passcode`.
- `src/server/services/billing/portal-guard.ts` validates these headers.
- `src/app/api/billing/events/route.ts` (line 29-36) validates passcode OR portal session.

**Status:** ✅ **STILL TRUE**

**Source Files:**
- `billing-engine-portal/src/api/portal-api.js`
- `src/server/services/billing/portal-guard.ts`
- `src/app/api/billing/events/route.ts`

**Current Architecture:** Portal auth via `X-Portal-*` headers + optional service JWT (`validateServiceJWT`).

**Difference From Historical Architecture:** None material — headers still work.

**Risk:** LOW.

**Required Action:** None.

---

### 2.10 "The portal is actually receiving real-time data"

**Historical Finding:** Portal receives live transaction data.

**Current Source-Code Evidence:**
- `billing-engine-portal/src/hooks/usePlatformEvents.js` (line 31-45) subscribes to `platform_events` INSERT via Supabase Realtime.
- `billing-engine-portal/src/pages/BillingEngine.jsx` (line ~1) uses `usePlatformEvents({ limit: 25 })` and shows a "Connected" badge.

**Status:** ✅ **STILL TRUE** — Portal receives real-time data via Supabase Realtime.

**Source Files:**
- `billing-engine-portal/src/hooks/usePlatformEvents.js`
- `billing-engine-portal/src/pages/BillingEngine.jsx`

**Current Architecture:** Realtime subscription on `platform_events` table.

**Difference From Historical Architecture:** The historical report assumed API polling. Current code uses Realtime push.

**Risk:** LOW — depends on RLS allowing anon read of `platform_events`.

**Required Action:** Verify RLS policy for `platform_events` anon read.

---

## 3. Additional Findings Beyond the Historical Report

### 3.1 Duplicate Billing-Event Paths (NEW)

**Evidence:**
- `src/server/services/billing/purchase-completion.ts` (line 161) calls `recordVoucherPurchaseBillingEvent()` AND (line 217) `publishPlatformEvent()` (which internally calls it again).
- `src/app/api/v1/payments/webhook/route.ts` (line 164) calls `recordVoucherPurchaseBillingEvent()` AND (line 184) `publishPlatformEvent()`.

**Risk:** MEDIUM — mitigated by idempotency guards (`event_key` / `source_id`), but the dual-call pattern is a design smell.

### 3.2 Dual BankServ Adaptors (NEW)

**Evidence:**
- `src/lib/bankserv-adaptor.ts` (legacy) — used by `src/app/api/cron/settlement/route.ts` + `src/app/api/v1/settlement/batch/route.ts` + `src/app/api/v1/settlement/bankserv-webhook/route.ts`.
- `src/server/services/bankserv/adaptor.ts` (current) — used by purchase route + webhook + purchase-completion.

**Risk:** HIGH — two settlement paths could diverge. The legacy one writes to `transactions` table; the current one writes to `bankserv_adaptor_transactions`.

### 3.3 Reconciliation is Manual-Only (NEW)

**Evidence:**
- `src/server/services/billing/reconciliation-engine.ts` (line 24) `runDailyReconciliation()`.
- Only triggered via `src/app/api/billing/reconciliation/run/route.ts` — NOT on a cron schedule.

**Risk:** MEDIUM — no automated daily reconciliation.

### 3.4 Cron Jobs Exist (NEW)

**Evidence:**
- `vercel.json` (line 2-15): `/api/cron/process-outbox` (00:15), `/api/cron/settlement` (23:00), `/api/cron/specials-expiry` (00:00).
- `src/app/api/cron/process-outbox/route.ts` — processes `platform_event_outbox` with retry + dead-letter.
- `src/app/api/cron/settlement/route.ts` — creates settlement batch + generates BankServ file.

**Risk:** LOW — outbox processing is automated.

---

## 4. Consolidated Status Matrix

| # | Historical Claim | Status | Risk |
|---|---|---|---|
| 1 | Purchase flow uses `createBillingEvent()` | ❌ SUPERSEDED | LOW |
| 2 | Billing events written successfully | ✅ STILL TRUE | LOW |
| 3 | Portal reads `billing_events` | ⚠️ PARTIALLY TRUE | LOW |
| 4 | Dashboard calculates real totals | ✅ STILL TRUE | LOW |
| 5 | Settlement records visible | ✅ STILL TRUE | MEDIUM |
| 6 | BankServ ACK/NCK propagated | ⚠️ PARTIALLY TRUE | MEDIUM |
| 7 | Portal env config is primary problem | ⚠️ PARTIALLY TRUE | MEDIUM |
| 8 | CORS is required | ⚠️ PARTIALLY TRUE | MEDIUM |
| 9 | Portal auth headers sufficient | ✅ STILL TRUE | LOW |
| 10 | Portal receives real-time data | ✅ STILL TRUE | LOW |
| 11 | (NEW) Duplicate billing-event paths | ⚠️ NEW FINDING | MEDIUM |
| 12 | (NEW) Dual BankServ adaptors | ⚠️ NEW FINDING | HIGH |
| 13 | (NEW) Reconciliation manual-only | ⚠️ NEW FINDING | MEDIUM |
| 14 | (NEW) Cron jobs exist | ✅ NEW FINDING | LOW |

---

## 5. Required Actions (Documentation Only — No Code Changes)

1. **Verify RLS** on `platform_events` allows portal anon read (Realtime dependency).
2. **Audit all `/api/billing/*` routes** for CORS headers.
3. **Reconcile** `billing_settlements` vs `bankserv_adaptor_transactions`.
4. **Wire ACK/NCK** outcomes into settlement payout gating.
5. **Set portal env** `VITE_PORTAL_API_BASE_URL=http://localhost:4028` for local dev.
6. **Consolidate** the dual BankServ adaptors (legacy vs current).
7. **Add reconciliation to cron** or document as manual-only.
8. **Remove orphaned** `billing-event-recorder.ts` in a future cleanup.

---

**Generated by:** Cline (source-code trace)  
**Baseline:** `BILLING_ENGINE_SYNC_REPORT.md` (Amazon Q)  
**Date:** 2026-08-08