'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';

interface OverviewMetrics {
  totalVolume: number;
  totalSavings: number;
  totalMargin: number;
  transactionCount: number;
  roiPct: number;
}

interface MonthlyRow {
  month: string;
  volume: number;
  savings: number;
}

interface MerchantRow {
  merchantId: string;
  merchantName: string;
  spent: number;
  savings: number;
}

interface RecentTransactionRow {
  created_at: string;
  merchant_name: string;
  amount: number;
  savings: number;
}

interface OverviewPayload {
  role: string;
  metrics: OverviewMetrics;
  monthlySeries: MonthlyRow[];
  merchantSeries: MerchantRow[];
  recentTransactions: RecentTransactionRow[];
}

function toCurrency(value: number) {
  return `R${Number(value ?? 0).toFixed(2)}`;
}

const CHART_COLORS = ['#10B981', '#14B8A6', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<OverviewPayload | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/v1/analytics/overview', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load analytics.');
        setPayload(data);
      } catch (overviewError: any) {
        setError(overviewError?.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    void fetchOverview();
  }, [user]);

  const maxMonthlyVolume = useMemo(() => {
    const values = payload?.monthlySeries?.map((row) => Number(row.volume ?? 0)) ?? [];
    return Math.max(...values, 1);
  }, [payload]);

  const totalMerchantSpend = useMemo(() => {
    return (payload?.merchantSeries ?? []).reduce((sum, row) => sum + Number(row.spent ?? 0), 0);
  }, [payload]);

  const donutStops = useMemo(() => {
    const rows = payload?.merchantSeries ?? [];
    if (rows.length === 0 || totalMerchantSpend <= 0) return '';
    let cursor = 0;
    const stops: string[] = [];
    rows.forEach((row, index) => {
      const percent = (Number(row.spent ?? 0) / totalMerchantSpend) * 100;
      const next = cursor + percent;
      const color = CHART_COLORS[index % CHART_COLORS.length];
      stops.push(`${color} ${cursor.toFixed(2)}% ${next.toFixed(2)}%`);
      cursor = next;
    });
    return `conic-gradient(${stops.join(',')})`;
  }, [payload, totalMerchantSpend]);

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
          <div>
            <h1 className="font-headline font-bold text-5xl text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Track your spending and savings</p>
          </div>

          {error && (
            <div className="p-4 rounded-lg border border-error/20 bg-error/10">
              <p className="text-sm text-error font-body">{error}</p>
            </div>
          )}

          {payload && (
            <>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl border border-border p-5">
                  <p className="font-headline font-bold text-5xl text-foreground">
                    {toCurrency(payload.metrics.totalVolume)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-5">
                  <p className="font-headline font-bold text-5xl text-foreground">
                    {toCurrency(payload.metrics.totalSavings)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Saved</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-5">
                  <p className="font-headline font-bold text-5xl text-foreground">
                    {Number(payload.metrics.roiPct).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">% Saved</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-5">
                  <p className="font-headline font-bold text-5xl text-foreground">
                    {payload.metrics.transactionCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h2 className="font-headline font-bold text-3xl text-foreground mb-4">Monthly Spending</h2>
                  {payload.monthlySeries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-16">No data yet</p>
                  ) : (
                    <div className="space-y-4">
                      {payload.monthlySeries.map((row) => {
                        const widthPct = (Number(row.volume) / maxMonthlyVolume) * 100;
                        return (
                          <div key={row.month}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-muted-foreground">{row.month}</span>
                              <span className="text-sm font-headline font-semibold text-foreground">
                                {toCurrency(row.volume)}
                              </span>
                            </div>
                            <div className="h-8 rounded-lg bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${Math.max(4, widthPct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-5">
                  <h2 className="font-headline font-bold text-3xl text-foreground mb-4">Spend by Merchant</h2>
                  {payload.merchantSeries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-16">No data yet</p>
                  ) : (
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div
                        className="w-44 h-44 rounded-full relative shrink-0"
                        style={{ background: donutStops || '#E5E7EB' }}
                      >
                        <div className="absolute inset-8 rounded-full bg-card" />
                      </div>
                      <div className="space-y-2 w-full">
                        {payload.merchantSeries.map((row, index) => (
                          <div key={row.merchantId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <span className="text-sm text-foreground">{row.merchantName}</span>
                            </div>
                            <span className="font-headline font-semibold text-foreground">
                              {toCurrency(row.spent)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5">
                <h2 className="font-headline font-bold text-3xl text-foreground mb-4">Recent Transactions</h2>
                {payload.recentTransactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {payload.recentTransactions.map((row, idx) => (
                      <div
                        key={`${row.created_at}-${idx}`}
                        className="rounded-xl border border-border p-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-headline font-semibold text-foreground">{row.merchant_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(row.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-headline font-semibold text-foreground">{toCurrency(row.amount)}</p>
                          <p className="text-xs text-success">Saved: {toCurrency(row.savings)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
