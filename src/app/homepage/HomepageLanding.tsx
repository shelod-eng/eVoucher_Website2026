'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import CustomerRegistrationModal from '@/app/components/CustomerRegistrationModal';
import MerchantOnboardingModal from '@/app/components/MerchantOnboardingModal';
import ForgotPasswordModal from '@/app/components/ForgotPasswordModal';
import HeroSection from './components/HeroSection';
import Footer from './components/Footer';
import PlatformAccessSection from './components/PlatformAccessSection';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface WalletSummary {
  walletBalance: number;
  activeVouchers: number;
  totalSaved: number;
}

interface PublicMerchant {
  id: string;
  name: string;
  category: string;
  logoPath: string | null;
  brandKey: string | null;
}

const PROMOTIONS = [
  {
    title: 'Food Relief Programme',
    description: 'Government-backed food vouchers for qualifying households.',
    badge: 'Government',
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    title: 'Kalapeng Pharmacy Loyalty',
    description: 'Earn loyalty points on every eVoucher purchase at Kalapeng.',
    badge: 'Loyalty',
    color: 'bg-success/5 border-success/20',
    badgeColor: 'bg-success/15 text-success',
  },
  {
    title: 'CSI Sponsor Vouchers',
    description: 'Corporate social investment vouchers distributed to communities.',
    badge: 'CSI',
    color: 'bg-warning/5 border-warning/20',
    badgeColor: 'bg-warning/15 text-warning',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Browse & Choose',
    desc: 'Search products from trusted South African merchants.',
  },
  { step: '2', title: 'Add to Cart', desc: 'Select your products and see your instant savings.' },
  { step: '3', title: 'Pay Securely', desc: 'Pay with card, EFT, USSD, or cash at retail stores.' },
  {
    step: '4',
    title: 'Redeem In-Store',
    desc: 'Your voucher is created instantly. Scan or show at checkout.',
  },
];

