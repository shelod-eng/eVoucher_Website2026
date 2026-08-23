/**
 * READ-ONLY Billing Engine spine verification.
 * Does NOT modify the database. Does NOT create transactions.
 * Verifies:
 *  1. Whether source_id exists on merchant_payouts / billing_invoices / billing_settlements
 *  2. Golden transaction TXN-1786646772611-9FD9B69FD5E7 lifecycle trace
 */
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Load .env.local manually (no dotenv dependency)
const envPath = path.join(rootDir, '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    let value = trimmed.substring(eqIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const GOLDEN_TXN = 'TXN-1786646772611-9FD9B69FD5E7';

async function checkColumn(table, column) {
  // Supabase PostgREST does not expose information_schema.columns.
  // Instead, attempt a direct select on the column — if the column does not
  // exist, PostgREST returns an error mentioning "column ... does not exist".
  const { data, error } = await admin
    .from(table)
    .select(column)
    .limit(1);
  if (error) {
    const msg = String(error?.message ?? '');
    // PostgREST error format: "column merchant_payouts.source_id does not exist"
    // or "could not find the 'source_id' column in the schema cache"
    const columnMissing =
      msg.includes(`column ${table}.${column} does not exist`) ||
      msg.includes(`column "${column}" does not exist`) ||
      msg.includes(`could not find the '${column}' column`);
    return { table, column, exists: !columnMissing, error: columnMissing ? null : msg };
  }
  return { table, column, exists: true, dataType: 'unknown (select succeeded)', nullable: null };
}

async function countRows(table, column, value) {
  const { count, error } = await admin
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, value);
  if (error) {
    return { table, count: -1, error: error.message };
  }
  return { table, count: count ?? 0 };
}

async function fetchRows(table, column, value, limit = 5) {
  const { data, error } = await admin
    .from(table)
    .select('*')
    .eq(column, value)
    .limit(limit);
  if (error) {
    return { table, rows: [], error: error.message };
  }
  return { table, rows: data ?? [] };
}

