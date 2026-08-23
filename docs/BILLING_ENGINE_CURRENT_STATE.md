# ⚙️ Billing Engine — Current State (Authoritative Engineering Baseline)

**Date:** 2026-08-08  
**Status:** ✅ VERIFIED FROM CURRENT SOURCE CODE  
**Scope:** Only what is verified in the current source code. This is the authoritative baseline for the Billing Engine Synchronisation project.  
**No code modified.**

---

## 1. Executive Summary

The Billing Engine synchronisation architecture has evolved beyond the historical Amazon Q report. The current system uses a **platform-event publisher + outbox pattern** that is fully wired into the purchase flow, with a **duplicate-path risk** across three trigger points and a **dual BankServ adaptor** divergence.

**Core verified facts:**
- Purchase route → `publishPlatformEvent('VOUCHER_PURCHASED')` → `platform_events` + `platform_event_outbox` → `recordVoucherPurchaseBillingEvent()` → full billing chain.
- Old `createBillingEvent()` (billing-event-recorder) is **orphaned** — zero imports.
- Portal consumes via **BOTH** Supabase Realtime (`platform_events`) AND `/api/billing/*` endpoints.
- Outbox + settlement cron jobs exist in `vercel.json`.
- **Reconciliation is manual-only** (no cron trigger).
- **Dual BankServ adaptors** create a HIGH-risk divergence.

---

## 2. End-to-End Transaction Trace (Verified)

```
Consumer Checkout
  │
  ▼
/api/v1/vouchers/purchase (POST)
  │  src/app/api/v1/vouchers/purchase/route.ts
  │  - validates consumer role + input
  │  - creates payment_transactions row
  │  - issues customer_voucher (if completed)
  │  - sends purchase receipt email
  │
  ├──▶ publishPlatformEvent('VOUCHER_PURCHASED')          [src/lib/platform-events.ts]
  │       │
  │       ├──▶ platform_events (immutable log, status=processing)
  │       ├──▶ platform_event_outbox (status=pending)
  │       └──▶ recordVoucherPurchaseBillingEvent()        [src/server/services/billing/billing-events.ts]
  │             ├──▶ billing_events (event_type=payment_transaction)
  │             ├──▶ billing_ledger_entries (double-entry, source_id=eventKey)
  │             ├──▶ merchant_payouts (status=pending)
  │             ├──▶ billing_settlements (status=pending)
  │             ├──▶ billing_invoices (status=approved)
  │             └──▶ audit_events (billing_event_created)
  │
  └──▶ queueBankservSettlementTransaction()               [src/server/services/bankserv/adaptor.ts]
        └──▶ bankserv_adaptor_transactions (status=queued|ignored)
```

**Trigger points that invoke the billing chain (all verified):**

| # | Trigger | File | Calls |
|---|---|---|---|
| 1 | Purchase route (checkout) | `src/app/api/v1/vouchers/purchase/route.ts` | `publishPlatformEvent` + `queueBankservSettlementTransaction` |
| 2 | Payment webhook | `src/app/api/v1/payments/webhook/route.ts` | `recordVoucherPurchaseBillingEvent` + `publishPlatformEvent` + `queueBankservSettlementTransaction` |
| 3 | Purchase completion (simulator) | `src/server/services/billing/purchase-completion.ts` | `recordVoucherPurchaseBillingEvent` + `queueBankservSettlementTransaction` + `publishPlatformEvent` |
| 4 | Billing simulator | `src/app/api/billing/simulator/route.ts` | `ensureCompletedPurchaseArtifacts` (→ purchase-completion) |
| 5 | Event gateway (external) | `src/app/api/billing/events/route.ts` | `recordVoucherPurchaseBillingEvent` / `recordVoucherRedemptionBillingEvent` |
| 6 | Outbox cron | `src/app/api/cron/process-outbox/route.ts` | POSTs to `/api/billing/events` gateway |

---

## 3. Component Inventory (A–F Classification)