function SavingsCalculator() {
  const [monthly, setMonthly] = useState(3000);
  const savings = Math.round(monthly * 0.025);
  const cashback = Math.round(monthly * 0.01);

  return (
    <section
      aria-label="Savings Calculator"
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-white p-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-2 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
          Savings Calculator
        </p>
        <h2 className="mb-2 font-headline text-2xl font-bold text-foreground">
          How much could you save this month?
        </h2>
        <p className="mb-8 text-sm text-muted-foreground">
          Move the slider to match your monthly shopping spend.
        </p>
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Monthly shopping spend</span>
            <span className="font-headline text-2xl font-bold text-foreground">
              R{monthly.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={500}
            max={20000}
            step={500}
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
            className="h-2 w-full rounded-full accent-primary"
            aria-label="Monthly shopping spend"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>R500</span>
            <span>R20,000</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-muted-foreground">Instant Savings</p>
            <p className="font-headline text-2xl font-bold text-success">
              R{savings.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-muted-foreground">Cashback Earned</p>
            <p className="font-headline text-2xl font-bold text-primary">
              R{cashback.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-primary p-4 text-primary-foreground shadow-sm">
            <p className="mb-1 text-xs opacity-80">Total Monthly Value</p>
            <p className="font-headline text-2xl font-bold">
              R{(savings + cashback).toLocaleString()}
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Based on eVoucher&apos;s standard savings model. Actual savings may vary by merchant and
          product.
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section aria-label="How eVoucher Works">
      <div className="mb-6 text-center">
        <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
          Simple Process
        </p>
        <h2 className="font-headline text-2xl font-bold text-foreground">How eVoucher Works</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS.map((item) => (
          <div
            key={item.step}
            className="rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-sm"
          >
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-headline text-lg font-bold text-primary-foreground">
              {item.step}
            </div>
            <h3 className="mb-2 font-headline text-base font-bold text-foreground">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MerchantCard({ merchant, onClick }: { merchant: PublicMerchant; onClick: () => void }) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center rounded-2xl border border-border bg-white p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md"
      aria-label={`Shop at ${merchant.name}`}
    >
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-[#F8FAFC] p-2 transition-transform duration-200 group-hover:scale-105">
        {merchant.logoPath && !logoFailed ? (
          <img
            src={merchant.logoPath}
            alt={merchant.name}
            className="h-12 w-12 object-contain"
            loading="lazy"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <Icon
            name="BuildingStorefrontIcon"
            size={28}
            variant="outline"
            className="text-muted-foreground"
          />
        )}
      </div>
      <p className="font-headline text-sm font-bold text-foreground line-clamp-1">
        {merchant.name}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{merchant.category}</p>
      <span className="mt-2 text-xs font-semibold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Shop Now →
      </span>
    </button>
  );
}

export default function HomepageLanding() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUserType] = useState<'consumer' | 'merchant'>('consumer');
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [publicMerchants, setPublicMerchants] = useState<PublicMerchant[]>([]);
  const [merchantsLoading, setMerchantsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<
    { id: string; label: string; amount: number; date: string }[]
  >([]);

  // Load public merchants — no auth required
  useEffect(() => {
    const loadPublicMerchants = async () => {
      try {
        const res = await fetch('/api/v1/merchants/public', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setPublicMerchants((data.merchants ?? []) as PublicMerchant[]);
        }
      } catch {
        // Non-critical
      } finally {
        setMerchantsLoading(false);
      }
    };
    void loadPublicMerchants();
  }, []);

  // Load wallet summary for signed-in users
  useEffect(() => {
    if (authLoading || !user) return;

    const loadDashboard = async () => {
      try {
        const dashRes = await fetch('/api/v1/customer/dashboard', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!dashRes.ok) return;
        const dash = await dashRes.json();
        const vouchers: any[] = dash.vouchers ?? [];
        const active = vouchers.filter(
          (v: any) =>
            v.is_active &&
            Number(v.current_balance) > 0 &&
            new Date(v.expires_at).getTime() > Date.now()
        );
        const totalSaved = vouchers.reduce((sum: number, v: any) => {
          const face = Number(v.face_value ?? 0);
          const paid = Number(v.consumer_price ?? face);
          return sum + Math.max(0, face - paid);
        }, 0);
        setWalletSummary({
          walletBalance: Number(dash.walletBalance ?? 0),
          activeVouchers: active.length,
          totalSaved,
        });
        const payments: any[] = dash.paymentTransactions ?? [];
        setRecentActivity(
          payments
            .filter((tx: any) => String(tx.payment_status ?? '').toLowerCase() === 'completed')
            .slice(0, 4)
            .map((tx: any) => ({
              id: tx.id,
              label: tx.voucher_code ? 'Voucher Purchase' : 'Wallet Top-Up',
              amount: Number(tx.amount ?? 0),
              date: tx.created_at,
            }))
        );
      } catch {
        // Non-critical
      }
    };

    void loadDashboard();
  }, [user, authLoading]);

  const isSignedIn = !authLoading && Boolean(user);

  return (
    <div className="min-h-screen bg-background">
      <Header forcePublic={!isSignedIn} />
      <main className="pt-16">
        {/* Hero — white */}
        <HeroSection
          onOpenCustomerModal={() => setShowCustomerModal(true)}
          onOpenMerchantModal={() => setShowMerchantModal(true)}
          onOpenForgotModal={() => setShowForgotModal(true)}
        />

        {/* Wallet Summary — signed-in only, white */}
        {isSignedIn && walletSummary && (
          <div className="bg-white">
            <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-headline text-2xl font-bold text-foreground">Your Wallet</h2>
                <button
                  onClick={() => router.push('/wallet')}
                  className="font-headline text-sm font-semibold text-primary hover:underline"
                >
                  View Wallet →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="mb-1 text-xs text-muted-foreground">Balance</p>
                  <p className="font-headline text-2xl font-bold text-foreground">
                    R{walletSummary.walletBalance.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="mb-1 text-xs text-muted-foreground">Active Vouchers</p>
                  <p className="font-headline text-2xl font-bold text-foreground">
                    {walletSummary.activeVouchers}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="mb-1 text-xs text-muted-foreground">Total Saved</p>
                  <p className="font-headline text-2xl font-bold text-success">
                    R{walletSummary.totalSaved.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="mb-2 text-xs text-muted-foreground">Quick Actions</p>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => router.push('/shop')}
                      className="text-left font-headline text-xs font-semibold text-primary hover:underline"
                    >
                      Shop Now →
                    </button>
                    <button
                      onClick={() => router.push('/redeem')}
                      className="text-left font-headline text-xs font-semibold text-secondary hover:underline"
                    >
                      Redeem Voucher →
                    </button>
                  </div>
                </div>
              </div>
              {recentActivity.length > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-card p-4">
                  <p className="mb-3 font-headline text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Recent Activity
                  </p>
                  <div className="space-y-2">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="font-body text-foreground">{item.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-headline font-semibold text-foreground">
                            R{item.amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Featured Merchants — soft teal background */}
        <div className="bg-[#F2FBFA]">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
                  Marketplace
                </p>
                <h2 className="font-headline text-2xl font-bold text-foreground">
                  Featured Merchants
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Shop from trusted South African brands and save instantly.
                </p>
              </div>
              <button
                onClick={() => router.push('/shop')}
                className="font-headline text-sm font-semibold text-primary hover:underline"
              >
                Browse All →
              </button>
            </div>

            {merchantsLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/60" />
                ))}
              </div>
            ) : publicMerchants.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {publicMerchants.slice(0, 16).map((merchant) => (
                  <MerchantCard
                    key={merchant.id}
                    merchant={merchant}
                    onClick={() =>
                      router.push(
                        `/shop?q=${encodeURIComponent(merchant.brandKey ?? merchant.name)}`
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-white p-10 text-center">
                <Icon
                  name="BuildingStorefrontIcon"
                  size={40}
                  variant="outline"
                  className="mx-auto mb-3 text-muted-foreground"
                />
                <p className="text-sm text-muted-foreground">
                  Merchants are being onboarded. Check back soon.
                </p>
                <button
                  onClick={() => router.push('/shop')}
                  className="mt-4 font-headline text-sm font-semibold text-primary hover:underline"
                >
                  Browse Shop →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Platform Access — white */}
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
            <PlatformAccessSection />
          </div>
        </div>

        {/* Savings Calculator — light grey */}
        <div className="bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
            <SavingsCalculator />
          </div>
        </div>

        {/* How It Works — soft teal */}
        <div className="bg-[#F2FBFA]">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
            <HowItWorks />
          </div>
        </div>

        {/* Current Promotions — white */}
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
            <div className="mb-6">
              <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
                Promotions
              </p>
              <h2 className="font-headline text-2xl font-bold text-foreground">Current Offers</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {PROMOTIONS.map((promo) => (
                <div key={promo.title} className={`rounded-xl border p-5 ${promo.color}`}>
                  <span
                    className={`mb-3 inline-block rounded-full px-2 py-1 font-headline text-xs font-semibold ${promo.badgeColor}`}
                  >
                    {promo.badge}
                  </span>
                  <h3 className="mb-1 font-headline text-lg font-bold text-foreground">
                    {promo.title}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">{promo.description}</p>
                  <button
                    onClick={() => router.push('/shop')}
                    className="font-headline text-sm font-semibold text-primary hover:underline"
                  >
                    Shop Now →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Merchant CTA — gradient */}
        {!isSignedIn && (
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="mx-auto max-w-7xl px-4 py-12 text-center lg:px-6">
              <h2 className="mb-2 font-headline text-2xl font-bold text-foreground">
                Are you a merchant?
              </h2>
              <p className="mb-6 text-muted-foreground">
                Join eVoucher to reach more customers, manage products, and receive fast
                settlements.
              </p>
              <button
                onClick={() => setShowMerchantModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-headline font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Icon name="BuildingStorefrontIcon" size={18} variant="outline" />
                Onboard as Merchant
              </button>
            </div>
          </div>
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
        userType={forgotUserType}
      />
    </div>
  );
}
