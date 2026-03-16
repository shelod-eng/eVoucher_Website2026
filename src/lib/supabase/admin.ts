import { createClient } from '@supabase/supabase-js';

export function isLikelyServiceRoleKey(key: string | undefined | null) {
  const value = String(key ?? '').trim();
  if (!value) return false;

  // Supabase "new" key formats:
  // - publishable: sb_publishable_*
  // - secret/service: sb_secret_*
  // Older projects may still use JWT-looking service keys (eyJ...).
  if (value.startsWith('sb_publishable_')) return false;
  if (value.startsWith('sb_secret_')) return true;
  if (value.startsWith('eyJ')) return true;

  // Unknown format: assume it's not safe to treat as a service role key.
  return false;
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL for admin operations.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
