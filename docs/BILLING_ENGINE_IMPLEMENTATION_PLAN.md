# 🔧 Billing Engine — Controlled Implementation Plan (P0)

**Date:** 2026-08-08  
**Status:** ✅ ENGINEERING CONTRACT — APPROVED FOR EXECUTION PREPARATION  
**Evidence Base:** `BILLING_ENGINE_HISTORICAL_RECONCILIATION.md`, `BILLING_ENGINE_CURRENT_STATE.md`, `BILLING_ENGINE_GAP_IMPLEMENTATION_MATRIX.md` + verified source code  
**Scope:** Controlled implementation plan for **P0-1 GAP-003**, **P0-2 GAP-011**, **P0-3 GAP-005** only.  
**Constraint:** Do NOT modify production code while producing this plan. Do NOT refactor unrelated code. Do NOT introduce new architecture unless required by the documented gaps. Preserve existing functionality.

---

## 0. Implementation Sequence Summary

| Step | GAP | Name | Rationale for Order |
|---|---|---|---|
| **1** | **GAP-003** | Dual BankServ adaptors | **Root cause** — settlement, reconciliation, treasury, and merchant statements all depend on a single settlement source of truth. Must be fixed first to prevent divergence. |
| **2** | **GAP-011** | Silent webhook billing failure | After the single settlement path is established, the billing trigger path must be made safe (no silent failures). Depends on knowing the single billing entry point from GAP-003 work. |
| **3** | **GAP-005** | ACK/NCK payout gating | Final financial-control gate — requires the settled adaptor path (GAP-003) to be in place before ACK/NCK can gate payouts reliably. |

**Why GAP-003 first:** The legacy adaptor (`src/lib/bankserv-adaptor.ts`) and current adaptor (`src/server/services/bankserv/adaptor.ts`) write to different tables (`transactions` vs `bankserv_adaptor_transactions`). Until this is consolidated, any settlement/ACK/NCK/payout logic built on either path will diverge, making GAP-005 and all downstream financial controls unreliable.

---

# P0-1 — GAP-003: Dual BankServ Adaptors

## 1. Current Behaviour

Two independent BankServ settlement implementations exist and are both active:

| | Legacy Path | Current Path |
|---|---|---|
| **Source file** | `src/lib/bankserv-adaptor.ts` | `src/server/services/bankserv/adaptor.ts` |
| **Writes to** | `transactions` table (legacy), `settlement_batches` | `bankserv_adaptor_transactions`, `billing_bank_linkages` |
| **Functions** | `createSettlementBatch()`, `generateBankServBatchFile()`, `submitSettlementInstruction()`, `processBankServResponse()` | `queueBankservSettlementTransaction()`, `deriveSettlementAmount()`, `mapPaymentMethodToBankservRail()`, `isBankservAdaptorCompatibilityError()` |
| **Consumers** | `/api/cron/settlement/route.ts`, `/api/v1/settlement/batch/route.ts`, `/api/v1/settlement/bankserv-webhook/route.ts` | `src/app/api/v1/vouchers/purchase/route.ts`, `src/app/api/v1/payments/webhook/route.ts`, `src/server/services/billing/purchase-completion.ts` |

## 2. Required Target Behaviour

A **single** BankServ adaptor path must handle the full settlement lifecycle (queue → batch → file → submit → ACK/NCK → confirm). No writes to the legacy `transactions` table. The current (`src/server/services/bankserv/adaptor.ts`) path is the **canonical** adaptor; the legacy (`src/lib/bankserv-adaptor.ts`) path is **deprecated and disconnected**.

## 3. Exact Files

**To modify:**
- `src/app/api/cron/settlement/route.ts` — rewire from legacy `src/lib/bankserv-adaptor.ts` to current `src/server/services/bankserv/adaptor.ts`
- `src/app/api/v1/settlement/batch/route.ts` — rewire to current adaptor
- `src/app/api/v1/settlement/bankserv-webhook/route.ts` — rewire `processBankServResponse` equivalent to current tracking
- `vercel.json` — keep cron schedule; path unchanged

**To deprecate / remove (disconnect only, keep file for traceability during transition):**
- `src/lib/bankserv-adaptor.ts` — add `@deprecated` JSDoc + re-export shim or remove entirely after all consumers migrated

**NOT to modify:**
- `src/server/services/bankserv/adaptor.ts` — canonical path, stable
- `src/server/services/billing/billing-events.ts` — unrelated chain

## 4. Exact Functions/Routes

