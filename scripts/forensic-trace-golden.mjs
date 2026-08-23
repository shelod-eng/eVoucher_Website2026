/**
 * READ-ONLY forensic trace of the golden transaction.
 * Does NOT modify the database. Does NOT create records.
 * Traces TXN-1786958164570-2509C9F62EF3 through the full billing spine.
 */
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Load .env.local manually
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Golden transaction reference can be overridden via CLI:
//   node scripts/forensic-trace-golden.mjs TXN-XXXXXXXX-XXXX
const GOLDEN_TXN = String(process.argv[2] ?? '').trim() || 'TXN-1786958158916-C4127F5E5978';

async function query(table, filter) {
  let q = admin.from(table).select('*');
  for (const [col, val] of Object.entries(filter)) {
    q = q.eq(col, val);
  }
  const { data, error } = await q;
  return { data: data ?? [], error: error?.message ?? null };
}

async function main() {
  console.log('==============================================');
  console.log('GOLDEN TRANSACTION FORENSIC TRACE (READ-ONLY)');
  console.log('==============================================');
  console.log(`Transaction: ${GOLDEN_TXN}`);
  console.log('');

  // ── 1. payment_transactions ──────────────────────────────────────
  console.log('--- 1. payment_transactions ---');
  const pt = await query('payment_transactions', { transaction_reference: GOLDEN_TXN });
  if (pt.error) console.log('  ERROR:', pt.error);
  else if (pt.data.length === 0) console.log('  ❌ NO RECORD');
  else {
    const row = pt.data[0];
    console.log('  ✅ RECORD FOUND');
    console.log('  id:', row.id);
    console.log('  merchant_id:', row.merchant_id);
    console.log('  customer_id:', row.customer_id);
    console.log('  voucher_code:', row.voucher_code);
    console.log('  amount:', row.amount);
    console.log('  face_value:', row.face_value);
    console.log('  consumer_price:', row.consumer_price);
    console.log('  total_discount_amount:', row.total_discount_amount);
    console.log('  payment_status:', row.payment_status);
    console.log('  created_at:', row.created_at);
    console.log('  product_id:', row.product_id);
  }
  console.log('');

  // ── 2. platform_events ───────────────────────────────────────────
  console.log('--- 2. platform_events ---');
  const pe = await query('platform_events', { transaction_ref: GOLDEN_TXN });
  if (pe.error) console.log('  ERROR:', pe.error);
  else if (pe.data.length === 0) console.log('  ❌ NO RECORD (by transaction_ref)');
  else {
    const row = pe.data[0];
    console.log('  ✅ RECORD FOUND');
    console.log('  id:', row.id);
    console.log('  event_id:', row.event_id);
    console.log('  event_type:', row.event_type);
    console.log('  correlation_id:', row.correlation_id);
    console.log('  status:', row.status);
    console.log('  error_message:', row.error_message ?? '(none)');
    console.log('  occurred_at:', row.occurred_at);
  }
  console.log('');

  // ── 3. platform_event_outbox ─────────────────────────────────────
  console.log('--- 3. platform_event_outbox ---');
  const outbox = await query('platform_event_outbox', {});
  const outboxRows = (outbox.data ?? []).filter((r) => {
    const p = r.payload ?? {};
    return p.transaction_ref === GOLDEN_TXN || p.correlation_id === GOLDEN_TXN;
  });
  if (outbox.error) console.log('  ERROR:', outbox.error);
  else if (outboxRows.length === 0) console.log('  ❌ NO RECORD (by payload.transaction_ref/correlation_id)');
  else {
    console.log(`  ✅ ${outboxRows.length} RECORD(S) FOUND`);
    for (const row of outboxRows) {
      console.log('  id:', row.id);
      console.log('  event_id:', row.event_id);
      console.log('  status:', row.status);
      console.log('  retries:', row.retries);
      console.log('  error_message:', row.error_message ?? '(none)');
      console.log('  created_at:', row.created_at);
    }
  }
  console.log('');

  // ── 4. billing_events ────────────────────────────────────────────
  console.log('--- 4. billing_events ---');
  const be = await query('billing_events', { event_key: GOLDEN_TXN });
  if (be.error) console.log('  ERROR:', be.error);
  else if (be.data.length === 0) console.log('  ❌ NO RECORD');
  else {
    const row = be.data[0];
    console.log('  ✅ RECORD FOUND');
    console.log('  id:', row.id);
    console.log('  event_key:', row.event_key);
    console.log('  event_type:', row.event_type);
    console.log('  merchant_id:', row.merchant_id);
    console.log('  customer_id:', row.customer_id);
    console.log('  gross_amount:', row.gross_amount);
    console.log('  merchant_payout_amount:', row.merchant_payout_amount);
    console.log('  total_discount_pct:', row.total_discount_pct);
    console.log('  total_discount_amount:', row.total_discount_amount);
    console.log('  occurred_at:', row.occurred_at);
    console.log('  metadata:', JSON.stringify(row.metadata ?? {}).substring(0, 300));
  }
  console.log('');

  // ── 5. billing_ledger_entries ────────────────────────────────────
  console.log('--- 5. billing_ledger_entries ---');
  const ledger = await query('billing_ledger_entries', { source_id: GOLDEN_TXN });
  if (ledger.error) console.log('  ERROR:', ledger.error);
  else if (ledger.data.length === 0) console.log('  ❌ NO RECORD');
  else {
    console.log(`  ✅ ${ledger.data.length} RECORD(S) FOUND`);
    for (const row of ledger.data) {
      console.log('  id:', row.id, '| debit:', row.debit_account, '| credit:', row.credit_account, '| amount:', row.amount);
    }
  }
  console.log('');

  // ── 6. merchant_payouts ──────────────────────────────────────────
  console.log('--- 6. merchant_payouts ---');
  const payout = await query('merchant_payouts', { source_id: GOLDEN_TXN });
  if (payout.error) console.log('  ERROR:', payout.error);
  else if (payout.data.length === 0) console.log('  ❌ NO RECORD (by source_id)');
  else {
    const row = payout.data[0];
    console.log('  ✅ RECORD FOUND');
    console.log('  id:', row.id);
    console.log('  merchant_id:', row.merchant_id);
    console.log('  amount:', row.amount);
    console.log('  gross_amount:', row.gross_amount);
    console.log('  bank_fee_amount:', row.bank_fee_amount);
    console.log('  status:', row.status);
    console.log('  source_id:', row.source_id);
    console.log('  created_at:', row.created_at);
  }
  console.log('');

  // ── 7. billing_invoices ──────────────────────────────────────────
  console.log('--- 7. billing_invoices ---');
  const invoice = await query('billing_invoices', { source_id: GOLDEN_TXN });
  if (invoice.error) console.log('  ERROR:', invoice.error);
  else if (invoice.data.length === 0) console.log('  ❌ NO RECORD (by source_id)');
  else {
    const row = invoice.data[0];
    console.log('  ✅ RECORD FOUND');
    console.log('  id:', row.id);
    console.log('  invoice_number:', row.invoice_number);
    console.log('  merchant_id:', row.merchant_id);
    console.log('  net_payable_to_merchant:', row.net_payable_to_merchant);
    console.log('  status:', row.status);
    console.log('  source_id:', row.source_id);
    console.log('  created_at:', row.created_at);
  }
  console.log('');

  // ── 8. billing_settlements ───────────────────────────────────────
  console.log('--- 8. billing_settlements ---');
  const settlement = await query('billing_settlements', { source_id: GOLDEN_TXN });
  if (settlement.error) console.log('  ERROR:', settlement.error);
  else if (settlement.data.length === 0) console.log('  ❌ NO RECORD (by source_id)');
  else {
    const row = settlement.data[0];
    console.log('  ✅ RECORD FOUND');
    console.log('  id:', row.id);
    console.log('  merchant_id:', row.merchant_id);
    console.log('  amount:', row.amount);
    console.log('  status:', row.status);
    console.log('  source_id:', row.source_id);
    console.log('  created_at:', row.created_at);
  }
  console.log('');

  // ── 9. bankserv_adaptor_transactions ─────────────────────────────
  console.log('--- 9. bankserv_adaptor_transactions ---');
  const bankserv = await query('bankserv_adaptor_transactions', { transaction_reference: GOLDEN_TXN });
  if (bankserv.error) console.log('  ERROR:', bankserv.error);
  else if (bankserv.data.length === 0) console.log('  ❌ NO RECORD');
  else {
    const row = bankserv.data[0];
    console.log('  ✅ RECORD FOUND');
    console.log('  id:', row.id);
    console.log('  transaction_reference:', row.transaction_reference);
    console.log('  merchant_id:', row.merchant_id);
    console.log('  settlement_amount:', row.settlement_amount);
    console.log('  gross_amount:', row.gross_amount);
    console.log('  status:', row.status);
    console.log('  status_reason:', row.status_reason ?? '(none)');
    console.log('  created_at:', row.created_at);
  }
  console.log('');

  // ── 10. audit_events ─────────────────────────────────────────────
  console.log('--- 10. audit_events ---');
  const audit = await query('audit_events', { request_id: GOLDEN_TXN });
  if (audit.error) console.log('  ERROR:', audit.error);
  else if (audit.data.length === 0) console.log('  ❌ NO RECORD (by request_id)');
  else {
    console.log(`  ✅ ${audit.data.length} RECORD(S) FOUND`);
    for (const row of audit.data) {
      console.log('  id:', row.id, '| action:', row.action, '| entity_type:', row.entity_type, '| entity_id:', row.entity_id);
    }
  }
  console.log('');

  // ── 11. reconciliation_exceptions ────────────────────────────────
  console.log('--- 11. reconciliation_exceptions ---');
  const recon = await query('reconciliation_exceptions', { transaction_ref: GOLDEN_TXN });
  if (recon.error) console.log('  ERROR:', recon.error);
  else if (recon.data.length === 0) console.log('  ✅ NO EXCEPTIONS (0 records — correct)');
  else {
    console.log(`  ⚠️  ${recon.data.length} EXCEPTION(S) FOUND`);
    for (const row of recon.data) {
      console.log('  id:', row.id, '| status:', row.status, '| reason:', row.reason ?? '(none)');
    }
  }
  console.log('');

  console.log('==============================================');
  console.log('FORENSIC TRACE COMPLETE (READ-ONLY — NO CHANGES MADE)');
  console.log('==============================================');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});