# AWS Migration Playbook for eVoucher Platform

**Purpose:** Guide for scaling from Supabase → AWS RDS when you outgrow single-region Supabase limits  
**Target Timeline:** Year 2-3 (when monthly bill exceeds R2,500)  
**Estimated Migration Time:** 2-3 weeks

---

## PHASE 1: WHEN TO MIGRATE

### Supabase → AWS Decision Tree

**Migrate to AWS RDS when you hit ANY of these limits:**

| Metric | Supabase Limit | Your Action |
| --- | --- | --- |
| Database Size | 2 GB (Pro tier) | Upgrade or migrate |
| Concurrent Connections | 100 | Connection pooling no longer helps |
| Monthly Cost | > R5,000 | AWS RDS becomes cheaper (R500-R2,500) |
| Query Latency | > 500ms | Need multi-region replication |
| Availability Requirement | 99.9% SLA needed | AWS provides 99.95% |
| HIPAA/Compliance | Regulated data | AWS Enterprise support required |

**Year 1 Projection (Supabase):**

- Merchants: 50-100
- Monthly transactions: 5,000-10,000
- Database size: ~200-500 MB
- Cost: R500-R1,000/month
- **Decision: STAY ON SUPABASE**

**Year 2-3 Projection (When to migrate):**

- Merchants: 500-1,000
- Monthly transactions: 50,000-100,000
- Database size: 1-2 GB
- Cost trajectory: R2,000-R5,000/month
- **Decision: MIGRATE IF COST > R2,500 or if you need multi-region**

### Pre-Migration Readiness Checklist

- [ ] Supabase optimization complete (all indexes, RLS, materialized views)
- [ ] Database backups working for 30+ days
- [ ] Load testing shows current limit (transactions/sec)
- [ ] Cost analysis shows AWS cheaper
- [ ] Team trained on AWS RDS operations
- [ ] Downtime window scheduled (2-4 hours planned)
- [ ] Rollback procedure documented and tested

---

## PHASE 2: ARCHITECTURE COMPARISON

### Supabase Stack (Current)

```text
┌─────────────────┐
│  Next.js App    │
│  (Vercel)       │
└────────┬────────┘
         │
┌────────▼────────┐
│  Supabase       │
│  PostgreSQL     │
│  EU Region      │
│  Single Zone    │
└─────────────────┘
```

**Features:**

- Managed: Supabase handles upgrades, security, backups
- Single region: All data in Ireland
- Real-time: Built-in PostgreSQL subscriptions
- Auth: Supabase Auth integrated
- Cost: R300-R1,000/month

### AWS RDS Stack (Future)

```text
┌──────────────────────────────────────┐
│     Next.js App (Vercel)             │
│     Multi-region endpoints           │
└──────────────────┬───────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼──────┐  ┌───▼──────┐  ┌───▼──────┐
│ RDS      │  │ Read     │  │ Read     │
│ Primary  │  │ Replica  │  │ Replica  │
│ eu-west │  │ eu-east  │  │ us-east  │
└──────────┘  └──────────┘  └──────────┘
    │              │              │
    └──────────────┬──────────────┘
                   │
          ┌────────▼────────┐
          │  Aurora Global  │
          │  Database       │
          └─────────────────┘
```

**Features:**

- Self-managed: Complete control over configuration
- Multi-region: Read replicas in 2-3 regions
- Aurora Global DB: <1ms cross-region replication
- Advanced: Custom performance tuning
- Cost: R500-R3,000/month (depending on instance size)

---

## PHASE 3: INFRASTRUCTURE SETUP

### 3.1 AWS Account Preparation

```bash
# Step 1: Create AWS account or use existing
# Console: https://console.aws.amazon.com/

# Step 2: Install AWS CLI
brew install awscli  # macOS
# or download from: https://aws.amazon.com/cli/

# Step 3: Configure AWS credentials
aws configure
# AWS Access Key ID: [from IAM console]
# AWS Secret Access Key: [from IAM console]
# Default region: eu-west-1 (Ireland)
# Default output format: json

# Step 4: Verify configuration
aws s3 ls  # Should list S3 buckets (or return empty)
```

### 3.2 Create RDS PostgreSQL Instance

