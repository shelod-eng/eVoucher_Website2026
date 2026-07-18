'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const SAVINGS_CARDS = [
  {
    merchant: 'Pick n Pay',
    logo: '/assets/images/merchants/picknpay.png',
    pct: '2.5%',
    category: 'Groceries',
    color: 'from-red-50 to-red-100/50',
    accent: '#e31837',
  },
  {
    merchant: 'Shoprite',
    logo: '/assets/images/merchants/shoprite.png',
    pct: '2.5%',
    category: 'Groceries',
    color: 'from-red-50 to-orange-50',
    accent: '#e31837',
  },
  {
    merchant: 'Checkers',
    logo: '/assets/images/merchants/checkers.png',
    pct: '2.5%',
    category: 'Fresh Produce',
    color: 'from-red-50 to-red-100/50',
    accent: '#e31837',
  },
  {
    merchant: 'Clicks',
    logo: '/assets/images/merchants/clicks.png',
    pct: '2.5%',
    category: 'Pharmacy',
    color: 'from-blue-50 to-blue-100/50',
    accent: '#0066cc',
  },
  {
    merchant: 'Woolworths',
    logo: '/assets/images/merchants/woolworths.png',
    pct: '2.5%',
    category: 'Premium',
    color: 'from-green-50 to-emerald-100/50',
    accent: '#00a651',
  },
  {
    merchant: 'Dis-Chem',
    logo: '/assets/images/merchants/dischem.png',
    pct: '2.5%',
    category: 'Health',
    color: 'from-red-50 to-pink-50',
    accent: '#e31837',
  },
];

function useCountUp(target: number, duration = 1400, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const steps = 60;
    const inc = target / steps;
    const interval = duration / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) {
        setCount(target);
        clearInterval(t);
      } else setCount(Math.floor(cur));
    }, interval);
    return () => clearInterval(t);
  }, [target, duration, start]);
  return count;
}

function SavingsCard({ merchant, logo, pct, category, color, accent }: (typeof SAVINGS_CARDS)[0]) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`group flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br ${color} border border-slate-100 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
        {!failed ? (
          <img
            src={logo}
            alt={merchant}
            className="h-10 w-full object-contain"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="font-headline text-lg font-bold" style={{ color: accent }}>
            {merchant[0]}
          </span>
        )}
      </div>
      <div className="text-center">
        <p className="font-headline text-sm font-bold text-slate-800">{merchant}</p>
        <p className="text-[11px] text-slate-500">{category}</p>
      </div>
      <div className="rounded-xl px-3 py-1" style={{ backgroundColor: `${accent}15` }}>
        <p className="font-headline text-lg font-bold" style={{ color: accent }}>
          Save {pct}
        </p>
      </div>
    </div>
  );
}

export default function BigSavingsBanner() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const savedCount = useCountUp(2500000, 1600, visible);
  const merchantCount = useCountUp(16, 800, visible);
  const shopperCount = useCountUp(50000, 1200, visible);

  return (
    <section ref={ref} aria-label="Save up to 15%" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
        {/* ── Section header ── */}
        <div className="mb-4 text-center">
          <span className="inline-block rounded-full bg-secondary/10 px-4 py-1.5 font-headline text-xs font-bold text-secondary">
            🎉 This Week Only
          </span>
        </div>
        <div className="mb-6 text-center">
          <h2 className="font-headline text-5xl font-bold leading-tight text-foreground lg:text-6xl">
            Save up to{' '}
            <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
              15%
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Shop at South Africa&apos;s biggest retailers and save instantly with your eVoucher
            wallet. No loyalty card. No hassle.
          </p>
        </div>

        {/* ── Animated KPI strip ── */}
        <div className="mb-12 flex flex-wrap justify-center gap-8">
          {[
            {
              label: 'Community Savings',
              value: `R${(savedCount / 1000000).toFixed(2)}M`,
              icon: '💰',
            },
            { label: 'Trusted Merchants', value: `${merchantCount}+`, icon: '🏪' },
            { label: 'Happy Shoppers', value: `${(shopperCount / 1000).toFixed(0)}K+`, icon: '😊' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="text-3xl">{s.icon}</span>
              <div>
                <p className="font-headline text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Savings cards grid ── */}
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {SAVINGS_CARDS.map((card) => (
            <SavingsCard key={card.merchant} {...card} />
          ))}
        </div>

        {/* ── Gradient highlight CTA ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#0891b2] px-8 py-10 text-center shadow-2xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-12 left-1/4 h-48 w-48 rounded-full bg-white/5" />
          <div className="relative">
            <p className="mb-2 font-headline text-sm font-semibold uppercase tracking-widest text-white/60">
              Ready to start saving?
            </p>
            <h3 className="mb-6 font-headline text-3xl font-bold text-white lg:text-4xl">
              Claim Your Savings Today
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => router.push('/shop')}
                className="rounded-xl bg-white px-8 py-3.5 font-headline text-sm font-bold text-primary shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                Start Shopping →
              </button>
              <button
                onClick={() => router.push('/merchant-partnership')}
                className="rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 font-headline text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Become a Merchant
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
