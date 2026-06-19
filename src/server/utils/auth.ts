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

    if (user) {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) {
          const metadata = user.user_metadata || {};
          const email = user.email || '';
          const role = String(metadata.role || 'customer')
            .toLowerCase()
            .trim();
          const fullName = String(metadata.full_name || email.split('@')[0]);
          const phone = String(metadata.phone || '');

          await supabase.from('user_profiles').insert({
            id: user.id,
            email,
            full_name: fullName,
            phone,
            role,
            acquisition_channel: String(metadata.acquisition_channel ?? 'web'),
            primary_access_channel: String(metadata.primary_access_channel ?? 'web'),
            consumer_segment: String(metadata.consumer_segment ?? 'unknown'),
            popia_consent_at: metadata.popia_consent_at ?? null,
            popia_consent_version: metadata.popia_consent_version ?? null,
            marketing_consent: Boolean(metadata.marketing_consent ?? false),
          });
        }
      } catch (profileError) {
        console.warn('[auth-utility] Defensive user profile creation warning:', profileError);
      }
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