| Function/Route | Current | Target |
|---|---|---|
| `/api/cron/settlement` GET/POST | imports `createSettlementBatch`, `generateBankServBatchFile` from `@/lib/bankserv-adaptor` | use batch creation + file generation via `src/server/services/bankserv/adaptor.ts` |
| `/api/v1/settlement/batch` POST | imports from `@/lib/bankserv-adaptor` | use current adaptor |
| `/api/v1/settlement/bankserv-webhook` POST | `processBankServResponse` from legacy | route to `processAckNckRecord` / `enqueueAckNckTracking` (see GAP-005) |

## 5. Database Tables Affected

- `transactions` (legacy) — **stop writing**; existing rows retained for historical/audit
- `bankserv_adaptor_transactions` — canonical active table
- `settlement_batches` — currently written by legacy `createSettlementBatch()`; must be produced by the current adaptor path instead (or the batch lifecycle routes already present under `/api/v1/admin/settlements/batches/*` must be the sole batch creation path)

## 6. Event-Flow Changes

- `SETTLEMENT_QUEUED` / `SETTLEMENT_SUBMITTED` / `SETTLEMENT_CONFIRMED` platform events are declared but never published. After consolidation, the batch submit/confirm routes should publish these via `publishPlatformEvent()` so the portal Realtime feed reflects settlement lifecycle.
- No change to `VOUCHER_PURCHASED` / `VOUCHER_REDEEMED` events.

## 7. Dependencies

- GAP-001 must NOT be implemented before this (do not remove direct `recordVoucherPurchaseBillingEvent()` calls while settlement paths are being consolidated).
- Requires the existing `/api/v1/admin/settlements/batches/*` lifecycle endpoints to remain stable.
- Requires `CRON_SECRET` env var for the settlement cron.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Breaking the nightly settlement cron | Keep cron schedule; test manually before relying on schedule |
| Legacy `transactions` rows orphaned | Keep table; add reconciliation query comparing legacy vs current |
| Dual-write during transition | Disconnect legacy consumers in one PR; verify zero writes to `transactions` after |
| `settlement_batches` batch creation logic lost | Map legacy `createSettlementBatch()` behavior into current path or reuse existing admin batch endpoints |

## 9. Security Considerations

- Settlement cron remains protected by `CRON_SECRET` Bearer or Vercel cron UA.
- `/api/v1/settlement/batch` and `/api/v1/settlement/bankserv-webhook` must keep admin/portal auth.
- No new secrets introduced.

## 10. Idempotency Considerations

- `queueBankservSettlementTransaction()` already idempotent by `transaction_reference`.
- Batch creation must be idempotent by day/rail (do not create duplicate batches on repeated cron runs).

## 11. Required Automated Tests

- `tests/bankserv-adaptor.test.ts` — extend to cover the consolidation contract
- `tests/bankserv-formatter.test.ts` — keep green
- New: test that after consolidation, no writes target `transactions` table
- New: test that settlement cron uses current adaptor (mock `createAdminClient`)

## 12. Manual Verification Steps

1. Trigger `/api/cron/settlement` manually with `CRON_SECRET`.
2. Verify `settlement_batches` created via current path.
3. Verify `bankserv_adaptor_transactions` updated (batched/submitted).
4. Verify zero new rows in legacy `transactions`.
5. Verify portal settlements tab + BankServ tab reflect the batch.

## 13. Rollback Strategy

- Keep `src/lib/bankserv-adaptor.ts` in the repo (deprecated, not deleted) during the transition.
- Revert `vercel.json` cron to legacy path if the new path fails in a nightly run.
- Legacy `transactions` table untouched means no data loss on rollback.

## 14. Definition of Done

- [ ] Single settlement write path in production (`bankserv_adaptor_transactions`).
- [ ] Zero writes to legacy `transactions` table.
- [ ] `/api/cron/settlement` uses current adaptor.
- [ ] Settlement batch + file generation verified manually.
- [ ] All existing `bankserv-*.test.ts` green.

---

# P0-2 — GAP-011: Silent Webhook Billing Failure

## 1. Current Behaviour

In `src/app/api/v1/payments/webhook/route.ts` (line 180), `recordVoucherPurchaseBillingEvent()` is wrapped in an empty `catch {}`:

```typescript
try {
  await recordVoucherPurchaseBillingEvent(admin, { ... });
} catch {
  // billing failure must never block the webhook response
}
```

A billing failure is **silently swallowed** — no log, no retry, no alert, no outbox entry. A financial transaction can complete (webhook returns 200) while billing records are missing.

