# 📊 Billing Engine — Gap & Implementation Matrix

**Date:** 2026-08-08  
**Status:** ✅ ENGINEERING CONTRACT FOR IMPLEMENTATION PHASE  
**Evidence Base:** `BILLING_ENGINE_HISTORICAL_RECONCILIATION.md` + `BILLING_ENGINE_CURRENT_STATE.md` + verified source code  
**Scope:** Determine what must change to achieve 100% reliable propagation of a completed financial transaction through every enterprise Billing Engine capability.  
**No code modified.**

---

## 1. Executive Summary

This matrix traces a completed consumer voucher purchase through the full enterprise Billing Engine capability chain and classifies every stage. It distinguishes **DATA CREATION** from **EVENT PROPAGATION** from **PROCESSING** from **SETTLEMENT** from **RECONCILIATION** from **USER/PORTAL VISIBILITY**.

**Headline findings:**
- The **data-creation chain is GREEN** — a purchase correctly creates `platform_events`, `billing_events`, `billing_ledger_entries`, `merchant_payouts`, `billing_settlements`, `billing_invoices`, and `audit_events`.
- **Duplicate/competing paths exist** (PURPLE) — dual BankServ adaptors, dual billing-event invocation, orphaned legacy recorder.
- **Reconciliation is AMBER** — implemented but manual-only (no cron).
- **Settlement is AMBER/ORANGE** — cron exists but uses the LEGACY adaptor writing to a different table.
- **Merchant/Consumer statements are RED** — no statement generation capability found.
- **Treasury is RED** — no treasury module found.
- **Revenue analytics is AMBER** — dashboard aggregates exist but no dedicated analytics module.
- **ACK/NCK payout gating is ORANGE** — tracked but not gating payouts.

---

## 2. End-to-End Capability Trace

### Stage-by-Stage Classification

| # | Stage | Current Implementation | Actual Trigger | Source File | Function/Route | Classification |
|---|---|---|---|---|---|---|
| 1 | **Consumer Purchase** | `payment_transactions` row created | Synchronous (checkout POST) | `src/app/api/v1/vouchers/purchase/route.ts` | `POST` (line 264) | 🟢 **GREEN** |
| 2 | **Payment Confirmation** | `payment_status=completed` set | Synchronous (dev) / Webhook | `src/app/api/v1/vouchers/purchase/route.ts` + `src/app/api/v1/payments/webhook/route.ts` | `POST` | 🟢 **GREEN** |
| 3 | **Voucher Issuance** | `customer_vouchers` row created | Synchronous | `src/server/services/voucher/default-voucher-service.ts` | `issueVoucher()` | 🟢 **GREEN** |
| 4 | **Platform Event** | `platform_events` + `platform_event_outbox` written | Synchronous | `src/lib/platform-events.ts` | `publishPlatformEvent()` (line 176) | 🟢 **GREEN** |
| 5 | **Billing Event** | `billing_events` row created | Synchronous (via publish) | `src/server/services/billing/billing-events.ts` | `recordVoucherPurchaseBillingEvent()` (line 203) | 🟢 **GREEN** |
| 6 | **Ledger** | `billing_ledger_entries` double-entry posted | Synchronous | `src/server/services/billing/billing-events.ts` | `recordVoucherPurchaseBillingEvent()` (line 274-340) | 🟢 **GREEN** |
| 7 | **Merchant Liability/Payout** | `merchant_payouts` row created (status=pending) | Synchronous | `src/server/services/billing/billing-events.ts` | (line 342-380) | 🟢 **GREEN** |
| 8 | **Settlement** | `billing_settlements` + `bankserv_adaptor_transactions` created | Synchronous (queue) + Cron (batch) | `src/server/services/billing/billing-events.ts` + `src/server/services/bankserv/adaptor.ts` + `src/app/api/cron/settlement/route.ts` | `queueBankservSettlementTransaction()` | 🟠 **ORANGE** — dual path, legacy cron |
| 9 | **Reconciliation** | `reconciliation_runs` created | Manual (API) | `src/server/services/billing/reconciliation-engine.ts` + `src/app/api/billing/reconciliation/run/route.ts` | `runDailyReconciliation()` | 🟡 **AMBER** — manual-only |
| 10 | **Merchant Statement** | ❌ Not found | — | — | — | 🔴 **RED** — missing |
| 11 | **Consumer Statement** | ❌ Not found | — | — | — | 🔴 **RED** — missing |
| 12 | **Audit** | `audit_events` written | Synchronous | `src/server/utils/audit.ts` | `writeAuditEvent()` | 🟢 **GREEN** |
| 13 | **Treasury** | ❌ Not found | — | — | — | 🔴 **RED** — missing |
| 14 | **Revenue Analytics** | Dashboard aggregates | API | `src/app/api/billing/dashboard/route.ts` | `GET` | 🟡 **AMBER** — no dedicated analytics |
| 15 | **Billing Dashboard** | Aggregates billing data | API | `src/app/api/billing/dashboard/route.ts` | `GET` | 🟢 **GREEN** |
| 16 | **Billing Engine Portal** | Realtime + API consumption | Realtime + API | `billing-engine-portal/src/hooks/usePlatformEvents.js` + `billing-engine-portal/src/api/portal-api.js` | `usePlatformEvents()` + `portalFetchJson()` | 🟢 **GREEN** |

