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
      sameSite: 'lax',
    });
  });

  return response;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      const response = jsonNoStore(
        { error: error.message, code: 'logout_failed' },
        { status: 500 }
      );
      return await expireSupabaseAuthCookies(response);
    }
    const response = jsonNoStore({ success: true });
    return await expireSupabaseAuthCookies(response);
  } catch (error: any) {
    const response = jsonNoStore(
      { error: error?.message || 'Failed to log out.', code: 'logout_failed' },
      { status: 500 }
    );
    return await expireSupabaseAuthCookies(response);
  }
}
