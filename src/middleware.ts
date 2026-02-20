import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const role = String(user?.user_metadata?.role ?? '').toLowerCase();

  // Redirect to login if accessing protected routes without auth
  if (!user && (request.nextUrl.pathname.startsWith('/customer/dashboard') || request.nextUrl.pathname.startsWith('/merchant/dashboard') || request.nextUrl.pathname.startsWith('/buy-vouchers'))) {
    const url = request.nextUrl.clone();
    if (request.nextUrl.pathname.startsWith('/buy-vouchers')) {
      url.pathname = '/signin';
    } else {
      url.pathname = request.nextUrl.pathname.startsWith('/customer') ? '/customer/login' : '/merchant/login';
    }
    return NextResponse.redirect(url);
  }

  // Role-aware route protections.
  if (user) {
    const customerArea =
      request.nextUrl.pathname.startsWith('/customer/dashboard') ||
      request.nextUrl.pathname.startsWith('/buy-vouchers') ||
      request.nextUrl.pathname.startsWith('/shop') ||
      request.nextUrl.pathname.startsWith('/cart') ||
      request.nextUrl.pathname.startsWith('/wallet') ||
      request.nextUrl.pathname.startsWith('/rewards');

    const merchantArea =
      request.nextUrl.pathname.startsWith('/merchant/dashboard') ||
      request.nextUrl.pathname.startsWith('/merchant/payouts') ||
      request.nextUrl.pathname.startsWith('/merchant/onboarding') ||
      request.nextUrl.pathname.startsWith('/merchant/login') ||
      request.nextUrl.pathname.startsWith('/merchants');

    if (customerArea && role === 'merchant') {
      const url = request.nextUrl.clone();
      url.pathname = '/merchant/dashboard';
      return NextResponse.redirect(url);
    }

    if (merchantArea && role && role !== 'merchant') {
      const url = request.nextUrl.clone();
      url.pathname = '/shop';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
