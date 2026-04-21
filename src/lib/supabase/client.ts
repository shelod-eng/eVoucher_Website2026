import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Keep browser sessions stable across refreshes and tabs.
        // Session isolation remains per-browser/device.
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}
