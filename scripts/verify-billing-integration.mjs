/**
 * Billing Engine Integration Verification Script
 * Run this to test if website and portal are properly synchronized
 * 
 * Usage: node scripts/verify-billing-integration.mjs
 */

import fetch from 'node-fetch';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  info: (msg) => console.log(`${COLORS.cyan}ℹ${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  section: (msg) => console.log(`\n${COLORS.bold}${COLORS.cyan}${msg}${COLORS.reset}`),
};

const WEBSITE_BASE = 'http://localhost:4028';
const PORTAL_BASE = 'http://localhost:3000';
const ADMIN_PASSCODE = 'eVoucherAdmin2024';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
};

async function testEndpoint(name, url, expectedStatus = 200, options = {}) {
  results.total++;
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Portal-Passcode': ADMIN_PASSCODE,
        ...options.headers,
      },
      ...options,
    });

    if (response.status === expectedStatus) {
      results.passed++;
      log.success(`${name}: OK (${response.status})`);
      return { success: true, data: await response.json().catch(() => null) };
    } else {
      results.failed++;
      log.error(`${name}: Expected ${expectedStatus}, got ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    results.failed++;
    log.error(`${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function verifyWebsiteEndpoints() {
  log.section('📡 Testing Website API Endpoints');

  await testEndpoint(
    'Dashboard API',
    `${WEBSITE_BASE}/api/billing/dashboard`
  );

  await testEndpoint(
    'Billing Events API',
    `${WEBSITE_BASE}/api/billing/events?limit=10`
  );

  await testEndpoint(
    'Settlements API',
    `${WEBSITE_BASE}/api/billing/settlements`
  );

  await testEndpoint(
    'Merchants API',
    `${WEBSITE_BASE}/api/merchants`
  );
}

async function verifyPortalAccess() {
  log.section('🏢 Testing Billing Portal Access');

  const portalCheck = await testEndpoint(
    'Portal Homepage',
    PORTAL_BASE,
    200
  );

  if (!portalCheck.success) {
    log.warn('Portal may not be running. Start with: cd billing-engine-portal && npm run dev');
    results.warnings++;
  }
}

async function verifyDataFlow() {
  log.section('🔄 Testing Data Flow');

  log.info('Fetching dashboard data from website...');
  const dashboardResult = await testEndpoint(
    'Dashboard Data',
    `${WEBSITE_BASE}/api/billing/dashboard`
  );

  if (dashboardResult.success && dashboardResult.data) {
    const data = dashboardResult.data;
    if (data.data?.totals) {
      const totals = data.data.totals;
      log.info(`  Total Voucher Volume: R${totals.totalVoucherVolume?.toFixed(2) || '0.00'}`);
      log.info(`  Platform Revenue: R${totals.platformRevenue?.toFixed(2) || '0.00'}`);
      log.info(`  Member Benefits: R${totals.memberBenefitsPaid?.toFixed(2) || '0.00'}`);
      log.info(`  Pending Payouts: R${totals.pendingMerchantPayouts?.toFixed(2) || '0.00'}`);

      if (totals.totalVoucherVolume > 0) {
        results.passed++;
        log.success('✓ Dashboard has transaction data');
      } else {
        results.warnings++;
        log.warn('Dashboard shows zero transactions. Create a test purchase on the website.');
      }
    } else {
      results.warnings++;
      log.warn('Dashboard data structure unexpected');
    }
  }

  log.info('Fetching billing events from website...');
  const eventsResult = await testEndpoint(
    'Billing Events',
    `${WEBSITE_BASE}/api/billing/events?limit=10`
  );

  if (eventsResult.success && eventsResult.data) {
    const events = eventsResult.data?.data || [];
    log.info(`  Found ${events.length} billing events`);

    if (events.length > 0) {
      results.passed++;
      log.success('✓ Billing events table has data');
      const recent = events[0];
      log.info(`  Most recent: ${recent.event_type}, R${recent.gross_amount}`);
    } else {
      results.warnings++;
      log.warn('No billing events found. Create a test purchase on the website.');
    }
  }
}

async function verifyConfiguration() {
  log.section('⚙️  Verifying Configuration');

  log.info('Checking environment configuration...');

  try {
    // Check if portal can reach website APIs
    const response = await fetch(`${WEBSITE_BASE}/api/merchants`, {
      headers: {
        'X-Portal-Passcode': ADMIN_PASSCODE,
      },
    });

    if (response.ok) {
      results.passed++;
      log.success('✓ Portal can reach website APIs (CORS configured correctly)');
    } else {
      results.failed++;
      log.error('Portal cannot reach website APIs. Check CORS configuration.');
    }
  } catch (error) {
    results.failed++;
    log.error(`Portal cannot connect to website: ${error.message}`);
    log.warn('  Ensure website is running on http://localhost:4028');
    log.warn('  Check VITE_PORTAL_API_BASE_URL in billing-engine-portal/.env.local');
  }
}

async function printSummary() {
  log.section('📊 Verification Summary');

  console.log(`Total Tests: ${results.total}`);
  console.log(`${COLORS.green}Passed: ${results.passed}${COLORS.reset}`);
  console.log(`${COLORS.red}Failed: ${results.failed}${COLORS.reset}`);
  console.log(`${COLORS.yellow}Warnings: ${results.warnings}${COLORS.reset}`);

  if (results.failed === 0 && results.warnings === 0) {
    log.section('🎉 All Systems Operational - Demo Ready!');
    console.log('\nYour billing engine integration is working correctly.');
    console.log('You can now run the sponsor demo.\n');
  } else if (results.failed === 0) {
    log.section('⚠️  System Functional with Warnings');
    console.log('\nBilling engine is working but needs test data.');
    console.log('Create a test purchase on the website to populate the portal.\n');
  } else {
    log.section('🔴 Integration Issues Detected');
    console.log('\nPlease fix the errors above before running the demo.');
    console.log('Check BILLING_ENGINE_SYNC_REPORT.md for troubleshooting.\n');
  }
}

async function printRecommendations() {
  log.section('💡 Next Steps');

  if (results.warnings > 0 || results.failed > 0) {
    console.log('\n1. Start both services:');
    console.log('   Terminal 1: cd evoucher_website_2026 && npm run dev');
    console.log('   Terminal 2: cd billing-engine-portal && npm run dev');
    console.log('\n2. Verify portal .env.local has:');
    console.log('   VITE_PORTAL_API_BASE_URL=http://localhost:4028');
    console.log('\n3. Create a test transaction:');
    console.log('   http://localhost:4028/buy-vouchers');
    console.log('\n4. Verify portal dashboard:');
    console.log('   http://localhost:3000 (login with: eVoucherAdmin2024)');
    console.log('\n5. Re-run this script to verify:\n   node scripts/verify-billing-integration.mjs\n');
  } else {
    console.log('\n✅ System ready for demo!');
    console.log('\nDemo URLs:');
    console.log(`  Website: ${WEBSITE_BASE}/buy-vouchers`);
    console.log(`  Billing Portal: ${PORTAL_BASE}`);
    console.log(`  Admin Passcode: ${ADMIN_PASSCODE}\n`);
  }
}

// Main execution
async function main() {
  console.log(`
${COLORS.bold}${COLORS.cyan}═══════════════════════════════════════════════════════${COLORS.reset}
${COLORS.bold}  Billing Engine Integration Verification${COLORS.reset}
${COLORS.cyan}═══════════════════════════════════════════════════════${COLORS.reset}
`);

  await verifyWebsiteEndpoints();
  await verifyPortalAccess();
  await verifyDataFlow();
  await verifyConfiguration();
  await printSummary();
  await printRecommendations();

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  log.error(`Verification script failed: ${error.message}`);
  process.exit(1);
});
