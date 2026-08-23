# Lebo Progress Update — eVoucher E2E Integration Audit

## Date
9 June 2026

## Objective
Verify and complete the existing eVoucher financial integration so that one completed customer purchase automatically propagates through the complete financial lifecycle and becomes visible in the Billing Engine portal.

## What We Completed

### Phase 0-1: Inventory & Transaction Mapping ✅
- Inspected repository state: branch `main`, commit `240c0cbf`, 7 modified files
- Identified technology stack: Next.js 14, Supabase, Vercel, React portal
- Mapped canonical transaction identifier: `transaction_reference` (format: `TXN-{timestamp}-{random}`)
- Confirmed identifier flows through 9 financial tables consistently

### Phase 2-4: Core Flow Verification ✅
- Traced website purchase → webhook → billing events → ledger → payouts → settlements → invoices
- Verified all source files and database tables involved
- Confirmed webhook idempotency via `payment_webhook_events`
- Confirmed billing event idempotency via `event_key`
- Confirmed ledger entries are double-entry and idempotent via `source_id`

### Phase 3: GAP-003 Verification ✅
- **Status**: ALREADY COMPLETE
- All settlement routes use canonical `bankserv_adaptor_transactions`
- Legacy `src/lib/bankserv-adaptor.ts` marked `@deprecated`, no active consumers

### Phase 4: GAP-011 Verification ✅
- **Status**: ALREADY MITIGATED
- Webhook catch block now logs diagnostic errors:
  ```
  [Webhook] Direct billing event recording failed (will be retried via platform event outbox): ...
  ```

### Phase 5-6: Billing Engine Analysis ✅
- Identified portal at `billing-engine-portal/`
- Discovered **critical issue**: defaults to `mock` data mode (`VITE_BILLING_DATA_MODE=mock`)
- Confirmed real API endpoints exist at `/api/billing/*`
- Portal can display real data when configured correctly

### Phase 7-8: Dashboard Verification ⚠️
- Infrastructure dashboard: redirects to `/infrastructure`, not deeply verified
- Merchant dashboard: not yet verified
- Both require production access for full verification

### Phase 9: CI/CD Verification ✅
- **Finding**: No `.github/workflows/` directory
- **Impact**: No automated tests/builds on commit
- **Status**: Gap identified, not blocking for this audit

### Phase 10: BankServ Verification ✅
- **Status**: File-generation/simulation only
- `simulateBankServSubmission()` returns random ACK/NCK (95% success rate)
- NOT live with FNB/RMB
- Documented as sandbox/demo mode

### Phase 11-13: Production Testing ❌
- Could not execute without production database access
- Requires manual test transaction creation and tracing

### Phase 12: Automated Tests ✅
- Executed: `npm test`
- **Result**: ✅ 14 test files passed, 49 tests passed
- Coverage includes: webhook idempotency, GAP-011 observability, Bankserv adaptor, billing calculations, reconciliation

### Phase 14: Security Verification ⚠️
- Code review complete: no secrets exposed client-side
- Webhook signatures verified
- RLS policies not reviewed (requires database access)
- Environment variables properly separated

### Phase 15: Final Documentation ✅
- Created `E2E_INTEGRATION_AUDIT.md` with complete architecture analysis
- Created `E2E_INTEGRATION_STATUS.md` with final verdict
- **Overall Status: AMBER**

## Key Deliverables

1. **E2E_INTEGRATION_AUDIT.md** — Comprehensive inventory:
   - Architecture diagrams and data flow
   - Transaction lifecycle mapping
   - Source files, database tables, API endpoints
   - Authentication mechanisms
   - Deployment configuration
   - Gaps identified and prioritized
   - Risk assessment
   - Implementation order

2. **E2E_INTEGRATION_STATUS.md** — Final status report:
   - Lifecycle verification table (12 stages)
   - GAP status (GAP-003: COMPLETE, GAP-011: MITIGATED)
   - Remaining gaps with priorities
   - Test results
   - Deployment details
   - Final acceptance criteria

## What's Working Well

✅ Canonical transaction identifier flows through all 9 financial tables  
✅ Website purchase → billing events → ledger → payouts → settlements → invoices fully implemented  
✅ Webhook idempotency verified  
✅ Billing event idempotency verified  
✅ Ledger entries are double-entry and idempotent  
✅ Audit trail created at each stage  
✅ Platform event outbox published for real-time sync  
✅ All 49 existing tests pass  
✅ GAP-003 already complete (BankServ adaptor migrated)  
✅ GAP-011 already mitigated (observability logging added)

## Critical Gaps Found

1. **Billing Engine Mock Data** (HIGH)
   - Portal defaults to `mock` mode showing hardcoded demo data
   - **Fix**: Set `VITE_BILLING_DATA_MODE=portal` in Vercel

2. **No CI/CD** (MEDIUM)
   - No `.github/workflows/` directory
   - **Fix**: Add GitHub Actions workflow

3. **Duplicate Billing Path** (MEDIUM)
   - Webhook calls billing recorder directly AND via platform event
   - **Fix**: Remove direct call after confirming outbox reliability

4. **BankServ Simulation** (LOW)
   - Not live with sponsor bank
   - File-generation/simulation only
   - **Fix**: Document as sandbox mode

## What's NOT Yet Verified

❌ Controlled test transaction traced through production database  
❌ Billing Engine portal displaying real data  
❌ Merchant dashboard showing transaction  
❌ Infrastructure dashboard reflecting real state  
❌ Reconciliation run matching records  
❌ TypeScript compilation (`npx tsc --noEmit`)  
❌ Production build (`npm run build`)

## Recommended Next Steps

1. **IMMEDIATE**: Switch Billing Engine to portal data mode
   - Set `VITE_BILLING_DATA_MODE=portal` in Vercel
   - Redeploy billing-engine-portal

2. **SHORT-TERM**: Create controlled test transaction
   - Use prefix `E2E-TEST-YYYYMMDD-HHMMSS`
   - Trace through all stages
   - Capture database evidence

3. **SHORT-TERM**: Run type check and build
   - `npx tsc --noEmit`
   - `npm run build`

4. **MEDIUM-TERM**: Add GitHub Actions CI/CD
   - Create `.github/workflows/ci.yml`
   - Add test, type-check, build steps

5. **MEDIUM-TERM**: Clean up duplicate billing path
   - Remove direct `recordVoucherPurchaseBillingEvent` call from webhook
   - Rely on platform event outbox

## Files Created/Modified

- `E2E_INTEGRATION_AUDIT.md` (new) — Complete audit report
- `E2E_INTEGRATION_STATUS.md` (new) — Final status and acceptance criteria

No production code was modified during this audit.

## Conclusion

**The eVoucher financial integration architecture is sound and implementation is complete through code review and automated testing. The system is FUNCTIONAL but NOT FULLY VERIFIED end-to-end in production.**

Current status: **AMBER**

To reach GREEN:
1. Switch Billing Engine to portal mode
2. Create and trace one test transaction
3. Verify all dashboards display real data
4. Run type check and build
5. Add CI/CD

**Do not claim GREEN until a controlled transaction can be searched and found in every subsystem with financially consistent amounts.**

---

*Audit completed: 9 June 2026*  
*Next review: After production test transaction execution*