/**
 * Billing Engine API Validator
 * Tests connectivity to production website APIs
 * 
 * Usage: node validate-billing-api.mjs
 */

const API_BASE_URL = 'https://www.evoucher.co.za';
const ADMIN_PASSCODE = 'eVoucherAdmin2024';
const ADMIN_EMAIL = 'shelod@gmail.com';

const endpoints = [
  { name: 'Dashboard', path: '/api/billing/dashboard' },
  { name: 'Events (Voucher Ledger)', path: '/api/billing/events?limit=10' },
  { name: 'Invoices', path: '/api/billing/invoices?limit=10' },
  { name: 'Settlement Batches', path: '/api/billing/settlement-batches?limit=10' },
  { name: 'Settlements', path: '/api/billing/settlements?limit=10' },
];

async function testEndpoint(endpoint) {
  const url = `${API_BASE_URL}${endpoint.path}`;
  const headers = {
    'X-Portal-Passcode': ADMIN_PASSCODE,
    'X-Portal-User': ADMIN_EMAIL,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, { headers });
    const data = await response.json();

    if (response.ok) {
      const recordCount = data?.data?.length ?? (Array.isArray(data?.data) ? data.data.length : '?');
      console.log(`✅ ${endpoint.name}: OK (${recordCount} records)`);
      return { success: true, endpoint: endpoint.name, data };
    } else {
      console.log(`❌ ${endpoint.name}: FAILED - ${data.error || 'Unknown error'}`);
      return { success: false, endpoint: endpoint.name, error: data.error };
    }
  } catch (error) {
    console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
    return { success: false, endpoint: endpoint.name, error: error.message };
  }
}

async function validateAll() {
  console.log('🔍 Billing Engine API Validation\n');
  console.log(`API Base: ${API_BASE_URL}`);
  console.log(`Admin: ${ADMIN_EMAIL}\n`);
  console.log('Testing endpoints...\n');

  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Rate limiting
  }

  console.log('\n📊 Summary:');
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`✅ Passed: ${passed}/${endpoints.length}`);
  console.log(`❌ Failed: ${failed}/${endpoints.length}`);

  if (failed > 0) {
    console.log('\n⚠️  ACTION REQUIRED:');
    console.log('1. Check Vercel environment variables:');
    console.log('   - PORTAL_ADMIN_PASSCODE');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    console.log('2. Redeploy website from Vercel dashboard');
    console.log('3. Re-run this script\n');
  } else {
    console.log('\n✅ All systems operational - Demo ready!\n');
  }

  return results;
}

validateAll().catch(console.error);
