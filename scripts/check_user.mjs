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

async function findAuthUserByEmail(email) {
  const perPage = 200;
  let page = 1;
  while (page <= 20) {
    console.log(`Fetching page ${page} of users...`);
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    console.log(`Page ${page} returned ${users.length} users.`);
    const match = users.find((user) => user.email?.trim().toLowerCase() === email.trim().toLowerCase());
    if (match) return match;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function main() {
  const email = 'admin@evoucher.co.za';
  console.log(`Searching for auth user with email: ${email}`);

  const user = await findAuthUserByEmail(email);
  if (!user) {
    console.log(`User ${email} NOT found in auth.users on any page!`);
    return;
  }

  console.log('User found in auth.users:', {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    app_metadata: user.app_metadata
  });

  // Query portal_user_roles
  const { data: portalRole, error: portalRoleError } = await supabase
    .from('portal_user_roles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (portalRoleError) {
    console.error('Error querying portal_user_roles:', portalRoleError);
  } else {
    console.log('portal_user_roles record:', portalRole);
  }

  // Query user_profiles
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Error querying user_profiles:', profileError);
  } else {
    console.log('user_profiles record:', profile);
  }
}

main().catch(err => {
  console.error(err);
});
