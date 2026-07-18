'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import CustomerRegistrationModal from '@/app/components/CustomerRegistrationModal';
import MerchantOnboardingModal from '@/app/components/MerchantOnboardingModal';
import ForgotPasswordModal from '@/app/components/ForgotPasswordModal';
import HeroSection from './components/HeroSection';
import Footer from './components/Footer';
import TodaysFeaturedDeals from './components/TodaysFeaturedDeals';
import FeaturedMerchants from './components/FeaturedMerchants';
import PopularCategories from './components/PopularCategories';
import BigSavingsBanner from './components/BigSavingsBanner';
import TrustedMerchantsCarousel from './components/TrustedMerchantsCarousel';
import MobileAppSection from './components/MobileAppSection';
import SecurityTrustSection from './components/SecurityTrustSection';
import { useAuth } from '@/contexts/AuthContext';

// ─── Savings Calculator ──────────────────────────────────────────────────────
const PRESETS = [500, 1000, 2000, 5000];

function SavingsCalculator() {
  const [amount, setAmount] = useState(1000);
  const eVoucherPrice = Math.round(amount * 0.975);
  const savedToday = amount - eVoucherPrice;
  const cashback = Math.round(amount * 0.025);
  const totalBenefit = savedToday + cashback;

  return (
    <section aria-label="Savings Calculator" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-secondary/5 shadow-sm">
          <div className="grid items-center gap-0 lg:grid-cols-2">
            {/* Left: input */}
            <div className="p-10 lg:p-12">
              <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
                Interactive Calculator
              </p>
              <h2 className="mb-2 font-headline text-3xl font-bold text-foreground">
                How much could you save today?
              </h2>
              <p className="mb-8 text-sm text-muted-foreground">
                Enter your shopping amount and see your instant eVoucher savings.
              </p>

              {/* Preset buttons */}
              <div className="mb-5 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(p)}
                    className={`rounded-xl px-4 py-2 font-headline text-sm font-bold transition-all ${
                      amount === p
                        ? 'bg-primary text-white shadow-md'
                        : 'border border-border bg-white text-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    R{p.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Shopping Value</span>
                <span className="font-headline text-2xl font-bold text-foreground">
                  R{amount.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={20000}
                step={100}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="h-2 w-full rounded-full accent-primary"
                aria-label="Shopping amount"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>R100</span>
                <span>R20,000</span>
              </div>
            </div>

            {/* Right: results */}
            <div className="bg-gradient-to-br from-[#064e3b] to-[#0d9488] p-10 lg:p-12">
              <p className="mb-6 font-headline text-xs font-semibold uppercase tracking-widest text-white/60">
                Your Savings Breakdown
              </p>
              <div className="space-y-4">
                {[
                  {
                    label: 'Shopping Value',
                    value: `R${amount.toLocaleString()}`,
                    sub: 'What you spend',
                  },
                  {
                    label: 'eVoucher Price',
                    value: `R${eVoucherPrice.toLocaleString()}`,
                    sub: '2.5% instant discount',
                    highlight: false,
                  },
                  {
                    label: 'You Save Today',
                    value: `R${savedToday.toLocaleString()}`,
                    sub: 'Instant at checkout',
                    highlight: true,
                  },
                  {
                    label: 'Cashback Earned',
                    value: `R${cashback.toLocaleString()}`,
                    sub: 'Added to your wallet',
                    highlight: true,
                  },
                  {
                    label: 'Total Consumer Benefit',
                    value: `R${totalBenefit.toLocaleString()}`,
                    sub: 'Combined value',
                    highlight: true,
                    big: true,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                      row.big
                        ? 'border border-white/20 bg-white/15'
                        : 'border border-white/10 bg-white/5'
                    }`}
                  >
                    <div>
                      <p
                        className={`font-headline text-sm font-semibold ${row.big ? 'text-white' : 'text-white/80'}`}
                      >
                        {row.label}
                      </p>
                      {row.sub && <p className="text-[11px] text-white/50">{row.sub}</p>}
                    </div>
                    <p
                      className={`font-headline font-bold ${
                        row.big
                          ? 'text-2xl text-[#6ee7b7]'
                          : row.highlight
                            ? 'text-lg text-[#6ee7b7]'
                            : 'text-base text-white'
                      }`}
                    >
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-white/40">
                Based on eVoucher's standard 2.5% savings model. Actual savings vary by merchant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    step: '01',
    emoji: '📝',
    title: 'Register Free',
    desc: 'Create your eVoucher account in under 2 minutes. No credit check required.',
  },
  {
    step: '02',
    emoji: '🛒',
    title: 'Shop',
    desc: 'Browse real products from trusted South African merchants and add to cart.',
  },
  {
    step: '03',
    emoji: '💳',
    title: 'Pay Securely',
    desc: 'Pay with card, EFT, USSD, or cash. Your voucher is created instantly.',
  },
  {
    step: '04',
    emoji: '💰',
    title: 'Save',
    desc: 'Redeem in-store, earn cashback, and watch your savings grow.',
  },
];