---

## 3. Component-Level Gap Matrix

### 3.1 Platform Event Publisher

| Attribute | Value |
|---|---|
| **Current implementation** | `publishPlatformEvent()` writes `platform_events` + `platform_event_outbox`, then routes to billing handler |
| **Actual trigger** | Synchronous (purchase route, redeem route, webhook, purchase-completion) |
| **Source file** | `src/lib/platform-events.ts` |
| **Function/route** | `publishPlatformEvent()` (line 176) |
| **Database tables** | `platform_events`, `platform_event_outbox` |
| **Events** | `VOUCHER_PURCHASED`, `VOUCHER_REDEEMED`, etc. |
| **API dependencies** | None (direct Supabase writes) |
| **Realtime dependencies** | Portal subscribes to `platform_events` INSERT |
| **Cron/worker dependencies** | `/api/cron/process-outbox` |
| **Authentication** | N/A (server-side) |
| **Idempotency** | `event_id` unique constraint |
| **Retry behaviour** | Via outbox cron (max 5 retries → dead_letter) |
| **Failure handling** | Never throws — logs + returns null |
| **Current status** | 🟢 **GREEN** |

**Gap:** None for core function. Settlement lifecycle events (`SETTLEMENT_QUEUED`, `SETTLEMENT_SUBMITTED`, `SETTLEMENT_CONFIRMED`) are declared in `PlatformEventType` but never published by any code path.

---

### 3.2 Billing Event Recorder (Purchase)

| Attribute | Value |
|---|---|
| **Current implementation** | `recordVoucherPurchaseBillingEvent()` writes `billing_events` + ledger + payouts + settlements + invoices + audit |
| **Actual trigger** | Synchronous (via `publishPlatformEvent`, webhook, purchase-completion) |
| **Source file** | `src/server/services/billing/billing-events.ts` |
| **Function/route** | `recordVoucherPurchaseBillingEvent()` (line 203) |
| **Database tables** | `billing_events`, `billing_ledger_entries`, `merchant_payouts`, `billing_settlements`, `billing_invoices`, `audit_events` |
| **Events** | Consumes `VOUCHER_PURCHASED` |
| **API dependencies** | None (direct Supabase writes) |
| **Realtime dependencies** | None |
| **Cron/worker dependencies** | None |
| **Authentication** | N/A (server-side) |
| **Idempotency** | `event_key` / `source_id` |
| **Retry behaviour** | Caller decides |
| **Failure handling** | Throws on non-duplicate errors |
| **Current status** | 🟢 **GREEN** |

**Gap:** None for core function. But see GAP-001 for duplicate invocation.

---

### 3.3 Duplicate Billing-Event Invocation (PURPLE)

| Attribute | Value |
|---|---|
| **Current implementation** | Webhook + purchase-completion call BOTH `recordVoucherPurchaseBillingEvent()` AND `publishPlatformEvent()` (which calls it again) |
| **Actual trigger** | Synchronous |
| **Source files** | `src/app/api/v1/payments/webhook/route.ts` (line 164 + 184), `src/server/services/billing/purchase-completion.ts` (line 161 + 217) |
| **Database tables** | All billing tables (idempotency prevents duplicates) |
| **Current status** | 🟣 **PURPLE** — duplicate/competing path |

