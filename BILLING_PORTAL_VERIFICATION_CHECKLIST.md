# 📊 Billing Portal Verification Checklist

## Transaction Flow: www.evoucher.co.za → Billing Engine Portal

---

## 🔄 **How The System Works**

### **Step 1: Consumer Makes Purchase on Website**
When a consumer completes a purchase on `https://www.evoucher.co.za`:

1. **Payment is processed** through one of 9 payment methods
2. **Voucher is created** in `customer_vouchers` table
3. **Billing event is recorded** in `billing_events` table ← **THIS IS KEY!**
4. **Wallet credit is added** (2.5% consumer benefit)

### **Step 2: Billing Engine Portal Reads Data**
The Billing Portal at `http://localhost:5173` pulls data from:

```
API Endpoint: https://www.evoucher.co.za/api/billing/events
Database Table: billing_events
Refresh Rate: Every 5 seconds (real-time)
```

---

## ✅ **Verification Checklist - What To Test**

### **🎯 Test 1: VISA Secure (3DS2) Payment**

**On Website (www.evoucher.co.za):**
1. Navigate to `/buy-vouchers`
2. Select merchant (e.g., Pick n Pay)
3. Choose voucher amount (e.g., R100)
4. Select **"VISA Secure (3DS2)"** payment method
5. Enter card details:
   - Card: 4242 4242 4242 4242
   - Expiry: 12/25
   - CVV: 123
6. Complete 3DS OTP challenge
7. Note the transaction reference

**On Billing Portal (localhost:5173):**
1. Navigate to **Voucher Ledger** tab
2. **VERIFY within 5 seconds:**
   - ✅ New row appears in transaction table
   - ✅ Transaction ID matches reference
   - ✅ Payment Method shows "3DS Secure"
   - ✅ Face Value = R100.00
   - ✅ Consumer Savings = R2.50 (2.5%)
   - ✅ Merchant Settlement = R96.00 (96%)
   - ✅ Platform Revenue = R1.20 (1.2%)
   - ✅ Status badge is ORANGE "Pending"
3. Navigate to **Overview** tab (BillingEngine)
4. **VERIFY KPI cards updated:**
   - ✅ Total Voucher Volume increased by R100
   - ✅ Platform Revenue increased by R1.20
   - ✅ Member Benefits increased by R2.50

---

### **🎯 Test 2: Cash at Till Payment**

**On Website:**
1. Select **"Cash at Till"** payment method
2. Complete checkout
3. Receive cash voucher code

**On Billing Portal:**
1. Check **Voucher Ledger**
2. **VERIFY:**
   - ✅ Payment Method shows "Cash at Till"
   - ✅ Status shows "Pending" (until cash paid)
   - ✅ All amounts calculated correctly

---

### **🎯 Test 3: eVoucher Wallet Payment**

**On Website:**
1. Ensure wallet has balance
2. Select **"eVoucher Wallet"** payment method
3. Complete instant purchase

**On Billing Portal:**
1. Check **Voucher Ledger**
2. **VERIFY:**
   - ✅ Payment Method shows "Wallet"
   - ✅ Transaction appears instantly
   - ✅ Status shows "Settled" (GREEN badge)

---

### **🎯 Test 4: PayFast Payment**

**On Website:**
1. Select **"PayFast"** payment method
2. Complete PayFast payment flow

**On Billing Portal:**
1. Check **Voucher Ledger**
2. **VERIFY:**
   - ✅ Payment Method shows "PayFast"
   - ✅ Transaction recorded with correct amounts

---

### **🎯 Test 5: USSD Payment**

**On Website:**
1. Select **"USSD (*120*8682#)"** payment method
2. Receive USSD code

**On Billing Portal:**
1. Check **Voucher Ledger**
2. **VERIFY:**
   - ✅ Payment Method shows "USSD"
   - ✅ Status shows "Pending" until USSD completed

---

### **🎯 Test 6: Settlement Processing**

**After Multiple Transactions:**
1. Navigate to **Settlement Payouts** tab
2. **VERIFY:**
   - ✅ Pending amounts card shows total
   - ✅ Number of merchants ready for batch
3. Click **"Create Batch"** button
4. **VERIFY:**
   - ✅ Batch created with unique batch number
   - ✅ Status badge shows "pending_approval" (YELLOW)
   - ✅ Total amount matches sum of transactions
5. Click **"Approve"** button (if Finance Approver role)
6. **VERIFY:**
   - ✅ Status changes to "approved" (BLUE)
   - ✅ "Export CSV" button appears
7. Click **"Export CSV"**
8. **VERIFY:**
   - ✅ CSV file downloads with all settlement details
   - ✅ BankServ format correct
9. Click **"Submit to Bank"**
10. **VERIFY:**
    - ✅ Status changes to "submitted_to_bank" (PURPLE)
11. Click **"Confirm Paid"**
12. **VERIFY:**
    - ✅ Status changes to "confirmed" (GREEN)

---

## 🔍 **What To Check in Database**

### **Verify Billing Events Table:**
```sql
SELECT 
  id,
  event_type,
  merchant_id,
  customer_id,
  gross_amount,
  total_discount_amount,
  occurred_at,
  metadata->>'paymentMethod' as payment_method,
  metadata->>'transactionReference' as txn_ref
FROM billing_events
ORDER BY occurred_at DESC
LIMIT 10;
```

**Should see:**
- ✅ Each website transaction creates ONE billing_event row
- ✅ `event_type` = 'payment_transaction'
- ✅ `gross_amount` = face value of voucher
- ✅ `total_discount_amount` = 2.5% of face value
- ✅ `metadata` contains payment method, transaction reference, voucher code