```bash
#!/bin/bash
# create-rds-instance.sh

# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name evoucher-subnets \
  --db-subnet-group-description "eVoucher database subnet" \
  --subnet-ids subnet-12345678 subnet-87654321 \
  --region eu-west-1

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier evoucher-primary \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username postgres \
  --master-user-password "$(openssl rand -base64 32)" \
  --allocated-storage 100 \
  --storage-type gp3 \
  --db-subnet-group-name evoucher-subnets \
  --vpc-security-group-ids sg-12345678 \
  --multi-az \
  --backup-retention-period 30 \
  --enable-cloudwatch-logs-exports postgresql \
  --enable-iam-database-authentication \
  --region eu-west-1

# Get endpoint after creation
aws rds describe-db-instances \
  --db-instance-identifier evoucher-primary \
  --query 'DBInstances[0].Endpoint' \
  --region eu-west-1
```

### 3.3 Restore from Supabase Backup

```bash
#!/bin/bash
# restore-from-supabase.sh

# Step 1: Download backup from Supabase
# Dashboard → Database → Backups → Download backup file

# Step 2: Restore to RDS
pg_restore \
  --host evoucher-primary.xxxxx.eu-west-1.rds.amazonaws.com \
  --username postgres \
  --database postgres \
  --format=custom \
  --jobs=4 \
  --verbose \
  ./evoucher_backup.dump

# Step 3: Verify data
psql -h evoucher-primary.xxxxx.eu-west-1.rds.amazonaws.com \
  -U postgres \
  -d postgres \
  -c "SELECT COUNT(*) FROM merchants;"

# Expected output: (your merchant count)
```

---

## PHASE 4: SETUP AURORA GLOBAL DATABASE (Multi-Region)

### 4.1 Enable Aurora Global Database

```bash
#!/bin/bash
# create-aurora-global.sh

# Step 1: Create primary cluster
aws rds create-db-cluster \
  --db-cluster-identifier evoucher-global-primary \
  --engine aurora-postgresql \
  --engine-version 15.2 \
  --master-username postgres \
  --master-user-password "$(openssl rand -base64 32)" \
  --database-name evoucher \
  --backup-retention-period 30 \
  --region eu-west-1

# Step 2: Add instances to primary cluster
aws rds create-db-instance \
  --db-instance-identifier evoucher-global-primary-1 \
  --db-instance-class db.r6g.xlarge \
  --engine aurora-postgresql \
  --db-cluster-identifier evoucher-global-primary \
  --region eu-west-1

# Step 3: Create secondary region cluster (us-east-1)
aws rds create-db-cluster \
  --db-cluster-identifier evoucher-global-secondary \
  --engine aurora-postgresql \
  --global-cluster-identifier evoucher-global \
  --region us-east-1

# Step 4: Verify replication
aws rds describe-global-clusters \
  --global-cluster-identifier evoucher-global
```

### 4.2 Read Replica Configuration

```typescript
// In your application code: read replicas for reporting

// Primary connection (writes)
const primaryClient = new PoolClient({
  connectionString: process.env.DATABASE_URL_PRIMARY,
});

// Read replica connection (reads only)
const replicaClient = new PoolClient({
  connectionString: process.env.DATABASE_URL_REPLICA,
});

// Route queries intelligently
export async function executeQuery(sql: string, params: any[], isWrite: boolean) {
  const client = isWrite ? primaryClient : replicaClient;
  return client.query(sql, params);
}

// Example usage in Next.js
export async function getMerchantDashboard(merchantId: string) {
  // Reporting query: use read replica
  const result = await executeQuery(
    `SELECT * FROM merchant_dashboard_metrics WHERE merchant_id = $1`,
    [merchantId],
    false  // not a write
  );
  return result.rows[0];
}
```

---

## PHASE 5: DATA MIGRATION STRATEGY

### 5.1 Zero-Downtime Migration Using Logical Replication

