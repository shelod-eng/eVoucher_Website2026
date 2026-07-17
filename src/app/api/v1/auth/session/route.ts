import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const accessToken = String(body?.accessToken ?? '').trim();
    const refreshToken = String(body?.refreshToken ?? '').trim();

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'accessToken and refreshToken are required.' },
        { status: 400 }
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ success: true });

    // Create a server client that writes cookies directly onto the response object.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
              });
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error || !data?.session) {
      return NextResponse.json(
        { error: error?.message || 'Failed to establish server session.' },
        { status: 401 }
      );
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Session sync failed.' },
      { status: 500 }
    );
  }
}
