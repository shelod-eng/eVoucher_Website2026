import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  const email = process.argv[2] || 'admin@evoucher.co.za';
  if (!email) {
    console.error('Usage: node scripts/check_user.mjs [email]');
    process.exit(1);
  }
  console.log(`Searching for auth user with email: ${email}`);

  // Use the more efficient direct lookup instead of manual pagination
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserByEmail(email);
  if (userError && !user) {
    console.error(`Error fetching user: ${userError.message}`);
  }

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
