# Merchant Spec Gap Tracker

This tracker maps the currently requested "Merchant Business Logic Portal" outcomes to implementation status in this repository.

## Critical Workflow (Must Work First)

1. New merchant onboarding -> verification email -> credentials email -> first login -> password change -> dashboard access
- Status: Implemented (hardened)
- This pass delivered:
  - Type and helper mismatch fixes in merchant KPI API route.
  - Merchant login flow hardened to use `signIn` return user directly (removed extra `getUser` dependency that could hang submit state).
  - Product API fallback now tolerates missing any specials columns (`is_special`, `special_title`, `special_end_at`, `display_priority`) for backward-compatible DB schemas.
  - Password reset completion now verifies DB update success and safely falls back from `user_id` to `email`.
  - Auth-state now enforces reset when either auth metadata or merchant DB reset flag is true.
  - Reset-state reconciliation added to prevent auth/merchant drift.

2. Pre-seeded merchant login reliability (Shoprite, Pick n Pay, Kalapeng demo users)
- Status: Partial
- This pass delivered:
  - Merchant/product routes now allow mapped merchant user fallback (`merchant.user_id` match) to tolerate role/profile drift.
- Remaining:
  - End-to-end environment validation of demo seed route and credentials.

3. Merchant product creation persists and appears in consumer catalog
- Status: Implemented (hardened)
- This pass delivered:
  - DB-compat fallback for missing specials fields to prevent 500 errors on product list/create/update.
  - Merchant status gating (`approved` or `active`) for product create/update/deactivate.
  - Product lifecycle audit logging hooks (non-blocking).
  - Product update route now validates business rules before persistence.

## Spec Features

1. Specials lifecycle end-to-end
- Status: Partial
- Implemented:
  - Specials fields in product APIs and catalog ranking.
  - Merchant dashboard special product inputs/badges.
- Pending:
  - Full lifecycle states/reporting workflow exactly per spec.

2. Branch hierarchy + scope enforcement
- Status: Partial
- Implemented:
  - Product create/update validation now enforces:
    - `specific_branch` requires `validBranchIds`.
    - `province_wide` requires `validProvinces`.
- Pending:
  - Complete branch hierarchy controls and scope enforcement across all merchant/admin/consumer flows.

3. KPI/report modules and export parity
- Status: Partial
- Implemented:
  - KPI API route compiles and aligns with current auth helpers.
- Pending:
  - Remaining report/export modules exactly per spec sections.

## Next Implementation Batch

1. Reproduce production onboarding first-login flow with a new private merchant and capture exact failing API (if any).
2. Finalize demo seed consistency so all 3 demo credentials reliably authenticate.
3. Complete specials lifecycle status transitions and reporting states.
4. Implement full branch hierarchy governance in merchant/admin/consumer flows.
5. Align any remaining KPI/export modules against the spec checklist section-by-section.
