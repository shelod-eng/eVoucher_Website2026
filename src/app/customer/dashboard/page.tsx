'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
  role: string;
}

interface Voucher {
  id: string;
  merchant_id?: string | null;
  merchant_name: string;
  voucher_code: string;
  face_value: number;
  discount_percent: number;
  current_balance: number;
  is_active: boolean;
  expires_at: string;
}

interface RedemptionTransaction {
  id: string;
  merchant_name: string;
  amount: number;
  transaction_type: string;
  created_at: string;
}

interface PaymentTransaction {
  id: string;
  voucher_code: string | null;
  amount: number | null;
  payment_status: string | null;
  created_at: string;
}

interface RewardsSnapshot {
  totalCashSaved: number;
  thisMonthSavings: number;
  savingsRatePct: number;
}

export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<RedemptionTransaction[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [rewards, setRewards] = useState<RewardsSnapshot>({
    totalCashSaved: 0,
    thisMonthSavings: 0,
    savingsRatePct: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/customer/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [dashboardRes, rewardsRes] = await Promise.all([
          fetch('/api/v1/customer/dashboard', { method: 'GET', credentials: 'include' }),
          fetch('/api/v1/customer/rewards', { method: 'GET', credentials: 'include' }),
        ]);

        const dashboardData = await dashboardRes.json();
        const rewardsData = await rewardsRes.json();

        if (!dashboardRes.ok) {
          throw new Error(dashboardData.error || 'Failed to load dashboard.');
        }
        if (!rewardsRes.ok) {
          throw new Error(rewardsData.error || 'Failed to load rewards summary.');
        }

        setUserProfile(dashboardData.profile ?? null);
        setVouchers(dashboardData.vouchers ?? []);
        setTransactions(dashboardData.transactions ?? []);
        setPaymentTransactions(dashboardData.paymentTransactions ?? []);
        setRewards({
          totalCashSaved: Number(rewardsData.totalCashSaved ?? 0),
          thisMonthSavings: Number(rewardsData.thisMonthSavings ?? 0),
          savingsRatePct: Number(rewardsData.savingsRatePct ?? 0),
        });
      } catch (dashboardError: any) {
        setError(dashboardError?.message || 'Failed to load customer dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [user]);

  const displayName = useMemo(() => {
    const profileName = userProfile?.full_name?.trim();
    if (profileName) return profileName;
    return String(
      user?.user_metadata?.full_name ??
        user?.user_metadata?.name ??
        user?.email?.split('@')[0] ??
        'consumer'
    ).trim();
  }, [userProfile?.full_name, user?.email, user?.user_metadata]);

  const activeVouchers = useMemo(
    () =>
      vouchers.filter(
        (voucher) =>
          voucher.is_active &&
          Number(voucher.current_balance) > 0 &&
          new Date(voucher.expires_at).getTime() > Date.now()
      ),
    [vouchers]
  );

  const walletBalance = activeVouchers.reduce((sum, voucher) => sum + Number(voucher.current_balance), 0);

  const recentActivity = useMemo(() => {
    const purchaseRows = paymentTransactions
      .filter((transaction) => String(transaction.payment_status ?? '').toLowerCase() === 'completed')
      .map((transaction) => {
        const matchedVoucher = vouchers.find((voucher) => voucher.voucher_code === transaction.voucher_code);
        const savings = Number(matchedVoucher?.face_value ?? 0) - Number(transaction.amount ?? 0);
        return {
          id: `purchase-${transaction.id}`,
          merchantName: matchedVoucher?.merchant_name ?? 'Voucher Purchase',
          amount: Number(transaction.amount ?? 0),
          savings: Math.max(0, Number.isFinite(savings) ? savings : 0),
          createdAt: transaction.created_at,
        };
      });

    const redemptionRows = transactions.map((transaction) => ({
      id: `redemption-${transaction.id}`,
      merchantName: transaction.merchant_name,
      amount: Number(transaction.amount ?? 0),
      savings: 0,
      createdAt: transaction.created_at,
    }));

    return [...purchaseRows, ...redemptionRows]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [paymentTransactions, transactions, vouchers]);

  const quickActions = [
    {
      label: 'Buy Voucher',
      href: '/shop',
      icon: 'ShoppingBagIcon',
      color: 'bg-primary/15 text-primary',
    },
    {
      label: 'My Wallet',
      href: '/wallet',
      icon: 'WalletIcon',
      color: 'bg-secondary/15 text-secondary',
    },
    {
      label: 'Find Stores',
      href: '/shop',
      icon: 'MapPinIcon',
      color: 'bg-blue-500/15 text-blue-600',
    },
    {
      label: 'Rewards',
      href: '/rewards',
      icon: 'StarIcon',
      color: 'bg-warning/15 text-warning',
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="font-headline font-bold text-4xl text-foreground">Hello, {displayName}</h1>
              <p className="text-muted-foreground mt-1">Welcome back to eVoucher</p>
            </div>
            <div className="rounded-full bg-success text-white px-5 py-3 min-w-40 text-center">
              <p className="font-headline font-bold">Cashback Rewards</p>
              <p className="text-xs">{rewards.savingsRatePct.toFixed(1)}% savings rate</p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error font-body">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Icon name="WalletIcon" size={20} variant="outline" className="text-primary" />
              </div>
              <p className="text-4xl font-headline font-bold text-foreground">R{walletBalance.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
                <Icon name="ArrowTrendingUpIcon" size={20} variant="outline" className="text-success" />
              </div>
              <p className="text-4xl font-headline font-bold text-foreground">R{rewards.totalCashSaved.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Cash Saved</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
                <Icon name="StarIcon" size={20} variant="outline" className="text-warning" />
              </div>
              <p className="text-4xl font-headline font-bold text-foreground">
                R{rewards.thisMonthSavings.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">This Month Savings</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                <Icon name="TicketIcon" size={20} variant="outline" className="text-blue-600" />
              </div>
              <p className="text-4xl font-headline font-bold text-foreground">{activeVouchers.length}</p>
              <p className="text-sm text-muted-foreground">Active Vouchers</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-headline font-bold text-2xl text-foreground">Quick Actions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="bg-card rounded-2xl border border-border p-5 text-left hover:bg-muted transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color}`}>
                    <Icon name={action.icon as any} size={22} variant="outline" />
                  </div>
                  <p className="font-headline font-semibold text-foreground mt-4">{action.label}</p>
                  <p className="text-muted-foreground">&rarr;</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline font-bold text-2xl text-foreground">My Vouchers</h3>
                <Icon name="TicketIcon" size={20} variant="outline" className="text-primary" />
              </div>
              {activeVouchers.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">No active vouchers yet</p>
              ) : (
                <div className="space-y-3">
                  {activeVouchers.slice(0, 5).map((voucher) => (
                    <div key={voucher.id} className="rounded-xl border border-border p-4">
                      <p className="font-headline font-semibold text-foreground">{voucher.merchant_name}</p>
                      <p className="text-xs text-muted-foreground">{voucher.voucher_code}</p>
                      <p className="text-sm text-primary mt-1">
                        Balance: R{Number(voucher.current_balance).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline font-bold text-2xl text-foreground">Recent Activity</h3>
                <button
                  onClick={() => router.push('/analytics')}
                  className="text-primary text-sm font-headline font-semibold"
                >
                  View All
                </button>
              </div>
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="rounded-xl border border-border p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-headline font-semibold text-foreground">{transaction.merchantName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-headline font-semibold text-foreground">
                          R{Number(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-success">
                          Saved R{Number(transaction.savings).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
