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
  const applyNoStoreHeaders = (response: NextResponse) => {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Vary', 'Cookie, Authorization');
    return response;
  };

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
    path.startsWith('/merchant/create-product') ||
    path.startsWith('/merchant/change-password');

  const portalArea = path.startsWith('/portal');
  const portalLogin = path.startsWith('/portal/login');
  const portalResetPassword = path.startsWith('/portal/reset-password');
  const portalPublicArea = portalLogin || portalResetPassword;
  const protectedArea = customerArea || merchantProtectedArea || (portalArea && !portalPublicArea);

  const hasSupabaseSessionCookie = request.cookies.getAll().some(({ name }) => {
    const normalizedName = name.toLowerCase();
    return (
      normalizedName === 'supabase-auth-token' ||
      (normalizedName.startsWith('sb-') && normalizedName.includes('auth-token'))
    );
  });

  if (protectedArea && !hasSupabaseSessionCookie) {
    const url = request.nextUrl.clone();
    if (portalArea) {
      url.pathname = '/portal/login';
    } else if (merchantProtectedArea) {
      url.pathname = '/merchant/login';
    } else {
      url.pathname = '/signin';
    }
    return applyNoStoreHeaders(NextResponse.redirect(url));
  }

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
          const isProduction = process.env.NODE_ENV === 'production';
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, {
              ...options,
              sameSite: options?.sameSite ?? 'lax',
              secure: isProduction ? true : (options?.secure ?? false),
              httpOnly: options?.httpOnly ?? true,
            });
          });
        },
      },
    }
  );

  let user = null;
  try {
    const {
      data: { user: resolvedUser },
    } = await supabase.auth.getUser();
    user = resolvedUser;
  } catch (error: any) {
    const message = String(error?.message ?? '').toLowerCase();
    const causeCode = String(error?.cause?.code ?? '');
    if (!(message.includes('fetch failed') || causeCode === 'UND_ERR_CONNECT_TIMEOUT')) {
      throw error;
    }
    user = null;
  }
  const role = String(user?.user_metadata?.role ?? '').toLowerCase();

  // Redirect to login if accessing protected routes without auth
  if (!user && protectedArea) {
    const url = request.nextUrl.clone();
    if (portalArea) {
      url.pathname = '/portal/login';
    } else if (merchantProtectedArea) {
      url.pathname = '/merchant/login';
    } else {
      url.pathname = '/signin';
    }
    return applyNoStoreHeaders(NextResponse.redirect(url));
  }

  // Role-aware route protections.
  if (user) {
    if (customerArea && role === 'merchant') {
      const url = request.nextUrl.clone();
      url.pathname = '/merchant/dashboard';
      return applyNoStoreHeaders(NextResponse.redirect(url));
    }

    if (merchantProtectedArea && role && role !== 'merchant') {
      const url = request.nextUrl.clone();
      url.pathname = '/shop';
      return applyNoStoreHeaders(NextResponse.redirect(url));
    }

    if (portalArea && !portalPublicArea && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = role === 'merchant' ? '/merchant/dashboard' : '/shop';
      return applyNoStoreHeaders(NextResponse.redirect(url));
    }
  }

  return applyNoStoreHeaders(supabaseResponse);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
