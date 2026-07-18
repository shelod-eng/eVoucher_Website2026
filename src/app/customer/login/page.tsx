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

async function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(msg)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
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
      <span className="font-headline text-xs font-semibold text-white">
        {deal.merchant}
      </span>
      <span className="font-headline text-xs font-bold text-emerald-300">
        {deal.saved} saved
      </span>
    </div>
  );
}

function MerchantLogoStrip() {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {MERCHANT_LOGOS.map((m) => {
        const [failed, setFailed] = useState(false);
        return (
          <div
            key={m.name}
            className="flex h-9 w-16 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm"
          >
            {!failed ? (
              <img
                src={m.src}
                alt={m.name}
                className="h-6 w-full object-contain brightness-0 invert opacity-70"
                onError={() => setFailed(true)}
              />
            ) : (
              <span className="font-headline text-[9px] font-bold text-white/60">{m.name[0]}</span>
            )}
          </div>
        );
      })}
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
      if (!em || !pw) { setError('Email and password are required.'); setLoading(false); return; }
      await withTimeout(signIn(em, pw), 60000, 'Sign in timed out. Please try again.');
      router.push('/customer/dashboard');
    } catch (err: any) {
      const msg = String(err?.message || 'Invalid email or password.');
      if (msg.toLowerCase().includes('timed out')) { try { await signOut(); } catch {} }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#042f2e] via-[#064e3b] to-[#0c4a6e]">
      {/* ── Blurred glow orbs ── */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-40 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

      {/* ── Dot grid ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Floating emoji particles ── */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="pointer-events-none absolute select-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            opacity: 0.18,
            animation: `float ${3 + (i % 3)}s ease-in-out ${p.delay}s infinite`,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* ── Main layout ── */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Top brand */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <span>🇿🇦</span>
            <span>South Africa&apos;s Smart Savings Platform</span>
          </div>
          <h1 className="font-headline text-4xl font-bold text-white lg:text-5xl">
            Smart Savings
          </h1>
          <p className="mt-1 font-headline text-lg font-medium text-white/70">
            for South Africa
          </p>
          <div className="mt-4 flex justify-center">
            <LiveDealTicker />
          </div>
        </div>

        {/* ── Login card ── */}
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-8 shadow-2xl backdrop-blur-xl">
            {/* Card header */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <span className="font-headline text-2xl font-bold text-white">eV</span>
              </div>
              <h2 className="font-headline text-2xl font-bold text-white">Welcome back</h2>
              <p className="mt-1 text-sm text-white/60">Sign in to your eVoucher account</p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="mb-1.5 block font-headline text-sm font-semibold text-white/80">
                  Email or Phone
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 font-body text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-headline text-sm font-semibold text-white/80">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 pr-12 font-body text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
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
                  className="font-headline text-sm font-semibold text-teal-300 hover:text-teal-200"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 py-4 font-headline text-base font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing In...
                  </span>
                ) : (
                  'Sign In →'
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/40">or continue with</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="flex justify-center gap-3">
              <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg backdrop-blur-sm transition-all hover:bg-white/20">
                📱
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg backdrop-blur-sm transition-all hover:bg-white/20">
                🔑
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-white/50">
              No account?{' '}
              <Link href="/consumer-experience" className="font-headline font-semibold text-teal-300 hover:text-teal-200">
                Register Free
              </Link>
              {' · '}
              <Link href="/merchant/login" className="font-headline font-semibold text-orange-300 hover:text-orange-200">
                Merchant Login
              </Link>
            </p>
          </div>
        </div>

        {/* ── Merchant logos strip ── */}
        <div className="mt-8 w-full max-w-md">
          <p className="mb-3 text-center font-headline text-xs font-semibold uppercase tracking-widest text-white/30">
            Accepted at
          </p>
          <MerchantLogoStrip />
        </div>

        {/* ── Trust footer ── */}
        <p className="mt-6 text-center text-xs text-white/25">
          🔒 SSL/TLS enforced · POPIA compliant · Powered by eVoucher Platform
        </p>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        userType="consumer"
      />
    </div>
  );
}