async function main() {
  console.log('==============================================');
  console.log('BILLING ENGINE SPINE — READ-ONLY VERIFICATION');
  console.log('==============================================');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Golden Transaction: ${GOLDEN_TXN}`);
  console.log('');

  // ── CHECKPOINT 3: Schema verification ──────────────────────────────
  console.log('--- CHECKPOINT 3: SCHEMA VERIFICATION (source_id) ---');
  const schemaChecks = [
    ['merchant_payouts', 'source_id'],
    ['billing_invoices', 'source_id'],
    ['billing_settlements', 'source_id'],
    ['billing_events', 'event_key'],
    ['billing_ledger_entries', 'source_id'],
    ['bankserv_adaptor_transactions', 'transaction_reference'],
  ];
  for (const [table, column] of schemaChecks) {
    const result = await checkColumn(table, column);
    console.log(
      `  ${result.exists ? '✅' : '❌'} ${table}.${column} — ${result.exists ? `exists (${result.dataType}, nullable=${result.nullable})` : 'MISSING'}${result.error ? ` [${result.error}]` : ''}`
    );
  }
  console.log('');

  // ── CHECKPOINT 4: Golden transaction trace ─────────────────────────
  console.log('--- CHECKPOINT 4: GOLDEN TRANSACTION LIFECYCLE TRACE ---');
  console.log(`Transaction: ${GOLDEN_TXN}`);
  console.log('');

  const stages = [
    { name: 'payment_transactions', table: 'payment_transactions', column: 'transaction_reference' },
    { name: 'platform_events', table: 'platform_events', column: 'transaction_ref' },
    { name: 'billing_events', table: 'billing_events', column: 'event_key' },
    { name: 'billing_ledger_entries', table: 'billing_ledger_entries', column: 'source_id' },
    { name: 'merchant_payouts', table: 'merchant_payouts', column: 'source_id' },
    { name: 'billing_invoices', table: 'billing_invoices', column: 'source_id' },
    { name: 'billing_settlements', table: 'billing_settlements', column: 'source_id' },
    { name: 'bankserv_adaptor_transactions', table: 'bankserv_adaptor_transactions', column: 'transaction_reference' },
    { name: 'audit_events', table: 'audit_events', column: 'request_id' },
    { name: 'reconciliation_exceptions', table: 'reconciliation_exceptions', column: 'transaction_ref' },
  ];

  for (const stage of stages) {
    const result = await countRows(stage.table, stage.column, GOLDEN_TXN);
    if (result.count >= 0) {
      console.log(`  ${result.count > 0 ? '✅' : '❌'} ${stage.name} (${stage.table}.${stage.column}): ${result.count} row(s)`);
    } else {
      console.log(`  ⚠️  ${stage.name} (${stage.table}.${stage.column}): ERROR — ${result.error}`);
    }
  }
  console.log('');

  // ── Fetch sample rows for found stages ─────────────────────────────
  console.log('--- SAMPLE ROWS (first 2 per found stage) ---');
  for (const stage of stages) {
    const result = await fetchRows(stage.table, stage.column, GOLDEN_TXN, 2);
    if (result.rows.length > 0) {
      console.log(`\n[${stage.name}] ${result.rows.length} row(s) found:`);
      for (const row of result.rows) {
        // Summarize key fields only
        const summary = {};
        for (const [k, v] of Object.entries(row)) {
          if (typeof v === 'object' && v !== null) {
            summary[k] = JSON.stringify(v).substring(0, 120);
          } else {
            summary[k] = String(v).substring(0, 80);
          }
        }
        console.log('  ', JSON.stringify(summary).substring(0, 400));
      }
    }
  }
  console.log('');

  // ── CHECKPOINT 6: Dashboard aggregate preview ──────────────────────
  console.log('--- CHECKPOINT 6: DASHBOARD AGGREGATE PREVIEW (read-only) ---');
  const { data: events, error: eventsError } = await admin
    .from('billing_events')
    .select('gross_amount,total_discount_amount')
    .limit(10000);
  if (eventsError) {
    console.log('  billing_events query error:', eventsError.message);
  } else {
    const totalVolume = (events ?? []).reduce((s, e) => s + Number(e.gross_amount ?? 0), 0);
    const discountPool = (events ?? []).reduce((s, e) => s + Number(e.total_discount_amount ?? 0), 0);
    console.log(`  billing_events rows: ${(events ?? []).length}`);
    console.log(`  totalVoucherVolume (gross_amount sum): R${totalVolume.toFixed(2)}`);
    console.log(`  discountPool (total_discount_amount sum): R${discountPool.toFixed(2)}`);
  }

  const { data: invoices, error: invoicesError } = await admin
    .from('billing_invoices')
    .select('status,net_payable_to_merchant,bank_fee_amount,settlement_batch_id')
    .limit(10000);
  if (invoicesError) {
    console.log('  billing_invoices query error:', invoicesError.message);
  } else {
    const pending = (invoices ?? [])
      .filter((i) => i.status === 'approved' && !i.settlement_batch_id)
      .reduce((s, i) => s + Number(i.net_payable_to_merchant ?? 0), 0);
    const fees = (invoices ?? []).reduce((s, i) => s + Number(i.bank_fee_amount ?? 0), 0);
    console.log(`  billing_invoices rows: ${(invoices ?? []).length}`);
    console.log(`  pendingMerchantPayouts: R${pending.toFixed(2)}`);
    console.log(`  bankProcessingFees: R${fees.toFixed(2)}`);
  }

  const { data: settlements, error: settlementsError } = await admin
    .from('billing_settlements')
    .select('status,amount')
    .limit(10000);
  if (settlementsError) {
    console.log('  billing_settlements query error:', settlementsError.message);
  } else {
    const settled = (settlements ?? [])
      .filter((s) => s.status === 'confirmed')
      .reduce((s, i) => s + Number(i.amount ?? 0), 0);
    console.log(`  billing_settlements rows: ${(settlements ?? []).length}`);
    console.log(`  settledToMerchants: R${settled.toFixed(2)}`);
  }

  console.log('');
  console.log('==============================================');
  console.log('VERIFICATION COMPLETE (READ-ONLY — NO CHANGES MADE)');
  console.log('==============================================');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});