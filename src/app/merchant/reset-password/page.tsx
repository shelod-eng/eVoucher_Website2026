'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  return null;
}

export default function MerchantResetPasswordPage() {
  const router = useRouter();
  const { user, role, loading, signIn } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const {
          data: { user: latestUser },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        setReady(Boolean(latestUser));
      } catch {
        if (!cancelled) setReady(Boolean(user));
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      const {
        data: { user: latestUser },
      } = await supabase.auth.getUser();
      if (!cancelled) {
        setReady(Boolean(latestUser));
      }
    });

    void bootstrap();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, user]);

  useEffect(() => {
    if (loading) return;
    if (user && role === 'merchant') {
      setReady(true);
    }
  }, [loading, user, role]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);

    const validationError = validatePassword(password);
    if (validationError) {
      setStatus(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user: latestUser },
      } = await supabase.auth.getUser();
      if (!latestUser) {
        setStatus('Open the password recovery link from your email, then try again.');
        setSubmitting(false);
        return;
      }

      const metadataRole = String(latestUser.user_metadata?.role ?? role ?? '').toLowerCase();
      if (metadataRole && metadataRole !== 'merchant') {
        setStatus('This password reset screen is reserved for merchant accounts.');
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/v1/merchant/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json().catch(() => ({}) as any);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update password.');
      }

      const email = String(latestUser.email ?? '')
        .trim()
        .toLowerCase();
      if (email) {
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // no-op
        }
        await signIn(email, password);
      }

      router.replace('/merchant/dashboard');
    } catch (error: any) {
      setStatus(error?.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.16),_transparent_50%),#f4fbfa]">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="mb-5 rounded-2xl border border-teal-300/40 bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-5 text-white shadow-xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-teal-100 font-headline">
              eVoucher Merchant Recovery
            </p>
            <h1 className="mt-2 font-headline font-bold text-2xl">Reset your merchant password</h1>
            <p className="mt-1 text-sm text-teal-100">
              Open the recovery link from your email, then set a new password.
            </p>
          </div>
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl shadow-lg p-8">
            {status && (
              <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 p-3 flex items-start gap-2">
                <Icon name="InformationCircleIcon" size={18} variant="solid" className="text-primary mt-0.5" />
                <p className="text-sm text-foreground font-body">{status}</p>
              </div>
            )}

            {!ready ? (
              <div className="rounded-xl border border-border bg-background px-4 py-5 text-sm text-muted-foreground">
                Open the password recovery email first. Once the recovery session is active, this page
                will let you set a new password.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                    placeholder="Use 8+ chars with upper/lowercase and number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                    placeholder="Re-enter password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg font-headline font-semibold hover:bg-secondary/90 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Updating password...' : 'Update Password'}
                </button>
              </form>
            )}

            <div className="mt-6 text-xs text-muted-foreground">
              Return to login:{' '}
              <Link href="/merchant/login" className="text-secondary hover:underline">
                Merchant sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
