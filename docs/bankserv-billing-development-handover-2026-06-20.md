# BankServ Adaptor and Billing Engine Development Handover

Date: 2026-06-20
Branch: `feat/bankserv-report`

## Local Test Targets

### BankServ Adaptor

- Path: `C:\Users\mpeta\Desktop\eVoucher_2026\eVoucher_Website_Development2026\evoucher_website_2026`
- Local URL: `http://localhost:4028/portal/bankserv`
- Login: `admin@evoucher.co.za`
- Password: `Admin@2026eV!`
- Dev log: `.local-bankserv-dev.log`

### Billing Engine

- Path: `C:\Users\mpeta\Desktop\eVoucher_2026\eVoucher_Website_Development2026\evoucher_website_2026\billing-engine-portal`
- Local URL: `http://localhost:5173/BillingEngine`
- Login: `shelod@gmail.com` or `mpetalebo@outlook.com`
- Password: `eVoucherAdmin2024`
- Dev log: `billing-engine-portal\.local-billing-dev.log`

## Requirements Covered In This Pass

- ACK/NCK automation with exponential backoff service.
- ACK/NCK tracking schema migration.
- ACK/NCK processing endpoint.
- Manual ACK/NCK retry endpoint per settlement batch.
- ACK/NCK status endpoint per settlement batch.
- Ledger split verification for:
  - 96% merchant settlement
  - 2.8% member benefit
  - 1.2% platform revenue
  - 0.5% bank fee on merchant payout
- Invoice creation alignment to the TRD v2 split model.
- OpenAPI 3.0 contract draft for BankServ/Billing endpoints.
- CI pipeline improvement to run type-check, lint, tests, then build.
- Staging environment template for Supabase Pro, BankServ mode, alerts, and performance thresholds.

## Key Files Added Or Updated

- `.github/workflows/nodejs.yml`
- `.env.staging.example`
- `docs/openapi-bankserv-billing.yaml`
- `src/server/services/bankserv/ack-nck-retry.ts`
- `src/server/services/billing/ledger-verification.ts`
- `src/app/api/billing/bankserv/ack-nck/process/route.ts`
- `src/app/api/v1/admin/settlements/batches/[id]/ack-nck/route.ts`
- `src/app/api/v1/admin/settlements/batches/[id]/ack-nck/retry/route.ts`
- `src/app/api/v1/admin/ledger/verify/route.ts`
- `src/app/api/billing/invoices/route.ts`
- `src/app/api/billing/settlement-batches/[id]/submit/route.ts`
- `src/app/api/v1/admin/settlements/batches/[id]/submit/route.ts`
- `supabase/migrations/20260620000000_ack_nck_tracking_and_ledger.sql`
- `tests/billing-revenue-calculator.test.ts`

## Verification Completed

- Root app type-check passed: `npm.cmd run type-check`
- Root app lint passed: `npm.cmd run lint`
- Targeted billing tests passed: 8 tests across 2 files
- Root Next build passed: `npm.cmd run build`
- Billing Engine Vite build passed outside the managed sandbox: `npm.cmd run build`
- Billing Engine local route responded with HTTP 200.
- BankServ Adaptor local route responded with HTTP 200 after first Next compile.

## Known Notes

- Billing Engine lint has a large pre-existing backlog unrelated to this pass, mostly unused imports, prop-types, unescaped entities, and hook ordering in older JSX files.
- Billing Engine production build succeeds despite lint backlog.
- First load of the BankServ Next app can take 30-45 seconds while compiling route bundles.
- Vitest and Vite builds can fail inside the managed sandbox because esbuild is denied parent-directory reads. Running outside the sandbox works.

## Suggested Test Flow

1. Open `http://localhost:4028/portal/bankserv`.
2. Log in with the BankServ portal credentials.
3. Confirm the BankServ dashboard loads and existing batch lifecycle data still displays.
4. Use settlement batch submission flows to confirm ACK/NCK tracking records are created.
5. Test the ledger verification endpoint through the app or API:
   - `GET http://localhost:4028/api/v1/admin/ledger/verify?faceValue=1000`
6. Open `http://localhost:5173/BillingEngine`.
7. Log in with one of the Billing Engine credentials.
8. Confirm Billing Engine dashboard, invoices, settlements, BankServ, and reconciliation tabs load.
9. Generate a test invoice and confirm totals follow the 96/2.8/1.2 model.

## Next Development Priorities

- Connect ACK/NCK outcomes to settlement payout gating.
- Add Slack/email alert dispatch from monitoring alerts.
- Add audit-proof PDF invoice generation and Supabase Storage export.
- Implement T+1 reconciliation with discrepancy threshold greater than R5.00.
- Extend dashboard reporting with structured error metadata.
- Add role-based manual batch resend controls with audit reason capture.
