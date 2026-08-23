# eVoucher E2E Integration Audit

## A. Current Architecture

### High-Level Data Flow
```
Customer Purchase (www.evoucher.co.za)
    ↓
Payment Transaction Created
    ↓
Payment Confirmed (webhook)
    ↓
Voucher Issued
    ↓
Billing Event Recorded (billing_events)
    ↓
Ledger Entries Created (billing_ledger_entries)
    ↓
Merchant Payout Created (merchant_payouts)
    ↓
Settlement Record Created (billing_settlements)
    ↓
BankServ Adaptor Transaction (bankserv_adaptor_transactions)
    ↓
Settlement Batch (billing_settlement_batches)
    ↓
BankServ File Export / Webhook ACK
    ↓
Reconciliation Run
    ↓
Audit Event Logged
    ↓
Billing Engine Portal Display
```

### Technology Stack
- **Frontend**: Next.js 14.2.0, React 18.2.0, Tailwind CSS
- **Backend**: Next.js API Routes (server-side TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Billing Engine Portal**: Separate React app (billing-engine-portal/) with Vite
- **Real-time**: Supabase Realtime for platform events feed

## B. Transaction Lifecycle

### Canonical Transaction Identifier
**Transaction Reference** (`transaction_reference`) generated via `generateTransactionReference()` in `src/server/utils/security.ts`.

This identifier flows through:
1. `payment_transactions.transaction_reference` (primary)
2. `billing_events.event_key` (idempotency key)
3. `billing_ledger_entries.source_id`
4. `merchant_payouts.source_id`
5. `billing_settlements.source_id`
6. `billing_invoices.source_id`
7. `platform_events.transaction_ref`
8. `platform_event_outbox.payload.transaction_ref`
9. `bankserv_adaptor_transactions.transaction_reference`

### Lifecycle Stages Verified

| Stage | Implementation | Status |
|-------|---------------|--------|
| 1. Website Purchase | `POST /api/v1/vouchers/purchase` | ✅ Implemented |
| 2. Payment Confirmed | Webhook at `/api/v1/payments/webhook` | ✅ Implemented |
| 3. Voucher Issued | `DefaultVoucherService.issueVoucher()` | ✅ Implemented |
| 4. Billing Event | `recordVoucherPurchaseBillingEvent()` | ✅ Implemented |
| 5. Ledger Entries | Double-entry in same function | ✅ Implemented |
| 6. Merchant Payout | `merchant_payouts` insert | ✅ Implemented |
| 7. Invoice | `billing_invoices` insert | ✅ Implemented |
| 8. Settlement | `billing_settlements` insert | ✅ Implemented |
| 9. BankServ Queue | `queueBankservSettlementTransaction()` | ✅ Implemented |
| 10. Reconciliation | `/api/billing/reconciliation/run` | ✅ Implemented |
| 11. Audit Trail | `writeAuditEvent()` | ✅ Implemented |
| 12. Billing Engine | Portal reads via `/api/billing/*` | ⚠️ Mock by default |

## C. Source Files Involved

### Core Financial Flow
- `src/app/api/v1/vouchers/purchase/route.ts` — Purchase initiation
- `src/app/api/v1/payments/webhook/route.ts` — Payment confirmation & billing trigger
- `src/server/services/billing/billing-events.ts` — Billing event & ledger creation
- `src/lib/platform-events.ts` — Platform event publisher & outbox

### Settlement & BankServ
- `src/server/services/bankserv/adaptor.ts` — Canonical BankServ adaptor
- `src/app/api/cron/settlement/route.ts` — Daily settlement cron
- `src/app/api/v1/settlement/batch/route.ts` — Manual batch creation
- `src/app/api/v1/settlement/bankserv-webhook/route.ts` — BankServ ACK/NCK handler
- `src/lib/bankserv-adaptor.ts` — **LEGACY** (deprecated, no active consumers)

### Billing Engine Portal
- `billing-engine-portal/src/pages/BillingEngine.jsx` — Main portal page
- `billing-engine-portal/src/api/portal-api.js` — API client
- `billing-engine-portal/src/api/billing-mock-data.js` — Mock data (used by default)

### Supporting
- `src/server/utils/audit.ts` — Audit logging
- `src/lib/pricing.ts` — Discount pricing calculations
- `src/server/services/voucher/default-voucher-service.ts` — Voucher issuance

## D. Database Tables Involved

| Table | Purpose | Written By |
|-------|---------|------------|
| `payment_transactions` | Customer purchase record | Purchase route |
| `payment_webhook_events` | Webhook idempotency | Webhook route |
| `customer_vouchers` | Issued voucher | Voucher service |
| `platform_events` | Immutable event log | `publishPlatformEvent()` |
| `platform_event_outbox` | Retry queue for events | `publishPlatformEvent()` |
| `billing_events` | Financial event record | `recordVoucherPurchaseBillingEvent()` |
| `billing_ledger_entries` | Double-entry ledger | Same as above |
| `merchant_payouts` | Merchant payout calculation | Same as above |
| `billing_settlements` | Settlement record | Same as above |
| `billing_invoices` | Invoice generation | Same as above |
| `bankserv_adaptor_transactions` | BankServ queue | `queueBankservSettlementTransaction()` |
| `billing_settlement_batches` | Settlement batches | Cron / batch route |
| `bankserv_ack_nck_tracking` | ACK/NCK retry tracking | BankServ webhook |
| `bankserv_responses` | BankServ response log | BankServ webhook |
| `audit_events` (or `pasa_audit_log`) | Compliance trail | Various |

## E. API Endpoints Involved

### Website (Next.js)
- `POST /api/v1/vouchers/purchase` — Initiate purchase
- `POST /api/v1/payments/webhook` — Payment provider webhook
- `POST /api/cron/settlement` — Daily settlement batch (Vercel cron)
- `POST /api/v1/settlement/batch` — Manual batch creation
- `POST /api/v1/settlement/bankserv-webhook` — BankServ ACK/NCK
- `GET /api/v1/admin/settlements/batches` — List batches (portal auth)

### Billing Engine Portal APIs (proxied through website)
- `GET /api/billing/dashboard` — Dashboard totals
- `GET /api/billing/events` — Billing events list
- `GET /api/billing/ledger` — Ledger entries
- `GET /api/billing/merchant-payouts` — Payouts
- `GET /api/billing/settlements` — Settlements
- `GET /api/billing/invoices` — Invoices
- `POST /api/billing/reconciliation/run` — Trigger reconciliation
- `GET /api/billing/reconciliation/runs` — Reconciliation history
- `GET /api/v1/admin/audit-events` — Audit log

### Billing Engine Portal (internal)
- `GET /api/billing/bankserv/status` — BankServ status
- `POST /api/billing/events/replay` — Event replay

## F. Authentication/Service-to-Service Mechanism

### Website Internal
- **Admin Client**: `createAdminClient()` uses `SUPABASE_SERVICE_ROLE_KEY`
- **User Auth**: Supabase Auth via `getAuthenticatedUser()`
- **Portal Auth**: Custom header-based (`X-Portal-User`, `X-Portal-Role`, `X-Portal-Passcode`)

### Billing Engine Portal → Website
- **API Base**: `https://www.evoucher.co.za` (configurable via `VITE_PORTAL_API_BASE_URL`)
- **Headers**: 
  - `X-Portal-User`: session email
  - `X-Portal-Role`: user role
  - `X-Portal-Passcode`: admin passcode (`VITE_ADMIN_PASSCODE`)
- **Sandbox**: Separate auth via `VITE_SANDBOX_API_KEY`

### Service JWT (internal)
- `generateServiceJWT()` in `platform-events.ts` — HMAC-SHA256 signed JWT
- Used for potential service-to-service calls (currently not actively used in external calls)

## G. Current Deployment Configuration

### Vercel
- **Production URL**: `https://www.evoucher.co.za`
- **Cron Jobs**:
  - `/api/cron/specials-expiry` — Daily at midnight
  - `/api/cron/settlement` — Daily at 23:00
  - `/api/cron/process-outbox` — Daily at 00:15
- **Environment Variables**: `.vercel.production.env` / `.vercel.preview.env`

### Billing Engine Portal
- **Production URL**: `https://evoucher-billing-portal.vercel.app/BillingEngine`
- **Data Mode**: `VITE_BILLING_DATA_MODE` (default: `mock`, can be `portal`)

## H. Existing Gaps

### GAP-001: Direct Billing Call Redundancy
- **Location**: `src/app/api/v1/payments/webhook/route.ts` lines 163-185
- **Issue**: Webhook calls `recordVoucherPurchaseBillingEvent()` directly AND calls `publishPlatformEvent()` which ALSO calls the same billing recorder.
- **Impact**: Potential double-processing if outbox retry fires after direct call succeeds.
- **Status**: Needs cleanup — either remove direct call or make outbox conditional.

### GAP-011: Silent Catch (Already Identified)
- **Location**: `src/app/api/v1/payments/webhook/route.ts` lines 180-185
- **Previous State**: Empty catch block
- **Current State**: ✅ Already fixed — now logs diagnostic error
- **Verification Required**: Confirm no other silent catches exist.

### GAP-003: BankServ Adaptor (Already Verified)
- **Status**: ALREADY COMPLETE
- **Evidence**: 
  - Settlement routes use canonical `bankserv_adaptor_transactions` table
  - Legacy `src/lib/bankserv-adaptor.ts` is marked `@deprecated`
  - No active writes to legacy `transactions` or `settlement_batches` tables

### Critical Gap: Billing Engine Mock Data
- **Location**: `billing-engine-portal/src/pages/BillingEngine.jsx`
- **Issue**: Default data mode is `mock`, showing hardcoded demo data.
- **Impact**: Portal does NOT display real transactions unless `VITE_BILLING_DATA_MODE=portal` is set.
- **Required**: Switch to portal mode and verify real data flows.

### Critical Gap: No GitHub Actions CI/CD
- **Evidence**: No `.github/workflows/` directory found.
- **Impact**: No automated tests, builds, or deployments on commit.
- **Risk**: Production deployments may not be validated.

## I. Already-Completed GAPs

### GAP-003: BankServ Adaptor Migration
- **Status**: ALREADY COMPLETE
- **Evidence**:
  - `src/server/services/bankserv/adaptor.ts` is canonical
  - All settlement routes reference `bankserv_adaptor_transactions`
  - Legacy file explicitly marked deprecated

### GAP-011: Platform Event Outbox Observability
- **Status**: ALREADY MITIGATED
- **Evidence**: Webhook catch block now logs:
  ```typescript
  console.error(
    '[Webhook] Direct billing event recording failed (will be retried via platform event outbox):',
    billingError?.message ?? billingError
  );
  ```

## J. Risks

1. **Financial Data in Mock Mode**: Billing Engine portal defaults to mock data, hiding real financial state.
2. **No CI/CD**: Changes may reach production without automated validation.
3. **Duplicate Billing Path**: Webhook writes billing events AND publishes platform event that writes again.
4. **BankServ Simulation**: `simulateBankServSubmission()` in legacy adaptor suggests no real bank integration yet.
5. **Environment Config**: Multiple env files (.vercel.production.env, .vercel.preview.env) increase misconfiguration risk.
6. **Outbox Processing**: Cron runs at 00:15 — events published late in day may sit unprocessed for hours.

## K. Exact Recommended Implementation Order

### Phase 1: Verify Transaction Identifier (NON-INVASIVE)
1. Confirm `transaction_reference` is the canonical identifier
2. Document mapping across all tables
3. Add search/trace endpoint if missing

### Phase 2: Verify Website → Billing (NON-INVASIVE)
1. Create test transaction via `POST /api/v1/vouchers/purchase`
2. Trigger webhook (sandbox/simulator)
3. Query database to verify:
   - `billing_events` row exists
   - `billing_ledger_entries` rows exist
   - `merchant_payouts` row exists
   - `billing_settlements` row exists
   - `billing_invoices` row exists

### Phase 3: Verify GAP-003 (ALREADY DONE)
- Confirm no legacy table writes
- Document as complete

### Phase 4: Verify GAP-011 (MINOR FIX)
- Confirm diagnostic logging is present
- Check for other silent catches

### Phase 5: Billing Engine Integration (CONFIG CHANGE)
1. Set `VITE_BILLING_DATA_MODE=portal` in Vercel environment
2. Redeploy billing-engine-portal
3. Verify portal displays real data from `/api/billing/*`

### Phase 6: Billing Engine Data Verification (TESTING)
1. Verify transaction appears in all portal tabs
2. Check amounts match database
3. Verify merchant payout, consumer benefit, platform revenue calculations

### Phase 7: Infrastructure Dashboard (VERIFICATION)
1. Confirm dashboard reads from canonical tables
2. Verify no mock data in production

### Phase 8: Merchant Dashboard (VERIFICATION)
1. Verify merchant sees same transaction data
2. Check consistency with Billing Engine

### Phase 9: GitHub Actions (NEW INFRASTRUCTURE)
1. Create `.github/workflows/ci.yml`
2. Add `npm test`, `npm run type-check`, `npm run build`
3. Configure deployment protection

### Phase 10: Sponsor Bank/BankServ (VERIFICATION)
1. Document current status: likely file-generation only
2. Verify no real BankServ API credentials in environment
3. Set expectations: NOT live with FNB/RMB

### Phase 11: Test Transaction (EXECUTION)
1. Create controlled test with prefix `E2E-TEST-YYYYMMDD-HHMMSS`
2. Trace through entire lifecycle
3. Capture database evidence at each stage
4. Verify Billing Engine portal visibility

### Phase 12: Automated Tests (TESTING)
1. Run existing `npm test`
2. Run `npx tsc --noEmit`
3. Add missing tests for:
   - Webhook idempotency
   - Billing failure observability
   - Outbox retry
   - Settlement canonical path

### Phase 13: Database Reconciliation (TESTING)
1. Compare all amounts across tables
2. Verify: face value, consumer benefit, merchant settlement, platform revenue, bank fee, net payout
3. Document reconciliation formula

### Phase 14: Security (VERIFICATION)
1. Verify no secrets in client-side code
2. Check RLS policies
3. Verify webhook signatures
4. Confirm environment variable separation

### Phase 15: Final Status (DOCUMENTATION)
1. Produce `E2E_INTEGRATION_STATUS.md`
2. Mark GREEN/AMBER/RED
3. List all evidence

---

## Preliminary Findings

### Overall Status: AMBER

**Reason**: Core financial flow from website purchase through billing is implemented and traceable. However:
- Billing Engine portal defaults to mock data (not production-ready configuration)
- No GitHub Actions CI/CD detected
- BankServ integration appears to be file-generation/simulation only

### Transaction Tested: NOT YET EXECUTED

No controlled test transaction has been created. Ready to proceed with Phase 11.

### Lifecycle Verification Status

| Stage | Status | Evidence |
|-------|--------|----------|
| Website Purchase | ✅ | Code review: `purchase/route.ts` creates `payment_transactions` |
| Payment | ✅ | Code review: webhook verifies signature, updates status |
| Webhook | ✅ | Code review: idempotent via `payment_webhook_events` |
| Voucher | ✅ | Code review: `issueVoucher()` called on completion |
| Billing Event | ✅ | Code review: `recordVoucherPurchaseBillingEvent()` creates records |
| Ledger | ✅ | Code review: double-entry posted in same function |
| Merchant Payout | ✅ | Code review: `merchant_payouts` insert |
| Invoice | ✅ | Code review: `billing_invoices` insert |
| Settlement | ✅ | Code review: `billing_settlements` insert |
| BankServ | ⚠️ | Queued in `bankserv_adaptor_transactions`; export/simulation only |
| Reconciliation | ✅ | Code review: `/api/billing/reconciliation/run` exists |
| Audit | ✅ | Code review: `writeAuditEvent()` called throughout |
| Billing Engine | ⚠️ | Portal exists but defaults to mock data |
| Merchant Dashboard | ❓ | Not yet verified |
| Infrastructure Dashboard | ❓ | Not yet verified |

### GAP Status

**GAP-003**: ALREADY COMPLETE  
**GAP-011**: ALREADY MITIGATED

### Remaining Gaps (Evidence-Based)
1. **Billing Engine Mock Data Default**: Portal shows demo data unless explicitly configured otherwise.
2. **No CI/CD**: Missing `.github/workflows/` — no automated validation.
3. **Duplicate Billing Write Path**: Webhook direct call + platform event both write billing records.
4. **BankServ Live Integration**: Current implementation is simulation/file-generation; not confirmed live with sponsor bank.

### Code Changes Required
- **None for core flow** — implementation is complete.
- **Configuration**: Set `VITE_BILLING_DATA_MODE=portal` in Vercel.
- **Cleanup**: Remove direct billing call in webhook (GAP-001) after confirming outbox reliability.
- **CI/CD**: Add GitHub Actions workflow.

### Database Changes Required
- **None** — schema appears complete for the lifecycle.

### Tests Execution Status
- **Not yet run**: `npm test` pending
- **Not yet run**: `npx tsc --noEmit` pending
- **Not yet run**: `npm run build` pending

### Deployment
- **Production URL**: https://www.evoucher.co.za
- **Billing Engine**: https://evoucher-billing-portal.vercel.app/BillingEngine
- **Deployed commit**: `240c0cbf48fa71be1661b24eb51637f876c7f6c6`

---

## Next Steps

1. Execute Phase 11: Create controlled test transaction and trace through all stages.
2. Switch Billing Engine to portal data mode and verify real data display.
3. Run all tests and type checks.
4. Address GAP-001 cleanup if outbox proves reliable.
5. Add GitHub Actions CI/CD.
6. Document BankServ integration status explicitly (likely mock/sandbox).