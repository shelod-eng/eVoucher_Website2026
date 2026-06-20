import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function noStoreHeaders(existing?: HeadersInit): HeadersInit {
  return {
    ...(existing ?? {}),
    'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    Vary: 'Cookie, Authorization',
  };
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...(init ?? {}),
    headers: noStoreHeaders(init?.headers),
  });
}

async function expireSupabaseAuthCookies(response: NextResponse) {
  const cookieStore = await cookies();
  const authCookies = cookieStore
    .getAll()
    .map(({ name }) => name)
    .filter((name) => name.startsWith('sb-') || name.includes('auth-token'));

  authCookies.forEach((name) => {
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });
  });

  return response;
}

export async function POST() {
  try {
    const supabase = await createClient();

    // CRITICAL FIX: Use scope 'global' to revoke ALL sessions for this user
    // on the Supabase Auth server. 'local' only clears browser cookies.
    // Without global revocation, the session token remains valid server-side
    // and can be reused (POPIA / compliance violation).
    const { error } = await supabase.auth.signOut({ scope: 'global' });

    if (error) {
      // Even if the Supabase API call fails, we MUST still clear cookies
      // to ensure the browser session is destroyed.
      console.error('Logout route: supabase signOut error (non-fatal):', error.message);
      const response = jsonNoStore(
        {
          success: true,
          warning: 'Server session revocation encountered an issue; local session cleared.',
        },
        { status: 200 }
      );
      return await expireSupabaseAuthCookies(response);
    }

    const response = jsonNoStore({ success: true });
    return await expireSupabaseAuthCookies(response);
  } catch (error: any) {
    // Catch-all: still clear cookies even on unexpected errors
    console.error('Logout route: unexpected error (non-fatal):', error?.message || error);
    const response = jsonNoStore({ success: true, warning: 'Session cleared.' }, { status: 200 });
    return await expireSupabaseAuthCookies(response);
  }
}
