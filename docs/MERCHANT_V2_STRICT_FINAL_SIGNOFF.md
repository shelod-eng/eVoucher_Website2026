# Merchant Business Logic Portal v2.0 - Strict Final Sign-off

Date: 2026-03-05
Environment: Production (`www.evoucher.co.za`)
Branch/Commit under validation: `main`

## 1) Scope and Interpretation

This sign-off is aligned to the Merchant Business Logic Portal v2.0 spec and interpreted for the current stack in this repository:
- Runtime: Node.js + TypeScript
- Framework: Next.js API routes (not standalone Express runtime)
- DB/Auth: Supabase Postgres + Supabase Auth

Note:
- Equivalent business outcomes are validated in current architecture.
- This sign-off is strict: any failed critical gate = NO-GO.

## 2) Critical E2E Gates (Must PASS)

### Gate A - Private Merchant E2E

1. Submit onboarding (`POST /api/v1/merchant/onboarding`) with private merchant payload.
- Expected: 200 with `merchantId`, `status`, `merchantType=private`.
- Pass/Fail: ___
- Evidence: ___

2. Verify email token (`POST /api/v1/merchant/onboarding/verify-email`).
- Expected: 200, `emailVerified=true` and status progression.
- Pass/Fail: ___
- Evidence: ___

3. Approve merchant (`POST /api/v1/merchant/onboarding/approve`) with approval key/admin flow.
- Expected: 200, `approved=true`, status `approved`.
- Pass/Fail: ___
- Evidence: ___

4. First login with temporary credentials.
- Expected: redirect/enforced path to `/merchant/change-password`.
- Pass/Fail: ___
- Evidence: ___

5. Complete password reset (`POST /api/v1/merchant/onboarding/complete-password-reset`).
- Expected: 200 `{ success: true }`.
- Pass/Fail: ___
- Evidence: ___

6. Dashboard entry (`/merchant/dashboard`) + products API load.
- Expected: 200 on `/api/v1/merchant/dashboard` and `/api/v1/merchant/products`.
- Pass/Fail: ___
- Evidence: ___

### Gate B - Chain Merchant E2E

1. Submit onboarding with `merchantType=chain`.
- Expected: 200 with valid `merchantId`.
- Pass/Fail: ___
- Evidence: ___

2. Verify email token.
- Expected: 200 + progression.
- Pass/Fail: ___
- Evidence: ___

3. Approve chain merchant.
- Expected: 200, `approved=true`, credentials issuance path available.
- Pass/Fail: ___
- Evidence: ___

4. First login + forced password change.
- Expected: reset enforced before dashboard access.
- Pass/Fail: ___
- Evidence: ___

5. Post-reset dashboard and product create.
- Expected: 201 on `POST /api/v1/merchant/products`.
- Pass/Fail: ___
- Evidence: ___

## 3) Spec Feature Traceability (Strict)

### A. Product Studio
- Create voucher product: Implemented
- Discount validation 3-15: Implemented
- Immutable 50/50 split: Implemented via pricing + validator
- Active product available to consumers: Implemented
Status: PASS / FAIL ___

### B. Consumer Feed Integration
- Active products appear in shop catalog: Implemented
- Status change reflected immediately via request-time fresh API: Implemented
Status: PASS / FAIL ___

### C. Specials & Promotions
- Promotion flags/badges fields supported: Implemented with schema-compat fallback
- Expiry timer behavior supported: Implemented
Status: PASS / FAIL ___

### D. Chain Branch Management
- Parent/child hierarchy model: Partial
- Branch-scoped visibility controls end-to-end: Partial
Status: PASS / FAIL ___

### E. Ledger & Settlement
- Purchase price snapshot: Implemented in purchase flow
- Voucher instance creation: Implemented
- Ledger write path: Implemented
- BankServ payout operational integration parity: Partial/Env-dependent
Status: PASS / FAIL ___

### F. Dashboard KPIs
- Payouts/sales/platform margin/consumer savings: Implemented
Status: PASS / FAIL ___

## 4) Critical Rule Validation

1. 50/50 split immutable after activation: PASS / FAIL ___
2. Consumer pays less than face value: PASS / FAIL ___
3. Price snapshot at purchase immutable: PASS / FAIL ___
4. Only active products visible: PASS / FAIL ___
5. Discount 3-15 enforced: PASS / FAIL ___
6. Session protection on merchant APIs: PASS / FAIL ___

## 5) Mandatory API Evidence Capture

Capture response payloads for each run:
- `POST /api/v1/merchant/onboarding`
- `POST /api/v1/merchant/onboarding/verify-email`
- `POST /api/v1/merchant/onboarding/approve`
- `POST /api/v1/merchant/onboarding/complete-password-reset`
- `GET /api/v1/merchant/auth-state`
- `GET /api/v1/merchant/dashboard`
- `POST /api/v1/merchant/products`
- `GET /api/v1/shop/catalog`

## 6) Known Compatibility Requirements

1. Mixed Supabase schemas are supported by API fallbacks (missing specials/status columns).
2. If `MERCHANT_APPROVAL_KEY` is enabled, manual approve must include header `x-merchant-approval-key`.
3. Demo seed flows require one of:
- `SEED_DEMO_MERCHANTS=true`
- `ENABLE_DEMO_MERCHANT_SEED=true`
- `NEXT_PUBLIC_ENABLE_DEMO_MERCHANT_SEED=true`
- `NEXT_PUBLIC_FORCE_DEMO_SEED_ON_LOGIN=true`

## 7) Final Decision

- Private Merchant E2E: PASS / FAIL ___
- Chain Merchant E2E: PASS / FAIL ___
- Critical rules: PASS / FAIL ___
- Consumer catalog + active product visibility: PASS / FAIL ___
- Overall readiness: GO / NO-GO ___

Signed by:
- QA/Owner: ____________________
- Date/Time: ___________________
