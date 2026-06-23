# Payment Methods - PASA Compliant Implementation

## 🧮 Discount Logic (Applied to ALL Products)

### Formula:
- **Face Value**: Original retail price (e.g., R500.00)
- **Discount Budget**: 5% (50/50 split)
  - **Consumer Savings**: 2.5% of face value
  - **Platform Fee**: 2.5% of face value
- **You Pay**: Face Value - Consumer Savings
- **Merchant Receivable**: Face Value - Total Discount Budget (5%)

### Example:
```
Face Value:           R239.96
Discount Budget (5%): R12.00
  └─ Consumer Savings (2.5%): R5.99
  └─ Platform Fee (2.5%):     R6.01
You Pay:              R233.97
Merchant Receivable:  R227.96
```

---

## 💳 8 Payment Methods (PASA Standards)

### 1. PayFast
**Type**: Redirect Gateway  
**PASA Compliance**:
- ✅ PCI-DSS compliant gateway
- ✅ 3DS2 authentication
- ✅ Transaction logged in Billing Engine
- ✅ BankServ settlement via Adaptor

**User Flow**:
1. User enters email (for receipt)
2. Redirected to PayFast checkout
3. Completes payment on PayFast
4. Returns to eVoucher
5. Voucher issued

**Backend Requirements**:
- Store: `pasaEmail`, `pasaPhone`, `payfastEmail`, `transactionReference`
- Sync to Billing Engine ledger
- Route settlement via BankServ Adaptor

---

### 2. EFT (Electronic Funds Transfer)
**Type**: Manual Bank Transfer  
**PASA Compliance**:
- ✅ Bank reference provides audit trail
- ✅ Proof of payment uploaded
- ✅ Manual verification
- ✅ BankServ reconciliation

**User Flow**:
1. User sees bank details: FNB | Acc: 62834910251 | Branch: 250655
2. User transfers money
3. User uploads proof of payment (PDF/JPG/PNG)
4. Admin verifies payment
5. Voucher issued after verification

**Backend Requirements**:
- Store: `pasaEmail`, `pasaPhone`, `eftReference`, `eftProofName`
- Status: `pending_verification` until admin approves
- Sync to Billing Engine after verification

---

### 3. Card (Debit/Credit)
**Type**: Direct Card Payment  
**PASA Compliance**:
- ✅ 3DS2 authentication
- ✅ PCI-DSS tokenization
- ✅ PASA dispute resolution rules
- ✅ Transaction logged

**User Flow**:
1. User enters card number, name, expiry, CVV, billing address
2. Card authorization
3. Payment processed
4. Voucher issued

**Backend Requirements**:
- Store: `pasaEmail`, `pasaPhone`, `cardLastFour`, `cardBrand`, `billingAddress`
- Never store full card number
- Sync to Billing Engine

---

### 4. VISA Secure (3DS2)
**Type**: Card + 3D Secure OTP  
**PASA Compliance**:
- ✅ 3DS2 OTP challenge
- ✅ Bank-level authentication
- ✅ Fraud prevention
- ✅ Full audit trail

**User Flow**:
1. User enters card details
2. Bank sends OTP to customer's phone
3. Customer enters OTP
4. Payment processed
5. Voucher issued

**Backend Requirements**:
- Store: `pasaEmail`, `pasaPhone`, `cardLastFour`, `3dsAuthCode`
- Sync to Billing Engine

---

### 5. Cash at Till
**Type**: Offline Cash Payment  
**PASA Compliance**:
- ✅ Voucher token validated at POS
- ✅ Settlement logged via BankServ
- ✅ Email/phone captured before code issued

**User Flow**:
1. User completes checkout
2. Receives cash voucher code
3. Takes code to Shoprite/Pick n Pay/Boxer
4. Pays cash at till (within 24 hours)
5. eVoucher activated immediately

**Backend Requirements**:
- Store: `pasaEmail`, `pasaPhone`, `cashVoucherCode`, `expiresAt`
- Status: `pending_payment` until till confirms
- Sync to Billing Engine after confirmation

---

### 6. USSD (*120*8682#)
**Type**: Offline Phone Payment  
**PASA Compliance**:
- ✅ PASA-approved USSD rails
- ✅ Telco transaction ID
- ✅ SMS confirmation
- ✅ Works on feature phones