## 2. Required Target Behaviour

The webhook must **never block the payment response** (200 to the payment provider) BUT must guarantee that a billing failure is **recorded, retried, and alerted** — consistent with the outbox pattern already used by `publishPlatformEvent()`.

Target: on billing failure, write a failure marker (e.g., insert into `platform_event_outbox` with `status=failed` or a dedicated `billing_failures` log) so the existing `/api/cron/process-outbox` worker can retry it.

## 3. Exact Files

**To modify:**
- `src/app/api/v1/payments/webhook/route.ts` (line 180 area)

**To reference (NOT modify):**
- `src/lib/platform-events.ts` — `publishPlatformEvent()` is the canonical non-blocking publisher
- `src/app/api/cron/process-outbox/route.ts` — existing retry worker

## 4. Exact Functions/Routes

| Function/Route | Current | Target |
|---|---|---|
| `src/app/api/v1/payments/webhook/route.ts` `POST` (line 164-182) | Direct `recordVoucherPurchaseBillingEvent()` call with silent `catch {}` | Replace both the direct call AND `publishPlatformEvent()` (lines 164 + 184) with a **single** `await publishPlatformEvent(...)` (which never throws and writes to outbox on failure) — this resolves GAP-001 for the webhook too |

> **Note:** This is consistent with GAP-001 (duplicate invocation removal) but scoped strictly to the webhook's reliability. The webhook's dual call (direct recorder + publisher) is replaced by the single publisher; the publisher's billing handler failure is already written to `platform_events.status=failed` and the outbox worker retries it.

## 5. Database Tables Affected

- `platform_events` — status transitions (processing → processed | failed)
- `platform_event_outbox` — pending → sent | failed → dead_letter (existing worker)
- `billing_events`, `billing_ledger_entries`, `merchant_payouts`, `billing_settlements`, `billing_invoices` — created exactly once via idempotent `recordVoucherPurchaseBillingEvent()` after retry

## 6. Event-Flow Changes

- Webhook no longer invokes the billing recorder directly.
- Webhook publishes `VOUCHER_PURCHASED` once; billing chain is driven solely by `publishPlatformEvent()`.
- Failure path: publisher marks `platform_events.status=failed`; outbox worker retries via `/api/billing/events` gateway.

## 7. Dependencies

- GAP-003 (settlement consolidation) must be complete so the webhook's `queueBankservSettlementTransaction()` still targets the canonical table.
- `publishPlatformEvent()` remains the single billing entry point.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Removing direct recorder call could delay billing if publisher fails silently | Publisher already writes failure status + returns null; enhance to log error with transaction ref |
| Payment provider retries webhook → duplicate `VOUCHER_PURCHASED` | Idempotency: `payment_webhook_events` unique on `provider_event_id` (line 62-73) already returns `ignored_duplicate`; `publishPlatformEvent` idempotent by `event_id` |
| Behavior change in webhook response | Response shape unchanged; only internal invocation path changes |

## 9. Security Considerations

- Webhook HMAC signature verification unchanged.
- No new tokens/secrets.
- Publishing from webhook uses server-side admin client as today.

## 10. Idempotency Considerations

- `publishPlatformEvent()` ids idempotent by `event_id`.
- `recordVoucherPurchaseBillingEvent()` idempotent by `event_key` (= transaction reference).
- `payment_webhook_events` unique on `provider_event_id` prevents duplicate webhook processing.
- Retry safety: outbox worker re-POSTs to `/api/billing/events` which checks `platform_events` by `event_id` and returns duplicate status without re-posting.

## 11. Required Automated Tests

- Extend `tests/webhook-route.test.ts`:
  - Case A: simulate billing handler failure → webhook still returns 200.
  - Case B: verify `platform_events` row exists with `status=failed` + `error_message`.
  - Case C: re-run same webhook (duplicate `provider_event_id`) → returns `ignored_duplicate`, no second billing row.
- New idempotency test: two `publishPlatformEvent()` calls with same `event_id` → one `platform_events` row, one billing row.

## 12. Manual Verification Steps

1. Send a test webhook via `scripts/send-webhook-test.js`.
2. Confirm webhook returns 200.
3. Query `platform_events` for the transaction ref → status `processed` (or `failed` if billing handler intentionally broken in a test).
4. Run `/api/cron/process-outbox` manually → confirm failed event retried to processed.
5. Confirm exactly one set of billing records in `billing_events`, `billing_ledger_entries`, `merchant_payouts`, `billing_settlements`, `billing_invoices`.

