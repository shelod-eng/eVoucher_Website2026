# Merchant Portal v2.0 - End-to-End UAT Checklist

Date: 2026-03-05

## A. Private Merchant Onboarding (E2E)

1. Submit onboarding form with private merchant details.
2. Verify email via token endpoint/page.
3. Verify OTP (if enabled) and confirm status progression.
4. Approve merchant (manual/private approval path).
5. Confirm credentials sent and merchant user can log in.
6. Confirm forced password reset is required on first login.
7. Change password and verify redirect to dashboard.
8. Confirm `must_change_password=false` and `must_reset_password=false` after completion.

Expected result: private merchant lands on dashboard and can create products.

## B. Chain Merchant Onboarding (E2E)

1. Submit onboarding form with chain merchant details.
2. Verify email and OTP as configured.
3. Trigger chain approval path.
4. Confirm merchant status is approved/active.
5. Log in with issued credentials.
6. Complete first password reset if flagged.
7. Confirm dashboard and product endpoints return success.

Expected result: chain merchant is operable for product lifecycle management.

## C. Demo Merchant Reliability

1. Trigger demo seed endpoint.
2. Log in as `demo-shoprite@evoucher.co.za`.
3. Log in as `demo-picknpay@evoucher.co.za`.
4. Log in as `demo-kalapeng@evoucher.co.za`.
5. For each: open dashboard and create one product.

Expected result: each demo user can create and view merchant products without role/mapping errors.

## D. Product Studio Rules

1. Create product with discount 2%.
- Expected: validation error.

2. Create product with discount 16%.
- Expected: validation error.

3. Create product with discount 5% and face value R100.
- Expected: success and valid split/pricing fields.

4. Update product discount and face value.
- Expected: pricing recomputes and passes business-rule checks.

## E. Specials & Promotions

1. Create special with `isSpecial=true`, title, and future `specialEndAt`.
- Expected: success with special metadata persisted.

2. Create special with missing title or past expiry.
- Expected: validation error.

3. Verify special badge metadata appears in merchant products and shop catalog outputs.

## F. Consumer Feed Integration

1. Activate merchant product.
2. Query consumer shop catalog.
3. Deactivate product.
4. Query consumer shop catalog again.

Expected result: active product appears; deactivated product no longer appears.

## G. Purchase -> Snapshot -> Settlement Chain

1. Purchase voucher for active merchant product.
2. Verify transaction records include snapshot pricing values.
3. Verify voucher instance assigned to consumer.
4. Verify ledger/settlement records written.
5. Verify merchant KPI totals reflect transaction.

Expected result: purchase flow is immutable and traceable from product to payout metrics.

## H. Access Control & Session Protection

1. Access merchant APIs without session.
- Expected: 401 unauthorized.

2. Access merchant APIs as non-merchant user.
- Expected: 403 merchant_only.

3. Access merchant APIs as mapped merchant with profile-role drift.
- Expected: authorized when merchant.user_id matches auth user.

## I. Audit Trail

1. Create product and verify audit event written (or warning logged in schema-missing dev env).
2. Update product and verify audit event written.
3. Deactivate product and verify audit event written.
4. Complete first password reset and verify onboarding event logs.

## Sign-off Fields

- Private onboarding E2E: PASS / FAIL
- Chain onboarding E2E: PASS / FAIL
- Demo merchant reliability: PASS / FAIL
- Product studio rules: PASS / FAIL
- Consumer feed sync: PASS / FAIL
- Purchase-settlement chain: PASS / FAIL
- Access/session controls: PASS / FAIL
- Audit trail: PASS / FAIL