**GAP ID: GAP-001**

| Attribute | Value |
|---|---|
| **Business impact** | Redundant processing; risk of double-posting if idempotency guards ever fail |
| **Technical impact** | Extra DB round-trips; confusing code path; harder to reason about |
| **Risk** | MEDIUM |
| **Exact source files** | `src/app/api/v1/payments/webhook/route.ts`, `src/server/services/billing/purchase-completion.ts` |
| **Required change** | Remove the direct `recordVoucherPurchaseBillingEvent()` call; rely solely on `publishPlatformEvent()` as the single billing entry point |
| **Dependencies** | `publishPlatformEvent()` must remain the single billing entry point |
| **Test requirement** | Verify a single purchase produces exactly one set of billing records |
| **Acceptance criteria** | One purchase → one `billing_events` row, one ledger group, one payout, one settlement, one invoice |

---

### 3.4 Legacy Billing Event Recorder (PURPLE)

| Attribute | Value |
|---|---|
| **Current implementation** | `createBillingEvent()` in `src/lib/billing/billing-event-recorder.ts` |
| **Actual trigger** | None — orphaned (0 imports) |
| **Source file** | `src/lib/billing/billing-event-recorder.ts` |
| **Current status** | 🟣 **PURPLE** — duplicate/legacy, dead code |

**GAP ID: GAP-002**

| Attribute | Value |
|---|---|
| **Business impact** | None (dead code) |
| **Technical impact** | Confusion; risk of accidental re-wiring |
| **Risk** | LOW |
| **Exact source files** | `src/lib/billing/billing-event-recorder.ts` |
| **Required change** | Remove or explicitly deprecate |
| **Dependencies** | None |
| **Test requirement** | Verify no imports reference it |
| **Acceptance criteria** | File removed or marked deprecated with no references |

---

### 3.5 BankServ Adaptor — Current (GREEN)

| Attribute | Value |
|---|---|
| **Current implementation** | `queueBankservSettlementTransaction()` writes `bankserv_adaptor_transactions` |
| **Actual trigger** | Synchronous (purchase route, webhook, purchase-completion) |
| **Source file** | `src/server/services/bankserv/adaptor.ts` |
| **Function/route** | `queueBankservSettlementTransaction()` (line 231) |
| **Database tables** | `bankserv_adaptor_transactions`, `billing_bank_linkages` |
| **Idempotency** | `transaction_reference` |
| **Retry behaviour** | Caller decides |
| **Failure handling** | Throws on non-compatibility errors |
| **Current status** | 🟢 **GREEN** |

---

### 3.6 BankServ Adaptor — Legacy (PURPLE)

| Attribute | Value |
|---|---|
| **Current implementation** | `createSettlementBatch()`, `generateBankServBatchFile()`, `submitSettlementInstruction()` |
| **Actual trigger** | Cron (`/api/cron/settlement`) + v1 settlement APIs |
| **Source file** | `src/lib/bankserv-adaptor.ts` |
| **Database tables** | `transactions` (legacy), `settlement_batches` |
| **Current status** | 🟣 **PURPLE** — duplicate/competing path |

**GAP ID: GAP-003**

| Attribute | Value |
|---|---|
| **Business impact** | Two settlement paths could diverge; payouts may be computed differently; merchant statements impossible |
| **Technical impact** | Writes to different tables (`transactions` vs `bankserv_adaptor_transactions`); reconciliation impossible |
| **Risk** | **HIGH** |
| **Exact source files** | `src/lib/bankserv-adaptor.ts`, `src/app/api/cron/settlement/route.ts`, `src/app/api/v1/settlement/batch/route.ts`, `src/app/api/v1/settlement/bankserv-webhook/route.ts` |
| **Required change** | Consolidate to single adaptor (`src/server/services/bankserv/adaptor.ts`); update cron + v1 APIs to use it |
| **Dependencies** | Settlement cron must be rewired to current adaptor |
| **Test requirement** | Verify settlement batch creation + BankServ file generation work with current adaptor |
| **Acceptance criteria** | Single settlement path; no writes to legacy `transactions` table |

---

### 3.7 Settlement Processing (ORANGE)

