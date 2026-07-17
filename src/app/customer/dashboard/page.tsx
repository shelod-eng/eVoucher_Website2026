'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import {
  PageShell,
  PageContent,
  PremiumHero,
  ActionCard,
  SectionHeader,
  VoucherProgressBar,
  ActivityTimeline,
  SavingsStrip,
  LoadingSkeleton,
  ErrorBanner,
  getMerchantLogo,
  PLACEHOLDER_LOGO,
  BRAND,
} from '@/components/ui/DesignSystem';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserProfile { full_name: string; email: string; phone: string; role: string }
interface Voucher {
  id: string; merchant_name: string; voucher_code: string;
  face_value: number; current_balance: number; is_active: boolean; expires_at: string;
}
interface RedemptionTransaction {
  id: string; merchant_name: string; amount: number; transaction_type: string; created_at: string;
}
interface PaymentTransaction {
  id: string; voucher_code: string | null; amount: number | null;
  payment_status: string | null; created_at: string;
}
interface RewardsSnapshot { totalCashSaved: number; thisMonthSavings: number; savingsRatePct: number }

// ─── Quick Actions ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Shop Products', emoji: '🛒', href: '/shop', bg: 'from-teal-500 to-teal-600', desc: 'Browse & buy vouchers' },
  { label: 'My Wallet', emoji: '💳', href: '/wallet', bg: 'from-indigo-500 to-indigo-600', desc: 'Balances & vouchers' },
  { label: 'Redeem Voucher', emoji: '🎁', href: '/redeem', bg: 'from-orange-500 to-orange-600', desc: 'Use in-store' },
  { label: 'Benefits', emoji: '⭐', href: '/benefits', bg: 'from-amber-500 to-amber-600', desc: 'Cashback & rewards' },
  { label: 'Orders', emoji: '📦', href: '/cart', bg: 'from-blue-500 to-blue-600', desc: 'Purchase history' },
  { label: 'Find Merchants', emoji: '🏪', href: '/merchants', bg: 'from-emerald-500 to-emerald-600', desc: 'Nearby stores' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ─── Voucher Card ─────────────────────────────────────────────────────────────
function VoucherCard({ voucher }: { voucher: Voucher }) {
  const router = useRouter();
  const logo = getMerchantLogo(voucher.merchant_name);
  const expiry = new Date(voucher.expires_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  const pct = Math.round((Number(voucher.current_balance) / Number(voucher.face_value)) * 100);

  return (
    <article className={`group relative overflow-hidden ${BRAND.cardBase} ${BRAND.cardHover}`}>
      <div className="h-1.5 w-full bg-gradient-to-r from-primary to-teal-400" />
      <div className="p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white p-1 shadow-sm">
            <img src={logo} alt={voucher.merchant_name} className="h-8 w-8 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_LOGO; }} />
          </div>
          <div className="min-w-0">
            <p className="font-headline text-sm font-bold text-foreground line-clamp-1">{voucher.merchant_name}</p>
            <p className="text-[11px] text-muted-foreground">R{Number(voucher.face_value).toFixed(0)} Voucher</p>
          </div>
        </div>

        <p className="font-headline text-2xl font-bold text-foreground">R{Number(voucher.current_balance).toFixed(2)}</p>
        <p className="mb-2 text-[11px] text-muted-foreground">Balance remaining</p>

        <VoucherProgressBar pct={pct} />

        <div className="my-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Expires {expiry}</span>
          <span className="rounded-full bg-success/10 px-2 py-0.5 font-semibold text-success">{pct}% left</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => router.push(`/wallet?code=${voucher.voucher_code}`)}
            className={BRAND.btnOutline + ' py-2 text-xs'}>
            View QR
          </button>
          <button onClick={() => router.push(`/redeem?code=${encodeURIComponent(voucher.voucher_code)}`)}
            className={BRAND.btnPrimary + ' py-2 text-xs'}>
            Redeem
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<RedemptionTransaction[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [rewards, setRewards] = useState<RewardsSnapshot>({ totalCashSaved: 0, thisMonthSavings: 0, savingsRatePct: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/customer/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setLoading(true); setError('');
        const [dashRes, rewardsRes] = await Promise.all([
          fetch('/api/v1/customer/dashboard', { credentials: 'include' }),
          fetch('/api/v1/customer/rewards', { credentials: 'include' }),
        ]);
        const dash = await dashRes.json();
        const rew = await rewardsRes.json();
        if (!dashRes.ok) throw new Error(dash.error || 'Failed to load dashboard.');
        if (!rewardsRes.ok) throw new Error(rew.error || 'Failed to load rewards.');
        setUserProfile(dash.profile ?? null);
        setVouchers(dash.vouchers ?? []);
        setTransactions(dash.transactions ?? []);
        setPaymentTransactions(dash.paymentTransactions ?? []);
        setRewards({
          totalCashSaved: Number(rew.totalCashSaved ?? 0),
          thisMonthSavings: Number(rew.thisMonthSavings ?? 0),
          savingsRatePct: Number(rew.savingsRatePct ?? 0),
        });
      } catch (e: any) { setError(e?.message || 'Failed to load dashboard.'); }
      finally { setLoading(false); }
    };
    void fetchData();
  }, [user]);

  const displayName = useMemo(() => {
    const n = userProfile?.full_name?.trim();
    if (n) return n.split(' ')[0];
    return String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'there').split(' ')[0];
  }, [userProfile, user]);

  const activeVouchers = useMemo(() =>
    vouchers.filter(v => v.is_active && Number(v.current_balance) > 0 && new Date(v.expires_at).getTime() > Date.now()),
    [vouchers]);

  const walletBalance = activeVouchers.reduce((s, v) => s + Number(v.current_balance), 0);

  const recentActivity = useMemo(() => {
    const purchases = paymentTransactions
      .filter(t => String(t.payment_status ?? '').toLowerCase() === 'completed')
      .map(t => {
        const mv = vouchers.find(v => v.voucher_code === t.voucher_code);
        return {
          id: `p-${t.id}`, merchant: mv?.merchant_name ?? 'Voucher Purchase',
          typeLabel: 'Purchase', amount: Number(t.amount ?? 0),
          savings: Math.max(0, Number(mv?.face_value ?? 0) - Number(t.amount ?? 0)),
          createdAt: t.created_at,
        };
      });
    const redemptions = transactions.map(t => ({
      id: `r-${t.id}`, merchant: t.merchant_name, typeLabel: 'Redemption',
      amount: Number(t.amount ?? 0), savings: 0, createdAt: t.created_at,
    }));
    return [...purchases, ...redemptions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [paymentTransactions, transactions, vouchers]);

  if (authLoading || loading) {
    return (
      <PageShell>
        <Header />
        <PageContent><LoadingSkeleton /></PageContent>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Header />
      <PageContent>
        <ErrorBanner message={error} />

        {/* ── Premium Hero ── */}
        <PremiumHero
          title={`${getGreeting()}, ${displayName} 👋`}
          subtitle="Welcome back to your eVoucher world."
          stats={[
            { label: 'Wallet Balance', value: `R${walletBalance.toFixed(2)}`, sub: 'Active vouchers' },
            { label: 'Total Saved', value: `R${rewards.totalCashSaved.toFixed(2)}`, sub: 'All time' },
            { label: 'Active Vouchers', value: String(activeVouchers.length), sub: 'Ready to use' },
            { label: 'Cashback Rate', value: `${rewards.savingsRatePct.toFixed(1)}%`, sub: 'On every purchase' },
          ]}
        />

        {/* ── Quick Actions ── */}
        <section>
          <SectionHeader title="Quick Actions" />
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {QUICK_ACTIONS.map(a => (
              <ActionCard key={a.label} emoji={a.emoji} label={a.label} desc={a.desc}
                gradient={a.bg} onClick={() => router.push(a.href)} />
            ))}
          </div>
        </section>

        {/* ── Vouchers + Activity ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Vouchers */}
          <section>
            <SectionHeader
              title="My Vouchers"
              action={
                <button onClick={() => router.push('/wallet')}
                  className="font-headline text-sm font-semibold text-primary hover:underline">
                  View All →
                </button>
              }
            />
            <div className="mt-4">
              {activeVouchers.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-12 text-center">
                  <span className="mb-3 text-4xl">🎁</span>
                  <p className="font-headline text-sm font-semibold text-foreground">No active vouchers yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Visit the shop to buy your first voucher</p>
                  <button onClick={() => router.push('/shop')} className={`mt-4 ${BRAND.btnPrimary}`}>
                    Shop Now
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeVouchers.slice(0, 4).map(v => <VoucherCard key={v.id} voucher={v} />)}
                </div>
              )}
            </div>
          </section>

          {/* Activity Timeline */}
          <section>
            <SectionHeader
              title="Recent Activity"
              action={
                <button onClick={() => router.push('/wallet')}
                  className="font-headline text-sm font-semibold text-primary hover:underline">
                  View All →
                </button>
              }
            />
            <div className="mt-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
              <ActivityTimeline items={recentActivity} />
            </div>
          </section>
        </div>

        {/* ── Savings Strip ── */}
        <SavingsStrip amount={rewards.thisMonthSavings} onShop={() => router.push('/shop')} />
      </PageContent>
    </PageShell>
  );
}
