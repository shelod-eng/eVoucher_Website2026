# eVoucher Backend Architecture (One‑Pager)

## Overview
eVoucher’s backend is built on **Next.js API routes** with **Supabase** as the core data platform. It supports merchant onboarding, product creation, consumer purchases, voucher redemption, and settlement processing with a compliance/audit trail.

---

## High‑Level Architecture
```mermaid
flowchart LR
  Web[Web & Merchant Portal] --> API[Next.js API Routes]
  API --> Auth[Supabase Auth]
  API --> DB[Supabase Postgres]
  API --> Storage[Supabase Storage]
  API --> Payments[Payment Gateway (PayFast/Webhooks)]
  API --> Bank[Settlement Export / BankServ]

  DB --> Audit[Audit Events]
  DB --> KYC[Merchant KYC Docs]
  DB --> Merchants[Merchants + Products]
  DB --> Vouchers[Voucher & Wallet Tables]
```

---

## Core Modules
- **Merchant Onboarding**  
  `/api/v1/merchant/onboarding/*` → creates merchant profile, assigns user, tracks verification

- **Merchant Products**  
  `/api/v1/merchant/products` → creates vouchers (gated by KYC/compliance)

- **Shop Catalog**  
  `/api/v1/shop/catalog` → delivers active merchant products to consumers

- **Voucher Purchase & Redemption**  
  `/api/v1/vouchers/purchase`, `/api/v1/vouchers/redeem`

- **Compliance & KYC**  
  `/api/v1/merchant/compliance/status`  
  `/api/v1/merchant/compliance/upload`  
  `/api/v1/admin/compliance/review`

- **Phase 2 Settlement Batches**  
  `/api/v1/admin/settlements/batches/*` → create, approve, export, submit, confirm

- **Audit & Fraud Scaffolding**  
  `audit_events`, `fraud_alerts`

---

## Data Model Highlights
- `merchants`, `merchant_products`
- `merchant_kyc_documents`, `merchant_kyc_reviews`
- `customer_vouchers`, `voucher_redemption_idempotency`
- `audit_events`, `fraud_alerts`

---

## Security & Compliance
- **RLS (Row Level Security)** on sensitive tables
- **KYC gating** before voucher issuance
- **Audit logging** for key actions (products, settlements, reviews)
- **POPIA‑aligned data handling**

---

## Deployment
- **Frontend + API:** Vercel (Next.js)
- **Database + Auth + Storage:** Supabase
- **Payments:** PayFast (webhooks)
- **Settlement files:** Exported EFT/CSV for sponsor bank

---

## Current State
- Merchant compliance workflows **live**
- SuperPrecast products **active**
- Demo chain merchants **Shoprite + Pick n Pay**
- Phase‑2 settlement endpoints **wired**

