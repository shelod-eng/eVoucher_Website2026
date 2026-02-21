import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // For local testing we avoid sticky sessions across full browser restarts.
        persistSession: !isLocalhost,
      },
    }
  );
}
