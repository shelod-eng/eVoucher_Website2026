'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface ConsumerLoginCardProps {
  redirectTo?: string;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export default function ConsumerLoginCard({
  redirectTo = '/customer/dashboard',
}: ConsumerLoginCardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn, signOut } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = String(email ?? '')
        .trim()
        .toLowerCase();
      const normalizedPassword = String(password ?? '').trim();
      if (!normalizedEmail || !normalizedPassword) {
        setError('Email and password are required.');
        setLoading(false);
        return;
      }
      await withTimeout(
        signIn(normalizedEmail, normalizedPassword),
        60000,
        'Sign in timed out. Please try again.'
      );
      router.push(redirectTo);
    } catch (signInError: any) {
      const message = String(signInError?.message || 'Invalid email or password.');
      if (message.toLowerCase().includes('timed out')) {
        try {
          await signOut();
        } catch {
          // Best effort local session clear on timeout.
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card rounded-[28px] shadow-2xl border border-border/70 p-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="font-headline font-bold text-primary text-2xl">eV</span>
        </div>
        <h1 className="font-headline font-bold text-5xl text-primary mb-2">eVoucher</h1>
        <p className="text-lg text-foreground font-body">
          Smart Savings for South African Consumers
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-lg border border-error/20 bg-error/10 text-error text-sm font-body">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
        <div>
          <label
            htmlFor="consumer-email"
            className="block text-base font-headline font-semibold text-foreground mb-2"
          >
            Email or Phone
          </label>
          <div className="relative">
            <Icon
              name="EnvelopeIcon"
              size={18}
              variant="solid"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="consumer-email"
              name="consumer-email"
              type="text"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-border rounded-2xl bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="consumer-password"
            className="block text-base font-headline font-semibold text-foreground mb-2"
          >
            Password
          </label>
          <div className="relative">
            <Icon
              name="LockClosedIcon"
              size={18}
              variant="solid"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="consumer-password"
              name="consumer-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-border rounded-2xl bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="text-right">
          <Link
            href="/support"
            className="text-primary text-sm font-headline font-semibold hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-headline font-bold text-xl hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="flex items-center gap-3 mt-6 mb-4">
        <div className="h-px bg-border flex-1" />
        <span className="text-muted-foreground text-sm font-body">or continue with</span>
        <div className="h-px bg-border flex-1" />
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <button
          type="button"
          className="w-14 h-14 rounded-2xl border border-border bg-muted/40 flex items-center justify-center"
        >
          <Icon name="DevicePhoneMobileIcon" size={22} variant="outline" />
        </button>
        <button
          type="button"
          className="w-14 h-14 rounded-2xl border border-border bg-muted/40 flex items-center justify-center"
        >
          <Icon name="FingerPrintIcon" size={22} variant="outline" />
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground font-body">
        Don&apos;t have an account?{' '}
        <Link
          href="/consumer-experience"
          className="text-primary font-headline font-semibold hover:underline"
        >
          Register Now
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground font-body mt-2">
        Merchant account?{' '}
        <Link
          href="/merchant/login"
          className="text-secondary font-headline font-semibold hover:underline"
        >
          Sign in here
        </Link>
      </p>

      <div className="text-center mt-5">
        <p className="text-sm text-foreground font-headline font-semibold">SSL/TLS enforced</p>
        <p className="text-xs text-muted-foreground font-body">Powered by eVoucher Platform</p>
      </div>
    </div>
  );
}
