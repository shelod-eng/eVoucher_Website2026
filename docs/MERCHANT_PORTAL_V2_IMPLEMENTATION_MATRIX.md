# Merchant Business Logic Portal v2.0 - Implementation Matrix

Date: 2026-03-05
Scope: Merchant Portal + end-to-end onboarding + product operations + consumer integration

## Merchant Types

1. Chain merchants
- Status: Implemented
- Notes: merchant_type supports chain; seeded/demo coverage exists for major chains.

2. Private/SME merchants
- Status: Implemented
- Notes: merchant_type supports private; onboarding paths include private approvals.

## Key Features

1. Product Studio
- Status: Implemented
- Coverage:
  - Voucher product create/update/deactivate APIs.
  - Server-side discount validation (3-15%).
  - Pricing engine with 50/50 split checks via business-rules validator.
  - Active products set for consumer visibility.

2. Consumer Feed Integration
- Status: Implemented
- Coverage:
  - Active merchant products exposed via shop catalog APIs.
  - Merchant status checks for approved/active visibility.

3. Specials & Promotions Engine
- Status: Implemented (core), Partial (advanced lifecycle)
- Coverage:
  - Special flags: `is_special`, `special_title`, `special_end_at`, `display_priority`.
  - Expiry validation for future special end date.
  - Backward-compatible fallback when specials columns are missing.

4. Chain Merchant Branch Management
- Status: Partial
- Coverage:
  - Scope fields and validation: `all_branches`, `specific_branch`, `province_wide`, `national`.
  - Branch/province arrays validated on product create/update.
- Remaining:
  - Full parent/child operating model, branch admin controls, and parent-vs-branch dashboard partitioning across all flows.

5. Ledger & Settlement Flow
- Status: Implemented (core flow), Partial (external payout ops parity)
- Coverage:
  - Purchase flow snapshots pricing at transaction time.
  - Voucher instance creation and transaction record paths exist.
  - Merchant payout data paths and KPI surfaces exist.
- Remaining:
  - Full BankServ operational reconciliation evidence and failure-mode runbooks in environment.

6. Merchant Dashboard KPIs
- Status: Implemented (core)
- Coverage:
  - Merchant dashboard APIs and KPI summaries for payouts, sales/volume, margin, consumer benefit metrics.

## Critical Business Rules

1. Immutable 50/50 discount split
- Status: Enforced
- Enforcement: server pricing + business-rules validator checks.

2. Consumer pays less than face value
- Status: Enforced
- Enforcement: pricing model and validator.

3. Price snapshot at purchase
- Status: Enforced
- Enforcement: purchase-time snapshot values persisted in purchase flows.

4. Active products visibility
- Status: Enforced
- Enforcement: consumer catalog uses active status filtering and merchant status checks.

5. Discount range validation (3-15)
- Status: Enforced
- Enforcement: product API validation and business-rules validator.

6. Session protection on merchant routes
- Status: Implemented
- Enforcement: authenticated server-side user checks on merchant APIs.

## Implementation Requirements

1. Role-based access
- Status: Implemented and hardened
- Notes: fallback access for mapped merchants prevents profile-role drift from blocking legitimate merchant users.

2. Real-time sync
- Status: Implemented (request-time consistency)
- Notes: active/special states propagate through APIs immediately; optional realtime channel enhancements can be added.

3. Audit trail
- Status: Implemented (non-blocking writes added for product lifecycle + onboarding events)
- Notes: currently tolerant of missing audit schema in some dev environments.

4. Error handling
- Status: Implemented
- Notes: API responses include explicit error messages and business-rule violation payloads.

5. Scalability
- Status: Partial
- Notes: data models support growth; branch hierarchy and operational load testing still required for full chain-scale sign-off.

## Final Readiness

- End-to-end merchant onboarding: Implemented for chain/private paths with drift hardening.
- Merchant product management: Implemented and production-hardened.
- Full v2.0 parity: Partial (remaining advanced branch governance + external settlement ops + parity-level UAT evidence).