| Attribute | Value |
|---|---|
| **Current implementation** | `billing_settlements` (status=pending) + `bankserv_adaptor_transactions` (status=queued/ignored) created at purchase; batch creation via cron |
| **Actual trigger** | Synchronous (queue) + Cron (batch at 23:00) |
| **Source files** | `src/server/services/billing/billing-events.ts`, `src/server/services/bankserv/adaptor.ts`, `src/app/api/cron/settlement/route.ts` |
| **Database tables** | `billing_settlements`, `bankserv_adaptor_transactions`, `settlement_batches` |
| **Current status** | 🟠 **ORANGE** — dual path, legacy cron, ACK/NCK not gating |

**GAP ID: GAP-004**

| Attribute | Value |
|---|---|
| **Business impact** | Payouts may proceed without ACK confirmation; settlement data may diverge between tables |
| **Technical impact** | Two settlement representations; cron uses legacy adaptor |
| **Risk** | **HIGH** |
| **Exact source files** | `src/app/api/cron/settlement/route.ts`, `src/lib/bankserv-adaptor.ts`, `src/server/services/bankserv/adaptor.ts` |
| **Required change** | Rewire cron to current adaptor; reconcile `billing_settlements` with `bankserv_adaptor_transactions` |
| **Dependencies** | GAP-003 (adaptor consolidation) |
| **Test requirement** | Verify settlement batch reflects queued transactions |
| **Acceptance criteria** | Settlement batch contains all queued transactions; no divergence between tables |

---

### 3.8 ACK/NCK Payout Gating (ORANGE)

| Attribute | Value |
|---|---|
| **Current implementation** | ACK/NCK tracked + retried, but NOT gating settlement payouts |
| **Actual trigger** | API (`/api/billing/bankserv/ack-nck/process`, `/api/v1/admin/settlements/batches/[id]/ack-nck`) |
| **Source files** | `src/server/services/bankserv/ack-nck-retry.ts`, `src/app/api/billing/bankserv/ack-nck/process/route.ts`, `src/app/api/v1/admin/settlements/batches/[id]/ack-nck/route.ts`, `src/app/api/v1/admin/settlements/batches/[id]/ack-nck/retry/route.ts` |
| **Database tables** | ACK/NCK tracking tables (from `20260620000000_ack_nck_tracking_and_ledger.sql`) |
| **Current status** | 🟠 **ORANGE** — tracked but not gating payouts |

**GAP ID: GAP-005**

| Attribute | Value |
|---|---|
| **Business impact** | Financial-control gap — payouts can proceed without ACK confirmation |
| **Technical impact** | ACK/NCK status not consumed by settlement approval logic |
| **Risk** | **HIGH** |
| **Exact source files** | `src/server/services/bankserv/ack-nck-retry.ts`, settlement batch approval routes |
| **Required change** | Wire ACK/NCK outcome into settlement payout gating (block payout if NACKED, require ACK before payout) |
| **Dependencies** | Settlement batch lifecycle routes |
| **Test requirement** | Verify NACKED batch cannot be paid out; ACKED batch can |
| **Acceptance criteria** | Settlement payout gated on ACK status; NACKED → blocked + alert |

---

### 3.9 Reconciliation Engine (AMBER)

| Attribute | Value |
|---|---|
| **Current implementation** | `runDailyReconciliation()` compares `payment_transactions` + `wallet_transactions` vs `billing_ledger_entries` |
| **Actual trigger** | Manual (API POST `/api/billing/reconciliation/run`) |
| **Source file** | `src/server/services/billing/reconciliation-engine.ts` |
| **Function/route** | `runDailyReconciliation()` (line 24) |
| **Database tables** | `reconciliation_runs`, `payment_transactions`, `wallet_transactions`, `billing_ledger_entries` |
| **Current status** | 🟡 **AMBER** — implemented but manual-only |

**GAP ID: GAP-006**

| Attribute | Value |
|---|---|
| **Business impact** | Discrepancies go undetected between WS1 records and billing ledger |
| **Technical impact** | No automated daily reconciliation; no alerting on exceptions |
| **Risk** | MEDIUM |
| **Exact source files** | `src/server/services/billing/reconciliation-engine.ts`, `src/app/api/billing/reconciliation/run/route.ts`, `vercel.json` |
| **Required change** | Add reconciliation to `vercel.json` cron schedule (e.g., 00:30 daily); add exception alerting |
| **Dependencies** | CRON_SECRET env var |
| **Test requirement** | Verify reconciliation runs on schedule and detects missing_ledger / amount_mismatch |
| **Acceptance criteria** | Daily reconciliation run creates `reconciliation_runs` record; exceptions raise alerts |