---

## 🧪 **Test All 9 Payment Methods**

| Payment Method | Website Path | Expected in Portal | Status Badge |
|----------------|-------------|-------------------|--------------|
| 1. VISA Secure (3DS2) | Buy Vouchers → Card Payment | "3DS Secure" | Orange (Pending) |
| 2. Debit/Credit Card | Buy Vouchers → Standard Card | "Card" | Orange (Pending) |
| 3. PayFast | Buy Vouchers → PayFast | "PayFast" | Orange (Pending) |
| 4. PayShap | Buy Vouchers → PayShap | "PayShap" | Orange (Pending) |
| 5. Cash at Till | Buy Vouchers → Cash | "Cash at Till" | Orange (Pending) |
| 6. USSD | Buy Vouchers → USSD | "USSD" | Orange (Pending) |
| 7. Airtime Payment | Buy Vouchers → Airtime | "Airtime" | Orange (Pending) |
| 8. eVoucher Wallet | Buy Vouchers → Wallet | "Wallet" | Green (Settled) |
| 9. EFT | Buy Vouchers → EFT | "EFT" | Orange (Pending) |

---

## 📝 **Expected Data Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│  Consumer on www.evoucher.co.za                             │
│  ↓                                                           │
│  Selects merchant & amount                                  │
│  ↓                                                           │
│  Chooses payment method (1 of 9)                            │
│  ↓                                                           │
│  Completes payment                                          │
│  ↓                                                           │
│  ✅ Voucher created in customer_vouchers                    │
│  ✅ Billing event recorded in billing_events ← KEY!         │
│  ✅ Wallet credited with 2.5% benefit                       │
│  ✅ Merchant liability recorded                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Billing Portal (localhost:5173)                            │
│  ↓                                                           │
│  Polls: GET /api/billing/events every 5 seconds            │
│  ↓                                                           │
│  Displays in Voucher Ledger tab (11 columns)               │
│  ↓                                                           │
│  Updates KPI cards on Overview tab                          │
│  ↓                                                           │
│  Aggregates for Settlement Payouts                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 **Common Issues & Fixes**

### **Issue 1: "No billing events found" in Voucher Ledger**
**Cause:** No transactions have been processed on the website yet
**Fix:** Complete at least 1 purchase on www.evoucher.co.za

### **Issue 2: Transaction appears on website but not in portal**
**Cause:** Billing event not created during checkout
**Check:** 
```sql
SELECT * FROM billing_events WHERE metadata->>'transactionReference' = 'YOUR_TXN_REF';
```
**Fix:** Ensure `createBillingEvent()` is called in payment flow

### **Issue 3: Portal shows "Failed to fetch"**
**Cause:** API endpoint not accessible or authentication failed
**Check:**
- Portal API URL in `.env.local`: `VITE_PORTAL_API_BASE_URL=https://www.evoucher.co.za`
- Admin passcode: `VITE_ADMIN_PASSCODE=eVoucherAdmin2024`
**Fix:** Login at `/login` with correct credentials

### **Issue 4: Amounts don't match (96%, 2.5%, 1.2%)**
**Cause:** Calculation logic mismatch
**Check:** VoucherLedger.jsx lines 103-120 (processedTransactions calculation)
**Expected:**
- Consumer Savings = discount * 0.7 (70% of 3.7% = 2.5%)
- Platform Revenue = discount * 0.3 (30% of 3.7% = 1.2%)
- Merchant Settlement = face value * 0.96 (96%)

---

## ✅ **Success Criteria**

All these must be TRUE:

1. ✅ Every website payment creates a billing_events row
2. ✅ Voucher Ledger shows transactions within 5 seconds
3. ✅ All 11 columns display correct data
4. ✅ Status badges are color-coded (Green/Orange/Red)
5. ✅ KPI cards update in real-time
6. ✅ All 9 payment methods are tracked
7. ✅ Settlement batches can be created and processed
8. ✅ CSV export works for sponsor reporting
9. ✅ Reconciliation panel shows settlement confirmations
10. ✅ Audit log records every transaction

---

## 📞 **Support & Debugging**

**Check Logs:**
```bash
# Website logs
tail -f .local-dev.log

# Billing Portal logs
tail -f billing-engine-portal/.local-billing-dev.log
```

**Test API Directly:**
```bash
curl -X GET "https://www.evoucher.co.za/api/billing/events?limit=10" \
  -H "X-Portal-User: mpetalebo@outlook.com" \
  -H "X-Portal-Role: admin" \
  -H "X-Portal-Passcode: eVoucherAdmin2024"
```

**Database Console:**
```sql
-- Check latest billing events
SELECT * FROM billing_events ORDER BY occurred_at DESC LIMIT 5;

-- Check settlement batches
SELECT * FROM billing_settlement_batches ORDER BY created_at DESC;

-- Check merchant liabilities
SELECT * FROM billing_merchant_liabilities ORDER BY created_at DESC LIMIT 10;
```

---

## 🎯 **Final Verification**

Before demo/sponsor presentation:

1. ✅ Process 3+ transactions on website (different payment methods)
2. ✅ Verify all appear in Voucher Ledger within 5 seconds
3. ✅ Create settlement batch
4. ✅ Export CSV
5. ✅ Verify all KPIs are accurate
6. ✅ Test search and filters work
7. ✅ Confirm real-time refresh (5 second interval)
8. ✅ Verify mobile responsive design
9. ✅ Test all color-coded status badges
10. ✅ Confirm hover tooltips show BankServ references

---

**SYSTEM IS SPONSOR-READY WHEN ALL CHECKS PASS** ✅
