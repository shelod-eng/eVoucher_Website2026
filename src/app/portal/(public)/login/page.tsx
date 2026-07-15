'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

const ADMIN_PORTAL_ROLES = new Set(['admin']);
const INFRASTRUCTURE_ROLES = new Set([
  'admin',
  'finance_approver',
  'auditor',
  'sponsor',
  'merchant',
]);

function normalizeRole(role: unknown) {
  return String(role ?? '')
    .toLowerCase()
    .trim();
}

function PortalLoginForm() {
  const { user, role, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const requestedNext = searchParams.get('next') ?? '';
  const returnTo =
    requestedNext.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/portal/bankserv';
  const isInfrastructureLogin = returnTo === '/infrastructure';

  useEffect(() => {
    const allowedRoles = isInfrastructureLogin ? INFRASTRUCTURE_ROLES : ADMIN_PORTAL_ROLES;
    if (user && role && allowedRoles.has(role)) {
      router.replace(returnTo);
    }
  }, [isInfrastructureLogin, user, role, router, returnTo]);

  const resolveSignedInRole = async (userId: string, metadataRole: unknown) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data?.role) {
        return normalizeRole(data.role);
      }
    } catch {
      // Metadata fallback below keeps login available if profile lookup is transiently unavailable.
    }

    return normalizeRole(metadataRole);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const loggedInUser = await signIn(email, password);
      if (!loggedInUser?.id) {
        setStatus('Login succeeded, but the session was not returned. Please try again.');
        return;
      }

      const resolvedRole = await resolveSignedInRole(
        loggedInUser.id,
        loggedInUser.user_metadata?.role
      );
      const allowedRoles = isInfrastructureLogin ? INFRASTRUCTURE_ROLES : ADMIN_PORTAL_ROLES;
      if (!allowedRoles.has(resolvedRole)) {
        setStatus(
          isInfrastructureLogin
            ? 'This account is not authorized for the infrastructure dashboard.'
            : 'This account is not authorized for the business portal.'
        );
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setStatus('Login succeeded, but the browser session is still initializing. Try once more.');
        return;
      }

      router.refresh();
      router.replace(returnTo);
    } catch (error: any) {
      setStatus(error?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = String(email ?? '')
      .trim()
      .toLowerCase();
    if (!normalizedEmail) {
      setStatus('Enter your admin email address first, then request a reset link.');
      return;
    }

    setResetLoading(true);
    setStatus(null);
    try {
      const redirectTo =
        typeof window === 'undefined'
          ? undefined
          : `${window.location.origin}/portal/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
      });
      if (error) throw error;
      setStatus('Password reset link sent. Check your email and open the recovery link.');
    } catch (error: any) {
      setStatus(error?.message || 'Failed to send password reset link.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80 font-semibold">
          {isInfrastructureLogin ? 'Infrastructure Dashboard' : 'Business Portal'}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Sign in to manage eVoucher</h1>
        <p className="mt-2 text-sm text-slate-300">
          Admin access only. Use the approved eVoucher admin credentials for this workspace.
        </p>

        {status && (
          <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {status}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="admin@evoucher.co.za"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void handleForgotPassword()}
          disabled={resetLoading}
          className="mt-4 w-full rounded-lg border border-sky-400/25 bg-[#102647] px-4 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-300/40 hover:text-white disabled:opacity-60"
        >
          {resetLoading ? 'Sending reset link…' : 'Forgot Password'}
        </button>

        <div className="mt-6 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-xs text-sky-100">
          <p className="font-semibold">Team sign-in</p>
          <p className="mt-1">
            Email: <span className="font-mono">admin@evoucher.co.za</span>
          </p>
          <p className="mt-1 text-sky-100/80">
            Use the current admin password shared through your secure team channel.
          </p>
        </div>

        <div className="mt-4 text-xs text-slate-400">
          Need the infrastructure dashboard?{' '}
          <Link href="/infrastructure" className="text-sky-300 hover:text-sky-200">
            Open dashboard
          </Link>
        </div>

        <div className="mt-3 text-xs text-slate-400">
          Need a merchant login?{' '}
          <Link href="/merchant/login" className="text-emerald-300 hover:text-emerald-200">
            Go to merchant portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={null}>
      <PortalLoginForm />
    </Suspense>
  );
}
