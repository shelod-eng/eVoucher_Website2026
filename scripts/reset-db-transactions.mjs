import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('🧹 Starting Transactional Database Reset...');
  console.log('🔒 PRESERVING ALL MERCHANTS AND MERCHANT PRODUCT CATALOGS.\n');

  // Order of deletion to respect foreign key constraints
  const tables = [
    'redemption_history',
    'customer_vouchers',
    'billing_ledger_entries',
    'billing_settlements',
    'billing_invoices',
    'billing_settlement_batches',
    'merchant_payouts',
    'payment_transactions',
    'fnb_distribution_schedule',
    'wallet_transactions',
    'billing_events',
    'billing_engine_runs',
    'audit_events',
    'fraud_alerts'
  ];

  for (const table of tables) {
    console.log(`⏳ Deleting all rows from public.${table}...`);
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows (or any ID not equal to zero uuid)
      
    if (error) {
      // If table doesn't exist, it might be a missing relation (non-fatal for modular database setups)
      const msg = error.message.toLowerCase();
      if (msg.includes('does not exist') || msg.includes('could not find')) {
        console.log(`ℹ️ Table public.${table} does not exist in this environment. Skipping.`);
      } else {
        console.error(`⚠️ Error clearing table public.${table}:`, error.message);
      }
    } else {
      console.log(`✅ Cleared table public.${table}.`);
    }
  }

  console.log('\n🎉 Transactional database reset completed successfully! All merchant/product definitions are preserved.');
}

main().catch(err => {
  console.error('❌ Critical error in reset-db-transactions:', err);
});
