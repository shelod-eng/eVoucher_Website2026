'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  return null;
}

export default function MerchantChangePasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { user, loading } = useAuth();
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
    const mustChange = Boolean(user.user_metadata?.must_change_password);
    if (!mustChange) {
      router.replace('/merchant/dashboard');
    }
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

    setSubmitting(true);
    try {
      const currentMetadata = user?.user_metadata ?? {};
      const updateResult = await withTimeout(
        supabase.auth.updateUser({
          password,
          data: {
            ...currentMetadata,
            must_change_password: false,
          },
        }),
        15000,
        'Password update timed out. Please try again.'
      );
      // Type guard for updateResult
      let updateError;
      if (typeof updateResult === 'object' && updateResult !== null && 'error' in updateResult) {
        updateError = (updateResult as any).error;
      }
      if (updateError) throw updateError;

      const resetResponse = await withTimeout(
        fetch('/api/v1/merchant/onboarding/complete-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
        15000,
        'Password reset sync timed out. Please try again.'
      );
      if (!resetResponse.ok) {
        const payload = await resetResponse.json().catch(() => ({} as any));
        throw new Error(payload?.error || 'Failed to finalize password reset.');
      }

      // Ensure client auth/session state is refreshed before navigation checks run.
      await supabase.auth.refreshSession();
      await supabase.auth.getUser();

      setSuccess('Password updated successfully. Redirecting to dashboard...');
      setTimeout(() => router.replace('/merchant/dashboard'), 900);
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-primary/5">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-lg p-8">
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
      </main>
    </div>
  );
}
