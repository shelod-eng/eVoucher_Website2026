# 🚀 Quick Start: Billing Engine Integration Test

## Prerequisites
- Node.js installed
- Both website and portal dependencies installed

## Start Services (2 Terminals)

### Terminal 1: Website
```bash
cd C:\Users\mpeta\Desktop\eVoucher_2026\eVoucher_Website_Development2026\evoucher_website_2026
npm run dev
```
✅ Should run on: **http://localhost:4028**

### Terminal 2: Billing Portal
```bash
cd C:\Users\mpeta\Desktop\eVoucher_2026\eVoucher_Website_Development2026\evoucher_website_2026\billing-engine-portal
npm run dev
```
✅ Should run on: **http://localhost:3000** or **http://localhost:5173**

---

## Test Flow (5 Minutes)

### Step 1: Create Test Transaction (Website)
1. Open: **http://localhost:4028/buy-vouchers**
2. Select any merchant (e.g., Pick n Pay)
3. Select R100 voucher
4. Click "Add to Cart"
5. Click "Checkout"
6. Fill in payment details (any dummy data)
7. Submit payment
8. ✅ **Voucher code should be issued**

### Step 2: Verify Billing Engine (Portal)
1. Open: **http://localhost:3000** (or 5173)
2. Enter passcode: **eVoucherAdmin2024**
3. Click "Billing Engine" tab
4. **Check Dashboard:**
   - Total Voucher Volume should show: **R100.00**
   - Platform Revenue should show: **R1.20** (1.2%)
   - Member Benefits should show: **R2.80** (2.8%)
   - Pending Merchant Payouts: **R96.00**

5. **Check "Recent Website Transactions":**
   - Should list your test purchase
   - Shows: Merchant ID, Customer ID, Voucher Code, Amount
   - Source: "www.evoucher.co.za -> website billing"

### Step 3: Verify VoucherLedger
1. Stay in Billing Engine
2. Scroll to "Recent Website Transactions" section
3. ✅ Your transaction should appear with:
   - Transaction type: "purchase"
   - Gross amount: R100.00
   - Timestamp: Just now

### Step 4: Verify Settlements
1. Click "Settlement Payouts" from sidebar/menu
2. Should show:
   - Pending amount: R96.00
   - 1 merchant ready for batch
3. Click "Create Batch"
4. ✅ Settlement batch created

### Step 5: Verify BankServ
1. Click "BankServ" from sidebar/menu
2. Should show:
   - Payment flow architecture
   - Settlement batches list
   - Status: pending_approval or approved
3. ✅ Batch visible with correct amount

---

## 🔍 Troubleshooting

### Portal Shows Empty/Mock Data?

**Check:**
1. Portal `.env.local` has: `VITE_PORTAL_API_BASE_URL=http://localhost:4028`
2. Website is running on port 4028
3. Portal can access website (open browser console, check for CORS errors)

**Fix:**
```bash
# In billing-engine-portal/.env.local
VITE_PORTAL_API_BASE_URL=http://localhost:4028
```

### Portal Shows "Failed to Fetch"?

**Cause:** CORS blocking portal requests

**Fix:** Open browser DevTools (F12), check Console for errors.

If you see CORS errors, temporarily add to website:
```typescript
// In website API routes, add response headers:
response.headers.set('Access-Control-Allow-Origin', '*');
response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Portal-User, X-Portal-Passcode');
```

### Dashboard Shows Zeros?

**Cause:** No billing_events in database yet

**Fix:** Create a test transaction on the website first.

### Transaction Not Appearing?

**Check:**
1. Website console logs (check for billing event errors)
2. Supabase dashboard → billing_events table
3. Portal API calls (Network tab in DevTools)

**Verify billing event was created:**
```sql
-- Check Supabase billing_events table
SELECT * FROM billing_events 
ORDER BY occurred_at DESC 
LIMIT 10;
```

---

## ✅ Success Checklist

Before demo, verify:

- [ ] Website runs on http://localhost:4028
- [ ] Portal runs on http://localhost:3000 (or 5173)
- [ ] Portal `.env.local` updated with localhost API URL
- [ ] Test transaction completes successfully
- [ ] Dashboard shows R100 total voucher volume
- [ ] Recent transactions section shows test purchase
- [ ] Settlement tab loads without error
- [ ] BankServ tab displays batch
- [ ] No console errors in browser

---

## 🎬 Demo Ready!

Once all checks pass, you're ready for sponsor demonstration.

**Demo Flow:**
1. Show website purchase (30 seconds)
2. Show Billing Engine Dashboard updates (1 minute)
3. Show VoucherLedger transaction record (30 seconds)
4. Show Settlement payout queue (30 seconds)
5. Show BankServ ACK confirmation (30 seconds)

**Total Demo Time:** 3 minutes

---

## 📞 Support

If issues persist:
1. Check `BILLING_ENGINE_SYNC_REPORT.md` for detailed troubleshooting
2. Verify Supabase credentials in `.env.local`
3. Check browser console for API errors
4. Restart both services (website + portal)

**Key Files:**
- Website API: `src/app/api/billing/dashboard/route.ts`
- Billing Recorder: `src/lib/billing/billing-event-recorder.ts`
- Portal Config: `billing-engine-portal/.env.local`
- Portal API Client: `billing-engine-portal/src/api/portal-api.js`