## 13. Rollback Strategy

- Revert webhook to the existing dual-call + silent catch; no data loss because idempotency guards prevent duplicates.
- The `platform_events`/outbox rows created during the window remain valid and can be replayed.

## 14. Definition of Done

- [ ] Webhook contains exactly one billing trigger (`publishPlatformEvent()`), no direct recorder call.
- [ ] Billing failure is recorded (`platform_events.status=failed` + `error_message`) — never silent.
- [ ] Outbox worker retries failed billing to completion.
- [ ] Webhook still returns 200 under billing failure.
- [ ] One purchase → exactly one set of billing records (idempotency verified).

---

# P0-3 — GAP-005: ACK/NCK Payout Gating

## 1. Current Behaviour

- ACK/NCK tracking is **fully implemented** in `src/server/services/bankserv/ack-nck-retry.ts`:
  - `enqueueAckNckTracking()` — called on batch submit (`src/app/api/v1/admin/settlements/batches/[id]/submit/route.ts` line 44)
  - `processAckNckRecord()` — handles acked/nacked with exponential backoff (30s → max 30m), max 5 retries, escalation to `ACK_FAILED` + audit event
  - `processAllDueAckNckRecords()` — processes due records (cron/webhook entry point)
  - `findDueAckNckRecords()` — finds pending/retrying due records
- **However, the batch approval route does NOT check ACK/NCK status:**
  - `src/app/api/v1/admin/settlements/batches/[id]/approve/route.ts` (lines 26-46) approves a batch and sets `billing_settlements.status='approved'` **without any ACK check**.
- `BILLING_BANKSERV_MODE=mock` (default) auto-acks all records — test-only behavior.

## 2. Required Target Behaviour

Settlement payout must be **gated on ACK status**:
- **ACKED** → batch can be approved (payout proceeds).
- **NACKED / ESCALATED / PENDING-with-retries-exceeded** → batch approval must be **blocked** with a clear error; processing continues via retry or manual review.
- The `approve` route must read `bankserv_ack_nck_tracking` for the batch and enforce the gate.

## 3. Exact Files

**To modify:**
- `src/app/api/v1/admin/settlements/batches/[id]/approve/route.ts` — insert ACK/NCK gate before `billing_settlement_batches` update

**To reference (NOT modify):**
- `src/server/services/bankserv/ack-nck-retry.ts` — `AckNckRecord`, `AckNckStatus` types
- `src/app/api/v1/admin/settlements/batches/[id]/submit/route.ts` — already enqueues tracking
- `src/app/api/cron/settlement/route.ts` — batch creation (GAP-003 rewired)

## 4. Exact Functions/Routes

| Function/Route | Current | Target |
|---|---|---|
| `src/app/api/v1/admin/settlements/batches/[id]/approve/route.ts` `POST` | Updates batch → approved + settlements → approved (no ACK check) | **Gate:** query `bankserv_ack_nck_tracking` where `entity_type='batch'` + `entity_id=batchId`; if latest status not `acked` → return 409 with ACK status; only then approve |

## 5. Database Tables Affected

- `bankserv_ack_nck_tracking` — read (gate), no write changes from this GAP
- `billing_settlement_batches` — status transitions unchanged (approval only when gated)
- `billing_settlements` — status transitions unchanged
- `batch_files` — existing `ACK_FAILED` escalation marker (set by `escalateToManualReview`)

## 6. Event-Flow Changes

- No new events required for the gate itself.
- Optionally publish `SETTLEMENT_APPROVED` platform event on successful gated approval (extends the declared but unpublished settlement lifecycle events; aligned with GAP-003 event-flow work).

## 7. Dependencies

- GAP-003 (single adaptor + canonical settlement tables) — the ACK/NCK tracking must reference the same batch lifecycle used for payout.
- `BILLING_BANKSERV_MODE` semantics: in `mock` mode all records auto-ack (gate always passes); in `real` mode the gate is enforced.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Blocking approvals in mock mode (if mode misread) | Explicitly honor `BILLING_BANKSERV_MODE=mock` → auto-acked → gate passes |
| No ACK/NCK record exists for a batch (legacy batches) | Gate must treat missing record as **PENDING-UNVERIFIED** → block with clear error OR allow only if batch submitted via new path; document behavior |
| Approval workflow disruption | Fail-closed: if record missing or not acked, block approval with explicit message |
| NACKED batch stuck forever | Escalation already writes `ACK_FAILED` + audit; manual review flow exists |

