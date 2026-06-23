/**
 * Demo Seed Script for Billing Engine
 * Run this to populate sample transactions for tomorrow's demo
 * 
 * Usage:
 *   node scripts/seed-billing-demo.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedBillingDemo() {
  console.log('🚀 Starting Billing Engine Demo Seed...\n');

  // Get first merchant and customer for demo
  const { data: merchants } = await supabase
    .from('merchants')
    .select('id, business_name')
    .eq('status', 'approved')
    .limit(3);

  const { data: customers } = await supabase
    .from('user_profiles')
    .select('id, email')
    .eq('role', 'customer')
    .limit(3);

  if (!merchants || merchants.length === 0) {
    console.error('❌ No approved merchants found. Run merchant seed first.');
    return;
  }

  if (!customers || customers.length === 0) {
    console.error('❌ No customers found. Run customer seed first.');
    return;
  }

  console.log(`✅ Found ${merchants.length} merchants and ${customers.length} customers\n`);

  // Payment methods to demo
  const paymentMethods = [
    { method: 'cash_voucher', name: 'Cash at Till' },
    { method: 'ussd', name: 'USSD (*120*8682#)' },
    { method: 'airtime', name: 'Airtime Payment' },
    { method: 'wallet', name: 'eVoucher Wallet' },
    { method: 'visa_secure', name: 'VISA Secure (3DS2)' },
    { method: 'debit_credit', name: 'Debit/Credit Card' },
    { method: 'payfast', name: 'PayFast' },
    { method: 'eft', name: 'EFT' },
  ];

  const events = [];
  const amounts = [50, 100, 200, 150, 300, 97.50, 195, 487.50];

  for (let i = 0; i < paymentMethods.length; i++) {
    const payment = paymentMethods[i];
    const merchant = merchants[i % merchants.length];
    const customer = customers[i % customers.length];
    const faceValue = amounts[i];
    const totalDiscountAmount = faceValue * 0.05; // 5% total discount
    const grossAmount = faceValue - (faceValue * 0.025); // Consumer pays 97.5%

    const transactionRef = `DEMO-${payment.method.toUpperCase()}-${Date.now()}-${i}`;
    const voucherCode = `EVCH-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    const event = {
      event_type: 'payment_transaction',
      merchant_id: merchant.id,
      customer_id: customer.id,
      gross_amount: grossAmount,
      total_discount_amount: totalDiscountAmount,
      occurred_at: new Date(Date.now() - i * 3600000).toISOString(), // Stagger times
      metadata: {
        transactionReference: transactionRef,
        voucherCode,
        paymentMethod: payment.method,
        source: 'www.evoucher.co.za -> website billing',
        flow: 'checkout',
        transactionType: 'purchase',
        transaction_type: 'purchase',
        merchantName: merchant.business_name,
        faceValue,
        consumerPrice: grossAmount,
        platformFee: totalDiscountAmount * 0.5,
        consumerBenefit: totalDiscountAmount * 0.5,
      },
    };

    events.push(event);

    console.log(`📝 Creating: ${payment.name} - R${grossAmount.toFixed(2)} - ${merchant.business_name}`);
  }

  // Insert events
  const { data: insertedEvents, error } = await supabase
    .from('billing_events')
    .insert(events)
    .select('id');

  if (error) {
    console.error('\n❌ Error inserting events:', error);
    return;
  }

  console.log(`\n✅ Successfully created ${insertedEvents.length} billing events!`);
  console.log('\n📊 Open Billing Engine dashboard to see transactions:');
  console.log('   http://localhost:5173\n');
  console.log('🎬 Ready for demo!\n');
}

// Run seed
seedBillingDemo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
