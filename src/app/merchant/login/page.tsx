'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';
import { createClient } from '@/lib/supabase/client';

export default function MerchantLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, role, signIn } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const allowDemoSeed = String(process.env.NEXT_PUBLIC_ENABLE_DEMO_MERCHANT_SEED ?? '').toLowerCase() === 'true';

  useEffect(() => {
    if (!user) return;
    const resolvedRole = String(role ?? user.user_metadata?.role ?? '').toLowerCase();
    if (resolvedRole === 'merchant') {
      router.replace(Boolean(user.user_metadata?.must_change_password) ? '/merchant/change-password' : '/merchant/dashboard');
    } else if (resolvedRole) {
      router.replace('/shop');
    }
  }, [user, role, router]);

  useEffect(() => {
    if (!allowDemoSeed) return;
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
  }, [allowDemoSeed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      const {
        data: { user: signedInUser },
      } = await supabase.auth.getUser();
      const mustChangePassword = Boolean(signedInUser?.user_metadata?.must_change_password);
      router.push(mustChangePassword ? '/merchant/change-password' : '/merchant/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-primary/5">
      <Header />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-headline font-semibold text-foreground mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            {allowDemoSeed && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground font-body mb-2 font-semibold">Demo Chain Merchant Credentials:</p>
                <p className="text-xs text-foreground font-body">Shoprite: demo-shoprite@evoucher.co.za</p>
                <p className="text-xs text-foreground font-body">Pick n Pay: demo-picknpay@evoucher.co.za</p>
                <p className="text-xs text-foreground font-body mt-1">Password: demo123</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
