import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envLocalPath = path.resolve('.env.local');
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
envLocalContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const userId = process.argv[2];
  const email = process.argv[3];

  if (!userId || !email) {
    console.error('Usage: node scripts/assign_admin_role.mjs <user-id> <email>');
    process.exit(1);
  }

  console.log(`Setting admin role for user ID: ${userId} (${email})`);

  try {
    const [profileResult, roleResult] = await Promise.all([
      // Upsert into user_profiles
      supabase.from('user_profiles').upsert({
        id: userId,
        email: email,
        role: 'admin',
        full_name: 'System Admin', // Default name for new admin profiles
        phone: '', // Default phone for new admin profiles
      }).select().single(),

      // Upsert into portal_user_roles
      supabase.from('portal_user_roles').upsert({
        user_id: userId,
        role: 'admin',
      }).select().single(),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (roleResult.error) throw roleResult.error;

    console.log('\n✅ Admin role assignment successful!');
    console.log('   - Updated user_profiles for:', profileResult.data.email);
    console.log('   - Updated portal_user_roles for user_id:', roleResult.data.user_id);
  } catch (error) {
    console.error('\n❌ Failed to assign admin role.');
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

main();
