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
  console.log('🧹 Starting Soft Clean of Demo Customer Data...');
  console.log('🔒 ALL MERCHANT DATA AND PRODUCT CATALOGS WILL BE PRESERVED.\n');

  // 1. Fetch all auth users
  let allUsers = [];
  let page = 1;
  const perPage = 200;
  
  while (true) {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });
    
    if (listError) {
      console.error('❌ Failed to list auth users:', listError.message);
      process.exit(1);
    }
    
    allUsers.push(...(users ?? []));
    if (!users || users.length < perPage) break;
    page++;
  }

  // Filter out demo customers specifically
  // We want to match: demo.customerXX@evoucher.co.za
  // We must EXCLUDE merchant emails: demo-shoprite@evoucher.co.za, demo-picknpay@evoucher.co.za
  const demoCustomers = allUsers.filter(u => {
    const email = String(u.email ?? '').toLowerCase().trim();
    const isDemo = email.startsWith('demo.customer') || (email.startsWith('demo-') && !email.includes('shoprite') && !email.includes('picknpay'));
    return isDemo;
  });

  if (demoCustomers.length === 0) {
    console.log('✅ No demo customers found in auth.users.');
    return;
  }

  const demoCustomerIds = demoCustomers.map(u => u.id);
  console.log(`🔍 Found ${demoCustomers.length} demo customers to clean.`);

  // 2. Delete transactional records for these customers
  // Table: customer_vouchers
  console.log('⏳ Deleting customer vouchers...');
  const { error: voucherError } = await supabase
    .from('customer_vouchers')
    .delete()
    .in('customer_id', demoCustomerIds);
  if (voucherError) console.error('⚠️ Error deleting customer_vouchers:', voucherError.message);
  else console.log('✅ Deleted customer vouchers.');

  // Table: redemption_history
  console.log('⏳ Deleting redemption history...');
  const { error: redemptionError } = await supabase
    .from('redemption_history')
    .delete()
    .in('customer_id', demoCustomerIds);
  if (redemptionError) console.error('⚠️ Error deleting redemption_history:', redemptionError.message);
  else console.log('✅ Deleted redemption history.');

  // Table: payment_transactions
  console.log('⏳ Deleting payment transactions...');
  const { error: paymentError } = await supabase
    .from('payment_transactions')
    .delete()
    .in('customer_id', demoCustomerIds);
  if (paymentError) console.error('⚠️ Error deleting payment_transactions:', paymentError.message);
  else console.log('✅ Deleted payment transactions.');

  // Table: wallet_transactions
  console.log('⏳ Deleting wallet transactions...');
  const { error: walletError } = await supabase
    .from('wallet_transactions')
    .delete()
    .in('customer_id', demoCustomerIds);
  if (walletError) console.error('⚠️ Error deleting wallet_transactions:', walletError.message);
  else console.log('✅ Deleted wallet transactions.');

  // Table: billing_events
  console.log('⏳ Deleting billing events...');
  const { error: billingEventsError } = await supabase
    .from('billing_events')
    .delete()
    .in('customer_id', demoCustomerIds);
  if (billingEventsError) console.error('⚠️ Error deleting billing_events:', billingEventsError.message);
  else console.log('✅ Deleted billing events.');

  // 3. Delete profiles and auth users
  console.log('⏳ Deleting user profiles...');
  const { error: profileError } = await supabase
    .from('user_profiles')
    .delete()
    .in('id', demoCustomerIds);
  if (profileError) console.error('⚠️ Error deleting user_profiles:', profileError.message);
  else console.log('✅ Deleted user profiles.');

  console.log('⏳ Deleting auth users...');
  for (const customer of demoCustomers) {
    const { error: authDelError } = await supabase.auth.admin.deleteUser(customer.id);
    if (authDelError) {
      console.error(`⚠️ Failed to delete auth user ${customer.email}:`, authDelError.message);
    }
  }
  console.log('✅ Deleted auth users.');

  console.log('\n🎉 Soft Clean Completed successfully! All merchant/product data is preserved.');
}

main().catch(err => {
  console.error('❌ Critical error in clean-demo-data:', err);
});