**User Flow**:
1. User enters phone number on website
2. Dials *120*8682# on any phone
3. Enters reference code from SMS
4. Confirms payment on phone
5. Receives voucher code via SMS

**Backend Requirements**:
- Store: `pasaEmail`, `pasaPhone`, `ussdTransactionId`, `telcoProvider`
- Status: `pending_payment` until USSD confirms
- Sync to Billing Engine

---

### 7. Airtime Payment
**Type**: Airtime Conversion  
**PASA Compliance**:
- ✅ Telco API transaction record
- ✅ MSISDN (phone number) = customer ID
- ✅ 3% convenience fee disclosed
- ✅ SMS confirmation

**User Flow**:
1. User enters phone number
2. Airtime deducted (amount + 3% fee)
3. Airtime converted to voucher value
4. Receives voucher via SMS

**Example**:
```
Voucher Value:           R233.97
Airtime Fee (3%):        R7.02
Total Airtime Deducted:  R240.99
```

**Backend Requirements**:
- Store: `pasaEmail`, `pasaPhone`, `airtimeFee`, `telcoTransactionId`
- Sync to Billing Engine

---

### 8. eVoucher Wallet
**Type**: Stored Value  
**PASA Compliance**:
- ✅ User already registered (email + phone)
- ✅ PASA stored value rules
- ✅ Instant transaction logging
- ✅ Offline caching support

**User Flow**:
1. User has wallet balance
2. Deducts from wallet
3. Instant voucher issued

**Backend Requirements**:
- Store: `pasaEmail`, `pasaPhone`, `walletBalanceBefore`, `walletBalanceAfter`
- Status: `completed` immediately
- Sync to Billing Engine

---

## 🔐 PASA Compliance Summary

### For ALL Payment Methods:
1. ✅ Email + Phone captured (from user registration)
2. ✅ Transaction logged in Billing Engine
3. ✅ Settlement via BankServ Adaptor
4. ✅ ACK/NCK handling for audit
5. ✅ 5-year record retention
6. ✅ POPIA data handling

### Database Schema Required:
```sql
-- payment_transactions table must have:
pasa_email VARCHAR(255) NOT NULL
pasa_phone VARCHAR(20) NOT NULL
payment_method VARCHAR(50) NOT NULL
transaction_reference VARCHAR(255) UNIQUE
payment_status VARCHAR(50) -- completed, pending_payment, pending_verification, failed
created_at TIMESTAMP
updated_at TIMESTAMP

-- Index for PASA audit
CREATE INDEX idx_pasa_audit ON payment_transactions(pasa_email, pasa_phone, created_at);
```

---

## 🎯 Implementation Status

### Website ✅
- [x] All 8 payment methods implemented
- [x] PASA email/phone auto-captured from user auth
- [x] Discount logic (50/50 split) working
- [x] Cart summary correct
- [x] Checkout flow complete

### Mobile App ❓
- [ ] Payment methods need verification
- [ ] Discount logic needs sync with website
- [ ] PASA compliance needs implementation

---

## 🚀 For Tuesday Demo

### Test Each Payment Method:
1. **PayFast**: Redirect, complete payment, return
2. **EFT**: Show bank details, upload proof
3. **Card**: Enter card, process
4. **VISA Secure**: Card + OTP flow
5. **Cash at Till**: Show code, explain 24hr expiry
6. **USSD**: Show dial code, explain SMS flow
7. **Airtime**: Show fee calculation
8. **Wallet**: Show instant deduction

### Demo Script:
```
1. Browse Shop → Add Kalapeng R100 voucher to cart
2. Cart shows:
   - Face Value: R100.00
   - Your Savings (2.5%): R2.50
   - You Pay: R97.50
3. Checkout → Select payment method
4. Complete payment (demo mode)
5. Voucher issued with QR code
6. Show voucher in Customer Dashboard
```

---

## ✅ DELIVERABLES FOR SPONSOR

- ✅ 8 PASA-compliant payment methods
- ✅ 50/50 discount split (2.5% consumer, 2.5% platform)
- ✅ Billing Engine ledger sync
- ✅ BankServ settlement integration
- ✅ ACK/NCK audit trail
- ✅ 5-year record retention ready
