'use client';

import { useEffect, useState } from 'react';
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
                  <p className="text-4xl font-headline font-bold text-foreground">
                    R{Number(payload.metrics.totalVolume).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-5">
                  <p className="text-4xl font-headline font-bold text-foreground">
                    R{Number(payload.metrics.totalSavings).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Saved</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-5">
                  <p className="text-4xl font-headline font-bold text-foreground">
                    {Number(payload.metrics.roiPct).toFixed(0)}%
                  </p>
                  <p className="text-sm text-muted-foreground">% Saved</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-5">
                  <p className="text-4xl font-headline font-bold text-foreground">
                    {payload.metrics.transactionCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h2 className="font-headline font-bold text-2xl text-foreground mb-4">Monthly Spending</h2>
                  {payload.monthlySeries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">No data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {payload.monthlySeries.map((row) => (
                        <div key={row.month} className="rounded-xl border border-border p-3">
                          <div className="flex justify-between items-center">
                            <p className="font-headline font-semibold text-foreground">{row.month}</p>
                            <p className="text-sm text-muted-foreground">R{Number(row.volume).toFixed(2)}</p>
                          </div>
                          <p className="text-xs text-success mt-1">Saved: R{Number(row.savings).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-5">
                  <h2 className="font-headline font-bold text-2xl text-foreground mb-4">Spend by Merchant</h2>
                  {payload.merchantSeries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">No data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {payload.merchantSeries.map((row) => (
                        <div key={row.merchantId} className="rounded-xl border border-border p-3">
                          <div className="flex justify-between items-center">
                            <p className="font-headline font-semibold text-foreground">{row.merchantName}</p>
                            <p className="text-sm text-muted-foreground">R{Number(row.spent).toFixed(2)}</p>
                          </div>
                          <p className="text-xs text-success mt-1">Saved: R{Number(row.savings).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5">
                <h2 className="font-headline font-bold text-2xl text-foreground mb-4">Recent Transactions</h2>
                {payload.recentTransactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {payload.recentTransactions.map((row, idx) => (
                      <div key={`${row.created_at}-${idx}`} className="rounded-xl border border-border p-3 flex justify-between items-center">
                        <div>
                          <p className="font-headline font-semibold text-foreground">{row.merchant_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(row.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-headline font-semibold text-foreground">R{Number(row.amount).toFixed(2)}</p>
                          <p className="text-xs text-success">Saved: R{Number(row.savings).toFixed(2)}</p>
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
