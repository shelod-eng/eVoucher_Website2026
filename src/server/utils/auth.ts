import { createClient } from '@/lib/supabase/server';

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      const message = String(error?.message ?? '').toLowerCase();
      const causeCode = String((error as any)?.cause?.code ?? '');
      // Treat missing session and transient auth timeouts as unauthenticated instead of hard server error.
      if (
        message.includes('auth session missing') ||
        message.includes('fetch failed') ||
        causeCode === 'UND_ERR_CONNECT_TIMEOUT'
      ) {
        return { supabase, user: null };
      }
      throw error;
    }

    return { supabase, user };
  } catch (error: any) {
    const message = String(error?.message ?? '').toLowerCase();
    const causeCode = String(error?.cause?.code ?? '');
    if (message.includes('fetch failed') || causeCode === 'UND_ERR_CONNECT_TIMEOUT') {
      return { supabase, user: null };
    }
    throw error;
  }
}
