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
  const path = request.nextUrl.pathname;

  const customerArea =
    path.startsWith('/customer/dashboard') ||
    path.startsWith('/buy-vouchers') ||
    path.startsWith('/shop') ||
    path.startsWith('/cart') ||
    path.startsWith('/wallet') ||
    path.startsWith('/benefits') ||
    path.startsWith('/rewards') ||
    path.startsWith('/analytics') ||
    path.startsWith('/profile');

  const merchantProtectedArea =
    path.startsWith('/merchant/dashboard') ||
    path.startsWith('/merchant/payouts') ||
    path.startsWith('/merchant/onboarding') ||
    path.startsWith('/merchant/create-product') ||
    path.startsWith('/merchant/login') ||
    path.startsWith('/merchant/register');

  const merchantRoleArea = merchantProtectedArea || path.startsWith('/merchants');

  // Redirect to login if accessing protected routes without auth
  if (!user && (customerArea || merchantProtectedArea)) {
    const url = request.nextUrl.clone();
    if (merchantProtectedArea) {
      url.pathname = '/merchant/login';
    } else {
      url.pathname = '/signin';
    }
    return NextResponse.redirect(url);
  }

  // Role-aware route protections.
  if (user) {
    if (customerArea && role === 'merchant') {
      const url = request.nextUrl.clone();
      url.pathname = '/merchant/dashboard';
      return NextResponse.redirect(url);
    }

    if (merchantRoleArea && role && role !== 'merchant') {
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
