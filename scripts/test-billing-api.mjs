#!/usr/bin/env node
/**
 * Test billing events API endpoint
 * Run: node scripts/test-billing-api.mjs
 */

const API_URL = process.env.TEST_API_URL || 'https://www.evoucher.co.za';
const PASSCODE = process.env.PORTAL_ADMIN_PASSCODE || 'eVoucherAdmin2024';
const EMAIL = process.env.TEST_EMAIL || 'mpetalebo@outlook.com';

async function testBillingEventsAPI() {
  console.log('🧪 Testing Billing Events API...\n');
  console.log(`   URL: ${API_URL}/api/billing/events`);
  console.log(`   Email: ${EMAIL}`);
  console.log(`   Passcode: ${PASSCODE.substring(0, 5)}...`);
  console.log('');

  try {
    const response = await fetch(`${API_URL}/api/billing/events?limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Portal-User': EMAIL,
        'X-Portal-Passcode': PASSCODE,
      },
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', data);
      return;
    }

    console.log('✅ API Response:', JSON.stringify(data, null, 2));
    
    if (data.data && Array.isArray(data.data)) {
      console.log(`\n📊 Found ${data.data.length} billing events`);
      
      if (data.data.length > 0) {
        console.log('\n📝 Recent Events:');
        data.data.slice(0, 5).forEach((event, idx) => {
          console.log(`   ${idx + 1}. ${event.transaction_reference || 'N/A'} - R${event.gross_amount || 0} (${event.event_type})`);
        });
      } else {
        console.log('\n⚠️  No billing events found!');
        console.log('   This means transactions are NOT creating billing_events rows.');
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testBillingEventsAPI();
