'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface MonthlySeriesItem {
  month: string;
  spent: number;
  savings: number;
}

interface RecentRewardTransaction {
  id: string;
  merchantName: string;
  amountPaid: number;
  savingsRealized: number;
  voucherCode: string | null;
  createdAt: string;
}

interface RewardsPayload {
  totalCashSaved: number;
  thisMonthSavings: number;
  averageAnnualSavings: number;
  savingsRatePct: number;
  totalSpent: number;
  thisMonthSpend: number;
  totalPlatformFeeAmount: number;
  merchantDiscountPct: number;
  consumerSavingsPct: number;
  platformFeePct: number;
  cashbackPer100: number;
  activeVouchers: number;
  monthlySeries: MonthlySeriesItem[];
  recentTransactions: RecentRewardTransaction[];
}

export default function BenefitsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<RewardsPayload | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const fetchRewards = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/v1/customer/rewards', {
          method: 'GET',
          credentials: 'include',
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to load benefits.');
        setData(payload);
      } catch (benefitsError: any) {
        setError(benefitsError?.message || 'Failed to load benefits.');
      } finally {
        setLoading(false);
      }
    };

    void fetchRewards();
  }, [user]);

  const effectiveConsumerSavingsPct = useMemo(() => {
    if (!data) return 0;
    if (data.consumerSavingsPct > 0) return data.consumerSavingsPct;
    return data.savingsRatePct;
  }, [data]);

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
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="bg-gradient-to-b from-primary to-primary/80 text-white p-6 md:p-8">
              <div className="text-center">
                <p className="font-headline font-semibold text-lg opacity-95">Your Savings</p>
                <p className="text-sm opacity-90 mt-1">Total Cash Saved</p>
                <p className="font-headline font-bold text-6xl mt-2">
                  R{Number(data?.totalCashSaved ?? 0).toFixed(0)}
                </p>
              </div>

              <div className="mt-6 grid md:grid-cols-3 rounded-xl overflow-hidden border border-white/20">
                <div className="bg-black/15 p-4 text-center">
                  <p className="text-sm opacity-90">This Month</p>
                  <p className="font-headline font-bold text-3xl">
                    R{Number(data?.thisMonthSavings ?? 0).toFixed(0)}
                  </p>
                </div>
                <div className="bg-black/10 p-4 text-center border-x border-white/20">
                  <p className="text-sm opacity-90">Avg Annual</p>
                  <p className="font-headline font-bold text-3xl">
                    R{Number(data?.averageAnnualSavings ?? 0).toFixed(0)}
                  </p>
                </div>
                <div className="bg-black/15 p-4 text-center">
                  <p className="text-sm opacity-90">Rate</p>
                  <p className="font-headline font-bold text-3xl">
                    {Number(data?.savingsRatePct ?? 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {error && (
                <div className="p-4 rounded-lg border border-error/20 bg-error/10">
                  <p className="text-sm text-error font-body">{error}</p>
                </div>
              )}

              <section className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center">
                    <Icon name="ArrowTrendingUpIcon" size={20} variant="outline" />
                  </div>
                  <div>
                    <h2 className="font-headline font-bold text-2xl text-foreground">Real Cash Impact</h2>
                    <p className="text-sm text-muted-foreground">Putting money back in your pocket</p>
                  </div>
                </div>
                <p className="text-foreground font-body">
                  Every time you spend{' '}
                  <span className="font-headline font-semibold">R100</span>, we put{' '}
                  <span className="font-headline font-semibold text-success">
                    R{Number(data?.cashbackPer100 ?? 0).toFixed(2)}
                  </span>{' '}
                  back in your wallet instantly. <strong>No points to count</strong>, just real savings on essentials.
                </p>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-muted-foreground">Your Monthly Spend</span>
                  <span className="font-headline font-bold text-2xl text-foreground">
                    R{Number(data?.thisMonthSpend ?? 0).toFixed(0)}
                  </span>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="InformationCircleIcon" size={18} variant="outline" className="text-primary" />
                  <h2 className="font-headline font-bold text-2xl text-foreground">How it Works</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Transparent breakdown of value</p>

                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
                    <span className="font-headline font-semibold text-foreground">Merchant Discount</span>
                    <span className="font-headline font-bold text-foreground">
                      {Number(data?.merchantDiscountPct ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-headline font-semibold text-foreground">Your Savings</span>
                    <span className="font-headline font-bold text-success">
                      {Number(effectiveConsumerSavingsPct).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="font-headline font-semibold text-foreground">Platform Fee</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        covers secure USSD access and operational costs
                      </p>
                    </div>
                    <span className="font-headline font-bold text-foreground">
                      {Number(data?.platformFeePct ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-headline font-bold text-2xl text-foreground mb-4">Recent Savings Activity</h2>
                {data?.recentTransactions?.length ? (
                  <div className="space-y-3">
                    {data.recentTransactions.slice(0, 8).map((tx) => (
                      <div key={tx.id} className="rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-headline font-semibold text-foreground">{tx.merchantName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-headline font-semibold text-foreground">
                              Paid: R{tx.amountPaid.toFixed(2)}
                            </p>
                            <p className="text-sm text-success">
                              Saved: R{tx.savingsRealized.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {tx.voucherCode && (
                          <p className="text-xs text-muted-foreground mt-2">Voucher: {tx.voucherCode}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No cashback transactions yet.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
