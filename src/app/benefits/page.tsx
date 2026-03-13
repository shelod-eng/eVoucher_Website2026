'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface MonthlySeriesPoint {
  month: string;
  spent: number;
  savings: number;
}

interface RecentTransaction {
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
  cashbackPer100: number;
  merchantDiscountPct: number;
  consumerSavingsPct: number;
  platformFeePct: number;
  monthlySeries: MonthlySeriesPoint[];
  recentTransactions: RecentTransaction[];
}

function formatRand(value: number, digits = 0) {
  return `R${Number(value || 0).toFixed(digits)}`;
}

function formatMonth(month: string) {
  const [year, monthNumber] = String(month)
    .split('-')
    .map((value) => Number(value));
  if (!year || !monthNumber) return month;
  const date = new Date(Date.UTC(year, monthNumber - 1, 1));
  return date.toLocaleString('en-ZA', { month: 'short', year: 'numeric' });
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
        <div className="max-w-3xl mx-auto space-y-6">
          {error && (
            <div className="p-4 rounded-lg border border-error/20 bg-error/10">
              <p className="text-sm text-error font-body">{error}</p>
            </div>
          )}

          <section className="rounded-2xl p-6 md:p-8 bg-gradient-to-b from-primary to-primary/85 text-white shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/25 flex items-center justify-center"
              >
                <Icon name="ChevronLeftIcon" size={20} variant="outline" />
              </button>
              <h1 className="font-headline font-bold text-4xl">Your Savings</h1>
              <button
                onClick={() => router.push('/wallet')}
                className="w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/25 flex items-center justify-center"
              >
                <Icon name="ArrowRightOnRectangleIcon" size={20} variant="outline" />
              </button>
            </div>

            <div className="text-center">
              <p className="text-lg opacity-90 mt-4">Total Cash Saved</p>
              <p className="font-headline font-bold text-8xl mt-2">
                {formatRand(data?.totalCashSaved ?? 0)}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 rounded-xl overflow-hidden border border-white/20">
              <div className="p-4 text-center bg-black/15">
                <p className="text-sm opacity-90">This Month</p>
                <p className="font-headline font-bold text-3xl">
                  {formatRand(data?.thisMonthSavings ?? 0)}
                </p>
              </div>
              <div className="p-4 text-center bg-black/10 border-x border-white/20">
                <p className="text-sm opacity-90">Avg Annual</p>
                <p className="font-headline font-bold text-3xl">
                  {formatRand(data?.averageAnnualSavings ?? 0)}
                </p>
              </div>
              <div className="p-4 text-center bg-black/15">
                <p className="text-sm opacity-90">Rate</p>
                <p className="font-headline font-bold text-3xl text-[#9df3c4]">
                  {Number(data?.savingsRatePct ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center">
                <Icon name="ArrowTrendingUpIcon" size={24} variant="outline" />
              </div>
              <div>
                <h2 className="font-headline font-bold text-4xl text-foreground">
                  Real Cash Impact
                </h2>
                <p className="text-sm text-muted-foreground">Putting money back in your pocket</p>
              </div>
            </div>

            <p className="text-lg text-foreground leading-8">
              Every time you spend <span className="font-headline font-semibold">R100</span>, we put{' '}
              <span className="font-headline font-semibold text-success">
                R{Number(data?.cashbackPer100 ?? 0).toFixed(2)}
              </span>{' '}
              back in your wallet instantly. No points to count, just real savings on essentials.
            </p>

            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-2xl text-muted-foreground">Your Monthly Spend</span>
              <span className="font-headline font-bold text-4xl text-foreground">
                {formatRand(data?.thisMonthSpend ?? 0)}
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon
                name="InformationCircleIcon"
                size={18}
                variant="outline"
                className="text-primary"
              />
              <h2 className="font-headline font-bold text-2xl text-foreground">How It Works</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Transparent breakdown of value</p>

            <div className="space-y-2">
              <div className="rounded-lg border border-border bg-background px-4 py-3 flex items-center justify-between">
                <span className="text-foreground font-body">Merchant Discount</span>
                <span className="font-headline font-bold text-foreground">
                  {Number(data?.merchantDiscountPct ?? 0).toFixed(1)}%
                </span>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3 flex items-center justify-between">
                <span className="text-foreground font-body">Your Savings</span>
                <span className="font-headline font-bold text-success">
                  {Number(data?.consumerSavingsPct ?? 0).toFixed(1)}%
                </span>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-foreground font-body">Platform Fee</p>
                  <p className="text-xs text-muted-foreground">
                    Covers secure USSD access and operational costs
                  </p>
                </div>
                <span className="font-headline font-bold text-foreground">
                  {Number(data?.platformFeePct ?? 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon
                  name="DocumentTextIcon"
                  size={18}
                  variant="outline"
                  className="text-primary"
                />
                <h2 className="font-headline font-bold text-2xl text-foreground">
                  Monthly Statements
                </h2>
              </div>
              <button
                onClick={() => router.push('/analytics')}
                className="text-sm font-headline font-semibold text-primary hover:underline"
              >
                View detailed savings report
              </button>
            </div>

            {Array.isArray(data?.monthlySeries) && data.monthlySeries.length > 0 ? (
              <div className="space-y-2">
                {[...data.monthlySeries]
                  .sort((a, b) => b.month.localeCompare(a.month))
                  .slice(0, 6)
                  .map((entry) => (
                    <div
                      key={entry.month}
                      className="rounded-lg border border-border bg-background px-4 py-3 grid grid-cols-3 gap-3"
                    >
                      <div>
                        <p className="text-xs text-muted-foreground">Month</p>
                        <p className="font-headline font-semibold text-foreground">
                          {formatMonth(entry.month)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Spend</p>
                        <p className="font-headline font-semibold text-foreground">
                          {formatRand(entry.spent, 2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Saved</p>
                        <p className="font-headline font-semibold text-success">
                          {formatRand(entry.savings, 2)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No statement data yet. Start buying vouchers to build your savings history.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
