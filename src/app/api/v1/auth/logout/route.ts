import { NextResponse } from 'next/server';
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

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      return jsonNoStore({ error: error.message, code: 'logout_failed' }, { status: 500 });
    }
    return jsonNoStore({ success: true });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to log out.', code: 'logout_failed' },
      { status: 500 }
    );
  }
}
