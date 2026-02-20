'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';

const DASHBOARD_CACHE_KEY = 'evoucher_customer_dashboard_cache_v1';
const DASHBOARD_CACHE_TTL_MS = 60 * 1000;

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

interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  transaction_type: string;
  created_at: string;
}

export default function CustomerDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockingCode, setBlockingCode] = useState<string | null>(null);
  const [blockingReason, setBlockingReason] = useState<string | null>(null);
  const [redeemingVoucherId, setRedeemingVoucherId] = useState<string | null>(null);
  const [redeemStatus, setRedeemStatus] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/customer/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      void fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const cachedPayload =
        typeof window !== 'undefined' ? window.sessionStorage.getItem(DASHBOARD_CACHE_KEY) : null;

      if (cachedPayload) {
        try {
          const parsed = JSON.parse(cachedPayload) as {
            profile: UserProfile | null;
            vouchers: Voucher[];
            transactions: Transaction[];
            fetchedAt: number;
          };

          if (Date.now() - parsed.fetchedAt < DASHBOARD_CACHE_TTL_MS) {
            setUserProfile(parsed.profile);
            setVouchers(parsed.vouchers ?? []);
            setTransactions(parsed.transactions ?? []);
            setLoading(false);
          }
        } catch {
          // Ignore invalid cache payload
        }
      }

      setLoading(!cachedPayload);
      setError('');
      setBlockingCode(null);
      setBlockingReason(null);
      const response = await fetch('/api/v1/customer/dashboard', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        setBlockingCode(data.code ?? null);
        setBlockingReason(data.error ?? 'Dashboard is currently unavailable.');
        throw new Error(data.error || 'Failed to load dashboard');
      }

      setUserProfile(data.profile || null);
      setVouchers(data.vouchers || []);
      setTransactions(data.transactions || []);

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          DASHBOARD_CACHE_KEY,
          JSON.stringify({
            profile: data.profile || null,
            vouchers: data.vouchers || [],
            transactions: data.transactions || [],
            fetchedAt: Date.now(),
          })
        );
      }
    } catch (dashboardError: any) {
      setError(dashboardError?.message || 'Failed to load customer dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/customer/login');
  };

  const handleRedeemVoucher = async (voucher: Voucher) => {
    if (!voucher.merchant_id) {
      setRedeemStatus('This voucher is missing merchant linkage and cannot be redeemed yet.');
      return;
    }

    try {
      setRedeemStatus('');
      setRedeemingVoucherId(voucher.id);
      const response = await fetch('/api/v1/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          voucherCode: voucher.voucher_code,
          merchantId: voucher.merchant_id,
          amount: Number(voucher.current_balance),
          idempotencyKey: `redeem-${voucher.id}-${Date.now()}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Redemption failed');
      }

      setRedeemStatus(
        `Redeemed successfully. Remaining balance: R${Number(data.remainingBalance).toFixed(2)}. Merchant payout queued: ${data.merchantPayoutQueued ? 'Yes' : 'No'}${data.merchantPayoutAmount !== undefined ? ` (R${Number(data.merchantPayoutAmount).toFixed(2)})` : ''}.`
      );
      await fetchDashboardData();
    } catch (redeemError: any) {
      setRedeemStatus(redeemError?.message || 'Failed to redeem voucher.');
    } finally {
      setRedeemingVoucherId(null);
    }
  };

  const totalBalance = vouchers.reduce((sum, voucher) => sum + Number(voucher.current_balance), 0);
  const totalSavings = vouchers.reduce(
    (sum, voucher) => sum + (Number(voucher.face_value) - Number(voucher.current_balance)),
    0
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-muted rounded-2xl" />
              <div className="grid md:grid-cols-3 gap-6">
                <div className="h-48 bg-muted rounded-2xl" />
                <div className="h-48 bg-muted rounded-2xl" />
                <div className="h-48 bg-muted rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-2">
                Welcome Back{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}!
              </h1>
              <p className="text-muted-foreground font-body">
                View payment status, vouchers issued, and redemption outcomes.
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-6 py-3 bg-card border border-border rounded-lg font-headline font-semibold hover:bg-muted transition-all duration-300"
            >
              <Icon name="ArrowRightOnRectangleIcon" size={20} variant="outline" />
              <span>Sign Out</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error font-body">{error}</p>
            </div>
          )}

          {blockingReason && (
            <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning font-body">{blockingReason}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {blockingCode === 'unauthenticated' && (
                  <button
                    onClick={() => router.push('/customer/login')}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-headline font-semibold"
                  >
                    Go to Consumer Login
                  </button>
                )}
                {blockingCode === 'consumer_only_dashboard' && (
                  <button
                    onClick={() => router.push('/merchant/dashboard')}
                    className="px-4 py-2 rounded-lg bg-secondary text-white font-headline font-semibold"
                  >
                    Open Merchant Dashboard
                  </button>
                )}
              </div>
            </div>
          )}

          {redeemStatus && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-foreground font-body">{redeemStatus}</p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <Icon name="WalletIcon" size={32} variant="solid" className="opacity-80" />
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Icon name="ArrowTrendingUpIcon" size={24} variant="outline" />
                </div>
              </div>
              <p className="text-sm opacity-90 mb-1">Total Voucher Balance</p>
              <p className="text-4xl font-headline font-bold">R{totalBalance.toFixed(2)}</p>
            </div>

            <div className="bg-gradient-to-br from-success to-success/80 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <Icon name="SparklesIcon" size={32} variant="solid" className="opacity-80" />
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Icon name="CheckCircleIcon" size={24} variant="solid" />
                </div>
              </div>
              <p className="text-sm opacity-90 mb-1">Total Savings</p>
              <p className="text-4xl font-headline font-bold">R{totalSavings.toFixed(2)}</p>
            </div>

            <div className="bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <Icon name="TicketIcon" size={32} variant="solid" className="opacity-80" />
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Icon name="ShoppingBagIcon" size={24} variant="outline" />
                </div>
              </div>
              <p className="text-sm opacity-90 mb-1">Active Vouchers</p>
              <p className="text-4xl font-headline font-bold">{vouchers.length}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline font-bold text-2xl text-foreground">My Vouchers</h2>
                <Icon name="TicketIcon" size={24} variant="solid" className="text-primary" />
              </div>

              <div className="space-y-4">
                {vouchers.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="TicketIcon" size={48} variant="outline" className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-body">No active vouchers yet</p>
                  </div>
                ) : (
                  vouchers.map((voucher) => (
                    <div
                      key={voucher.id}
                      className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-border hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-headline font-bold text-lg text-foreground">{voucher.merchant_name}</h3>
                          <p className="text-sm text-muted-foreground font-body">{voucher.voucher_code}</p>
                        </div>
                        <div className="px-3 py-1 bg-success/10 text-success rounded-full text-xs font-headline font-semibold">
                          {voucher.discount_percent}% OFF
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground font-body">Current Balance</p>
                          <p className="text-2xl font-headline font-bold text-primary">
                            R{Number(voucher.current_balance).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground font-body">Expires</p>
                          <p className="text-sm font-headline font-semibold text-foreground">
                            {new Date(voucher.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => void handleRedeemVoucher(voucher)}
                        disabled={redeemingVoucherId === voucher.id}
                        className="mt-4 w-full py-2 bg-primary text-primary-foreground rounded-lg font-headline font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all duration-300"
                      >
                        {redeemingVoucherId === voucher.id ? 'Redeeming...' : 'Redeem Voucher'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline font-bold text-2xl text-foreground">Recent Activity</h2>
                <Icon name="ClockIcon" size={24} variant="solid" className="text-primary" />
              </div>

              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="ClockIcon" size={48} variant="outline" className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-body">No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="ShoppingBagIcon" size={20} variant="solid" className="text-primary" />
                        </div>
                        <div>
                          <p className="font-headline font-semibold text-foreground">{transaction.merchant_name}</p>
                          <p className="text-sm text-muted-foreground font-body">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-headline font-bold text-lg text-foreground">
                          -R{Number(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-success font-body capitalize">{transaction.transaction_type}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