| Component | Source File | Function/Module | Classification | Notes |
|---|---|---|---|---|
| Platform Event Publisher | `src/lib/platform-events.ts` | `publishPlatformEvent()` | **A** — Fully implemented, auto-triggered | Writes platform_events + outbox + routes to billing |
| Billing Event Recorder (purchase) | `src/server/services/billing/billing-events.ts` | `recordVoucherPurchaseBillingEvent()` | **A** — Fully implemented, auto-triggered | Idempotent by event_key/source_id |
| Billing Event Recorder (redemption) | `src/server/services/billing/billing-events.ts` | `recordVoucherRedemptionBillingEvent()` | **A** — Fully implemented, auto-triggered | Idempotent by event_key/source_id |
| Legacy Billing Event Recorder | `src/lib/billing/billing-event-recorder.ts` | `createBillingEvent()` | **F** — Duplicate/legacy, orphaned | 0 imports in project |
| BankServ Adaptor (current) | `src/server/services/bankserv/adaptor.ts` | `queueBankservSettlementTransaction()` | **A** — Fully implemented, auto-triggered | Idempotent by transaction_reference |
| BankServ Adaptor (legacy) | `src/lib/bankserv-adaptor.ts` | `createSettlementBatch()`, `generateBankServBatchFile()`, `submitSettlementInstruction()` | **F** — Duplicate/legacy | Used by settlement cron + v1 settlement APIs |
| Purchase Completion | `src/server/services/billing/purchase-completion.ts` | `ensureCompletedPurchaseArtifacts()` | **B** — Implemented, dependent on simulator/API | Dual-call pattern (billing + platform event) |
| Reconciliation Engine | `src/server/services/billing/reconciliation-engine.ts` | `runDailyReconciliation()` | **B** — Implemented, manual/API only | No cron trigger |
| Ledger Verification | `src/server/services/billing/ledger-verification.ts` | (verify ledger splits) | **B** — Implemented, API-triggered | `/api/v1/admin/ledger/verify` |
| Portal Guard | `src/server/services/billing/portal-guard.ts` | `requirePortalUser()` | **A** — Fully implemented | Validates X-Portal-* headers |
| Outbox Worker | `src/app/api/cron/process-outbox/route.ts` | GET/POST | **A** — Fully implemented, cron-triggered | Retry + dead-letter, max 5 retries |
| Settlement Cron | `src/app/api/cron/settlement/route.ts` | GET/POST | **B** — Implemented, cron-triggered | Uses LEGACY bankserv-adaptor |
| Billing Dashboard API | `src/app/api/billing/dashboard/route.ts` | GET | **A** — Fully implemented | Aggregates billing data |
| Billing Events API | `src/app/api/billing/events/route.ts` | GET/POST | **A** — Fully implemented | Event gateway + list |
| Billing Settlements API | `src/app/api/billing/settlements/route.ts` | GET | **A** — Fully implemented | Serves settlement data |
| Billing Invoices API | `src/app/api/billing/invoices/route.ts` | GET/POST | **A** — Fully implemented | Invoice management |
| Billing Ledger API | `src/app/api/billing/ledger/route.ts` | GET | **A** — Fully implemented | Ledger entries |
| Merchant Payouts API | `src/app/api/billing/merchant-payouts/route.ts` | GET | **A** — Fully implemented | Payout records |
| Reconciliation Run API | `src/app/api/billing/reconciliation/run/route.ts` | POST | **B** — Implemented, manual trigger | Calls runDailyReconciliation |
| Billing Simulator | `src/app/api/billing/simulator/route.ts` | POST | **B** — Implemented, manual trigger | Simulates purchase/webhook/settlement |
| Portal Realtime Hook | `billing-engine-portal/src/hooks/usePlatformEvents.js` | `usePlatformEvents()` | **A** — Fully implemented | Supabase Realtime on platform_events |
| Portal API Client | `billing-engine-portal/src/api/portal-api.js` | portalFetchJson() | **A** — Fully implemented | Calls /api/billing/* with X-Portal-* headers |

---

## 4. Event Flow Matrix

| Event Type | Publisher | Consumer | Table Written | Trigger | Idempotency |
|---|---|---|---|---|---|
| `VOUCHER_PURCHASED` | `publishPlatformEvent()` | `recordVoucherPurchaseBillingEvent()` | `platform_events`, `platform_event_outbox`, `billing_events`, `billing_ledger_entries`, `merchant_payouts`, `billing_settlements`, `billing_invoices`, `audit_events` | Synchronous (purchase route) | `event_key` / `source_id` |
| `VOUCHER_REDEEMED` | `publishPlatformEvent()` | `recordVoucherRedemptionBillingEvent()` | `platform_events`, `platform_event_outbox`, `billing_events`, `billing_ledger_entries` | Synchronous (redeem route) | `event_key` / `source_id` |
| `PAYMENT_CAPTURED` | `publishPlatformEvent()` | (logged only) | `platform_events`, `billing_events` | Synchronous | `event_id` |
| `SETTLEMENT_QUEUED` | (not published) | — | `bankserv_adaptor_transactions` | Synchronous (queueBankservSettlementTransaction) | `transaction_reference` |
| `SETTLEMENT_SUBMITTED` | (not published) | — | `settlement_batches` | Cron/API | batch_id |
| `SETTLEMENT_CONFIRMED` | (not published) | — | `settlement_batches` | API | batch_id |

**Key finding:** Settlement lifecycle events (`SETTLEMENT_QUEUED`, `SETTLEMENT_SUBMITTED`, `SETTLEMENT_CONFIRMED`) are **declared** in `PlatformEventType` but **not published** by any current code path. They are logged to `platform_events` only if manually invoked.

---

## 5. Database Propagation Matrix

| Table | Written By | Read By | Status |
|---|---|---|---|
| `platform_events` | `publishPlatformEvent()` | Portal Realtime (`usePlatformEvents.js`), `/api/billing/events` | ✅ Active |
| `platform_event_outbox` | `publishPlatformEvent()` | `/api/cron/process-outbox` | ✅ Active |
| `billing_events` | `recordVoucherPurchaseBillingEvent()`, `recordVoucherRedemptionBillingEvent()`, `/api/billing/events` | `/api/billing/events`, `/api/billing/dashboard` | ✅ Active |
| `billing_ledger_entries` | `recordVoucherPurchaseBillingEvent()`, `recordVoucherRedemptionBillingEvent()` | `/api/billing/ledger`, reconciliation engine | ✅ Active |
| `merchant_payouts` | `recordVoucherPurchaseBillingEvent()` | `/api/billing/merchant-payouts` | ✅ Active |
| `billing_settlements` | `recordVoucherPurchaseBillingEvent()` | `/api/billing/settlements` | ✅ Active |
| `billing_invoices` | `recordVoucherPurchaseBillingEvent()` | `/api/billing/invoices` | ✅ Active |
| `audit_events` | `writeAuditEvent()` (multiple) | `/api/billing/audit` (portal) | ✅ Active |
| `bankserv_adaptor_transactions` | `queueBankservSettlementTransaction()` | `/api/billing/bankserv/*` | ✅ Active |
| `settlement_batches` | `createSettlementBatch()` (legacy lib) | `/api/v1/admin/settlements/batches/*` | ✅ Active |
| `reconciliation_runs` | `runDailyReconciliation()` | `/api/billing/reconciliation/runs` | ✅ Active (manual) |
| `payment_transactions` | purchase route, webhook, simulator | reconciliation engine, dashboard | ✅ Active |
| `customer_vouchers` | `DefaultVoucherService.issueVoucher()` | purchase route, portal | ✅ Active |
| `transactions` (legacy) | `src/lib/bankserv-adaptor.ts` | (legacy settlement) | ⚠️ Legacy — divergence risk |

---

## 6. API Propagation Matrix

| Endpoint | Method | Purpose | Auth | CORS |
|---|---|---|---|---|
| `/api/v1/vouchers/purchase` | POST | Purchase voucher | Supabase session (consumer) | N/A (same-origin) |
| `/api/v1/vouchers/purchase` | GET | Purchase status | Supabase session (consumer) | N/A |
| `/api/v1/payments/webhook` | POST | Payment webhook | HMAC signature | N/A |
| `/api/billing/events` | GET | List billing_events | X-Portal-Passcode / portal session | ✅ `*` |
| `/api/billing/events` | POST | Event gateway | Bearer JWT / passcode / portal session | ✅ `*` |
| `/api/billing/dashboard` | GET | Dashboard totals | Portal auth | ⚠️ Verify |
| `/api/billing/settlements` | GET | Settlements | Portal auth | ⚠️ Verify |
| `/api/billing/invoices` | GET/POST | Invoices | Portal auth | ⚠️ Verify |
| `/api/billing/ledger` | GET | Ledger entries | Portal auth | ⚠️ Verify |
| `/api/billing/merchant-payouts` | GET | Payouts | Portal auth | ⚠️ Verify |
| `/api/billing/reconciliation/run` | POST | Run reconciliation | Portal auth | ⚠️ Verify |
| `/api/billing/simulator` | POST | Simulate purchase | Portal auth | ⚠️ Verify |
| `/api/cron/process-outbox` | GET/POST | Outbox worker | CRON_SECRET / Vercel cron | N/A |
| `/api/cron/settlement` | GET/POST | Settlement batch | CRON_SECRET | N/A |
| `/api/v1/admin/settlements/batches/*` | GET/POST | Settlement batches | Admin auth | ⚠️ Verify |

**Key finding:** Only `/api/billing/events` has verified CORS headers. All other `/api/billing/*` routes need CORS audit.

---

## 7. Billing Portal Synchronisation Matrix

| Portal Feature | Consumption Method | Source | Status |
|---|---|---|---|
| Live Events feed | Supabase Realtime (`usePlatformEvents.js`) | `platform_events` table | ✅ Active |
| Dashboard totals | API (`portal-api.js` → `/api/billing/dashboard`) | `billing_events` + ledger | ✅ Active |
| VoucherLedger | API → `/api/billing/events` | `billing_events` | ✅ Active |
| Settlements | API → `/api/billing/settlements` | `billing_settlements` | ✅ Active |
| BankServ | API → `/api/billing/bankserv/*` | `bankserv_adaptor_transactions` | ✅ Active |
| Invoices | API → `/api/billing/invoices` | `billing_invoices` | ✅ Active |
| Reconciliation | API → `/api/billing/reconciliation/*` | `reconciliation_runs` | ✅ Active (manual) |
| Audit Log | API → `/api/billing/audit` | `audit_events` | ✅ Active |

**Key finding:** The portal is **BOTH** a true event consumer (Realtime on `platform_events`) AND an API viewer (dashboard/ledger/settlements). This is a hybrid model.

---

## 8. Cron/Worker Dependency Matrix

| Cron | Schedule | Route | Purpose | Status |
|---|---|---|---|---|
| `specials-expiry` | `0 0 * * *` (00:00) | `/api/cron/specials-expiry` | Expire specials | ✅ Configured |
| `settlement` | `0 23 * * *` (23:00) | `/api/cron/settlement` | Create settlement batch + BankServ file | ✅ Configured (uses LEGACY adaptor) |
| `process-outbox` | `15 0 * * *` (00:15) | `/api/cron/process-outbox` | Process platform_event_outbox | ✅ Configured |

**Key finding:** Reconciliation is **NOT** on a cron schedule — it is manual-only via `/api/billing/reconciliation/run`.

---

## 9. Duplicate/Legacy Path Analysis

### 9.1 Duplicate Billing-Event Paths

**Three trigger points call the billing chain:**

| Trigger | `recordVoucherPurchaseBillingEvent()` | `publishPlatformEvent()` (which calls it again) |
|---|---|---|
| Purchase route | ❌ (indirect via publish) | ✅ |
| Webhook | ✅ (line 164) | ✅ (line 184) |
| Purchase-completion | ✅ (line 161) | ✅ (line 217) |

**Risk:** MEDIUM — mitigated by idempotency guards (`event_key` / `source_id`), but the dual-call pattern is redundant. The webhook and purchase-completion both call the billing recorder directly AND via the platform publisher.

### 9.2 Dual BankServ Adaptors

| Adaptor | File | Used By | Writes To |
|---|---|---|---|
| Current | `src/server/services/bankserv/adaptor.ts` | purchase route, webhook, purchase-completion | `bankserv_adaptor_transactions` |
| Legacy | `src/lib/bankserv-adaptor.ts` | settlement cron, `/api/v1/settlement/batch`, `/api/v1/settlement/bankserv-webhook` | `transactions` (legacy) |

**Risk:** HIGH — two settlement paths could diverge. The legacy one writes to `transactions` table; the current one writes to `bankserv_adaptor_transactions`.

### 9.3 Orphaned Legacy Recorder

`src/lib/billing/billing-event-recorder.ts` (`createBillingEvent()`) — **0 imports** in the project. Dead code.

---

## 10. Idempotency Analysis

| Operation | Idempotency Key | Mechanism | Status |
|---|---|---|---|
| `publishPlatformEvent()` | `event_id` (UUID) | Unique constraint on `platform_events.event_id` | ✅ |
| `recordVoucherPurchaseBillingEvent()` | `event_key` | SELECT before INSERT + duplicate-key catch | ✅ |
| `recordVoucherRedemptionBillingEvent()` | `event_key` | SELECT before INSERT + duplicate-key catch | ✅ |
| Ledger posting | `source_id` | SELECT before INSERT | ✅ |
| `merchant_payouts` | `source_id` | SELECT before INSERT + duplicate-key catch | ✅ |
| `billing_settlements` | `source_id` | SELECT before INSERT + duplicate-key catch | ✅ |
| `billing_invoices` | `source_id` | SELECT before INSERT + duplicate-key catch | ✅ |
| `queueBankservSettlementTransaction()` | `transaction_reference` | SELECT before INSERT | ✅ |
| Webhook processing | `provider_event_id` | `payment_webhook_events` unique | ✅ |
| Outbox processing | `event_id` | Status transition (pending→processing→sent) | ✅ |

**Key finding:** All billing operations are idempotent. The duplicate-path risk is mitigated by these guards.

---

## 11. Failure/Retry Analysis

| Component | Failure Handling | Retry | Dead-Letter |
|---|---|---|---|
| `publishPlatformEvent()` | Never throws — logs + returns null | N/A (fire-and-forget) | N/A |
| Billing handler in `publishPlatformEvent()` | Catches, marks `platform_events.status=failed` | Via outbox cron | After 5 retries → `dead_letter` |
| Outbox worker | Marks `failed` + increments retries | Up to 5 retries | `dead_letter` status |
| `recordVoucherPurchaseBillingEvent()` | Throws on non-duplicate errors | Caller decides | N/A |
| `queueBankservSettlementTransaction()` | Throws on non-compat errors | Caller decides | N/A |
| Webhook billing | `catch {}` — silently ignores | N/A | N/A |
| Reconciliation | Throws on error | Manual re-run | N/A |

**Key finding:** The webhook's `catch {}` silently swallows billing failures — no retry, no alert. This is a gap.

---

## 12. Security Analysis

| Component | Auth Mechanism | Notes |
|---|---|---|
| Purchase route | Supabase session (consumer role) | ✅ |
| Webhook | HMAC signature (`x-webhook-signature`) | ✅ |
| `/api/billing/events` GET | X-Portal-Passcode OR portal session | ✅ |
| `/api/billing/events` POST | Bearer JWT (service) OR passcode OR portal session | ✅ |
| Other `/api/billing/*` | Portal guard (`requirePortalUser`) | ✅ |
| Cron routes | `CRON_SECRET` Bearer OR Vercel cron UA | ✅ |
| Portal Realtime | Supabase anon key + RLS | ⚠️ Verify RLS on `platform_events` |
| Service JWT | HMAC-SHA256 signed, 5-min expiry | ✅ |

**Key finding:** Portal Realtime depends on RLS allowing anon read of `platform_events`. This must be verified.

---

## 13. Gap Matrix

| # | Gap | Severity | Evidence |
|---|---|---|---|
| 1 | Dual BankServ adaptors diverge | HIGH | `src/lib/bankserv-adaptor.ts` vs `src/server/services/bankserv/adaptor.ts` |
| 2 | Reconciliation not on cron | MEDIUM | `runDailyReconciliation()` only via `/api/billing/reconciliation/run` |
| 3 | ACK/NCK not gating payouts | MEDIUM | Handover doc: "Connect ACK/NCK outcomes to settlement payout gating" is next priority |
| 4 | Webhook billing failures silently swallowed | MEDIUM | `catch {}` in `webhook/route.ts` line 180 |
| 5 | CORS not verified on all `/api/billing/*` | MEDIUM | Only `/api/billing/events` has verified CORS |
| 6 | Portal env points to production | MEDIUM | `VITE_PORTAL_API_BASE_URL=https://www.evoucher.co.za` |
| 7 | RLS on `platform_events` unverified | MEDIUM | Portal Realtime depends on it |
| 8 | Orphaned `billing-event-recorder.ts` | LOW | 0 imports |
| 9 | Settlement lifecycle events not published | LOW | `SETTLEMENT_QUEUED` etc. declared but not published |
| 10 | `billing_settlements` vs `bankserv_adaptor_transactions` reconciliation | MEDIUM | Two settlement tables |

---

## 14. Risk Ranking

| Rank | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | Dual BankServ adaptor divergence | HIGH | Consolidate to single adaptor |
| 2 | ACK/NCK not gating payouts | MEDIUM | Wire ACK/NCK into payout gating |
| 3 | Reconciliation manual-only | MEDIUM | Add to cron or document |
| 4 | Webhook billing failures silent | MEDIUM | Add retry/alert |
| 5 | CORS gaps on billing routes | MEDIUM | Audit + add headers |
| 6 | RLS on platform_events | MEDIUM | Verify policy |
| 7 | Settlement table divergence | MEDIUM | Reconcile |
| 8 | Portal env misconfig | MEDIUM | Fix for local dev |
| 9 | Orphaned legacy recorder | LOW | Remove |
| 10 | Settlement events not published | LOW | Publish or document |

---

## 15. Implementation Readiness

### READY / NOT READY

**Status: NOT READY**

**Why:**

1. **Dual BankServ adaptors (HIGH risk)** — The legacy `src/lib/bankserv-adaptor.ts` and current `src/server/services/bankserv/adaptor.ts` write to different tables (`transactions` vs `bankserv_adaptor_transactions`). Any implementation that touches settlement must first consolidate these to avoid divergence.

2. **ACK/NCK payout gating incomplete (MEDIUM)** — Payouts can proceed without ACK confirmation. This is a financial-control gap.

3. **Reconciliation is manual-only (MEDIUM)** — No automated daily reconciliation means discrepancies go undetected.

4. **Webhook billing failures silently swallowed (MEDIUM)** — `catch {}` in the webhook means billing failures are invisible.

5. **CORS + RLS unverified (MEDIUM)** — Portal API calls and Realtime subscription may fail in production.

**Recommended sequence before implementation:**

1. Consolidate the dual BankServ adaptors.
2. Wire ACK/NCK into settlement payout gating.
3. Add reconciliation to cron (or document as manual).
4. Fix webhook billing failure handling (retry/alert).
5. Audit CORS on all `/api/billing/*` routes.
6. Verify RLS on `platform_events`.
7. Fix portal env config for local dev.
8. Remove orphaned `billing-event-recorder.ts`.

---

## 16. Definition of Done

The Billing Engine Synchronisation project is **READY** when:

- [ ] Single BankServ adaptor (no dual path)
- [ ] ACK/NCK gates settlement payouts
- [ ] Reconciliation runs on a schedule
- [ ] Webhook billing failures are retried/alerted
- [ ] All `/api/billing/*` routes have CORS headers
- [ ] RLS on `platform_events` verified
- [ ] Portal env config correct for local + production
- [ ] Orphaned legacy recorder removed
- [ ] Settlement lifecycle events published (or documented as not needed)
- [ ] `billing_settlements` reconciled with `bankserv_adaptor_transactions`

---

## 17. Files Requiring Modification (Future — Not Done)

- `src/lib/bankserv-adaptor.ts` (consolidate or deprecate)
- `src/server/services/bankserv/adaptor.ts` (single source of truth)
- `src/app/api/v1/payments/webhook/route.ts` (fix silent catch)
- `src/app/api/billing/reconciliation/run/route.ts` (add cron or document)
- `vercel.json` (add reconciliation cron if needed)
- `src/middleware.ts` or per-route (CORS audit)
- `billing-engine-portal/.env.local` (fix API base URL)
- `src/lib/billing/billing-event-recorder.ts` (remove orphaned)

## 18. Files That Must NOT Be Modified

- `src/lib/platform-events.ts` (core event publisher — stable)
- `src/server/services/billing/billing-events.ts` (core billing chain — stable)
- `src/server/services/bankserv/adaptor.ts` (current adaptor — stable)
- `src/app/api/billing/events/route.ts` (event gateway — stable)
- `src/app/api/cron/process-outbox/route.ts` (outbox worker — stable)
- `billing-engine-portal/src/hooks/usePlatformEvents.js` (Realtime hook — stable)

## 19. Validation/Test Strategy

1. **Unit tests:** `tests/billing-revenue-calculator.test.ts`, `tests/billing-redemption-breakdown.test.ts`, `tests/compliance-sync-reconciliation.test.ts`, `tests/bankserv-adaptor.test.ts`, `tests/bankserv-formatter.test.ts`.
2. **Integration:** Run a test purchase → verify `platform_events`, `billing_events`, `billing_ledger_entries`, `merchant_payouts`, `billing_settlements`, `billing_invoices`, `audit_events`, `bankserv_adaptor_transactions` all created.
3. **Portal:** Verify Realtime feed + dashboard + settlements + invoices load.
4. **Cron:** Trigger `/api/cron/process-outbox` and `/api/cron/settlement` manually.
5. **Reconciliation:** Run `/api/billing/reconciliation/run` and verify no exceptions.
6. **Idempotency:** Re-run the same purchase twice → verify no duplicate ledger entries.

---

**Generated by:** Cline (source-code trace)  
**Baseline:** Verified current source code  
**Date:** 2026-08-08