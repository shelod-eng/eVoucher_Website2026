'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  return null;
}

export default function PortalResetPasswordPage() {
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
    if (user && role === 'admin') {
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
      if (metadataRole && metadataRole !== 'admin') {
        setStatus('This password reset screen is reserved for admin portal accounts.');
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

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

      router.replace('/portal/bankserv');
    } catch (error: any) {
      setStatus(error?.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300/80">
          Admin Recovery
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Reset your admin password</h1>
        <p className="mt-2 text-sm text-slate-300">
          Use the recovery link from your email, then set a new password for the admin portal.
        </p>

        {status && (
          <div className="mt-4 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
            {status}
          </div>
        )}

        {!ready ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/30 px-4 py-5 text-sm text-slate-300">
            Open the password recovery email first. Once the recovery session is active, this page
            will let you set a new password.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder="Use upper/lowercase and a number"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
            >
              {submitting ? 'Updating password…' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-xs text-slate-400">
          Return to login:{' '}
          <Link href="/portal/login" className="text-emerald-300 hover:text-emerald-200">
            Admin sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
