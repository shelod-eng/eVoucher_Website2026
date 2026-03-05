# Supabase Optimization Checklist for eVoucher Platform

**Last Updated:** March 5, 2026  
**Status:** Active Development  
**Target:** MVP → Production Ready

---

## PHASE 1: DATABASE INDEXES (CRITICAL - Do First)

### Priority 1: Transaction & Query Optimization

```sql
-- 1.1 Merchant lookup indexes
CREATE INDEX IF NOT EXISTS idx_merchants_id ON merchants(id);
CREATE INDEX IF NOT EXISTS idx_merchants_email ON merchants(email);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
CREATE INDEX IF NOT EXISTS idx_merchants_vetting_status ON merchants(vetting_status);
CREATE INDEX IF NOT EXISTS idx_merchants_merchant_type ON merchants(merchant_type);
CREATE INDEX IF NOT EXISTS idx_merchants_created_at ON merchants(created_at DESC);

-- 1.2 Voucher & product indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_merchant_id ON vouchers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_created_at ON vouchers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vouchers_expires_at ON vouchers(expires_at DESC);

-- 1.3 Transaction indexes
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- 1.4 Customer & wallet indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_wallets_customer_id ON wallets(customer_id);
CREATE INDEX IF NOT EXISTS idx_wallets_balance ON wallets(balance) WHERE balance > 0;

-- 1.5 Verification & onboarding indexes
CREATE INDEX IF NOT EXISTS idx_verifications_merchant_id ON merchant_onboarding_verifications(merchant_id);
CREATE INDEX IF NOT EXISTS idx_verifications_email_verified_at ON merchant_onboarding_verifications(email_verified_at);
CREATE INDEX IF NOT EXISTS idx_verifications_credentials_sent ON merchant_onboarding_verifications(credentials_sent_at);

-- 1.6 Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_merchants_status_created 
  ON merchants(status, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_date 
  ON transactions(merchant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vouchers_merchant_status 
  ON vouchers(merchant_id, status, expires_at DESC);
```

**Verification:**

```sql
-- Check index size and usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_size,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM (
  SELECT
    schemaname,
    tablename,
    indexrelname as indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as idx_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
) t
ORDER BY idx_size DESC;

-- Identify missing indexes
SELECT * FROM pg_stat_user_tables 
WHERE seq_scan > 100 
ORDER BY seq_scan DESC;
```

---

## PHASE 2: ROW LEVEL SECURITY (RLS) - Essential for Multi-tenant

### 2.1 Enable RLS on All Tables

```sql
-- Enable RLS
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_onboarding_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "merchants_select_policy" ON merchants;
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
```

### 2.2 Merchant Access Control

```sql
-- Merchants can only see their own data
CREATE POLICY "merchants_own_data" ON merchants
  FOR ALL
  USING (
    auth.uid()::text = user_id 
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Customers can only see themselves
CREATE POLICY "customers_own_profile" ON customers
  FOR ALL
  USING (
    auth.uid()::text = id 
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Merchants see only their vouchers
CREATE POLICY "vouchers_merchant_access" ON vouchers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM merchants 
      WHERE merchants.id = vouchers.merchant_id 
      AND merchants.user_id = auth.uid()::text
    )
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Transactions visible to relevant parties
CREATE POLICY "transactions_access" ON transactions
  FOR SELECT
  USING (
    customer_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM merchants 
      WHERE merchants.id = transactions.merchant_id 
      AND merchants.user_id = auth.uid()::text
    )
    OR auth.jwt() ->> 'role' = 'admin'
  );
```

### 2.3 Service Role (For Backend APIs)

```sql
-- Service role bypasses RLS
-- Use only in backend functions with SECURITY DEFINER

CREATE FUNCTION get_merchant_revenue(merchant_id UUID)
RETURNS TABLE (
  total_revenue DECIMAL,
  transaction_count BIGINT,
  last_transaction TIMESTAMP
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(amount)::DECIMAL,
    COUNT(*)::BIGINT,
    MAX(created_at)
  FROM transactions
  WHERE transactions.merchant_id = $1;
END;
$$;

-- Grant to service role only
GRANT EXECUTE ON FUNCTION get_merchant_revenue(UUID) TO service_role;
```

---

## PHASE 3: QUERY OPTIMIZATION

### 3.1 N+1 Query Prevention

**BEFORE (BAD - N+1 queries):**

