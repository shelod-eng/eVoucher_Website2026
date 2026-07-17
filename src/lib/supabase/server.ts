import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    expires?: number | Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: 'lax' | 'strict' | 'none';
    secure?: boolean;
  };
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            const isProduction = process.env.NODE_ENV === 'production';
            cookiesToSet?.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                sameSite: options?.sameSite ?? 'lax',
                secure: isProduction ? true : (options?.secure ?? false),
                httpOnly: options?.httpOnly ?? true,
              });
            });
          } catch {
            // Handle server component context
          }
        },
      },
    }
  );
}
