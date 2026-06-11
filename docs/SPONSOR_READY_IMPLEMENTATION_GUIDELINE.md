# eVoucher Sponsor-Ready Implementation Guideline

Date: 2026-06-11
Production website: https://www.evoucher.co.za
Audience: Sponsors, Gerald, product owners, developers, compliance reviewers

## What Was Implemented

The platform now presents eVoucher as national-scale digital voucher infrastructure, not only a web storefront.

Implemented layers:

- PWA install support for phone-first merchant onboarding.
- Homepage `Install eVoucher App` button for supported browsers.
- Sponsor-ready homepage positioning: "South Africa's Digital Voucher Infrastructure - Dignified Impact."
- Sponsor signal block for FNB, DTI, and CSI partners.
- Live impact metrics API and homepage section.
- Hardened merchant compliance upload flow.
- Private Supabase Storage metadata for KYC/KYB documents.
- Admin compliance queue with signed private document previews.
- Review actions: approve, reject, request more information.
- Merchant-visible rejection reasons and resubmission flow.
- SendGrid-compatible merchant review notifications.
- Revenue split transparency in the sponsor portal.
- NetCash-ready payment gateway positioning.
- Expo mobile upload implementation guideline for future native app work.

## Production Configuration

Set these environment variables for `www.evoucher.co.za`:

```env
NEXT_PUBLIC_APP_URL=https://www.evoucher.co.za
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
COMPLIANCE_STORAGE_BUCKET=merchant-compliance-documents
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=onboarding@evoucher.co.za
RESEND_API_KEY=...
RESEND_FROM=eVoucher Onboarding <onboarding@evoucher.co.za>
```

Email provider note:

- SendGrid is now supported for review notifications.
- Resend remains supported by the existing notification utility.
- In production, configure at least one provider before approving/rejecting live merchant documents.

## PWA Rollout

Files added:

- `public/manifest.json`
- `public/sw.js`
- `src/components/common/PwaRegistrar.tsx`
- `src/components/common/PwaInstallButton.tsx`

Production behavior:

- Merchants visiting `https://www.evoucher.co.za` can install the site from supported mobile browsers.
- The homepage hero includes an `Install eVoucher App` button that triggers the browser PWA install prompt where supported.
- The service worker caches app shell pages and avoids caching `/api/*` responses.
- PWA registration is enabled in production automatically.
- Local development registration can be enabled with:

```env
NEXT_PUBLIC_ENABLE_PWA_DEV=true
```

## Merchant Compliance Flow

Merchant page:

- `/merchant/compliance`

Merchant capabilities:

- Upload PDF, JPG, PNG, or WebP files.
- Capture camera images from mobile browsers.
- Browser-supported image uploads are resized to 2048px and converted to JPEG where possible.
- See document status badges.
- See rejection reasons.
- Resubmit rejected documents.
- See upload progress and file size.

Server enforcement:

- Maximum file size: 10MB.
- Allowed MIME types: PDF, JPEG, PNG, WebP.
- Storage path is generated server-side.
- SHA-256 checksum is recorded.
- Supabase Storage objects are private.
- Database insert failure triggers uploaded-object cleanup.

## Admin Compliance Review

Admin portal:

- `/portal/compliance`

API endpoints:

- `GET /api/v1/admin/compliance/documents`
- `GET /api/v1/admin/compliance/documents/[documentId]/signed-url`
- `PATCH /api/v1/admin/compliance/review`

Reviewer capabilities:

- View merchant document queue.
- Filter by status.
- Open short-lived signed preview URLs.
- Approve documents.
- Reject documents with mandatory notes.
- Request more information with mandatory notes.
- Trigger merchant-facing email notifications.
- Write audit events for upload and review activity.

## Supabase Migration

Migration added:

- `supabase/migrations/20260611100000_private_merchant_compliance_documents.sql`

It adds:

- `storage_bucket`
- `storage_path`
- `original_file_name`
- `mime_type`
- `size_bytes`
- `checksum_sha256`
- `reviewed_by`
- `updated_at`
- storage indexes
- size and MIME constraints
- private `merchant-compliance-documents` bucket
- storage RLS policies for merchant-owned uploads

Apply it before production use:

```powershell
supabase db push
```

or through the approved production migration process.

## Sponsor Impact Metrics

API:

- `GET /api/v1/impact/metrics`

Homepage section displays:

- Merchants onboarded.
- Vouchers issued.
- Payouts processed.
- Payout value processed.
- Consumers reached.

The section uses live Supabase data with graceful fallback numbers so sponsor demos remain polished even before all production tables are populated.

## Revenue Split Transparency

Portal page:

- `/portal/reports`

New sponsor block shows:

- Merchant settlement value.
- Consumer benefit retained.
- Platform revenue.
- Percentage share of visible value distribution.
- NetCash-ready payment gateway positioning.

This gives sponsors a clear value-flow narrative: merchants are paid, consumers benefit, and platform revenue is transparent.

## Expo Mobile Guidance

Native Expo work is documented in:

- `docs/EXPO_MOBILE_DOCUMENT_UPLOAD.md`

Use it when the Expo app is added. It covers:

- `expo-document-picker`
- `expo-image-picker`
- `expo-image-manipulator`
- HEIC to JPEG conversion
- 2048px resizing
- Axios upload progress
- authenticated multipart upload to the same backend endpoint

## Stakeholder Demo Path

Use this order for sponsor demos:

1. Open `https://www.evoucher.co.za`.
2. Show hero: national infrastructure and dignified impact.
3. Show FNB, DTI, CSI partner signal block.
4. Show live impact metrics.
5. Click `Install eVoucher App` to install the site as a PWA on mobile or desktop where supported.
6. Open merchant compliance and upload a sample document.
7. Open `/portal/compliance` and review the document.
8. Open `/portal/reports` and show revenue split transparency plus NetCash-ready positioning.

## Release Checklist

- Supabase migration applied.
- `merchant-compliance-documents` bucket is private.
- Service role key is server-only.
- SendGrid or Resend configured.
- `NEXT_PUBLIC_APP_URL=https://www.evoucher.co.za`.
- PWA manifest loads at `/manifest.json`.
- Service worker loads at `/sw.js`.
- Compliance upload rejects files over 10MB.
- Compliance upload rejects unsupported MIME types.
- Admin signed preview URLs expire.
- Rejection and request-more notes are visible to merchants.
- Sponsor reports show revenue split and impact metrics.
