'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ForgotPasswordModal from '@/app/components/ForgotPasswordModal';

/* ── Floating particle data ── */
const PARTICLES = [
  { emoji: '💳', x: 8, y: 15, delay: 0, size: 28 },
  { emoji: '🛒', x: 85, y: 10, delay: 0.8, size: 24 },
  { emoji: '💰', x: 12, y: 70, delay: 1.4, size: 32 },
  { emoji: '🎁', x: 80, y: 65, delay: 0.4, size: 26 },
  { emoji: '✅', x: 50, y: 8, delay: 1.8, size: 22 },
  { emoji: '🏷️', x: 92, y: 40, delay: 1.1, size: 20 },
  { emoji: '💚', x: 5, y: 45, delay: 2.2, size: 18 },
  { emoji: '⚡', x: 70, y: 85, delay: 0.6, size: 22 },
  { emoji: '🔒', x: 25, y: 88, delay: 1.6, size: 20 },
  { emoji: '📱', x: 60, y: 20, delay: 2.5, size: 24 },
];

const LIVE_DEALS = [
  { merchant: 'Pick n Pay', saved: 'R50', color: '#e31837' },
  { merchant: 'Shoprite', saved: 'R25', color: '#e31837' },
  { merchant: 'Checkers', saved: 'R31', color: '#e31837' },
  { merchant: 'Woolworths', saved: 'R74', color: '#00a651' },
  { merchant: 'Clicks', saved: 'R18', color: '#0066cc' },
  { merchant: 'Dis-Chem', saved: 'R22', color: '#e31837' },
];

const MERCHANT_LOGOS = [
  { name: 'Pick n Pay', src: '/assets/images/merchants/picknpay.png' },
  { name: 'Shoprite', src: '/assets/images/merchants/shoprite.png' },
  { name: 'Checkers', src: '/assets/images/merchants/checkers.png' },
  { name: 'Clicks', src: '/assets/images/merchants/clicks.png' },
  { name: 'Woolworths', src: '/assets/images/merchants/woolworths.png' },
  { name: 'Dis-Chem', src: '/assets/images/merchants/dischem.png' },
];

const BRAND_LOGO = '/assets/images/branding/evoucher-logo-app.png';
const LOGIN_BG = 'bg-slate-50';
const LOGIN_PANEL =
  'rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]';

async function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(msg)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function LiveDealTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % LIVE_DEALS.length);
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const deal = LIVE_DEALS[idx];
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
      style={{ transition: 'opacity 0.3s', opacity: visible ? 1 : 0 }}
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
      <span className="font-headline text-xs font-semibold text-white">{deal.merchant}</span>
      <span className="font-headline text-xs font-bold text-emerald-300">{deal.saved} saved</span>
    </div>
  );
}

function MerchantLogo({ name, src }: { name: string; src: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-10 min-w-[72px] items-center justify-center rounded-2xl border border-white/20 bg-white/90 p-2 shadow-sm">
      {!failed ? (
        <img
          src={src}
          alt={name}
          className="h-8 w-full object-contain"
          onError={(e) => {
            setFailed(true);
            e.currentTarget.src = '/assets/images/merchants/placeholder-merchant.svg';
          }}
        />
      ) : (
        <span className="font-headline text-[10px] font-bold text-slate-500">{name}</span>
      )}
    </div>
  );
}

function MerchantLogoStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {MERCHANT_LOGOS.map((m) => (
        <MerchantLogo key={m.name} name={m.name} src={m.src} />
      ))}
    </div>
  );
}

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const router = useRouter();
  const { signIn, signOut } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const em = email.trim().toLowerCase();
      const pw = password.trim();
      if (!em || !pw) {
        setError('Email and password are required.');
        setLoading(false);
        return;
      }
      await withTimeout(signIn(em, pw), 60000, 'Sign in timed out. Please try again.');
      router.push('/customer/dashboard');
    } catch (err: any) {
      const msg = String(err?.message || 'Invalid email or password.');
      if (msg.toLowerCase().includes('timed out')) {
        try {
          await signOut();
        } catch (_) {
          // ignore sign-out error after timeout
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${LOGIN_BG} min-h-screen py-12`}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1300px] flex-col gap-10 px-4 lg:flex-row lg:items-stretch lg:gap-8 lg:px-6">
        <section className="order-1 flex w-full flex-1 flex-col justify-center lg:order-2 lg:max-w-[560px]">
          <div className={`${LOGIN_PANEL} p-8 lg:p-10`}>
            <div className="mb-6 flex items-center gap-3">
              <img src={BRAND_LOGO} alt="eVoucher" className="h-10 w-auto" />
              <span className="text-sm font-semibold text-slate-500">eVoucher</span>
            </div>
            <div className="mb-8">
              <p className="font-headline text-sm uppercase tracking-[0.3em] text-teal-600">
                Smart Savings for South Africa
              </p>
              <h1 className="mt-4 font-headline text-3xl font-bold text-slate-900 sm:text-4xl">
                Welcome back
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                Sign in to your eVoucher account to access your vouchers, wallet and savings.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email or Phone
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-sm font-semibold text-teal-600 hover:text-teal-500"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-slate-200" />
              <span>or continue with</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50">
                Google
              </button>
              <button className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50">
                Apple
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              New to eVoucher?{' '}
              <Link
                href="/consumer-experience"
                className="font-semibold text-teal-600 hover:text-teal-500"
              >
                Register
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            🔒 SSL/TLS enforced · POPIA compliant · Powered by eVoucher Platform
          </p>
        </section>

        <section className="order-2 flex w-full flex-1 flex-col justify-between rounded-[2rem] bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-800 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:order-1 lg:max-w-[560px] lg:p-10">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <img
                src={BRAND_LOGO}
                alt="eVoucher"
                className="h-10 w-auto rounded-xl bg-white/10 p-2"
              />
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">
                eVoucher
              </span>
            </div>
            <h2 className="font-headline text-3xl font-bold leading-tight text-white">
              Smart Savings for South African Consumers
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/80">
              Sign in to access your vouchers, wallet and savings with trusted national merchants.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Trusted by</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {MERCHANT_LOGOS.map((m) => (
                  <img
                    key={m.name}
                    src={m.src}
                    alt={m.name}
                    className="h-10 w-full rounded-2xl bg-white/10 object-contain p-2"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/images/merchants/placeholder-merchant.svg';
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 text-sm text-white/80">
              <p className="font-semibold text-white">Secure merchant access</p>
              <p className="mt-2 leading-6 text-white/75">
                Your login is protected and ready for the FNB & DTI demo.
              </p>
            </div>
          </div>
        </section>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        userType="consumer"
      />
    </div>
  );
}
