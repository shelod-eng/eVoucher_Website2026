'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function PortalLoginPage() {
  const { user, role, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && role === 'admin') {
      router.replace('/portal');
    }
  }, [user, role, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const loggedInUser = await signIn(email, password);
      const resolvedRole = String(loggedInUser?.user_metadata?.role ?? role ?? '').toLowerCase();
      if (resolvedRole !== 'admin') {
        setStatus('This account is not authorized for the business portal.');
        return;
      }
      router.replace('/portal');
    } catch (error: any) {
      setStatus(error?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80 font-semibold">
          Business Portal
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Sign in to manage eVoucher</h1>
        <p className="mt-2 text-sm text-slate-300">
          Admin access only. Use your approved credentials.
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

        <div className="mt-6 text-xs text-slate-400">
          Need a merchant login?{' '}
          <Link href="/merchant/login" className="text-emerald-300 hover:text-emerald-200">
            Go to merchant portal
          </Link>
        </div>
      </div>
    </div>
  );
}
