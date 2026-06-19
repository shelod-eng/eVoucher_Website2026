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

  // Insert/upsert user_profiles
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      email: email,
      role: 'admin',
      full_name: 'System Admin',
      phone: ''
    });

  if (profileError) {
    console.error('Error upserting user_profiles:', profileError);
  } else {
    console.log('user_profiles updated successfully.');
  }

  // Insert/upsert portal_user_roles
  const { data: roleData, error: roleError } = await supabase
    .from('portal_user_roles')
    .upsert({
      user_id: userId,
      role: 'admin'
    });

  if (roleError) {
    console.error('Error upserting portal_user_roles:', roleError);
  } else {
    console.log('portal_user_roles updated successfully.');
  }
}

main().catch(err => {
  console.error(err);
});
