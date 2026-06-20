# Phase 2 API Quick Reference

## 🔗 Branch Hierarchy Management

**Base URL**: `/api/v1/merchant/hierarchy`

### Get Branch Hierarchy
```http
GET /api/v1/merchant/hierarchy
Authorization: Bearer {token}
```

**Response**:
```json
{
  "parentId": "uuid",
  "parentName": "Chain HQ",
  "parentStatus": "active",
  "branches": [
    {
      "id": "uuid",
      "businessName": "Chain HQ Sandton",
      "branchName": "Sandton",
      "email": "sandton@chain.com",
      "phone": "+27123456789",
      "city": "Johannesburg",
      "province": "Gauteng",
      "status": "active",
      "hasAdmin": true,
      "adminUserId": "uuid",
      "createdAt": "2026-06-25T10:00:00Z"
    }
  ],
  "totalBranches": 5
}
```

### Assign Branch Admin
```http
POST /api/v1/merchant/hierarchy
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "assign_admin",
  "branchId": "uuid",
  "adminEmail": "admin@branch.com",
  "role": "branch_admin"
}
```

**Roles**: `branch_admin`, `branch_manager`

### Get Branch Metrics
```http
POST /api/v1/merchant/hierarchy
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "get_metrics",
  "branchId": "uuid"
}
```

**Response**:
```json
{
  "branchId": "uuid",
  "activeProducts": 12,
  "totalRedemptions": 456,
  "totalRedemptionValue": 123456.78,
  "lastRedemptionAt": "2026-06-25T14:30:00Z"
}
```

### Revoke Branch Admin
```http
POST /api/v1/merchant/hierarchy
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "revoke_admin",
  "branchId": "uuid",
  "userId": "uuid"
}
```

---

## 🎯 Specials Lifecycle Management

**Base URL**: `/api/v1/merchant/specials`

### Get Active Specials
```http
GET /api/v1/merchant/specials?action=active&limit=10
GET /api/v1/merchant/specials?action=active&merchantId=uuid
GET /api/v1/merchant/specials?action=active&province=Gauteng
```

**Response**:
```json
{
  "specials": [
    {
      "id": "uuid",
      "productName": "R100 Voucher",
      "faceValue": 100.00,
      "consumerPrice": 92.50,
      "specialTitle": "Summer Sale",
      "specialEndAt": "2026-07-15T23:59:59Z",
      "displayPriority": 100,
      "merchantId": "uuid",
      "merchants": {
        "businessName": "SuperMart",
        "parentBrand": "SuperMart"
      }
    }
  ],
  "count": 10
}
```

### Schedule Special (Future Start)
```http
POST /api/v1/merchant/specials
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "schedule",
  "productId": "uuid",
  "specialTitle": "Black Friday Sale",
  "specialStartAt": "2026-11-29T00:00:00Z",
  "specialEndAt": "2026-11-30T23:59:59Z",
  "displayPriority": 200
}
```

### Activate Special (Immediate)
```http
POST /api/v1/merchant/specials
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "activate",
  "productId": "uuid",
  "specialTitle": "Flash Sale - 24 Hours",
  "specialEndAt": "2026-06-26T23:59:59Z",
  "displayPriority": 150
}
```

### Renew Special
```http
POST /api/v1/merchant/specials
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "renew",
  "productId": "uuid",
  "extensionDays": 7
}
```

### Cancel Special
```http
POST /api/v1/merchant/specials
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "cancel",
  "productId": "uuid"
}
```

### Get Special Performance
```http
GET /api/v1/merchant/specials?action=performance&productId=uuid&periodDays=7
```

**Response**:
```json
{
  "productId": "uuid",
  "periodDays": 7,
  "totalPurchases": 234,
  "totalRevenue": 21645.00,
  "redeemedCount": 198,
  "conversionRate": 84.62
}
```

### Check Expired Specials (Cron)
```http
GET /api/cron/specials-expiry
Authorization: Bearer {CRON_SECRET}
```

**Response**:
```json
{
  "success": true,
  "message": "Processed 5 expired specials",
  "expiredCount": 5,
  "results": [
    {
      "productId": "uuid",
      "merchantId": "uuid",
      "action": "expired"
    }
  ]
}
```

---

## 💰 BankServ Reconciliation

**Base URL**: `/api/v1/billing/reconciliation`  
**Access**: Portal users only (admin, finance_approver, auditor)

### Reconcile Batch
```http
GET /api/v1/billing/reconciliation?batchId=uuid
Authorization: Bearer {token}
```

**Response**:
```json
{
  "batchId": "uuid",
  "status": "matched|partial|failed",
  "totalSubmitted": 150,
  "totalAcknowledged": 145,
  "totalFailed": 5,
  "discrepancies": [
    {
      "settlementId": "uuid",
      "merchantId": "uuid",
      "expectedAmount": 1000.00,
      "receivedAmount": 999.50,
      "difference": -0.50,
      "reason": "Amount mismatch"
    }
  ],
  "failures": [
    {
      "settlementId": "uuid",
      "merchantId": "uuid",
      "amount": 500.00,
      "failureCode": "INSUFFICIENT_FUNDS",
      "failureReason": "Merchant account has insufficient balance",
      "retryable": true,
      "retryCount": 0
    }
  ]
}
```

### Get Batch Status
```http
GET /api/v1/billing/reconciliation?action=status&batchId=uuid
Authorization: Bearer {token}
```

### Generate Reconciliation Report
```http
GET /api/v1/billing/reconciliation?action=report&batchId=uuid
Authorization: Bearer {token}
```

**Response**:
```json
{
  "reportId": "uuid",
  "batchId": "uuid",
  "generatedAt": "2026-06-25T15:00:00Z",
  "summary": {
    "status": "partial",
    "totalSubmitted": 150,
    "totalAcknowledged": 145,
    "totalFailed": 5,
    "successRate": 96.67
  },
  "discrepancies": [],
  "failures": [],
  "recommendations": [
    "Review 5 failed settlements for retry eligibility",
    "3 settlements can be retried automatically",
    "2 settlements require manual intervention"
  ]
}
```

### Retry Failed Settlement
```http
POST /api/v1/billing/reconciliation
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "retry",
  "settlementId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "retryCount": 1
}
```

**Note**: Max 3 retry attempts. Returns error if exceeded.

### Manual Reconciliation Entry
```http
POST /api/v1/billing/reconciliation
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "manual_entry",
  "settlementId": "uuid",
  "merchantId": "uuid",
  "amount": 1000.00,
  "reason": "Bank system error - manually verified payment received"
}
```

**Response**:
```json
{
  "success": true,
  "entryGroupId": "uuid"
}
```

---

## 🔐 Authorization

### Merchant Routes
- Branch Hierarchy: Chain parent merchants only
- Specials Management: Merchant role required

### Portal Routes
- Reconciliation: `admin`, `finance_approver`, or `auditor` role

### Cron Jobs
- Header: `Authorization: Bearer {CRON_SECRET}`
- Set `CRON_SECRET` in environment variables

---

## 📊 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🚀 Deployment Configuration

### Environment Variables
```env
CRON_SECRET=your-secure-secret-key
```

### Vercel Cron (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/specials-expiry",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Database Migration
```bash
supabase db push
```

---

## 📝 Notes

- All dates use ISO 8601 format with timezone: `2026-06-25T15:00:00Z`
- Amounts are decimal with 2 decimal places
- UUIDs are lowercase without dashes: `550e8400e29b41d4a716446655440000`
- Retry logic: max 3 attempts, exponential backoff recommended
- Cron job runs daily at midnight UTC
- Performance data aggregates over rolling window (default 7 days)
