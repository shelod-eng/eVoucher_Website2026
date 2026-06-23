# BILLING ENGINE PORTAL - DEMO SETUP CHECKLIST

## ✅ CRITICAL: Vercel Environment Variables

The Billing Engine portal needs these environment variables set in Vercel production:

**Go to**: https://vercel.com/shelod-engs-projects/[your-project]/settings/environment-variables

**Add these variables** (Production environment):

```
PORTAL_ADMIN_PASSCODE=eVoucherAdmin2024
BILLING_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
BILLING_ENCRYPTION_KEY_ID=v1
```

After adding, **redeploy** the website from Vercel dashboard or push a commit to trigger deployment.

---

## ✅ Local Billing Engine Portal Configuration

File: `billing-engine-portal/.env.local`

**Already configured**:
```
VITE_BILLING_DATA_MODE=portal
VITE_PORTAL_API_BASE_URL=https://www.evoucher.co.za
VITE_ADMIN_PASSCODE=eVoucherAdmin2024
VITE_ADMIN_EMAILS=shelod@gmail.com,mpetalebo@outlook.com
VITE_FINANCE_APPROVER_EMAILS=mpetalebo@outlook.com
```

---

## ✅ Database Schema Verification

**Required tables in Supabase** (already created):
- `billing_events` - Transaction records
- `billing_invoices` - Monthly merchant invoices  
- `billing_settlements` - Settlement records
- `billing_settlement_batches` - Batch groupings
- `billing_bank_linkages` - Merchant bank accounts
- `billing_engine_runs` - Engine execution logs
- `portal_user_roles` - Portal access control

---

## ✅ API Endpoints (Production Website)

**All endpoints deployed at**: https://www.evoucher.co.za/api/billing/

### Core Endpoints:
- `/api/billing/dashboard` - KPI totals
- `/api/billing/events` - Transaction list (Voucher Ledger)
- `/api/billing/invoices` - Invoice management
- `/api/billing/settlements` - Settlement records
- `/api/billing/settlement-batches` - Batch operations
- `/api/billing/run-engine` - Generate settlements

### Authentication:
All endpoints require:
- Header: `X-Portal-Passcode: eVoucherAdmin2024`
- Header: `X-Portal-User: your-email@domain.com`

---

## ✅ Demo Flow - Step by Step

### 1. Start Billing Engine Portal Locally
```bash
cd billing-engine-portal
npm run dev
```
Portal opens at: http://localhost:5173

### 2. Login to Portal
- Enter admin passcode: `eVoucherAdmin2024`
- Enter your email: `mpetalebo@outlook.com` or `shelod@gmail.com`