```typescript
// Fetches 100 merchants, then N queries for each
const merchants = await supabase
  .from('merchants')
  .select('*')
  .limit(100);

for (const merchant of merchants.data) {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('merchant_id', merchant.id);
}
```

**AFTER (GOOD - Single query with joins):**

```typescript
const { data: merchantsWithTransactions } = await supabase
  .from('merchants')
  .select(`
    *,
    transactions:transactions(
      id,
      amount,
      status,
      created_at
    )
  `)
  .limit(100);
```

### 3.2 Materialized Views for Complex Reports

```sql
-- Create materialized view for merchant dashboard
CREATE MATERIALIZED VIEW merchant_dashboard_metrics AS
SELECT 
  m.id as merchant_id,
  m.business_name,
  COUNT(DISTINCT v.id) as total_vouchers,
  COUNT(DISTINCT t.id) as total_transactions,
  SUM(t.amount) as total_revenue,
  AVG(t.amount) as avg_transaction_amount,
  MAX(t.created_at) as last_transaction_date,
  COUNT(DISTINCT w.customer_id) as unique_customers
FROM merchants m
LEFT JOIN vouchers v ON m.id = v.merchant_id
LEFT JOIN transactions t ON m.id = t.merchant_id
LEFT JOIN wallets w ON m.id = w.merchant_id
GROUP BY m.id, m.business_name;

-- Create index on materialized view
CREATE INDEX idx_merchant_dashboard_metrics_id 
  ON merchant_dashboard_metrics(merchant_id);

-- Refresh periodically (via cron job)
REFRESH MATERIALIZED VIEW CONCURRENTLY merchant_dashboard_metrics;
```

### 3.3 Connection Pooling Settings

**In Supabase Dashboard → Project Settings → Database:**

```text
Connection Pool Mode: Transaction
Max pool size: 15
```

**In your .env:**

```text
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# Use pooled connection string for queries
SUPABASE_ADMIN_URL=https://xxxxx.supabase.co  # For admin operations
```

---

## PHASE 4: PERFORMANCE TUNING

### 4.1 Query Analysis & EXPLAIN

```sql
-- Identify slow queries
EXPLAIN ANALYZE
SELECT 
  m.id,
  m.business_name,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_amount
FROM merchants m
LEFT JOIN transactions t ON m.id = t.merchant_id
WHERE m.created_at > NOW() - INTERVAL '30 days'
GROUP BY m.id, m.business_name;

-- Look for:
-- ❌ Sequential Scans (should use indexes)
-- ❌ High actual rows (needs filtering)
-- ❌ High planning time (might need materialized view)
```

### 4.2 Autovacuum Optimization

```sql
-- Adjust autovacuum for high-churn tables
ALTER TABLE transactions SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_cost_delay = 10
);

-- Check autovacuum activity
SELECT 
  schemaname,
  relname,
  last_vacuum,
  last_autovacuum,
  vacuum_count,
  autovacuum_count
FROM pg_stat_user_tables
WHERE relname IN ('transactions', 'vouchers')
ORDER BY last_autovacuum DESC;
```

### 4.3 Table Partitioning (For Large Datasets)

```sql
-- Partition transactions table by month
CREATE TABLE transactions_2024_01 PARTITION OF transactions
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE transactions_2024_02 PARTITION OF transactions
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- This helps with:
-- ✅ Faster queries on recent data
-- ✅ Easier archive/deletion of old data
-- ✅ Parallel query execution
```

---

## PHASE 5: CACHING STRATEGY

### 5.1 Supabase Cache Headers

```typescript
// Control Supabase response caching
const { data } = await supabase
  .from('merchants')
  .select('*')
  .set('cache-control', 'public, max-age=3600'); // Cache 1 hour
```

### 5.2 Redis Layer (Optional - Add When Needed)

```typescript
// Implementation: Upstash Redis (serverless)
// Cost: ~$0.2/GB stored

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Cache merchant dashboard
async function getMerchantDashboard(merchantId: string) {
  const cacheKey = `dashboard:${merchantId}`;
  
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  
  // Query from Supabase if not cached
  const { data } = await supabase
    .from('merchant_dashboard_metrics')
    .select('*')
    .eq('merchant_id', merchantId)
    .single();
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(data));
  
  return data;
}
```

---

## PHASE 6: MONITORING & ALERTS

### 6.1 Supabase Dashboard Monitoring

**Dashboard → Database → Monitoring:**

