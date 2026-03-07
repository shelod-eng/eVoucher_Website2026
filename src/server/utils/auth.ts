import { createClient } from '@/lib/supabase/server';

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    const message = String(error?.message ?? '').toLowerCase();
    // Treat missing session as unauthenticated instead of hard server error.
    if (message.includes('auth session missing')) {
      return { supabase, user: null };
    }
    throw error;
  }

  return { supabase, user };
}
