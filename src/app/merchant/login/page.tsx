'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';

const DEMO_PASSWORD = 'demo123';
const DEMO_MERCHANTS = [
  { label: 'Shoprite', email: 'demo-shoprite@evoucher.co.za' },
  { label: 'Pick n Pay', email: 'demo-picknpay@evoucher.co.za' },
  { label: 'Boxer', email: 'demo-boxer@evoucher.co.za' },
  { label: 'Checkers', email: 'demo-checkers@evoucher.co.za' },
  { label: 'Clicks', email: 'demo-clicks@evoucher.co.za' },
  { label: 'Pep', email: 'demo-pep@evoucher.co.za' },
  { label: 'Engen', email: 'demo-engen@evoucher.co.za' },
  { label: 'Kalapeng Private', email: 'demo-kalapeng@evoucher.co.za' },
] as const;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

async function fetchMerchantAuthState() {
  const response = await fetch('/api/v1/merchant/auth-state', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({} as any));
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to load merchant auth state.');
  }
  return payload as {
    role: string;
    isMerchant: boolean;
    mustResetPassword: boolean;
  };
}

export default function MerchantLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, role, signIn, signOut } = useAuth();
  useEffect(() => {
    if (typeof user === 'undefined') {
      setError('Authentication context failed to load. Please refresh or contact support.');
    }
  }, [user]);
  const router = useRouter();
  const allowDemoSeed = String(process.env.NEXT_PUBLIC_ENABLE_DEMO_MERCHANT_SEED ?? '').toLowerCase() === 'true';
  const autoSeedOnLogin =
    String(process.env.NEXT_PUBLIC_FORCE_DEMO_SEED_ON_LOGIN ?? '').toLowerCase() === 'true';

  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const resolveLanding = async () => {
      try {
        const state = await fetchMerchantAuthState();
        if (cancelled) return;
        if (state.isMerchant) {
          router.replace(state.mustResetPassword ? '/merchant/change-password' : '/merchant/dashboard');
          return;
        }
        if (String(state.role ?? '').trim()) {
          router.replace('/shop');
        }
      } catch {
        const resolvedRole = String(role ?? user.user_metadata?.role ?? '').toLowerCase();
        if (resolvedRole === 'merchant') {
          router.replace(Boolean(user.user_metadata?.must_change_password) ? '/merchant/change-password' : '/merchant/dashboard');
        } else if (resolvedRole) {
          router.replace('/shop');
        }
      }
    };
    void resolveLanding();
    return () => {
      cancelled = true;
    };
  }, [user, role, router]);

  useEffect(() => {
    if (!allowDemoSeed || !autoSeedOnLogin) return;
    let cancelled = false;
    const seedDemoMerchants = async () => {
      try {
        const response = await fetch('/api/v1/merchant/demo-seed', { method: 'POST' });
        if (!response.ok) return;
        if (cancelled) return;
      } catch {
        // Demo seeding is best-effort and should never block merchant login.
      }
    };
    void seedDemoMerchants();
    return () => {
      cancelled = true;
    };
  }, [allowDemoSeed, autoSeedOnLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = String(email ?? '').trim().toLowerCase();
      const normalizedPassword = String(password ?? '').trim();
      if (!normalizedEmail || !normalizedPassword) {
        setError('Email and password are required.');
        setLoading(false);
        return;
      }
      const signedInUser = await withTimeout(
        signIn(normalizedEmail, normalizedPassword),
        60000,
        'Sign in timed out. Please try again.'
      );
      if (
        normalizedEmail === 'demo-shoprite@evoucher.co.za' ||
        normalizedEmail === 'demo-picknpay@evoucher.co.za'
      ) {
        try {
          await fetch('/api/v1/merchant/demo-seed', { method: 'POST' });
        } catch {
          // Best effort seeding to keep login resilient.
        }
      }
      let state;
      try {
        state = await withTimeout(
          fetchMerchantAuthState(),
          15000,
          'Failed to fetch merchant authentication state.'
        );
      } catch (apiErr: any) {
        const fallbackRole = String(signedInUser?.user_metadata?.role ?? '').toLowerCase();
        const fallbackMustChange = Boolean(signedInUser?.user_metadata?.must_change_password);
        if (fallbackRole === 'merchant') {
          router.replace(fallbackMustChange ? '/merchant/change-password' : '/merchant/dashboard');
          return;
        }
        if (fallbackRole) {
          router.replace('/shop');
          return;
        }
        setError('Failed to fetch merchant authentication state. Please try again or contact support.');
        setLoading(false);
        return;
      }
      if (!state || typeof state.mustResetPassword === 'undefined') {
        setError('Merchant authentication state is invalid.');
        setLoading(false);
        return;
      }
      router.replace(state.mustResetPassword ? '/merchant/change-password' : '/merchant/dashboard');
    } catch (err: any) {
      const message = String(err?.message || 'Invalid email or password');
      if (message.toLowerCase().includes('timed out')) {
        try {
          await signOut();
        } catch {
          // Best effort local session clear on timeout.
        }
      }
      setError(message);
      console.error('[MerchantLogin][handleSubmit][error]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.16),_transparent_50%),#f4fbfa]">
      <Header />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="mb-5 rounded-2xl border border-teal-300/40 bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-5 text-white shadow-xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-teal-100 font-headline">eVoucher Merchant Platform</p>
            <h1 className="mt-2 font-headline font-bold text-2xl">Business Portal Sign In</h1>
            <p className="mt-1 text-sm text-teal-100">Secure access for chain and private merchants.</p>
          </div>
          <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-border">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="BuildingStorefrontIcon" size={32} variant="solid" className="text-secondary" />
              </div>
              <h1 className="font-headline font-bold text-3xl text-foreground mb-2">Merchant Portal</h1>
              <p className="text-muted-foreground font-body">Sign in to manage your business</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start space-x-3">
                <Icon name="ExclamationCircleIcon" size={20} variant="solid" className="text-error flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error font-body">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <div>
                <label htmlFor="email" className="block text-sm font-headline font-semibold text-foreground mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="merchant-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 font-body"
                  placeholder="business@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-headline font-semibold text-foreground mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="merchant-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 font-body"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg font-headline font-semibold hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground font-body">
                New merchant?{' '}
                <Link href="/merchant/onboarding" className="text-secondary font-semibold hover:underline">
                  Apply now
                </Link>
              </p>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground font-body mb-2 font-semibold">
                Demo Merchant Credentials (click to autofill):
              </p>
              <div className="space-y-2">
                {DEMO_MERCHANTS.map((merchant) => (
                  <button
                    key={merchant.email}
                    type="button"
                    onClick={() => {
                      setEmail(merchant.email);
                      setPassword(DEMO_PASSWORD);
                      setError('');
                    }}
                    className="w-full text-left rounded-md border border-border bg-background px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <p className="text-xs font-headline font-semibold text-foreground">{merchant.label}</p>
                    <p className="text-[11px] text-muted-foreground font-body">{merchant.email}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-foreground font-body mt-2">Password: {DEMO_PASSWORD}</p>
              {!allowDemoSeed && (
                <p className="text-[11px] text-warning font-body mt-1">
                  Demo seeding endpoint is currently disabled by env flags.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