---

### 3.10 Merchant Statement (RED)

| Attribute | Value |
|---|---|
| **Current implementation** | ❌ Not found in source code |
| **Actual trigger** | — |
| **Source file** | — |
| **Current status** | 🔴 **RED** — missing |

**GAP ID: GAP-007**

| Attribute | Value |
|---|---|
| **Business impact** | Merchants cannot view their settlement/payout statement; regulatory reporting gap |
| **Technical impact** | No statement table, generation service, or API |
| **Risk** | MEDIUM |
| **Exact source files** | None (new capability) |
| **Required change** | Create merchant statement generation (aggregate `billing_events` + `merchant_payouts` + `billing_settlements` per merchant per period) |
| **Dependencies** | GAP-004 (settlement reconciliation) |
| **Test requirement** | Verify merchant statement reflects all transactions + payouts + settlements for a period |
| **Acceptance criteria** | Merchant statement API returns complete per-merchant period summary |

---

### 3.11 Consumer Statement (RED)

| Attribute | Value |
|---|---|
| **Current implementation** | ❌ Not found in source code |
| **Actual trigger** | — |
| **Source file** | — |
| **Current status** | 🔴 **RED** — missing |

**GAP ID: GAP-008**

| Attribute | Value |
|---|---|
| **Business impact** | Consumers cannot view their voucher purchase/spend history as a statement |
| **Technical impact** | No consumer statement table, generation service, or API |
| **Risk** | MEDIUM |
| **Exact source files** | None (new capability) |
| **Required change** | Create consumer statement generation (aggregate `payment_transactions` + `customer_vouchers` per customer per period) |
| **Dependencies** | None |
| **Test requirement** | Verify consumer statement reflects all purchases + vouchers for a period |
| **Acceptance criteria** | Consumer statement API returns complete per-customer period summary |

---

### 3.12 Audit Trail (GREEN)

| Attribute | Value |
|---|---|
| **Current implementation** | `writeAuditEvent()` writes `audit_events` for purchase, webhook, billing event creation |
| **Actual trigger** | Synchronous |
| **Source file** | `src/server/utils/audit.ts` |
| **Function/route** | `writeAuditEvent()` |
| **Database tables** | `audit_events` |
| **Current status** | 🟢 **GREEN** |

**Gap:** None. Audit events are written for purchases, webhooks, and billing event creation.

---

### 3.13 Treasury (RED)

| Attribute | Value |
|---|---|
| **Current implementation** | ❌ Not found in source code |
| **Actual trigger** | — |
| **Source file** | — |
| **Current status** | 🔴 **RED** — missing |

**GAP ID: GAP-009**

| Attribute | Value |
|---|---|
| **Business impact** | No cash-flow / treasury visibility; platform liability position unknown |
| **Technical impact** | No treasury module; ledger exists but no treasury view |
| **Risk** | MEDIUM |
| **Exact source files** | None (new capability) |
| **Required change** | Create treasury view (aggregate `billing_ledger_entries` by account: asset:cash, liability:voucher_outstanding, liability:merchant_payable, revenue:platform_benefit) |
| **Dependencies** | GAP-003, GAP-004 |
| **Test requirement** | Verify treasury view balances with ledger |
| **Acceptance criteria** | Treasury view shows asset/liability/revenue balances reconciled to ledger |

---

### 3.14 Revenue Analytics (AMBER)

| Attribute | Value |
|---|---|
| **Current implementation** | Dashboard aggregates totals; no dedicated analytics module |
| **Actual trigger** | API |
| **Source file** | `src/app/api/billing/dashboard/route.ts` |
| **Current status** | 🟡 **AMBER** — aggregates exist, no dedicated analytics |

**GAP ID: GAP-010**