### 3. Process Payment on Production Website
Go to: https://www.evoucher.co.za
- Select any merchant (e.g., SuperPrecast)
- Add voucher to cart
- Checkout with any payment method:
  - VISA Secure (3DS2)
  - Debit/Credit Card
  - PayFast
  - EFT
  - Wallet
  - Cash at Till
  - USSD (*120*8682#)
  - Airtime
  - SASSA Card

### 4. Verify Transaction in Voucher Ledger
In portal: Click "Voucher Ledger" button
- Transaction appears within **5 seconds**
- Shows all 11 columns:
  - Transaction ID
  - Date/Time
  - Consumer ID/Name
  - Merchant ID/Name
  - Payment Method
  - Face Value (R)
  - Consumer Savings (2.5%)
  - Merchant Settlement (96%)
  - Platform Revenue (1.2%)
  - Status Badge (Green=Settled, Orange=Pending, Red=Failed)
  - Actions (Link to Settlement)

### 5. Check Dashboard Totals
Go to: Billing Engine > Overview
- Total Voucher Volume updated
- Platform Revenue (1.2%) updated
- Member Benefits (2.8%) updated
- Merchant Payouts updated

### 6. Generate Invoice
Click "Generate Monthly Invoice"
- Creates invoice from unbilled events
- Go to Invoices tab to see new invoice

### 7. Run Settlement Engine
Click "Run Settlement Engine"
- Creates settlement batch from approved invoices
- Click "Open Settlements" to view batch

### 8. Settlement Workflow
In Settlement Payouts:
- Approve batch (Finance Approver role)
- Export CSV for BankServ
- Submit to Bank
- Confirm Paid (after bank confirmation)

### 9. Audit Trail
Go to: Audit Log
- Every action recorded
- Timestamps, user emails, changes visible
- PASA/PCI-DSS compliance

---

## ✅ Real-Time Features

### Auto-Refresh Intervals:
- **Voucher Ledger**: 5 seconds
- **Dashboard KPIs**: 15 seconds
- **Settlement Batches**: On-demand

### Color Coding:
- **Green**: Settled/Confirmed
- **Orange**: Pending/Processing
- **Red**: Failed/Error
- **Blue**: Approved (awaiting export)
- **Purple**: Submitted to bank

---

## ✅ Payment Method Integration

All 9 payment methods write to `billing_events` table via:

**File**: `src/app/api/v1/vouchers/purchase/route.ts`

**Function**: `createBillingEvent()`

**After successful payment**:
```typescript
await createBillingEvent({
  merchantId: voucher.merchant_id,
  customerId: customer.id,
  grossAmount: totalAmount,
  totalDiscountAmount: consumerDiscount + platformRevenue,
  eventType: 'payment_transaction',
  metadata: {
    transactionReference,
    voucherCode,
    paymentMethod,
    source: 'www.evoucher.co.za -> website billing',
  },
});
```

---

## ✅ Troubleshooting

### Issue: "Failed to fetch" in Settlement tab
**Solution**: Verify Vercel environment variables are set (see top of document)

### Issue: No transactions in Voucher Ledger
**Check**:
1. Portal pointing to production: `VITE_PORTAL_API_BASE_URL=https://www.evoucher.co.za`
2. Payment completed successfully on website
3. Check browser console for CORS errors
4. Verify portal passcode matches

### Issue: Dashboard shows R0.00
**Solution**: Generate invoices first - transactions don't count until invoiced

### Issue: Cannot approve batches
**Check**: User email is in `VITE_FINANCE_APPROVER_EMAILS` list

---

## ✅ CSV Export Format

**Columns**:
1. Transaction ID
2. Date/Time (YYYY-MM-DD HH:mm:ss)
3. Consumer ID
4. Consumer Name
5. Merchant ID
6. Merchant Name
7. Payment Method
8. Face Value
9. Consumer Savings (2.5%)
10. Merchant Settlement (96%)
11. Platform Revenue (1.2%)
12. Status
13. Voucher Code
14. Settlement Batch ID
15. BankServ Reference

**Filename**: `voucher-ledger-YYYY-MM-DD-HHmmss.csv`

---

## ✅ Sponsor Reporting

### FNB/RMB Requirements Met:
- ✅ Real-time transaction visibility
- ✅ 70/30 discount split transparency (2.8% consumer, 1.2% platform)
- ✅ Settlement batch tracking with ACK/NCK confirmations
- ✅ Audit trail for compliance
- ✅ CSV export for reconciliation
- ✅ BankServ integration ready
- ✅ Color-coded status badges
- ✅ Two-person approval workflow

---

## ✅ Demo Script

**Presenter**: "Let me demonstrate the complete Billing Engine workflow..."

1. **[Open Portal]** "This is our fintech-grade Billing Engine portal running locally but connected to our live production environment."

2. **[Show Dashboard]** "Here you see our real-time KPIs - Total Voucher Volume, Platform Revenue at 1.2%, Member Benefits at 2.8%, and Merchant Payouts at 96%."

3. **[Process Payment]** "Now I'll process a live payment on www.evoucher.co.za..." [Complete checkout]

4. **[Open Voucher Ledger]** "Within 5 seconds, the transaction appears in our Voucher Ledger with all financial splits visible."

5. **[Point to columns]** "You can see the Face Value, Consumer Savings, Merchant Settlement amount, and our Platform Revenue - complete transparency."

6. **[Hover status badge]** "The status badges show real-time settlement status. When we hover, you see the BankServ ACK confirmation."

7. **[Click Settlement link]** "Clicking here takes us directly to the settlement batch where this payout is queued."

8. **[Generate Invoice]** "We generate monthly invoices from these unbilled events..."

9. **[Run Settlement Engine]** "Then run the settlement engine to create payout batches..."

10. **[Show Approval Workflow]** "Finance approves, exports CSV for BankServ, submits to bank, and confirms payment - full two-person control."

11. **[Export CSV]** "For sponsor reporting, we export everything to CSV with one click."

12. **[Show Audit Log]** "Every action is logged for PASA and PCI-DSS compliance."

**Presenter**: "This entire system processes live transactions, ensures sponsor transparency, and maintains bank-grade audit trails."

---

## 🎯 SUCCESS CRITERIA

✅ Transaction appears in Voucher Ledger within 5 seconds of payment
✅ Dashboard totals update in real-time
✅ All 9 payment methods integrated
✅ Settlement batches display correctly
✅ CSV export downloads with all data
✅ Status badges show color-coded states
✅ Hover tooltips display BankServ references
✅ Audit log records all activities
✅ Two-person approval workflow functional
✅ Portal connects to production website

---

## 📞 Support

If any issues arise during demo:
1. Check Vercel environment variables (most common issue)
2. Verify portal .env.local points to production
3. Confirm payment completed on website
4. Check browser console for errors
5. Restart portal: Ctrl+C then `npm run dev`

---

**Last Updated**: 2026-01-XX
**Status**: ✅ DEMO READY
