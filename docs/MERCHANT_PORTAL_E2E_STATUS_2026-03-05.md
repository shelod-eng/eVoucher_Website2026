# Merchant Portal E2E Status - 2026-03-05

This status is prepared for team reporting on merchant onboarding and merchant portal readiness.

## Executive Summary

Core merchant onboarding and merchant product operations are implemented and now hardened for drift/fallback conditions that were blocking some demo users.

As of 2026-03-05:
- End-to-end onboarding flow exists for chain and private merchants (submit -> verify -> approve -> credentials -> first login -> forced password reset -> dashboard).
- Critical auth-state and merchant-profile drift bugs have been fixed in this pass.
- Demo merchant product creation reliability has been strengthened.
- Some spec items remain partial (not fully complete across all modules).

## What Was Hardened In This Pass

1. Password reset completion sync robustness
- `completeMerchantPasswordReset` now verifies that update-by-user-id actually updates a row.
- If user-id path updates zero rows, it falls back to email update.
- If both paths update zero rows, it now fails explicitly instead of silently succeeding.

2. Merchant auth-state correctness
- `mustResetPassword` is now enforced with OR semantics across:
  - `merchants.must_reset_password`
  - `auth.user_metadata.must_change_password`
- Merchant identity fallback now supports mapped merchant users even when role/profile data drifts.

3. Safe reconciliation for reset flag drift
- Added `reconcileMerchantResetState(userId)`.
- It heals mismatch only in the safe direction (`true`), preventing false unlocks.
- Added structured onboarding event logging for traceability.

4. Merchant profile resolution resilience
- Merchant lookup now uses `limit(1)` array-safe resolution instead of brittle `maybeSingle()` semantics that can fail in duplicate/drift scenarios.
- Applies to user_id path and email fallback path.

5. Product API authorization resilience
- Merchant product GET/POST now allows access when user is mapped to merchant record (`merchant.user_id === auth user id`) even if role resolution drifts.
- Product creation now explicitly blocks non-approved merchants (`pending` -> 409), enforcing onboarding completion.

## Required Feature Checklist (Requested)

1. Product Studio live (3-15%, immutable 50/50)
- Status: Implemented
- Notes: Pricing calculation + business rule validation are present server-side.

2. Consumer feed integration (active products visible instantly)
- Status: Implemented (core behavior)
- Notes: Shop catalog filters active products and merchant status.

3. Specials & promotions engine (badges + expiry)
- Status: Implemented, with compatibility fallbacks
- Notes: Supports `is_special`, `special_title`, `special_end_at`, `display_priority`; fallback logic exists for older schemas missing specials columns.

4. Chain branch management (parent/child + scoped visibility)
- Status: Partial
- Notes: Scope fields/validation exist (`redemption_scope`, `valid_provinces`, `valid_branch_ids`), but full hierarchy governance workflow is not fully complete across all modules.

5. Ledger & settlement flow (purchase snapshot -> voucher instance -> ledger -> payout)
- Status: Partial to Implemented by core APIs
- Notes: Snapshot/purchase and payout flows exist; full BankServ integration and operational parity should be validated in environment testing.

6. Merchant dashboard KPIs
- Status: Implemented (core KPI routes and dashboard metrics)
- Notes: Additional spec-level report/export parity remains to be finalized.

## Critical Business Rules (Requested)

1. Immutable 50/50 split
- Status: Enforced (business rules validator + pricing model).

2. Consumer always pays less than face value
- Status: Enforced.

3. Price snapshot at purchase
- Status: Enforced in purchase flow with snapshot fields.

4. Active products instantly visible
- Status: Implemented in consumer catalog behavior.

5. Discount range validated (3-15%)
- Status: Enforced.

6. Session protection on all merchant routes
- Status: Partial
- Notes: Supabase-authenticated protection exists; strict 24h merchant-session scheme from spec text is not uniformly implemented on every merchant route.

## Known Remaining Gaps Before "Spec Complete"

1. Full chain branch hierarchy governance across merchant/admin/consumer experiences.
2. Complete specials lifecycle/reporting parity exactly as spec v2.0 describes.
3. Full settlement operational validation (including external payout rails, reconciliation and failure handling evidence).
4. Uniform session-protection semantics if strict 24h merchant-session requirement is mandatory.
5. End-to-end UAT evidence package for private + chain onboarding in your target environment.

## Validation Notes

- External PDF parsing tool was unavailable in this environment, so this report is based on repository implementation and internal gap tracker alignment.
- Local type-check currently fails due unrelated test tooling/config in `tests/verifyEmail.test.ts` (missing test dependencies), not due the merchant flow changes.