| Attribute | Value |
|---|---|
| **Business impact** | Revenue trends, merchant performance, channel analytics not available |
| **Technical impact** | Dashboard is ad-hoc aggregation; no analytics tables/views |
| **Risk** | LOW-MEDIUM |
| **Exact source files** | `src/app/api/billing/dashboard/route.ts` |
| **Required change** | Add revenue analytics endpoints (daily/weekly/monthly revenue, merchant breakdown, channel breakdown) |
| **Dependencies** | None |
| **Test requirement** | Verify analytics match dashboard totals |
| **Acceptance criteria** | Revenue analytics API returns correct period-over-period figures |

---

### 3.15 Outbox Worker (GREEN)

| Attribute | Value |
|---|---|
| **Current implementation** | Processes `platform_event_outbox` pending/failed events, retries up to 5, dead-letters after |
| **Actual trigger** | Cron (00:15 daily) + manual POST |
| **Source file** | `src/app/api/cron/process-outbox/route.ts` |
| **Function/route** | `GET`/`POST` |
| **Database tables** | `platform_event_outbox`, `platform_events` |
| **Current status** | 🟢 **GREEN** |

**Gap:** None for function. Retry limit of 5 is reasonable; dead-letter polled only if cron runs.

---

### 3.16 Billing Engine Portal — Realtime (GREEN)

| Attribute | Value |
|---|---|
| **Current implementation** | `usePlatformEvents.js` subscribes to `platform_events` INSERT |
| **Actual trigger** | Realtime push |
| **Source file** | `billing-engine-portal/src/hooks/usePlatformEvents.js` |
| **Function/route** | `usePlatformEvents()` |
| **Database tables** | `platform_events` |
| **Realtime dependencies** | Supabase Realtime + RLS |
| **Current status** | 🟢 **GREEN** |
| **Gap** | ⚠️ RLS on `platform_events` anon read **must be verified** (Realtime dependency) |

---

### 3.17 Billing Engine Portal — API (GREEN)

| Attribute | Value |
|---|---|
| **Current implementation** | `portal-api.js` calls `/api/billing/*` with X-Portal-* headers |
| **Actual trigger** | API calls |
| **Source file** | `billing-engine-portal/src/api/portal-api.js` |
| **Function/route** | `portalFetchJson()` |
| **Current status** | 🟢 **GREEN** |
| **Gap** | ⚠️ CORS headers not verified on all `/api/billing/*` routes (only `/api/billing/events` verified) |

---

### 3.18 Webhook Billing Failure Handling (ORANGE)

| Attribute | Value |
|---|---|
| **Current implementation** | `catch {}` — silently swallows billing failures in webhook |
| **Actual trigger** | Webhook POST |
| **Source file** | `src/app/api/v1/payments/webhook/route.ts` (line 180) |
| **Current status** | 🟠 **ORANGE** — failures invisible |

**GAP ID: GAP-011**

| Attribute | Value |
|---|---|
| **Business impact** | A financial transaction could complete (webhook 200) but billing records silently missing |
| **Technical impact** | No retry, no alert, no trace of billing failure |
| **Risk** | **HIGH** |
| **Exact source files** | `src/app/api/v1/payments/webhook/route.ts` |
| **Required change** | Replace silent `catch {}` with error logging + retry/alert mechanism (e.g., write to outbox or error table) |
| **Dependencies** | GAP-001 (single billing entry point) |
| **Test requirement** | Simulate billing failure → verify it is logged/retried/alerted |
| **Acceptance criteria** | No billing failure is silent; all failures are recorded and retried |

---

### 3.19 Portal Environment Configuration (ORANGE)

| Attribute | Value |
|---|---|
| **Current implementation** | `VITE_PORTAL_API_BASE_URL=https://www.evoucher.co.za` (production) |
| **Actual trigger** | Portal API client |
| **Source file** | `billing-engine-portal/.env.local` (line 15) |
| **Current status** | 🟠 **ORANGE** — correct for production, wrong for local dev |

**GAP ID: GAP-012**

| Attribute | Value |
|---|---|
| **Business impact** | Local dev portal calls production API — confusing data, potential accidental writes |
| **Technical impact** | API-based views hit production when running locally |
| **Risk** | MEDIUM |
| **Exact source files** | `billing-engine-portal/.env.local` |
| **Required change** | Set `VITE_PORTAL_API_BASE_URL=http://localhost:4028` for local dev; keep production URL for prod builds |
| **Dependencies** | None |
| **Test requirement** | Verify portal local dev calls local API |
| **Acceptance criteria** | Local dev portal uses localhost; production build uses evoucher.co.za |

---

## 4. Duplicate/Competing Implementation Paths

| # | Path A | Path B | Risk | GAP ID |
|---|---|---|---|---|
| 1 | `publishPlatformEvent()` → `recordVoucherPurchaseBillingEvent()` | Direct `recordVoucherPurchaseBillingEvent()` call (webhook + purchase-completion) | MEDIUM — redundant processing | GAP-001 |
| 2 | `src/server/services/bankserv/adaptor.ts` (writes `bankserv_adaptor_transactions`) | `src/lib/bankserv-adaptor.ts` (writes `transactions`) | **HIGH** — divergence | GAP-003 |
| 3 | `recordVoucherPurchaseBillingEvent()` (active) | `createBillingEvent()` (orphaned) | LOW — dead code | GAP-002 |
| 4 | `billing_settlements` (billing engine) | `bankserv_adaptor_transactions` (BankServ queue) | **HIGH** — divergence | GAP-004 |

---

## 5. Data Creation vs Event Propagation vs Processing Distinction

| Capability | Data Created | Event Propagated | Processed | Settled | Reconciled | Portal Visible |
|---|---|---|---|---|---|---|
| Purchase | ✅ | ✅ | ✅ | ✅ (queued) | ⚠️ (manual) | ✅ |
| Platform Event | ✅ | ✅ | ✅ | — | — | ✅ (Realtime) |
| Billing Event | ✅ | ✅ | ✅ | — | ⚠️ | ✅ |
| Ledger | ✅ | ✅ | ✅ | — | ⚠️ | ✅ |
| Merchant Payout | ✅ | ⚠️ (no SETTLEMENT_QUEUED event) | ⚠️ (pending only) | ⚠️ | ⚠️ | ✅ |
| Settlement | ✅ | ❌ (no SETTLEMENT_SUBMITTED/CONFIRMED published) | ⚠️ (cron legacy) | ⚠️ | ❌ | ✅ |
| Reconciliation | ⚠️ (manual) | ❌ | ⚠️ | — | ⚠️ | ✅ |
| Merchant Statement | ❌ | ❌ | ❌ | — | ❌ | ❌ |
| Consumer Statement | ❌ | ❌ | ❌ | — | ❌ | ❌ |
| Audit | ✅ | — | ✅ | — | — | ✅ |
| Treasury | ❌ | ❌ | ❌ | — | ❌ | ❌ |
| Revenue Analytics | ⚠️ (dashboard) | ❌ | ⚠️ | — | ❌ | ✅ |
| Dashboard | ✅ | — | ✅ | — | — | ✅ |

**Key insight:** Several capabilities create data but do NOT propagate lifecycle events (settlement lifecycle), do NOT process further (payout remains pending), and do NOT reconcile (manual-only).

---

## 6. Implementation Priority

### P0 — Financial Correctness / Production Blockers

| Priority | GAP ID | Gap | Rationale |
|---|---|---|---|
| P0-1 | GAP-003 | Dual BankServ adaptors | Divergence risk is HIGH; financial reconciliation impossible |
| P0-2 | GAP-011 | Webhook silent billing failure | Financial transaction could silently miss billing records |
| P0-3 | GAP-005 | ACK/NCK not gating payouts | Financial-control gap; payouts without confirmation |

### P1 — Core Billing Engine Synchronisation

| Priority | GAP ID | Gap | Rationale |
|---|---|---|---|
| P1-1 | GAP-001 | Duplicate billing-event invocation | Redundant processing; single-entry-point correctness |
| P1-2 | GAP-004 | Settlement processing dual path | Settlement tables must converge |
| P1-3 | GAP-002 | Orphaned legacy recorder | Dead code removal for clarity |

### P2 — Reconciliation / Settlement Reliability

| Priority | GAP ID | Gap | Rationale |
|---|---|---|---|
| P2-1 | GAP-006 | Reconciliation manual-only | Automated daily reconciliation required |
| P2-2 | GAP-009 | Treasury missing | Ledger exists; treasury view needed |

### P3 — Portal / Dashboard Synchronisation

