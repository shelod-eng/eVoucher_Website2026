#!/usr/bin/env node
/**
 * Backfill per-transaction billing_invoices rows for completed website
 * purchases that have a billing_event but no invoice (source_id gap).
 *
 * ROOT CAUSE BEING REPAIRED (forensic evidence 2026-08-23):
 *   recordVoucherPurchaseBillingEvent() always failed its billing_invoices
 *   insert because the deployed table lacked customer_id. Every purchase
 *   therefore reached payouts/settlements but never produced an invoice.
 *
 * Financial model mirrors src/lib/billing/revenue-calculator.ts (TRD v2.0):
 *   merchantGrossPayout = 96% of face value
 *   bankFee             = 0.5% of merchant gross payout
 *   merchantNetPayout   = gross - bank fee
 *   consumerBenefit     = 2.8% of face value
 *   platformRevenue     = 1.2% of face value
 *
 * Idempotent by source_id (unique index). Tolerates a live schema that still
 * lacks customer_id by retrying without it.
 *
 * Run from repo root:
 *   node scripts/backfill-missing-billing-invoices.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const NL = String.fromCharCode(10);
const DRY_RUN = process.argv.includes('--dry-run');

function loadEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(NL)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function calculateRevenue(faceValue) {
  const amount = round2(faceValue);
  const merchantGrossPayout = round2(amount * 0.96);
  const bankFee = round2(merchantGrossPayout * 0.005);
  return {
    faceValue: amount,
    merchantGrossPayout,
    bankFee,
    merchantNetPayout: round2(merchantGrossPayout - bankFee),
    consumerBenefit: round2(amount * 0.028),
    platformRevenue: round2(amount * 0.012),
  };
}

function isoDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function isDuplicateKeyError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('duplicate key value') || message.includes('unique constraint');
}

function isMissingColumnError(error, column) {
  // Case-insensitive: PostgREST returns "Could not find the 'x' column ..."
  // with a leading capital.
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes(`column "${column}" does not exist`) ||
    message.includes(`column ${column} does not exist`) ||
    message.includes(`could not find the '${column}' column`)
  );
}

async function main() {
  console.log(
    `Backfilling missing per-transaction billing_invoices${DRY_RUN ? ' (DRY RUN)' : ''}...`
  );

  // Completed merchant transactions that already have a billing_event spine row.
  const { data: events, error: eventsError } = await supabase
    .from('billing_events')
    .select('event_key,merchant_id,customer_id,gross_amount,total_discount_amount,occurred_at')
    .eq('event_type', 'payment_transaction')
    .not('merchant_id', 'is', null)
    .order('occurred_at', { ascending: false })
    .limit(1000);

  if (eventsError) throw eventsError;

  let created = 0;
  let skippedExisting = 0;
  let failed = 0;

  for (const event of events ?? []) {
    const eventKey = String(event.event_key ?? '').trim();
    if (!eventKey) continue;

    try {
      const { data: existingInvoice } = await supabase
        .from('billing_invoices')
        .select('id')
        .eq('source_id', eventKey)
        .maybeSingle();
      if (existingInvoice) {
        skippedExisting += 1;
        continue;
      }

      const faceValue = round2(event.gross_amount ?? 0);
      if (!(faceValue > 0)) {
        skippedExisting += 1;
        continue;
      }

      const revenue = calculateRevenue(faceValue);
      const occurredAt = event.occurred_at ?? new Date().toISOString();

      const payload = {
        merchant_id: event.merchant_id,
        customer_id: event.customer_id ?? null,
        // Full canonical reference keeps invoice_number unique per transaction.
        invoice_number: `INV-${eventKey.toUpperCase()}`,
        period_start: isoDate(occurredAt),
        period_end: isoDate(occurredAt),
        face_value: revenue.faceValue,
        consumer_price: round2(faceValue - round2(event.total_discount_amount ?? 0)),
        total_face_value: revenue.faceValue,
        total_consumer_paid: round2(faceValue - round2(event.total_discount_amount ?? 0)),
        total_discount_amount: round2(event.total_discount_amount ?? 0),
        merchant_payout_amount: revenue.merchantGrossPayout,
        net_payable_to_merchant: revenue.merchantNetPayout,
        bank_fee_amount: revenue.bankFee,
        consumer_benefit_amount: revenue.consumerBenefit,
        platform_revenue_amount: revenue.platformRevenue,
        status: 'approved',
        source_id: eventKey,
        source_type: 'payment_transaction',
        created_at: occurredAt,
      };

      if (DRY_RUN) {
        console.log(`[dry-run] would create invoice for ${eventKey} (R${faceValue.toFixed(2)})`);
        created += 1;
        continue;
      }

      let { error: insertError } = await supabase.from('billing_invoices').insert(payload);

      if (insertError && isMissingColumnError(insertError, 'customer_id')) {
        const { customer_id: _omitted, ...legacyPayload } = payload;
        ({ error: insertError } = await supabase.from('billing_invoices').insert(legacyPayload));
      }

      if (insertError && !isDuplicateKeyError(insertError)) {
        throw insertError;
      }

      created += 1;
      console.log(`backfilled invoice ${payload.invoice_number} for ${eventKey}`);
    } catch (err) {
      failed += 1;
      console.error(`failed ${eventKey}: ${err?.message || err}`);
    }
  }

  console.log(
    JSON.stringify({ checked: events?.length ?? 0, created, skippedExisting, failed }, null, 2)
  );
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});