import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Avoid sticky sessions on shared devices (POPIA/security requirement).
        // Users will need to sign in again after a full page refresh.
        persistSession: false,
      },
    }
  );
}
