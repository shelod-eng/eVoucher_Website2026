#!/usr/bin/env node
/**
 * Backfill missing billing events for existing transactions
 * Run: node scripts/backfill-missing-billing-events.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillBillingEvents() {
  console.log('🔍 Finding transactions without billing events...\n');

  // Get all transactions
  const { data: transactions, error: txError } = await supabase
    .from('payment_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (txError) {
    console.error('❌ Error fetching transactions:', txError);
    process.exit(1);
  }

  console.log(`📊 Found ${transactions.length} recent transactions\n`);

  // Get existing billing events
  const { data: existingEvents, error: eventsError } = await supabase
    .from('billing_events')
    .select('transaction_reference');

  if (eventsError) {
    console.error('❌ Error fetching billing events:', eventsError);
    process.exit(1);
  }

  const existingRefs = new Set(
    existingEvents?.map((e) => e.transaction_reference) || []
  );

  const missingEvents = transactions.filter(
    (tx) => !existingRefs.has(tx.transaction_reference)
  );

  console.log(`🔥 Found ${missingEvents.length} transactions missing billing events\n`);

  if (missingEvents.length === 0) {
    console.log('✅ All transactions have billing events!');
    return;
  }

  // Create billing events for missing transactions
  let successCount = 0;
  let errorCount = 0;

  for (const tx of missingEvents) {
    const billingEvent = {
      event_type: 'payment_transaction',
      merchant_id: tx.merchant_id,
      customer_id: tx.customer_id,
      transaction_reference: tx.transaction_reference,
      voucher_code: tx.voucher_code,
      gross_amount: tx.face_value || tx.amount,
      total_discount_amount: tx.total_discount_amount || 0,
      occurred_at: tx.created_at,
      metadata: {
        paymentStatus: tx.payment_status || 'unknown',
        paymentMethod: tx.payment_method || 'unknown',
        accessChannel: tx.access_channel || 'web',
        consumerPrice: tx.consumer_price || tx.amount,
        platformFee: tx.evoucher_benefit_amount || 0,
        consumerBenefit: tx.consumer_benefit_amount || 0,
        cardBrand: tx.card_brand || null,
        cardLastFour: tx.card_last_four || null,
        backfilled: true,
        backfilledAt: new Date().toISOString(),
      },
    };

    const { error } = await supabase.from('billing_events').insert(billingEvent);

    if (error) {
      console.error(
        `❌ Failed to create event for ${tx.transaction_reference}:`,
        error.message
      );
      errorCount++;
    } else {
      console.log(
        `✅ Created billing event for ${tx.transaction_reference} (${tx.payment_status || 'unknown'}, R${(tx.amount || 0).toFixed(2)})`
      );
      successCount++;
    }
  }

  console.log(`\n📈 Backfill complete:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

backfillBillingEvents().catch((error) => {
  console.error('❌ Backfill failed:', error);
  process.exit(1);
});