```bash
#!/bin/bash
# zero-downtime-migration.sh

# Step 1: Enable logical decoding on Supabase
# Dashboard → Database → Replication → pglogical extension

# Step 2: Create publication on Supabase
psql -h supabase-endpoint.supabase.co \
  -U postgres \
  -d postgres \
  -c "CREATE PUBLICATION evoucher_pub FOR ALL TABLES;"

# Step 3: Create subscription on RDS
psql -h evoucher-primary.rds.amazonaws.com \
  -U postgres \
  -d postgres \
  -c "CREATE SUBSCRIPTION evoucher_sub CONNECTION 'host=supabase-endpoint.supabase.co dbname=postgres user=postgres password=xxx' PUBLICATION evoucher_pub;"

# Step 4: Monitor replication lag
psql -h evoucher-primary.rds.amazonaws.com \
  -U postgres \
  -d postgres \
  -c "SELECT
    slot_name,
    slot_type,
    restart_lsn,
    confirmed_flush_lsn
  FROM pg_replication_slots;"

# Step 5: Once replication lag < 100ms, switch traffic
# Update environment variables in Vercel

# Step 6: Drop subscription (cleanup)
psql -h evoucher-primary.rds.amazonaws.com \
  -U postgres \
  -d postgres \
  -c "DROP SUBSCRIPTION evoucher_sub;"
```

### 5.2 Update Connection Strings

**Vercel Environment Variables:**

```bash
# Before (Supabase)
DATABASE_URL=postgresql://[user]:[password]@[host]/postgres

# After (AWS RDS)
DATABASE_URL_PRIMARY=postgresql://postgres:xxxxx@evoucher-primary.eu-west-1.rds.amazonaws.com/evoucher
DATABASE_URL_REPLICA=postgresql://postgres:xxxxx@evoucher-replica.eu-west-1.rds.amazonaws.com/evoucher
DATABASE_URL_READ_ONLY=postgresql://readonly:xxxxx@evoucher-replica.eu-west-1.rds.amazonaws.com/evoucher
```

---

## PHASE 6: PERFORMANCE TUNING ON AWS

### 6.1 RDS Parameter Group Optimization

```bash
# Create custom parameter group
aws rds create-db-cluster-parameter-group \
  --db-cluster-parameter-group-name evoucher-params \
  --db-parameter-group-family aurora-postgresql15 \
  --description "Optimized for eVoucher platform"

# Optimize for OLTP workload
aws rds modify-db-cluster-parameter-group \
  --db-cluster-parameter-group-name evoucher-params \
  --parameters \
    ParameterName=shared_buffers,ParameterValue=16000,ApplyMethod=immediate \
    ParameterName=effective_cache_size,ParameterValue=24000,ApplyMethod=immediate \
    ParameterName=random_page_cost,ParameterValue=1.1,ApplyMethod=immediate \
    ParameterName=work_mem,ParameterValue=4096,ApplyMethod=immediate
```

### 6.2 Enhanced Monitoring

```bash
# Enable CloudWatch detailed monitoring
aws rds modify-db-instance \
  --db-instance-identifier evoucher-primary \
  --enable-cloudwatch-logs-exports postgresql \
  --monitoring-interval 60 \
  --monitoring-role-arn arn:aws:iam::ACCOUNT:role/rds-monitoring-role
```

### 6.3 Automated Backups & Snapshots

```bash
# Create automated snapshots
aws rds modify-db-instance \
  --db-instance-identifier evoucher-primary \
  --backup-retention-period 30 \
  --preferred-backup-window "02:00-03:00" \
  --preferred-maintenance-window "sun:03:00-sun:04:00"

# Create on-demand snapshot before major changes
aws rds create-db-snapshot \
  --db-instance-identifier evoucher-primary \
  --db-snapshot-identifier evoucher-snapshot-20260305
```

---

## PHASE 7: MONITORING & ALERTING

### 7.1 CloudWatch Dashboards

```bash
# Create dashboard for key metrics
aws cloudwatch put-dashboard \
  --dashboard-name eVoucher-RDS \
  --dashboard-body file://dashboard-config.json
```

**Dashboard metrics to watch:**

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
          ["AWS/RDS", "DatabaseConnections"],
          ["AWS/RDS", "ReadLatency"],
          ["AWS/RDS", "WriteLatency"],
          ["AWS/RDS", "ReadThroughput"],
          ["AWS/RDS", "WriteThroughput"],
          ["AWS/RDS", "FreeableMemory"]
        ]
      }
    }
  ]
}
```

### 7.2 Alarms Setup

```bash
# Alert on high CPU
aws cloudwatch put-metric-alarm \
  --alarm-name evoucher-rds-high-cpu \
  --alarm-description "Alert when RDS CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:eu-west-1:ACCOUNT:alerts