- ✅ CPU usage (should stay <70%)
- ✅ Memory usage (should stay <75%)
- ✅ Disk usage (alert if >80%)
- ✅ Connection count (watch for leaks)
- ✅ Query latency (p95 should be <200ms)

### 6.2 Set Up Alerts

```yaml
# In Supabase → Database → Configuration

CPU Usage Alert:
  Threshold: > 75%
  Duration: 5 minutes
  Action: Email + Slack

Storage Alert:
  Threshold: > 400MB (on 500MB free tier)
  Action: Email + Slack

Connection Pool Exhaustion:
  Threshold: > 10 connections
  Action: Alert immediately
```

### 6.3 Query Performance Tracking

```sql
-- Enable pg_stat_statements (tracks all queries)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time,
  stddev_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## PHASE 7: BACKUP & DISASTER RECOVERY

### 7.1 Supabase Backup Configuration

**Settings → Backups:**

- ✅ Daily automated backups (enabled by default)
- ✅ Point-in-time recovery: 7 days
- ✅ Manual backup before major changes

### 7.2 Custom Backup Script

```bash
#!/bin/bash
# backup-supabase.sh - Manual backup to GitHub

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Export database
pg_dump \
  --host "$SUPABASE_DB_HOST" \
  --username "postgres" \
  --database "postgres" \
  --format=custom \
  --verbose \
  > "$BACKUP_DIR/evoucher_$TIMESTAMP.dump"

# Commit to git (store backup reference)
git add "$BACKUP_DIR/"
git commit -m "Database backup $TIMESTAMP"
git push origin main

echo "Backup completed: $BACKUP_DIR/evoucher_$TIMESTAMP.dump"
```

### 7.3 Restore Procedure

```bash
# When you need to restore
pg_restore \
  --host "$NEW_DB_HOST" \
  --username "postgres" \
  --database "postgres" \
  --format=custom \
  --jobs=4 \
  "$BACKUP_DIR/evoucher_TIMESTAMP.dump"
```

---

## PHASE 8: MOBILE APP CONSIDERATIONS (Vercel + Supabase)

### 8.1 API Rate Limiting

```typescript
// Add rate limiting to your API routes for mobile traffic
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '10 s'),
});

export async function middleware(request: NextRequest) {
  const { success } = await ratelimit.limit(request.ip!);
  
  if (!success) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }
}
```

### 8.2 Offline-First Caching

```typescript
// Service Worker caching for mobile app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/api/v1/merchants/{id}',
        '/api/v1/vouchers',
        '/api/v1/transactions',
      ]);
    })
  );
});
```

### 8.3 Mobile-Specific Optimization

```typescript
// Compress responses for mobile
// In Vercel deployment: Enable Gzip compression
// In next.config.mjs:
export default {
  compress: true, // Gzip in built output
};

// Return minimal fields for mobile
const { data } = await supabase
  .from('vouchers')
  .select('id, title, amount, expires_at') // Not full object
  .limit(10);
```

---

---

## QUICK WINS CHECKLIST

### This Week

- [ ] Create all indexes (Section 1)
- [ ] Enable RLS policies (Section 2)
- [ ] Set up Supabase monitoring dashboard
- [ ] Create daily backup script

### This Month

- [ ] Optimize slow queries with EXPLAIN ANALYZE (Section 4.1)
- [ ] Create materialized views for dashboard (Section 3.2)
- [ ] Configure connection pooling (Section 3.3)
- [ ] Set up Redis caching if needed (Section 5.2)

### Before Production

- [ ] Test backup/restore procedure
- [ ] Load test with 1,000+ concurrent users
- [ ] Verify RLS policies block unauthorized access
- [ ] Document runbooks for common issues

---

## PERFORMANCE TARGETS

| Metric | Target | Current |
| --- | --- | --- |
| P95 Query Latency | <200ms | ? |
| P99 Query Latency | <500ms | ? |
| Database CPU | <70% | ? |
| Connection Pool Availability | >99.5% | ? |
| Backup Success Rate | 100% | ? |

---

## MAINTENANCE SCHEDULE

```text
Daily: Monitor CPU/Memory usage
Weekly: Review slow query logs
Monthly: Run VACUUM ANALYZE
Quarterly: Update database statistics
Annually: Archive old transactions, review capacity plan
```

---

**Next Step:** Move to AWS Migration Playbook when ready to scale beyond Supabase limits.
