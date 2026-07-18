'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface HeroSectionProps {
  className?: string;
  onOpenMerchantModal?: () => void;
  onOpenCustomerModal?: () => void;
  onOpenForgotModal?: () => void;
}

const TICKER_ITEMS = [
  '🛒 Shoprite — Save 2.5% instantly',
  '💊 Clicks — Healthcare savings',
  '🥊 Boxer — Grocery deals',
  '👗 Pep — Fashion vouchers',
  '⛽ Engen — Fuel savings',
  '🛍️ Pick n Pay — Weekly specials',
  '💚 Woolworths — Premium savings',
  '💊 Dis-Chem — Pharmacy deals',
  '🎮 Game — Electronics vouchers',
  '👔 Mr Price — Clothing savings',
  '🧺 uSave — Budget groceries',
  '✅ Checkers — Fresh produce deals',
];

const STATS = [
  { value: 16, suffix: '+', label: 'Trusted Merchants' },
  { value: 2500000, prefix: 'R', suffix: '+', label: 'Saved by Shoppers', compact: true },
  { value: 2.5, suffix: '%', label: 'Instant Saving', decimal: true },
  { value: 9, suffix: '', label: 'Provinces Covered' },
];

const CATEGORIES = [
  { label: 'Groceries', icon: 'ShoppingCartIcon' },
  { label: 'Pharmacy', icon: 'BeakerIcon' },
  { label: 'Fashion', icon: 'ShoppingBagIcon' },
  { label: 'Fuel', icon: 'TruckIcon' },
  { label: 'Airtime & Data', icon: 'DevicePhoneMobileIcon' },
  { label: 'Home & Living', icon: 'HomeIcon' },
];

function useCountUp(target: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const steps = 50;
    const increment = target / steps;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration, start]);
  return count;
}

function StatItem({ stat, animate }: { stat: (typeof STATS)[0]; animate: boolean }) {
  const raw = useCountUp(stat.decimal ? stat.value * 10 : stat.value, 1400, animate);
  const display = stat.compact
    ? raw >= 1000000
      ? `${(raw / 1000000).toFixed(1)}M`
      : raw >= 1000
        ? `${(raw / 1000).toFixed(0)}K`
        : raw.toString()
    : stat.decimal
      ? (raw / 10).toFixed(1)
      : raw.toLocaleString();

  return (
    <div className="text-center">
      <p className="font-headline text-2xl font-bold text-white lg:text-3xl">
        {stat.prefix ?? ''}
        {display}
        {stat.suffix}
      </p>
      <p className="mt-0.5 text-xs text-white/60">{stat.label}</p>
    </div>
  );
}

function useLiveCounter(base: number) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const t = setInterval(() => setVal((v) => v + Math.floor(Math.random() * 3)), 2800);
    return () => clearInterval(t);
  }, []);
  return val;
}

