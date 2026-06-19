import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

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

function getSupabasePublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email ?? body?.username ?? '')
      .trim()
      .toLowerCase();
    const password = String(body?.password ?? '');

    if (!email || !password) {
      return jsonNoStore({ error: 'Email/username and password are required.' }, { status: 400 });
    }

    const supabase = getSupabasePublicClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.session || !data?.user) {
      return jsonNoStore(
        { error: error?.message || 'Invalid login credentials.' },
        { status: 401 }
      );
    }

    let role: string | null = null;
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      role = profile?.role ?? null;
    } catch {
      role = null;
    }

    return jsonNoStore({
      success: true,
      token: data.session.access_token,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
        role,
      },
      session: data.session,
    });
  } catch (error: any) {
    return jsonNoStore({ error: error?.message || 'Login failed.' }, { status: 500 });
  }
}