function HowItWorks() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-label="How eVoucher Works" className="bg-[#F2FBFA]">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <div className="mb-10 text-center">
          <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
            Simple Process
          </p>
          <h2 className="font-headline text-3xl font-bold text-foreground">How eVoucher Works</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Three simple steps to start saving money every time you shop.
          </p>
        </div>

        <div ref={ref} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={s.step}
              className={`relative flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary hover:shadow-md ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="absolute -right-3 top-1/2 z-10 hidden h-0.5 w-6 bg-primary/20 lg:block" />
              )}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                {s.emoji}
              </div>
              <span className="mb-2 font-accent text-xs font-bold text-primary">{s.step}</span>
              <h3 className="mb-2 font-headline text-lg font-bold text-foreground">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Wallet Summary (signed-in) ───────────────────────────────────────────────
interface WalletSummary {
  walletBalance: number;
  activeVouchers: number;
  totalSaved: number;
}

function WalletSummarySection({
  summary,
  onShop,
  onRedeem,
}: {
  summary: WalletSummary;
  onShop: () => void;
  onRedeem: () => void;
}) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline text-2xl font-bold text-foreground">Your Wallet</h2>
          <button
            onClick={onShop}
            className="font-headline text-sm font-semibold text-primary hover:underline"
          >
            View Wallet →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-1 text-xs text-muted-foreground">Balance</p>
            <p className="font-headline text-2xl font-bold text-foreground">
              R{summary.walletBalance.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-1 text-xs text-muted-foreground">Active Vouchers</p>
            <p className="font-headline text-2xl font-bold text-foreground">
              {summary.activeVouchers}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-1 text-xs text-muted-foreground">Total Saved</p>
            <p className="font-headline text-2xl font-bold text-success">
              R{summary.totalSaved.toFixed(2)}
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-2 text-xs text-muted-foreground">Quick Actions</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={onShop}
                className="text-left font-headline text-xs font-semibold text-primary hover:underline"
              >
                Shop Now →
              </button>
              <button
                onClick={onRedeem}
                className="text-left font-headline text-xs font-semibold text-secondary hover:underline"
              >
                Redeem Voucher →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomepageLanding() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);

  const isSignedIn = !authLoading && Boolean(user);

  useEffect(() => {
    if (authLoading || !user) return;
    fetch('/api/v1/customer/dashboard', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((dash) => {
        if (!dash) return;
        const vouchers: any[] = dash.vouchers ?? [];
        const active = vouchers.filter(
          (v: any) =>
            v.is_active &&
            Number(v.current_balance) > 0 &&
            new Date(v.expires_at).getTime() > Date.now()
        );
        const totalSaved = vouchers.reduce(
          (s: number, v: any) =>
            s +
            Math.max(0, Number(v.face_value ?? 0) - Number(v.consumer_price ?? v.face_value ?? 0)),
          0
        );
        setWalletSummary({
          walletBalance: Number(dash.walletBalance ?? 0),
          activeVouchers: active.length,
          totalSaved,
        });
      })
      .catch(() => {});
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-background">
      <Header forcePublic={!isSignedIn} />
      <main className="pt-16">
        {/* 1. Hero — full-width commercial banner with 4D image */}
        <HeroSection
          onOpenCustomerModal={() => setShowCustomerModal(true)}
          onOpenMerchantModal={() => setShowMerchantModal(true)}
          onOpenForgotModal={() => setShowForgotModal(true)}
        />

        {/* 2. Today's Featured Deals — live merchant deals immediately below hero */}
        <TodaysFeaturedDeals />

        {/* 3. Wallet Summary — signed-in users only */}
        {isSignedIn && walletSummary && (
          <WalletSummarySection
            summary={walletSummary}
            onShop={() => router.push('/shop')}
            onRedeem={() => router.push('/redeem')}
          />
        )}

        {/* 5. Popular Categories */}
        <PopularCategories />

        {/* 6. Featured Merchants — from DB */}
        <FeaturedMerchants />

        {/* 7. Savings Calculator */}
        <SavingsCalculator />

        {/* 8. Big Savings Banner */}
        <BigSavingsBanner />

        {/* 9. How eVoucher Works */}
        <HowItWorks />

        {/* 10. Trusted Merchants Carousel */}
        <TrustedMerchantsCarousel />

        {/* 11. Security & Trust */}
        <SecurityTrustSection />

        {/* 12. Merchant CTA — unauthenticated only */}
        {!isSignedIn && (
          <section className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="mx-auto max-w-7xl px-4 py-14 text-center lg:px-6">
              <h2 className="mb-2 font-headline text-3xl font-bold text-foreground">
                Are you a merchant?
              </h2>
              <p className="mb-6 text-muted-foreground">
                Join eVoucher to reach more customers, manage products, and receive fast
                settlements.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setShowMerchantModal(true)}
                  className="rounded-xl bg-primary px-8 py-3.5 font-headline font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-primary/90"
                >
                  Onboard as Merchant →
                </button>
                <button
                  onClick={() => router.push('/merchant-partnership')}
                  className="rounded-xl border border-primary px-8 py-3.5 font-headline font-bold text-primary transition-all hover:bg-primary hover:text-white"
                >
                  Learn More
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      <CustomerRegistrationModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
      />
      <MerchantOnboardingModal
        isOpen={showMerchantModal}
        onClose={() => setShowMerchantModal(false)}
      />
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        userType="consumer"
      />
    </div>
  );
}