# Alert on replication lag
aws cloudwatch put-metric-alarm \
  --alarm-name evoucher-replication-lag \
  --alarm-description "Alert when replication lag > 1 second" \
  --metric-name AuroraBinlogReplicaLag \
  --namespace AWS/RDS \
  --statistic Maximum \
  --period 60 \
  --threshold 1000 \  # milliseconds
  --comparison-operator GreaterThanThreshold
```

---

## PHASE 8: COST ESTIMATION

### AWS RDS Pricing (South Africa Region)

| Component | Size | Monthly Cost |
| --- | --- | --- |
| Primary DB Instance (db.t3.medium) | 2 vCPU, 4 GB RAM | R400 |
| Read Replica (db.t3.small) | 1 vCPU, 2 GB RAM | R200 |
| Storage (GP3, 100 GB) | 100 GB | R300 |
| Data Transfer (1 TB/month) | 1 TB | R200 |
| Backups (30 day retention) | ~30 GB | R50 |
| CloudWatch Logs | 10 GB/month | R50 |
| **Total Monthly** | | **R1,200** |

**vs Supabase Pro Tier:**

- Supabase: R1,500/month (for 1 GB, limited to 1 region)
- AWS RDS: R1,200/month (100 GB, multi-region, full control)
- **Savings: R300/month + 100x more capacity**

### Year 3 Projection (1,000 merchants, 100k tx/month)

**Supabase (if still available):**

- Database: 2-5 GB
- Tier needed: Enterprise (custom pricing, R5,000+)

**AWS RDS:**

- Primary (db.r6i.2xlarge): R2,000
- 2x Read replicas: R1,200
- Storage (500 GB): R1,000
- Total: R4,200/month
- **Plus:** Full control, compliance support, multi-AZ guaranteed

---

## PHASE 9: ROLLBACK PROCEDURE

### If Migration Fails

```bash
#!/bin/bash
# rollback-to-supabase.sh

# Step 1: Stop Vercel deployments
# Dashboard → Settings → Pause deployments

# Step 2: Backup current RDS state
aws rds create-db-snapshot \
  --db-instance-identifier evoucher-primary \
  --db-snapshot-identifier evoucher-snapshot-rollback-$(date +%s)

# Step 3: Restore Supabase from backup
# Dashboard → Database → Backups → Restore to new database

# Step 4: Update connection string
# Vercel → Settings → Environment Variables → DATABASE_URL=[old supabase]

# Step 5: Redeploy
# Vercel → Deployments → Redeploy latest

# Step 6: Verify traffic flowing to Supabase
# Monitor logs and error rates

echo "Rollback complete! Traffic restored to Supabase."
```

---

## PHASE 10: POST-MIGRATION VALIDATION

### Checklist

- [ ] All merchants can login
- [ ] Dashboard loads without errors
- [ ] Transactions process normally
- [ ] Payment webhooks working
- [ ] RLS policies enforced correctly
- [ ] Replication lag < 100ms
- [ ] CPU utilization < 70%
- [ ] Backup/restore working
- [ ] CloudWatch alarms configured and tested
- [ ] Team trained on AWS RDS operations

### Performance Baseline

```bash
# Record baseline for future comparisons
psql -h evoucher-primary.rds.amazonaws.com \
  -U postgres \
  -d evoucher \
  -c "
  SELECT
    'Post-Migration Baseline' as checkpoint,
    (SELECT COUNT(*) FROM merchants) as merchant_count,
    (SELECT COUNT(*) FROM transactions) as transaction_count,
    (SELECT COUNT(*) FROM vouchers) as voucher_count,
    NOW() as timestamp;
  "
```

---

## MAINTENANCE RUNBOOKS

### Daily Tasks

```bash
# Check replication lag
aws rds describe-db-clusters \
  --query 'DBClusters[*].[DBClusterIdentifier, ReplicationLagInMilliseconds]'

# Monitor CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=evoucher-primary \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Weekly Tasks

- Review CloudWatch logs for errors
- Check backup success (should be 100%)
- Monitor storage growth trend
- Review security group rules (revoke unused IPs)

### Monthly Tasks

- Run VACUUM ANALYZE on all tables
- Review and optimize slow queries
- Update database statistics
- Test disaster recovery procedure

---

**Next Step:** Execute Phase 3-4 when you have confirmed budget approval.
