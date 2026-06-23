/**
 * Check if portal user exists in Supabase
 */

const SUPABASE_URL = 'https://tfpujpskfyqeikjkzjru.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcHVqcHNrZnlxZWlramt6anJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQyNzMyNCwiZXhwIjoyMDc4MDAzMzI0fQ.aUhG5Z01Di5bpPYSmGKewwd2kFbFaH8EbiAJZInWTLw';
const PORTAL_EMAIL = 'shelod@gmail.com';

async function checkUser() {
  console.log('🔍 Checking portal user setup\n');
  console.log(`Email: ${PORTAL_EMAIL}\n`);

  // Check if user exists
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  const user = data.users?.find(u => u.email?.toLowerCase() === PORTAL_EMAIL.toLowerCase());

  if (!user) {
    console.log('❌ User NOT found in Supabase auth.users');
    console.log('\n📋 Action required:');
    console.log('1. Create user account in Supabase Dashboard');
    console.log('2. Or sign up at: http://localhost:4028/portal/signup');
    return;
  }

  console.log('✅ User exists in auth.users');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role in metadata: ${user.user_metadata?.role || 'NOT SET'}\n`);

  // Check portal_user_roles table
  const rolesResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/portal_user_roles?user_id=eq.${user.id}`,
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    }
  );

  const roles = await rolesResponse.json();
  
  if (!rolesResponse.ok || !roles || roles.length === 0) {
    console.log('⚠️  User NOT in portal_user_roles table');
    console.log('\n📋 Action required - Run this SQL in Supabase:');
    console.log(`
INSERT INTO portal_user_roles (user_id, role)
VALUES ('${user.id}', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    `);
  } else {
    console.log(`✅ User has portal role: ${roles[0].role}`);
  }

  console.log('\n✅ Portal authentication should work now!');
}

checkUser().catch(console.error);
