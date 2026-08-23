# eVoucher E2E Integration Status

## Overall Status

**AMBER**

**Reason**: Core financial lifecycle from website purchase through billing events is fully implemented and traceable via code review and tests. However, end-to-end production verification is incomplete because:
- Billing Engine portal defaults to mock data (not yet switched to portal mode)
- No controlled test transaction has been executed against production database
- BankServ integration is file-generation/simulation only, not live with sponsor bank

## Transaction Tested

**Transaction Reference**: NOT YET EXECUTED

No controlled test transaction has been created in the production system. The architecture supports tracing via `transaction_reference` (format: `TXN-{timestamp}-{random}`), but actual database verification is pending.

## Lifecycle

| Stage | Status | Evidence |
|-------|--------|----------|
| Website Purchase | ✅ | Code: `src/app/api/v1/vouchers/purchase/route.ts` creates `payment_transactions` with `transaction_reference` |
| Payment | ✅ | Code: Webhook at `/api/v1/payments/webhook` verifies signature, updates `payment_status` |
| Webhook | ✅ | Code: Idempotent via `payment_webhook_events` table with `sha256` payload hash |
| Voucher | ✅ | Code: `DefaultVoucherService.issueVoucher()` called on payment completion |
| Billing Event | ✅ | Code: `recordVoucherPurchaseBillingEvent()` creates `billing_events` with idempotent `event_key` |
| Ledger | ✅ | Code: Double-entry posted to `billing_ledger_entries` (debit: asset:cash, credit: liability/contra accounts) |
| Merchant Payout | ✅ | Code: `merchant_payouts` insert with calculated amounts |
| Invoice | ✅ | Code: `billing_invoices` insert with invoice number `INV-{eventKey}` |
| Settlement | ✅ | Code: `billing_settlements` insert linked to batch |
| BankServ | ⚠️ | Queued in `bankserv_adaptor_transactions`; file export/simulation only |
| Reconciliation | ✅ | Code: `/api/billing/reconciliation/run` compares WS1 events vs ledger |
| Audit | ✅ | Code: `writeAuditEvent()` called at each stage with actor, action, metadata |
| Billing Engine | ⚠️ | Portal exists but defaults to mock data; real API paths confirmed |
| Merchant Dashboard | ❓ | Not yet verified |
| Infrastructure Dashboard | ❓ | Redirects to /infrastructure; not deeply verified |

## GAP Status

**GAP-003**: ALREADY COMPLETE  
**Evidence**: All settlement routes use canonical `bankserv_adaptor_transactions` table. Legacy `src/lib/bankserv-adaptor.ts` is marked `@deprecated` with no active consumers.

**GAP-011**: ALREADY MITIGATED  
**Evidence**: Webhook catch block now logs diagnostic error:
```typescript
console.error(
  '[Webhook] Direct billing event recording failed (will be retried via platform event outbox):',
  billingError?.message ?? billingError
);
```

## Remaining Gaps

1. **Billing Engine Mock Data Default** (HIGH PRIORITY)
   - **Issue**: `VITE_BILLING_DATA_MODE` defaults to `mock` in `billing-engine-portal/src/pages/BillingEngine.jsx`
   - **Impact**: Portal displays hardcoded demo data instead of real transactions
   - **Required Action**: Set `VITE_BILLING_DATA_MODE=portal` in Vercel environment and redeploy

2. **No GitHub Actions CI/CD** (MEDIUM PRIORITY)
   - **Issue**: No `.github/workflows/` directory found
   - **Impact**: No automated test/build validation on commits
   - **Required Action**: Create CI workflow running `npm test`, `npm run type-check`, `npm run build`

3. **Duplicate Billing Write Path** (MEDIUM PRIORITY)
   - **Issue**: `src/app/api/v1/payments/webhook/route.ts` calls `recordVoucherPurchaseBillingEvent()` directly AND `publishPlatformEvent()` which also calls it
   - **Impact**: Potential double-processing if outbox retry fires after direct call succeeds
   - **Required Action**: Remove direct billing call in webhook after confirming outbox reliability (GAP-001 cleanup)

