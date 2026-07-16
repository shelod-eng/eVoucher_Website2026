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

interface FeaturedMerchant {
  id: string;
  name: string;
  category: string;
  logoUrl?: string;
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

const MERCHANT_LOGOS = [
  { name: 'Pick n Pay', category: 'Grocery', color: '#E31837', initials: 'PnP' },
  { name: 'Shoprite', category: 'Grocery', color: '#E31837', initials: 'SR' },
  { name: 'Checkers', category: 'Grocery', color: '#E31837', initials: 'CH' },
  { name: 'Boxer', category: 'Grocery', color: '#FF6B00', initials: 'BX' },
  { name: 'Clicks', category: 'Pharmacy', color: '#0066CC', initials: 'CL' },
  { name: 'Dis-Chem', category: 'Pharmacy', color: '#00A651', initials: 'DC' },
  { name: 'Woolworths', category: 'Fashion', color: '#1A1A1A', initials: 'WW' },
  { name: 'Pep', category: 'Fashion', color: '#E31837', initials: 'PP' },
  { name: 'Ackermans', category: 'Fashion', color: '#003087', initials: 'AK' },
  { name: 'MTN', category: 'Airtime', color: '#FFCC00', initials: 'MTN' },
  { name: 'Vodacom', category: 'Airtime', color: '#E60000', initials: 'VC' },
  { name: 'Cell C', category: 'Airtime', color: '#00A651', initials: 'CC' },
  { name: 'Engen', category: 'Fuel', color: '#E31837', initials: 'EN' },
  { name: 'Makro', category: 'Wholesale', color: '#003087', initials: 'MK' },
  { name: 'Game', category: 'Electronics', color: '#E31837', initials: 'GM' },
  { name: 'Builders', category: 'Hardware', color: '#FF6B00', initials: 'BW' },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Browse & Choose', desc: 'Search products from trusted South African merchants.' },
  { step: '2', title: 'Add to Cart', desc: 'Select your products and see your instant savings.' },
  { step: '3', title: 'Pay Securely', desc: 'Pay with card, EFT, USSD, or cash at retail stores.' },
  { step: '4', title: 'Redeem In-Store', desc: 'Your voucher is created instantly. Scan or show at checkout.' },
];

function SavingsCalculator() {
  const [monthly, setMonthly] = useState(3000);
  const savingsPct = 0.025;
  const cashbackPct = 0.01;
  const savings = Math.round(monthly * savingsPct);
  const cashback = Math.round(monthly * cashbackPct);
  const total = savings + cashback;

  return (
    <section aria-label="Savings Calculator" className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-white p-8">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest text-primary font-headline font-semibold mb-2">Savings Calculator</p>
        <h2 className="font-headline font-bold text-2xl text-foreground mb-2">How much could you save this month?</h2>
        <p className="text-sm text-muted-foreground mb-8">Move the slider to match your monthly shopping spend.</p>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Monthly shopping spend</span>
            <span className="font-headline font-bold text-2xl text-foreground">R{monthly.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={500}
            max={20000}
            step={500}
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
            className="w-full accent-primary h-2 rounded-full"
            aria-label="Monthly shopping spend"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>R500</span><span>R20,000</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border border-border p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Instant Savings</p>
            <p className="font-headline font-bold text-2xl text-success">R{savings.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white border border-border p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Cashback Earned</p>
            <p className="font-headline font-bold text-2xl text-primary">R{cashback.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-primary text-primary-foreground p-4 shadow-sm">
            <p className="text-xs opacity-80 mb-1">Total Monthly Value</p>
            <p className="font-headline font-bold text-2xl">R{total.toLocaleString()}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Based on eVoucher&apos;s standard savings model. Actual savings may vary by merchant and product.</p>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section aria-label="How eVoucher Works">
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-widest text-primary font-headline font-semibold mb-1">Simple Process</p>
        <h2 className="font-headline font-bold text-2xl text-foreground">How eVoucher Works</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {HOW_IT_WORKS.map((item) => (
          <div key={item.step} className="rounded-xl border border-border bg-card p-6 text-center hover:border-primary hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-headline font-bold text-lg flex items-center justify-center mx-auto mb-4">
              {item.step}
            </div>
            <h3 className="font-headline font-bold text-base text-foreground mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
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
  const [merchants, setMerchants] = useState<FeaturedMerchant[]>([]);
  const [recentActivity, setRecentActivity] = useState<
    { id: string; label: string; amount: number; date: string }[]
  >([]);

  // Load wallet summary and merchants for signed-in users
  useEffect(() => {
    if (authLoading || !user) return;

    const loadData = async () => {
      try {
        const [dashRes, merchantsRes] = await Promise.all([
          fetch('/api/v1/customer/dashboard', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/v1/merchants/active', { credentials: 'include', cache: 'no-store' }),
        ]);

        if (dashRes.ok) {
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
          const activity = payments
            .filter((tx: any) => String(tx.payment_status ?? '').toLowerCase() === 'completed')
            .slice(0, 4)
            .map((tx: any) => ({
              id: tx.id,
              label: tx.voucher_code ? 'Voucher Purchase' : 'Wallet Top-Up',
              amount: Number(tx.amount ?? 0),
              date: tx.created_at,
            }));
          setRecentActivity(activity);
        }

        if (merchantsRes.ok) {
          const data = await merchantsRes.json();
          const list: FeaturedMerchant[] = (data.merchants ?? []).slice(0, 8).map((m: any) => ({
            id: String(m.id ?? ''),
            name: String(m.businessName ?? m.business_name ?? 'Merchant'),
            category: String(m.category ?? 'Partner'),
            logoUrl: m.logoUrl ?? m.logo_url ?? undefined,
          }));
          setMerchants(list);
        }
      } catch {
        // Non-critical — page still renders without data
      }
    };

    void loadData();
  }, [user, authLoading]);

  const isSignedIn = !authLoading && Boolean(user);

  return (
    <div className="min-h-screen bg-background">
      <Header forcePublic={!isSignedIn} />
      <main className="pt-16">
        {/* Hero */}
        <HeroSection
          onOpenCustomerModal={() => setShowCustomerModal(true)}
          onOpenMerchantModal={() => setShowMerchantModal(true)}
          onOpenForgotModal={() => setShowForgotModal(true)}
        />

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 space-y-14">
          {/* Compact Wallet Summary — signed-in only */}
          {isSignedIn && walletSummary && (
            <section aria-label="Wallet Summary">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline font-bold text-2xl text-foreground">Your Wallet</h2>
                <button
                  onClick={() => router.push('/wallet')}
                  className="text-sm font-headline font-semibold text-primary hover:underline"
                >
                  View Wallet →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">Balance</p>
                  <p className="font-headline font-bold text-2xl text-foreground">
                    R{walletSummary.walletBalance.toFixed(2)}
                  </p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">Active Vouchers</p>
                  <p className="font-headline font-bold text-2xl text-foreground">
                    {walletSummary.activeVouchers}
                  </p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">Cashback Earned</p>
                  <p className="font-headline font-bold text-2xl text-success">
                    R{walletSummary.totalSaved.toFixed(2)}
                  </p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col justify-between">
                  <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => router.push('/shop')}
                      className="text-xs font-headline font-semibold text-primary hover:underline text-left"
                    >
                      Shop Now →
                    </button>
                    <button
                      onClick={() => router.push('/redeem')}
                      className="text-xs font-headline font-semibold text-secondary hover:underline text-left"
                    >
                      Redeem Voucher →
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {recentActivity.length > 0 && (
                <div className="mt-4 bg-card rounded-xl border border-border p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-headline font-semibold mb-3">
                    Recent Activity
                  </p>
                  <div className="space-y-2">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-body">{item.label}</span>
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
            </section>
          )}

          {/* Featured Merchants */}
          <section aria-label="Featured Merchants">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-primary font-headline font-semibold mb-1">
                  Marketplace
                </p>
                <h2 className="font-headline font-bold text-2xl text-foreground">
                  Featured Merchants
                </h2>
              </div>
              <button
                onClick={() => router.push('/merchants')}
                className="text-sm font-headline font-semibold text-primary hover:underline"
              >
                View All →
              </button>
            </div>

            {merchants.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {merchants.map((merchant) => (
                  <button
                    key={merchant.id}
                    onClick={() => router.push('/shop')}
                    className="bg-card rounded-xl border border-border p-3 text-center hover:border-primary hover:shadow-sm transition-all"
                    aria-label={`Shop at ${merchant.name}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-2">
                      {merchant.logoUrl ? (
                        <img
                          src={merchant.logoUrl}
                          alt={merchant.name}
                          className="w-10 h-10 object-contain rounded"
                          loading="lazy"
                        />
                      ) : (
                        <Icon
                          name="BuildingStorefrontIcon"
                          size={22}
                          variant="outline"
                          className="text-muted-foreground"
                        />
                      )}
                    </div>
                    <p className="font-headline font-semibold text-xs text-foreground line-clamp-1">
                      {merchant.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{merchant.category}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {MERCHANT_LOGOS.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => router.push(`/shop?q=${encodeURIComponent(m.name)}`)}
                    className="bg-card rounded-xl border border-border p-3 text-center hover:border-primary hover:shadow-sm transition-all group"
                    aria-label={`Shop at ${m.name}`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 text-white text-xs font-headline font-bold transition-transform group-hover:scale-105"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.initials}
                    </div>
                    <p className="font-headline font-semibold text-xs text-foreground line-clamp-1">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.category}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Platform Access */}
          <PlatformAccessSection />

          {/* Savings Calculator */}
          <SavingsCalculator />

          {/* How eVoucher Works */}
          <HowItWorks />

          {/* Current Promotions */}
          <section aria-label="Current Promotions">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest text-primary font-headline font-semibold mb-1">
                Promotions
              </p>
              <h2 className="font-headline font-bold text-2xl text-foreground">Current Offers</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {PROMOTIONS.map((promo) => (
                <div key={promo.title} className={`rounded-xl border p-5 ${promo.color}`}>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-headline font-semibold mb-3 ${promo.badgeColor}`}
                  >
                    {promo.badge}
                  </span>
                  <h3 className="font-headline font-bold text-lg text-foreground mb-1">
                    {promo.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{promo.description}</p>
                  <button
                    onClick={() => router.push('/shop')}
                    className="text-sm font-headline font-semibold text-primary hover:underline"
                  >
                    Shop Now →
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Merchant CTA */}
          {!isSignedIn && (
            <section className="rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-border p-8 text-center">
              <h2 className="font-headline font-bold text-2xl text-foreground mb-2">
                Are you a merchant?
              </h2>
              <p className="text-muted-foreground mb-6">
                Join eVoucher to reach more customers, manage products, and receive fast
                settlements.
              </p>
              <button
                onClick={() => setShowMerchantModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-headline font-semibold hover:bg-primary/90 transition-colors"
              >
                <Icon name="BuildingStorefrontIcon" size={18} variant="outline" />
                Onboard as Merchant
              </button>
            </section>
          )}
        </div>
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
