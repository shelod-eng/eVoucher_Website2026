#!/usr/bin/env node
/**
 * Check if a specific transaction created a billing event
 * Run: node scripts/check-transaction-billing-event.mjs TXN-1782259940405-6FA2BBE62E90
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tfpujpskfyqeikjkzjru.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcHVqcHNrZnlxZWlramt6anJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQyNzMyNCwiZXhwIjoyMDc4MDAzMzI0fQ.aUhG5Z01Di5bpPYSmGKewwd2kFbFaH8EbiAJZInWTLw';

const transactionRef = process.argv[2] || 'TXN-1782259940405-6FA2BBE62E90';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransaction() {
  console.log(`🔍 Checking transaction: ${transactionRef}\n`);

  // Check payment_transactions table
  const { data: transaction, error: txError } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('transaction_reference', transactionRef)
    .maybeSingle();

  if (txError) {
    console.error('❌ Error fetching transaction:', txError.message);
    return;
  }

  if (!transaction) {
    console.error('❌ Transaction not found in payment_transactions table!');
    return;
  }

  console.log('✅ Transaction found in payment_transactions:');
  console.log(`   Amount: R${transaction.amount}`);
  console.log(`   Face Value: R${transaction.face_value}`);
  console.log(`   Status: ${transaction.payment_status}`);
  console.log(`   Method: ${transaction.payment_method}`);
  console.log(`   Voucher: ${transaction.voucher_code}`);
  console.log(`   Created: ${transaction.created_at}`);
  console.log('');

  // Check billing_events table - try both column and metadata
  const { data: eventByColumn, error: eventError1 } = await supabase
    .from('billing_events')
    .select('*')
    .eq('transaction_reference', transactionRef)
    .maybeSingle();

  const { data: eventByMetadata, error: eventError2 } = await supabase
    .from('billing_events')
    .select('*')
    .eq('metadata->>transactionReference', transactionRef)
    .maybeSingle();

  if (eventError1 && eventError2) {
    console.error('❌ Error querying billing_events:', eventError1 || eventError2);
    return;
  }

  const event = eventByColumn || eventByMetadata;

  if (!event) {
    console.error('❌ NO BILLING EVENT FOUND!');
    console.error('   This transaction did NOT create a billing_events row.');
    console.error('   The fix may not be deployed yet, or there was an error.');
    console.log('\n🔧 Check server logs for errors during transaction creation.');
    return;
  }

  console.log('✅ Billing event found:');
  console.log(`   Event ID: ${event.id}`);
  console.log(`   Event Type: ${event.event_type}`);
  console.log(`   Gross Amount: R${event.gross_amount}`);
  console.log(`   Discount: R${event.total_discount_amount}`);
  console.log(`   Occurred At: ${event.occurred_at}`);
  console.log(`   Transaction Ref (column): ${event.transaction_reference || 'NULL'}`);
  console.log(`   Transaction Ref (metadata): ${event.metadata?.transactionReference || 'NULL'}`);
  console.log('\n✅ Transaction is properly recorded in billing system!');
}

checkTransaction().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