4. **BankServ Live Integration** (LOW PRIORITY FOR THIS AUDIT)
   - **Issue**: `simulateBankServSubmission()` in legacy adaptor returns simulated ACK/NCK
   - **Impact**: Not a live integration with FNB/RMB; file-generation/simulation only
   - **Required Action**: Document as sandbox/demo mode; do not claim live bank connectivity

## Code Changes

### Already Completed
- GAP-003: BankServ adaptor migration (canonical path established)
- GAP-011: Webhook observability (diagnostic logging added)

### Required
1. **Configuration Change** (no code):
   - Set `VITE_BILLING_DATA_MODE=portal` in Vercel for billing-engine-portal

2. **Cleanup** (1 file):
   - `src/app/api/v1/payments/webhook/route.ts`: Remove lines 163-185 (direct `recordVoucherPurchaseBillingEvent` call) after verifying outbox handles all cases

3. **CI/CD** (new file):
   - `.github/workflows/ci.yml`: Add test/build pipeline

## Database Changes

**None required** — schema is complete for the full lifecycle:
- `payment_transactions`
- `billing_events`
- `billing_ledger_entries`
- `merchant_payouts`
- `billing_settlements`
- `billing_invoices`
- `bankserv_adaptor_transactions`
- `billing_settlement_batches`
- `platform_events`
- `platform_event_outbox`
- `bankserv_ack_nck_tracking`
- `bankserv_responses`
- `audit_events`

## Tests

### Executed
```bash
npm test
```
**Result**: ✅ 14 test files passed, 49 tests passed

### Not Yet Executed
```bash
npx tsc --noEmit
```
**Status**: Denied by user

```bash
npm run build
```
**Status**: Not yet executed

### Test Coverage Verified
- ✅ Payment webhook idempotency
- ✅ GAP-011 observability (billing failure logging)
- ✅ Bankserv adaptor compatibility
- ✅ Billing revenue calculator
- ✅ Redemption breakdown
- ✅ Compliance sync reconciliation
- ✅ Merchant business rules
- ✅ USSD state machine

## Deployment

### Production
- **Website**: https://www.evoucher.co.za
- **Billing Engine**: https://evoucher-billing-portal.vercel.app/BillingEngine
- **Current Commit**: `240c0cbf48fa71be1661b24eb51637f876c7f6c6` (branch: `main`)
- **Working Tree**: Has uncommitted modifications to 7 files

### Deployment Configuration
- **Platform**: Vercel
- **Cron Jobs**:
  - `/api/cron/specials-expiry` — Daily 00:00
  - `/api/cron/settlement` — Daily 23:00
  - `/api/cron/process-outbox` — Daily 00:15
- **Environment Files**: `.vercel.production.env`, `.vercel.preview.env`

## FINAL ACCEPTANCE

### What is Proven
1. ✅ Canonical transaction identifier (`transaction_reference`) exists and is used consistently
2. ✅ Website purchase creates financial records in correct tables
3. ✅ Webhook processes payments with idempotency
4. ✅ Billing events, ledger entries, payouts, settlements, and invoices are created automatically
5. ✅ BankServ adaptor queues transactions in canonical table
6. ✅ Audit trail is created at each stage
7. ✅ Platform event outbox is published for real-time sync
8. ✅ All existing tests pass

### What is Not Yet Proven
1. ❌ One controlled transaction traced through production database end-to-end
2. ❌ Billing Engine portal displaying real data (still in mock mode)
3. ❌ Merchant dashboard showing same transaction
4. ❌ Infrastructure dashboard reflecting real state
5. ❌ Reconciliation run matching database records
6. ❌ TypeScript compilation check completed
7. ❌ Production build succeeds

### Overall Verdict: AMBER

**The architecture is sound and implementation is complete through code review and automated tests. The system is FUNCTIONAL but NOT VERIFIED end-to-end in production.**

To reach GREEN:
1. Switch Billing Engine to portal data mode
2. Create and trace one test transaction through all stages
3. Verify Billing Engine displays the transaction correctly
4. Run type check and build
5. Add GitHub Actions CI/CD

**Do not claim GREEN until a controlled transaction can be searched and found in every subsystem with financially consistent amounts.**