| Priority | GAP ID | Gap | Rationale |
|---|---|---|---|
| P3-1 | GAP-012 | Portal env misconfig | Local dev correctness |
| P3-2 | (no ID) | CORS audit on all `/api/billing/*` | Portal API reliability |
| P3-3 | (no ID) | Verify RLS on `platform_events` | Realtime dependency |

### P4 — Observability / Operational Improvements

| Priority | GAP ID | Gap | Rationale |
|---|---|---|---|
| P4-1 | GAP-010 | Revenue analytics | Enhanced business intelligence |
| P4-2 | GAP-007 | Merchant statement | Merchant-facing reporting |
| P4-3 | GAP-008 | Consumer statement | Consumer-facing reporting |

---

## 7. Definition of Done

The Billing Engine synchronisation is **COMPLETE** when ALL of the following measurable acceptance criteria are met:

### Financial Correctness

- [ ] **One successful purchase produces exactly one financial transaction** (one `payment_transactions` row).
- [ ] **Required ledger entries are created exactly once** (one double-entry group per transaction in `billing_ledger_entries`).
- [ ] **Required billing events are created exactly once** (one `billing_events` row per transaction).
- [ ] **Settlement records are created correctly** (one `billing_settlements` row + one `bankserv_adaptor_transactions` row per transaction).
- [ ] **Duplicate event delivery does not create duplicate financial postings** (idempotency verified under concurrent re-delivery).
- [ ] **Failed downstream processing can be retried safely** (outbox retry produces no duplicates).
- [ ] **No financial transaction silently disappears** (webhook billing failures are recorded + retried + alerted).

### Reconciliation

- [ ] **Reconciliation can identify the transaction** (daily run finds it in both `payment_transactions` and `billing_ledger_entries` with zero exceptions).
- [ ] **Reconciliation runs automatically on a schedule** (cron-configured, not manual-only).

### Statements

- [ ] **Merchant statement reflects the transaction** (per-merchant period statement includes the transaction, payout, and settlement).
- [ ] **Consumer statement reflects the transaction** (per-customer period statement includes the purchase and voucher).

### Audit

- [ ] **Audit record exists** (one `audit_events` row for the purchase with `voucher_purchase_completed` action).

### Portal / Dashboard

- [ ] **Billing dashboard reflects the transaction** (totals include the new transaction).
- [ ] **Billing Engine Portal reflects the transaction** (Realtime feed shows the platform event; dashboard/ledger/settlement views show the data).
- [ ] **All critical APIs are authenticated** (portal routes require X-Portal-passcode or portal session; cron routes require CRON_SECRET).
- [ ] **Production-critical scheduled endpoints are protected** (outbox + settlement cron require Bearer CRON_SECRET or Vercel cron UA).

### Consolidation

- [ ] **No duplicate/competing implementation paths remain** (single BankServ adaptor, single billing entry point, no orphaned legacy recorder).

---

## 8. Implementation Readiness

### READY / NOT READY

**Status: NOT READY**

**Why:**

1. **The evidence base is now complete** — `BILLING_ENGINE_HISTORICAL_RECONCILIATION.md` and `BILLING_ENGINE_CURRENT_STATE.md` are the authoritative baselines, and this matrix identifies 12 concrete gaps with priorities, dependencies, and acceptance criteria.

2. **However, implementation must NOT begin yet** because:
   - The **P0 financial-correctness gaps** (GAP-003 dual BankServ adaptors, GAP-011 webhook silent failure, GAP-005 ACK/NCK gating) touch money-moving code paths and require careful sequencing.
   - GAP-003 must be resolved **first** because it underpins settlement, reconciliation, treasury, and merchant statements (GAP-004, GAP-006, GAP-009, GAP-007 all depend on it).
   - The **Definition of Done** criteria are not yet met by the current system — reconciliation is manual, statements are missing, treasury is missing, and duplicate paths exist.

3. **Recommended next step:** Begin implementation strictly in **P0 order** (GAP-003 → GAP-011 → GAP-005), with each change verified against the Definition of Done acceptance criteria before proceeding.

---

**Generated by:** Cline (source-code trace)  
**Evidence Base:** `BILLING_ENGINE_HISTORICAL_RECONCILIATION.md`, `BILLING_ENGINE_CURRENT_STATE.md`, verified source code  
**Date:** 2026-08-08