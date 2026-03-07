'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  return null;
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
  return payload as { isMerchant: boolean; mustResetPassword: boolean };
}

async function waitForResetClear(maxAttempts = 10, delayMs = 350) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const state = await fetchMerchantAuthState();
      if (state.isMerchant && !state.mustResetPassword) return true;
    } catch {
      // Ignore transient state-read failures and retry.
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

export default function MerchantChangePasswordPage() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();
  const supabase = createClient();
  useEffect(() => {
    if (typeof user === 'undefined') {
      setError('Authentication context failed to load. Please refresh or contact support.');
    }
  }, [user]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/merchant/login');
      return;
    }
    let cancelled = false;
    const resolveResetState = async () => {
      try {
        const state = await fetchMerchantAuthState();
        if (cancelled) return;
        if (!state.isMerchant) {
          router.replace('/shop');
          return;
        }
        if (!state.mustResetPassword) {
          router.replace('/merchant/dashboard');
        }
      } catch {
        const mustChange = Boolean(user.user_metadata?.must_change_password);
        if (!mustChange) {
          router.replace('/merchant/dashboard');
        }
      }
    };
    void resolveResetState();
    return () => {
      cancelled = true;
    };
  }, [loading, user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!user || typeof user.id === 'undefined') {
      setError('User context is missing. Please log in again.');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    try {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        const resetResponse = await fetch('/api/v1/merchant/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ password }),
        });
        clearTimeout(timeoutId);
        if (!resetResponse.ok) {
          const payload = await resetResponse.json().catch(() => ({} as any));
          const message = payload?.error || 'Failed to update password.';
          setError(message);
          console.error('[MerchantChangePassword][server-change-password][error]', message);
          setSubmitting(false);
          return;
        }
      } catch (changePasswordError: any) {
        if (changePasswordError?.name === 'AbortError') {
          setError('Password update is taking longer than expected. Please try once more.');
          setSubmitting(false);
          return;
        }
        const message = changePasswordError?.message || 'Failed to update password.';
        setError(message);
        console.error('[MerchantChangePassword][server-change-password][error]', message);
        setSubmitting(false);
        return;
      }

      setSuccess('Password updated successfully. Redirecting to dashboard...');
      // Force fresh session/user metadata to avoid stale must_change_password loops.
      const email = String(user?.email ?? '').trim().toLowerCase();
      if (email) {
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // no-op
        }
        await signIn(email, password);
      }

      const resetCleared = await waitForResetClear(12, 300);
      if (!resetCleared) {
        setError('Password updated but session sync is delayed. Please sign in once with your new password.');
        setSubmitting(false);
        router.replace('/merchant/login');
        return;
      }
      router.replace('/merchant/dashboard');
    } catch (submitError: any) {
      const message = String(submitError?.message || 'Failed to update password.');
      setError(message);
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
            <p className="text-[11px] uppercase tracking-[0.22em] text-teal-100 font-headline">eVoucher Security</p>
            <h1 className="mt-2 font-headline font-bold text-2xl">Set your permanent password</h1>
            <p className="mt-1 text-sm text-teal-100">One-time step before entering the merchant portal.</p>
          </div>
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <h1 className="font-headline text-2xl font-bold text-foreground">Set a New Password</h1>
            <p className="mt-2 text-sm text-muted-foreground font-body">
              For security, your temporary password must be changed before using the merchant dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2">
              <Icon name="ExclamationCircleIcon" size={18} variant="solid" className="text-error mt-0.5" />
              <p className="text-sm text-error font-body">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 flex items-start gap-2">
              <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success mt-0.5" />
              <p className="text-sm text-success font-body">{success}</p>
            </div>
          )}

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
          </div>
        </div>
      </main>
    </div>
  );
}