/* ── Right panel: clean lifestyle image + subtle floating KPI badges only ── */
function HeroRightPanel({ visible }: { visible: boolean }) {
  const totalSaved = useLiveCounter(2500000);

  return (
    <div
      className={`hidden lg:block transition-all duration-1000 delay-200 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      <div className="relative">
        {/* Glow behind image */}
        <div className="pointer-events-none absolute inset-0 scale-110 rounded-full bg-white/10 blur-3xl" />

        {/* Hero image — full, unobscured */}
        <div className="animate-float relative">
          <img
            src="/assets/images/branding/evoucher-3d-hero.png"
            alt="South African family saving with eVoucher"
            className="relative z-10 h-auto w-[420px] max-w-full drop-shadow-2xl"
            loading="eager"
          />
        </div>

        {/* Floating badge — Instant Saving */}
        <div
          className="absolute -right-4 top-8 z-20 animate-float rounded-2xl border border-white/20 bg-white px-4 py-3 shadow-2xl"
          style={{ animationDelay: '0.5s' }}
        >
          <p className="font-headline text-[10px] font-semibold text-muted-foreground">
            Instant Saving
          </p>
          <p className="font-headline text-2xl font-bold text-success">2.5%</p>
          <p className="text-[9px] text-muted-foreground">on every purchase</p>
        </div>

        {/* Floating badge — Community Saved */}
        <div
          className="absolute -left-6 bottom-24 z-20 animate-float rounded-2xl border border-white/20 bg-white px-4 py-3 shadow-2xl"
          style={{ animationDelay: '1s' }}
        >
          <p className="font-headline text-[10px] font-semibold text-muted-foreground">
            Community Saved
          </p>
          <p className="font-headline text-2xl font-bold text-primary">
            R{(totalSaved / 1000000).toFixed(2)}M
          </p>
          <p className="text-[9px] text-muted-foreground">and counting</p>
        </div>

        {/* Floating badge — Trusted Merchants */}
        <div
          className="absolute -right-2 bottom-14 z-20 animate-float rounded-2xl border border-white/20 bg-white px-3 py-2 shadow-xl"
          style={{ animationDelay: '1.5s' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🏪</span>
            <div>
              <p className="font-headline text-[9px] font-bold text-foreground">16+ Merchants</p>
              <p className="text-[8px] text-muted-foreground">Trusted SA brands</p>
            </div>
          </div>
        </div>

        {/* Floating badge — POPIA */}
        <div
          className="absolute left-4 top-6 z-20 animate-float rounded-2xl border border-white/20 bg-white px-3 py-2 shadow-xl"
          style={{ animationDelay: '2s' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🔒</span>
            <div>
              <p className="font-headline text-[9px] font-bold text-foreground">POPIA</p>
              <p className="text-[8px] text-muted-foreground">Compliant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const HeroSection = ({
  className = '',
  onOpenCustomerModal,
  onOpenMerchantModal,
}: HeroSectionProps) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statsVisible, setStatsVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(searchQuery.trim() ? `/shop?q=${encodeURIComponent(searchQuery.trim())}` : '/shop');
  };

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#0891b2] ${className}`}
    >
      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Radial glow top-right */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-[#a7f3d0]/10 blur-3xl" />

      {/* Scrolling ticker */}
      <div className="relative overflow-hidden border-b border-white/10 bg-black/25 py-2">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="mx-8 text-xs font-semibold text-white/75">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Main hero content */}
      <div className="relative mx-auto max-w-7xl px-4 py-14 lg:px-6 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* ── Left: Copy + Search ── */}
          <div
            className={`transition-all duration-700 ${heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
          >
            {/* SA badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <span>🇿🇦</span>
              <span>South Africa&apos;s Smart Savings Platform</span>
            </div>

            <h1 className="mb-4 font-headline text-4xl font-bold leading-[1.1] text-white lg:text-5xl xl:text-6xl">
              Shop &amp; Save with
              <br />
              <span className="text-[#6ee7b7]">eVoucher.</span>
            </h1>

            <p className="mb-8 max-w-lg font-body text-base leading-relaxed text-white/80 lg:text-lg">
              Save money every time you shop with trusted South African merchants. Instant discounts
              — no loyalty card, no hassle.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative mb-6 max-w-xl">
              <Icon
                name="MagnifyingGlassIcon"
                size={18}
                variant="outline"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Shoprite, Clicks, Pick n Pay..."
                className="w-full rounded-xl border-0 bg-white py-4 pl-11 pr-36 font-body text-sm text-foreground shadow-xl focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-5 py-2 font-headline text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
              >
                Search
              </button>
            </form>

            {/* Category pills */}
            <div className="mb-8 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => router.push(`/shop?q=${encodeURIComponent(cat.label)}`)}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25 hover:scale-105"
                >
                  <Icon name={cat.icon as any} size={13} variant="outline" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.push('/shop')}
                className="rounded-xl bg-white px-7 py-3.5 font-headline text-sm font-bold text-primary shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                Start Shopping →
              </button>
              <button
                onClick={onOpenCustomerModal}
                className="rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 font-headline text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Register Free
              </button>
              <button
                onClick={onOpenMerchantModal}
                className="font-headline text-sm font-semibold text-white/70 underline-offset-2 hover:text-white hover:underline"
              >
                Become a Merchant
              </button>
            </div>
          </div>

          {/* ── Right: Clean lifestyle image + floating KPI badges ── */}
          <HeroRightPanel visible={heroVisible} />
        </div>

        {/* ── Stats strip ── */}
        <div
          ref={statsRef}
          className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 sm:grid-cols-4"
        >
          {STATS.map((stat) => (
            <StatItem key={stat.label} stat={stat} animate={statsVisible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
