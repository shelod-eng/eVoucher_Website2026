# Environment Variables - BankServ Integration & Billing Engine

## Required for BankServ Integration

```bash
# BankServ Webhook Secret
# Used to verify incoming webhook signatures from BankServ
BANKSERV_WEBHOOK_SECRET=your-secure-webhook-secret-here

# Cron Job Secret
# Used to secure automated cron job endpoints
CRON_SECRET=your-secure-cron-secret-here

# BankServ API Credentials (Production only)
BANKSERV_API_URL=https://api.bankserv.africa/v1
BANKSERV_API_KEY=your-bankserv-api-key
BANKSERV_CLIENT_ID=your-bankserv-client-id
BANKSERV_CLIENT_SECRET=your-bankserv-client-secret

# BankServ SFTP Credentials (for batch file submission)
BANKSERV_SFTP_HOST=sftp.bankserv.africa
BANKSERV_SFTP_PORT=22
BANKSERV_SFTP_USERNAME=evoucher
BANKSERV_SFTP_PASSWORD=your-sftp-password
BANKSERV_SFTP_PATH=/incoming/settlements

# eVoucher Banking Details
EVOUCHER_BANK_CODE=250655
EVOUCHER_ACCOUNT_NUMBER=62834910251
EVOUCHER_ACCOUNT_NAME=eVoucher Platform
```

## Existing Variables (Required)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM=receipts@evoucher.co.za
```

## Development Mode

For local development, the system will:
- Auto-simulate BankServ ACK responses (95% success rate)
- Use mock SFTP file generation (returns base64 instead of uploading)
- Skip actual BankServ API calls

Set `NODE_ENV=development` to enable simulation mode.

## Vercel Deployment

Add these to your Vercel project:

1. Go to: Settings > Environment Variables
2. Add each variable above
3. Select environments: Production, Preview, Development
4. Save and redeploy

## Testing BankServ Integration

### 1. Test Settlement Instruction Submission

```bash
# After a successful purchase, check transactions table
SELECT 
  transaction_reference,
  bankserv_ack_status,
  bankserv_reference,
  settlement_status,
  settlement_date
FROM transactions
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 10;
```

### 2. Test Manual Batch Creation

```bash
# Trigger settlement batch creation manually
curl -X POST https://your-domain.vercel.app/api/v1/settlement/batch \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Test Cron Job Locally

```bash
# Run settlement cron manually
curl -X GET http://localhost:3000/api/cron/settlement \
  -H "Authorization: Bearer dev-cron-secret"
```

### 4. Simulate BankServ Webhook (ACK)

```bash
# Send mock ACK response
curl -X POST http://localhost:3000/api/v1/settlement/bankserv-webhook \
  -H "x-bankserv-signature: dev-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "EVOUCHER-REF-123",
    "status": "ACK",
    "code": "000",
    "message": "Settlement accepted",
    "timestamp": "2025-01-15T14:30:00Z"
  }'
```

### 5. Simulate BankServ Webhook (NCK - Failure)

```bash
# Send mock NCK response
curl -X POST http://localhost:3000/api/v1/settlement/bankserv-webhook \
  -H "x-bankserv-signature: dev-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "EVOUCHER-REF-123",
    "status": "NCK",
    "code": "E01",
    "message": "Invalid account number",
    "timestamp": "2025-01-15T14:30:00Z"
  }'
```

## Database Queries for Verification

### Check Merchant Ledger

```sql
SELECT 
  ml.merchant_id,
  up.business_name,
  COUNT(ml.id) as transaction_count,
  SUM(ml.credit_amount) as total_pending,
  ml.settlement_status,
  ml.settlement_date
FROM merchant_ledger ml
JOIN user_profiles up ON ml.merchant_id = up.id
WHERE ml.settlement_status = 'queued'
GROUP BY ml.merchant_id, up.business_name, ml.settlement_status, ml.settlement_date
ORDER BY total_pending DESC;
```

### Check Platform Revenue

```sql
SELECT 
  TO_CHAR(revenue_month, 'YYYY-MM') as month,
  COUNT(id) as transaction_count,
  SUM(platform_fee_amount) as gross_revenue,
  SUM(payment_processing_cost) as processing_costs,
  SUM(net_revenue) as net_revenue
FROM platform_revenue
GROUP BY revenue_month
ORDER BY revenue_month DESC;
```

### Check PASA Audit Log

```sql
SELECT 
  COUNT(*) as total_transactions,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as earliest_transaction,
  MAX(created_at) as latest_transaction,
  MIN(retention_until) as earliest_retention_expiry
FROM pasa_audit_log
WHERE retention_until > NOW();
```

### Check Settlement Batches

```sql
SELECT 
  batch_reference,
  settlement_date,
  total_amount,
  transaction_count,
  merchant_count,
  bankserv_status,
  status,
  created_at
FROM settlement_batches
ORDER BY created_at DESC
LIMIT 10;
```

## Monitoring & Alerts

### Key Metrics to Track

1. **Daily Settlement Volume**
   - Total amount queued for settlement
   - Number of transactions pending
   - Number of merchants waiting for payout

2. **BankServ Response Rates**
   - ACK rate (target: >95%)
   - NCK rate (should be <5%)
   - Average response time

3. **Revenue Recognition**
   - Daily platform fee collection
   - Payment method distribution
   - Net revenue after processing costs

4. **PASA Compliance**
   - 100% email/phone capture rate
   - Audit log retention compliance
   - No premature deletions

### Alerting Recommendations

Set up alerts for:
- NCK rate > 10% (indicates banking details issues)
- Settlement batch failures
- PASA audit log deletions before retention period
- Cron job failures
- BankServ API downtime

## Security Considerations

1. **Never commit secrets to Git**
   - Use environment variables only
   - Rotate secrets quarterly

2. **Webhook Signature Validation**
   - Always verify x-bankserv-signature header
   - Use cryptographically secure secrets

3. **Cron Job Protection**
   - Secure with Authorization header
   - Rate limit to prevent abuse
   - Log all executions

4. **Database Access**
   - Use Row Level Security (RLS) policies
   - Merchants can only see their own ledger
   - Consumers can only see their own transactions

## Troubleshooting

### Issue: Transactions not appearing in merchant_ledger

**Cause**: Transaction status is 'pending' or 'failed'

**Solution**: Only 'completed' transactions generate ledger entries. Check payment status.

### Issue: BankServ webhook returns 401 Unauthorized

**Cause**: Invalid webhook signature

**Solution**: Verify BANKSERV_WEBHOOK_SECRET matches the value configured in BankServ portal.

### Issue: Settlement batch has 0 transactions

**Cause**: No transactions ready for settlement (settlement_date > today)

**Solution**: This is normal if running before settlement date. Wait for T+2.

### Issue: Cron job not executing

**Cause**: Missing CRON_SECRET or Vercel cron not configured

**Solution**: 
1. Add CRON_SECRET to Vercel environment variables
2. Verify vercel.json has cron configuration
3. Redeploy application

## Production Checklist

Before going live:

- [ ] Database migration applied (20240115_billing_engine.sql)
- [ ] All environment variables configured in Vercel
- [ ] BankServ API credentials obtained and tested
- [ ] Webhook endpoint registered with BankServ
- [ ] SFTP access configured and tested
- [ ] Cron job scheduled and verified
- [ ] Monitoring dashboards set up
- [ ] Alert rules configured
- [ ] Test transactions completed end-to-end
- [ ] Merchant banking details validated
- [ ] PASA compliance verified
- [ ] Security audit completed
