#!/usr/bin/env node
/**
 * Backfill finance-grade billing events and ledger entries for completed
 * website purchase transactions that predate the explicit VOUCHER_PURCHASED
 * publisher in the checkout route.
 *
 * Run from repo root:
 *   node scripts/backfill-missing-billing-events.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function isDuplicate(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('duplicate key value') || message.includes('unique constraint');
}

async function findVoucherId(transaction) {
  const voucherCode = String(transaction.voucher_code || '').trim();
  if (!voucherCode) return null;

  const { data } = await supabase
    .from('customer_vouchers')
    .select('id')
    .eq('customer_id', transaction.customer_id)
    .eq('voucher_code', voucherCode)
    .maybeSingle();

  return data?.id || null;
}

async function insertBillingEvent(transaction, voucherId) {
  const eventKey = String(transaction.transaction_reference || '').trim();
  const faceValue = round2(
    transaction.face_value || transaction.amount || transaction.consumer_price
  );
  const consumerPrice = round2(transaction.consumer_price || transaction.amount || faceValue);
  const consumerBenefit = round2(
    transaction.consumer_benefit_amount || Math.max(faceValue - consumerPrice, 0)
  );
  const platformRevenue = round2(transaction.evoucher_benefit_amount || 0);
  const totalDiscountAmount = round2(
    transaction.total_discount_amount || consumerBenefit + platformRevenue
  );
  const totalDiscountPct = Number(transaction.total_discount_pct || 0);

  const { data: existing, error: existingError } = await supabase
    .from('billing_events')
    .select('*')
    .eq('event_key', eventKey)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('billing_events')
    .insert({
      event_key: eventKey,
      event_type: 'payment_transaction',
      merchant_id: transaction.merchant_id,
      customer_id: transaction.customer_id,
      voucher_id: voucherId,
      gross_amount: faceValue,
      merchant_payout_amount: 0,
      total_discount_pct: totalDiscountPct,
      total_discount_amount: totalDiscountAmount,
      occurred_at: transaction.created_at || new Date().toISOString(),
      metadata: {
        paymentStatus: transaction.payment_status || 'completed',
        paymentMethod: transaction.payment_method || transaction.card_brand || 'unknown',
        accessChannel: transaction.access_channel || 'web',
        transactionReference: eventKey,
        voucherCode: transaction.voucher_code || null,
        consumerPrice,
        faceValue,
        consumerBenefit,
        platformRevenue,
        source: 'payment_transactions_backfill',
        backfilled: true,
        backfilledAt: new Date().toISOString(),
      },
    })
    .select('*')
    .single();

  if (error) {
    if (isDuplicate(error)) {
      const { data: duplicate } = await supabase
        .from('billing_events')
        .select('*')
        .eq('event_key', eventKey)
        .maybeSingle();
      if (duplicate) return duplicate;
    }
    throw error;
  }

  return data;
}

async function insertLedgerEntries(transaction, event) {
  const eventKey = String(transaction.transaction_reference || '').trim();
  const { data: existingLedger, error: existingLedgerError } = await supabase
    .from('billing_ledger_entries')
    .select('id')
    .eq('source_id', eventKey)
    .limit(1);

  if (existingLedgerError) throw existingLedgerError;
  if (existingLedger?.length) return 0;

  const faceValue = round2(
    transaction.face_value || transaction.amount || transaction.consumer_price
  );
  const consumerPrice = round2(transaction.consumer_price || transaction.amount || faceValue);
  const consumerBenefit = round2(
    transaction.consumer_benefit_amount || Math.max(faceValue - consumerPrice, 0)
  );
  const platformRevenue = round2(transaction.evoucher_benefit_amount || 0);

  const entries = [
    {
      entry_group_id: event.id,
      source_type: 'transaction',
      source_id: eventKey,
      merchant_id: transaction.merchant_id,
      customer_id: transaction.customer_id,
      debit_account: 'asset:cash',
      credit_account: 'liability:voucher_outstanding',
      amount: faceValue,
      currency: 'ZAR',
      metadata: { eventType: 'payment_transaction', kind: 'voucher_liability', backfilled: true },
    },
    consumerBenefit > 0
      ? {
          entry_group_id: event.id,
          source_type: 'transaction',
          source_id: eventKey,
          merchant_id: transaction.merchant_id,
          customer_id: transaction.customer_id,
          debit_account: 'contra:consumer_benefit',
          credit_account: 'asset:cash',
          amount: consumerBenefit,
          currency: 'ZAR',
          metadata: {
            eventType: 'payment_transaction',
            kind: 'consumer_benefit',
            backfilled: true,
          },
        }
      : null,
    platformRevenue > 0
      ? {
          entry_group_id: event.id,
          source_type: 'transaction',
          source_id: eventKey,
          merchant_id: transaction.merchant_id,
          customer_id: transaction.customer_id,
          debit_account: 'revenue:platform_benefit',
          credit_account: 'asset:cash',
          amount: platformRevenue,
          currency: 'ZAR',
          metadata: {
            eventType: 'payment_transaction',
            kind: 'platform_revenue',
            backfilled: true,
          },
        }
      : null,
  ].filter(Boolean);

  const { error } = await supabase.from('billing_ledger_entries').insert(entries);
  if (error) throw error;
  return entries.length;
}

async function backfillBillingEvents() {
  const { data: transactions, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('payment_status', 'completed')
    .not('merchant_id', 'is', null)
    .not('transaction_reference', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw error;

  let createdEvents = 0;
  let createdLedgerRows = 0;
  let skipped = 0;
  let failed = 0;

  for (const transaction of transactions || []) {
    try {
      const voucherId = await findVoucherId(transaction);
      const event = await insertBillingEvent(transaction, voucherId);
      const ledgerRows = await insertLedgerEntries(transaction, event);
      createdLedgerRows += ledgerRows;
      if (ledgerRows > 0) createdEvents += 1;
      else skipped += 1;
      console.log(
        `${ledgerRows > 0 ? 'backfilled' : 'skipped'} ${transaction.transaction_reference} R${round2(
          transaction.face_value || transaction.amount
        ).toFixed(2)}`
      );
    } catch (err) {
      failed += 1;
      console.error(`failed ${transaction.transaction_reference}: ${err.message || err}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        checked: transactions?.length || 0,
        createdEvents,
        createdLedgerRows,
        skipped,
        failed,
      },
      null,
      2
    )
  );

  if (failed > 0) process.exit(1);
}

backfillBillingEvents().catch((error) => {
  console.error(error);
  process.exit(1);
});
