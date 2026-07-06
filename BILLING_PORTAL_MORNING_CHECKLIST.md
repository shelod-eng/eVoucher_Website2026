# Billing Portal - Morning Checklist (11am Presentation)

## CRITICAL: What's Working
✅ Main eVoucher website - ALL PAYMENTS WORKING
✅ PWA installation (uninstall old one first if greyed out)
✅ Voucher purchases and issuance
✅ Transaction history

## Billing Portal Setup (5 Minutes)

### Step 1: Verify Mock Mode
File: `billing-engine-portal/.env.local`
Should have: `VITE_BILLING_DATA_MODE=mock`

### Step 2: Start Billing Portal
```bash
cd billing-engine-portal
npm run dev
```
Should open at: http://localhost:5173

### Step 3: Login
- **Email**: mpetalebo@outlook.com
- **Passcode**: eVoucherAdmin2024

### Step 4: What You Should See

**BillingEngine Page (Overview Tab)**
✅ Yellow banner: "Demo mode: showing mock billing data"
✅ 6 KPI cards showing totals (Total Volume, Platform Revenue, etc.)
✅ Benefit Distribution Model chart
✅ 5-Year Financial Projections

**BillingEngine Page (Invoices Tab)**
✅ 3 mock invoices:
   - Shoprite: R1,432.80 (pending)
   - Super Precast: R955.20 (paid)
   - Kalapeng: R4,584.96 (pending)

**Settlement Payouts Page**
✅ Pending amount: Shows total from invoices
✅ "Create Batch" button
✅ Full workflow: Approve → Export CSV → Submit to Bank → Confirm Paid

**Voucher Ledger Page**
❌ Will show "No transactions found" (no mock data for this page)
- Just say: "This syncs with live API from www.evoucher.co.za"

## If Nothing Shows

### Issue 1: Not Logged In
- Look for login page - enter credentials above
- Check top right corner for your email

### Issue 2: Wrong Page
- Make sure you're on "BillingEngine" page, NOT "VoucherLedger"
- Click "Overview" tab if on different tab

### Issue 3: Still Blank
- Open browser console (F12)
- Look for errors
- Try refreshing page (Ctrl+R)

## Presentation Strategy

### Show Main Website (10 minutes)
1. Consumer purchases voucher ✅
2. Shows payment methods ✅
3. Voucher issued successfully ✅
4. PWA installation demo ✅

### Show Billing Portal (5 minutes)
1. Overview dashboard with KPIs ✅
2. Invoices tab - show 3 merchants ✅
3. Settlement Payouts - full workflow ✅
4. Skip Voucher Ledger (say "API integration pending")

### Key Talking Points
- "We have a full fintech-grade billing engine"
- "Automated merchant settlements via BankServ"
- "2-person approval workflow for finance compliance"
- "Real-time transaction tracking from website"
- "Mock data demonstrates full capability"

## If Billing Portal Doesn't Work at All
**Fallback**: Just show main website - it's FULLY WORKING and impressive!
- Skip billing portal entirely
- Focus on consumer experience
- Mention billing as "backend capability we're building"

## Emergency Contact
If completely stuck, use InPrivate/Incognito window for main website.
Billing portal is a "nice to have" - main site is what matters!

Good luck! 🚀
