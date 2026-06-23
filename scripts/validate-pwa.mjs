/**
 * PWA Validation Script
 * Run this to verify PWA is working correctly
 * 
 * Usage: node scripts/validate-pwa.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🔍 Validating PWA Configuration...\n');

let errors = [];
let warnings = [];
let passed = 0;
let total = 0;

function check(name, condition, errorMsg, warnMsg = null) {
  total++;
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else if (warnMsg) {
    console.log(`⚠️  ${name} - ${warnMsg}`);
    warnings.push(warnMsg);
  } else {
    console.log(`❌ ${name} - ${errorMsg}`);
    errors.push(errorMsg);
  }
}

// Check 1: Service worker file exists
const swPath = path.join(rootDir, 'public', 'service-worker.js');
check(
  'Service worker file exists',
  fs.existsSync(swPath),
  'File public/service-worker.js not found'
);

// Check 2: Manifest file exists
const manifestPath = path.join(rootDir, 'public', 'manifest.json');
check(
  'Manifest file exists',
  fs.existsSync(manifestPath),
  'File public/manifest.json not found'
);

// Check 3: Manifest is valid JSON
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    check(
      'Manifest is valid JSON',
      true,
      null
    );
    
    // Check manifest fields
    check(
      'Manifest has name',
      !!manifest.name,
      'Manifest missing "name" field'
    );
    
    check(
      'Manifest has start_url',
      !!manifest.start_url,
      'Manifest missing "start_url" field'
    );
    
    check(
      'Manifest has display mode',
      !!manifest.display,
      'Manifest missing "display" field'
    );
    
    check(
      'Manifest has icons',
      Array.isArray(manifest.icons) && manifest.icons.length > 0,
      'Manifest has no icons'
    );
  } catch (e) {
    check(
      'Manifest is valid JSON',
      false,
      `Manifest JSON parse error: ${e.message}`
    );
  }
}

// Check 4: Icons exist
const icon192 = path.join(rootDir, 'public', 'icons', 'icon-192x192.png');
const icon512 = path.join(rootDir, 'public', 'icons', 'icon-512x512.png');
check(
  'Icon 192x192 exists',
  fs.existsSync(icon192),
  'File public/icons/icon-192x192.png not found'
);
check(
  'Icon 512x512 exists',
  fs.existsSync(icon512),
  'File public/icons/icon-512x512.png not found'
);

// Check 5: PwaRegistrar component exists
const pwaRegistrarPath = path.join(rootDir, 'src', 'components', 'common', 'PwaRegistrar.tsx');
check(
  'PwaRegistrar component exists',
  fs.existsSync(pwaRegistrarPath),
  'File src/components/common/PwaRegistrar.tsx not found'
);

// Check 6: PwaRegistrar uses correct path
if (fs.existsSync(pwaRegistrarPath)) {
  const pwaRegistrarContent = fs.readFileSync(pwaRegistrarPath, 'utf8');
  check(
    'PwaRegistrar uses /service-worker.js',
    pwaRegistrarContent.includes("register('/service-worker.js')"),
    'PwaRegistrar uses wrong path (should be /service-worker.js)'
  );
}

// Check 7: Layout includes PwaRegistrar
const layoutPath = path.join(rootDir, 'src', 'app', 'layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  check(
    'Layout imports PwaRegistrar',
    layoutContent.includes('PwaRegistrar'),
    'layout.tsx does not import or use PwaRegistrar'
  );
}

// Check 8: ENV has PWA enabled
const envPath = path.join(rootDir, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  check(
    'PWA enabled in .env.local',
    envContent.includes('NEXT_PUBLIC_ENABLE_PWA_DEV="true"'),
    null,
    'NEXT_PUBLIC_ENABLE_PWA_DEV not set (PWA will only work in production)'
  );
}

// Check 9: Offline page exists
const offlinePath = path.join(rootDir, 'public', 'offline.html');
check(
  'Offline fallback page exists',
  fs.existsSync(offlinePath),
  null,
  'public/offline.html not found (recommended)'
);

// Results
console.log('\n' + '='.repeat(50));
console.log(`📊 Results: ${passed}/${total} checks passed`);
console.log('='.repeat(50));

if (errors.length > 0) {
  console.log('\n❌ ERRORS (Must Fix):');
  errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS (Should Fix):');
  warnings.forEach((warn, i) => console.log(`   ${i + 1}. ${warn}`));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n🎉 Perfect! PWA is fully configured and ready!');
  console.log('\n📱 To test:');
  console.log('   1. npm run dev');
  console.log('   2. Open http://localhost:4028');
  console.log('   3. Press F12 → Application → Service Workers');
  console.log('   4. Should show service-worker.js activated');
  console.log('   5. Look for install prompt in browser');
} else if (errors.length === 0) {
  console.log('\n✅ Good! PWA will work (warnings are optional)');
} else {
  console.log('\n🔧 Fix errors above before deploying PWA');
  process.exit(1);
}

console.log('\n');
