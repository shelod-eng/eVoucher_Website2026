/**
 * Test if PORTAL_ADMIN_PASSCODE is actually set in production
 */

const API_BASE_URL = 'https://www.evoucher.co.za';

async function testPasscode() {
  console.log('🔍 Testing different passcodes...\n');

  const tests = [
    { passcode: 'eVoucherAdmin2024', label: 'Correct passcode' },
    { passcode: 'wrong', label: 'Wrong passcode' },
    { passcode: '', label: 'Empty passcode' },
  ];

  for (const test of tests) {
    const response = await fetch(`${API_BASE_URL}/api/billing/dashboard`, {
      headers: {
        'X-Portal-Passcode': test.passcode,
        'X-Portal-User': 'shelod@gmail.com',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log(`${test.label}: ${response.status}`);
    console.log(`  Response: ${data.error || 'OK'}\n`);
  }
}

testPasscode().catch(console.error);