## 9. Security Considerations

- Approval route already requires `requirePortalRole(user, ['admin','finance_approver'])` (line 16) — unchanged.
- The gate is server-side; no client-supplied ACK status accepted.
- Audit event `settlement_batch_approved` retained; add `ackStatus` metadata.

## 10. Idempotency Considerations

- Approval is idempotent at the batch level (a second approve updates status again; gate re-evaluated).
- Gate must be deterministic: same ACK status → same approval decision.
- ACK/NCK tracking upsert (`enqueueAckNckTracking`) should be idempotent per `entity_type`+`entity_id` (re-submit should not create duplicate tracking records).

## 11. Required Automated Tests

- New: `tests/ack-nck-payout-gating.test.ts`:
  - Case A: batch with `acked` tracking → approve succeeds.
  - Case B: batch with `nacked` tracking → approve returns 409, batch stays un-approved.
  - Case C: batch with `escalated` tracking → approve blocked.
  - Case D: batch with missing tracking record → blocked (fail-closed) with clear error.
  - Case E: `BILLING_BANKSERV_MODE=mock` → approve succeeds (auto-ack).
- Keep existing `tests/bankserv-adaptor.test.ts` green.

## 12. Manual Verification Steps

1. Create settlement batch (via `/api/cron/settlement` or admin API).
2. Submit batch → verify `bankserv_ack_nck_tracking` row created (`entity_type='batch'`, status `pending`).
3. Process ACK/NCK (`/api/billing/bankserv/ack-nck/process`) → verify status `acked` or `nacked`.
4. Attempt approve:
   - If acked → success; batch + settlements → approved.
   - If nacked/escalated → 409 blocked with ACK status in error message.
5. Verify audit event `settlement_batch_approved` (with `ackStatus` metadata on success).

## 13. Rollback Strategy

- Revert approve route to no-gate version; ACK/NCK tracking data remains intact.
- No financial postings are altered by the gate itself — it only prevents approval transitions.
- If a batch is blocked incorrectly, admin can inspect `bankserv_ack_nck_tracking` and re-process ACK/NCK before retrying approval.

## 14. Definition of Done

- [ ] Approve route enforces ACK/NCK gate (acked → approve; nacked/escalated/missing → block with 409).
- [ ] Mock mode preserves current auto-ack behavior.
- [ ] Missing tracking record blocks approval (fail-closed) with explicit error.
- [ ] Audit event includes `ackStatus` metadata.
- [ ] All new + existing tests green.

---

# Cross-GAP Considerations

## Dependencies Between P0 Gaps

```
GAP-003 (single adaptor)
   │
   ├── enables ──► GAP-005 (ACK/NCK gate on the canonical batch lifecycle)
   │
   └── enables ──► GAP-011 (webhook publishes once; settlement queue targets canonical table)
```

## Shared Principles

1. **Single entry point** — `publishPlatformEvent()` is the only billing trigger; all direct recorder calls removed (GAP-001 fully resolved as a consequence of GAP-011 webhook work; purchase-completion/simulator cleanup deferred to P1).
2. **Fail-closed financial gates** — approval without ACK evidence fails closed.
3. **Idempotency preserved** — every new path reuses existing `event_id` / `event_key` / `source_id` / `transaction_reference` guards.
4. **No silent failures** — every failure is logged, recorded, retried, or delegated to manual review.

---

# Recommended Implementation Sequence (Final)

| Order | GAP | Justification |
|---|---|---|
| **1** | **P0-1 GAP-003** | Single settlement source of truth is foundational. Without it, ACK/NCK gating (GAP-005) and reliable webhook billing (GAP-011) cannot be trusted because they would reference divergent settlement tables. |
| **2** | **P0-2 GAP-011** | With the canonical settlement path settled, the webhook's billing trigger is made safe (single publish + outbox retry). Prevents silent financial data loss. |
| **3** | **P0-3 GAP-005** | Final financial-control gate. Requires the canonical batch lifecycle from GAP-003 to place the ACK/NCK gate correctly. |

Each GAP must be verified against its **Definition of Done** acceptance criteria before starting the next.

---

**Generated by:** Cline (source-code trace)  
**Evidence Base:** `BILLING_ENGINE_HISTORICAL_RECONCILIATION.md`, `BILLING_ENGINE_CURRENT_STATE.md`, `BILLING_ENGINE_GAP_IMPLEMENTATION_MATRIX.md`, verified source code  
**Date:** 2026-08-08