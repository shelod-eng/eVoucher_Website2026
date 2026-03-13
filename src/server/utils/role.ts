import type { User } from '@supabase/supabase-js';

type SupabaseLikeClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string
      ) => {
        maybeSingle: () => Promise<{ data: { role?: string | null } | null; error: any }>;
      };
    };
  };
};

export async function resolveUserRole(
  supabase: SupabaseLikeClient,
  user: User
): Promise<{ role: string; source: 'profile' | 'metadata' | 'default' }> {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    const metadataRole = String(user.user_metadata?.role ?? '')
      .toLowerCase()
      .trim();
    if (metadataRole) {
      return { role: metadataRole, source: 'metadata' };
    }
    return { role: 'customer', source: 'default' };
  }

  const profileRole = profile?.role?.toLowerCase().trim();
  if (profileRole) {
    return { role: profileRole, source: 'profile' };
  }

  const metadataRole = String(user.user_metadata?.role ?? '')
    .toLowerCase()
    .trim();
  if (metadataRole) {
    return { role: metadataRole, source: 'metadata' };
  }

  return { role: 'customer', source: 'default' };
}

export function isConsumerRole(role: string) {
  return role === 'customer' || role === 'consumer';
}

export function isMerchantRole(role: string) {
  return role === 'merchant';
}
