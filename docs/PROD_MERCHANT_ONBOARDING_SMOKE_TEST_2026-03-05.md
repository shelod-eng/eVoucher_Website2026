# PROD Smoke Test Runbook - Merchant Onboarding Core

Date: 2026-03-05
Target: Vercel PROD (prototype)
Goal: Prove sponsor-critical merchant onboarding + product activation chain works without errors.

## Pre-Checks (5 min)

1. Confirm latest deployment is live in Vercel Production.
2. Confirm env vars are correct (Supabase URL/key, app URL, demo seed flags if needed).
3. Open browser devtools Network tab (Preserve log ON).
4. Open this sign-off sheet and capture screenshot evidence per section.

## Test Data

1. Private merchant email: `qa-private-merchant+20260305@yourdomain.com`
2. Chain merchant email: `qa-chain-merchant+20260305@yourdomain.com`
3. Demo logins:
- `demo-shoprite@evoucher.co.za`
- `demo-picknpay@evoucher.co.za`
- `demo-kalapeng@evoucher.co.za`
Password: `demo123`

## Sequence A - Private Merchant E2E (15 min)

1. Submit private merchant onboarding form.
Expected: Submission success message, merchantId/token flow generated.
Evidence: onboarding submit response + UI success screenshot.
PASS/FAIL: ___

2. Verify email token flow.
Expected: verify-email API returns success and status progression.
Evidence: verify-email network response body.
PASS/FAIL: ___

3. Approve private merchant path.
Expected: merchant status becomes `approved` or `active`.
Evidence: onboarding status response.
PASS/FAIL: ___

4. First login with issued credentials.
Expected: redirected to change-password page.
Evidence: redirect URL + auth-state response.
PASS/FAIL: ___

5. Change password.
Expected: password update success, sync complete, redirected to dashboard.
Evidence: complete-password-reset response + dashboard load.
PASS/FAIL: ___

## Sequence B - Chain Merchant E2E (15 min)

1. Submit chain merchant onboarding form.
Expected: submit success.
Evidence: submit response.
PASS/FAIL: ___

2. Verify chain email token.
Expected: verify success.
Evidence: verify response.
PASS/FAIL: ___

3. Approve chain merchant.
Expected: status approved/active and credentials issued.
Evidence: statusData in response.
PASS/FAIL: ___

4. First login and forced password reset.
Expected: change-password enforced when flagged.
Evidence: auth-state payload.
PASS/FAIL: ___

5. Complete password reset and dashboard access.
Expected: dashboard opens with merchant profile.
Evidence: dashboard API response.
PASS/FAIL: ___

## Sequence C - Demo Merchant Reliability (10 min)

1. Login `demo-shoprite@evoucher.co.za`.
Expected: dashboard opens.
PASS/FAIL: ___

2. Login `demo-picknpay@evoucher.co.za`.
Expected: dashboard opens.
PASS/FAIL: ___

3. Login `demo-kalapeng@evoucher.co.za`.
Expected: dashboard opens.
PASS/FAIL: ___

If any fail, capture exact API error payload from:
- `/api/v1/merchant/auth-state`
- `/api/v1/merchant/dashboard`
- `/api/v1/merchant/products`

## Sequence D - Product Activation -> Consumer Visibility (10 min)

1. From merchant dashboard create product (e.g. `QA Voucher R100`, discount 5%).
Expected: create returns 201.
PASS/FAIL: ___

2. Ensure product is active.
Expected: appears in merchant products list as active.
PASS/FAIL: ___

3. Open consumer shop/catalog.
Expected: product appears for consumers.
PASS/FAIL: ___

4. Deactivate product.
Expected: product removed from consumer visible list.
PASS/FAIL: ___

## Sequence E - Core Rule Spot Checks (5 min)

1. Create product with discount `2%`.
Expected: validation error.
PASS/FAIL: ___

2. Create product with discount `16%`.
Expected: validation error.
PASS/FAIL: ___

3. Create product at `5%`.
Expected: success and valid pricing.
PASS/FAIL: ___

## Sponsor Summary (Fill Before 12 PM)

- Private merchant onboarding E2E: PASS / FAIL
- Chain merchant onboarding E2E: PASS / FAIL
- Demo merchant logins: PASS / FAIL
- Product create/activate/consumer visibility: PASS / FAIL
- First-login password reset enforcement: PASS / FAIL
- Overall sponsor readiness: GO / NO-GO

## Critical Failure Escalation Fields

- Failed step:
- API endpoint:
- HTTP status:
- Error payload:
- Merchant email used:
- Timestamp (local):
- Screenshot file name:
