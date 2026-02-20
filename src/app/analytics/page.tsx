'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface OverviewMetrics {
  totalVolume: number;
  totalSavings: number;
  totalMargin: number;
  pendingSettlements: number;
  paidSettlements: number;
  transactionCount: number;
  averageDiscountPct: number;
  roiPct: number;
}

interface MonthlyRow {
  month: string;
  volume: number;
  savings: number;
  margin: number;
}

interface OverviewPayload {
  role: string;
  metrics: OverviewMetrics;
  monthlySeries: MonthlyRow[];
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
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-headline font-bold text-3xl text-foreground">Analytics</h1>
                <p className="text-muted-foreground font-body">
                  Unified transaction, savings, and settlement insights across mobile and web activity.
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href="/api/v1/analytics/export?type=monthly"
                  className="px-4 py-3 rounded-lg border border-border font-headline font-semibold hover:bg-muted"
                >
                  Export Monthly CSV
                </a>
                <a
                  href="/api/v1/analytics/export?type=transactions"
                  className="px-4 py-3 rounded-lg bg-primary text-primary-foreground font-headline font-semibold"
                >
                  Export Transactions CSV
                </a>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg border border-error/20 bg-error/10">
              <p className="text-sm text-error font-body">{error}</p>
            </div>
          )}

          {payload && (
            <>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="text-3xl font-headline font-bold text-foreground mt-2">
                    R{Number(payload.metrics.totalVolume).toFixed(2)}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <p className="text-sm text-muted-foreground">Consumer Savings</p>
                  <p className="text-3xl font-headline font-bold text-success mt-2">
                    R{Number(payload.metrics.totalSavings).toFixed(2)}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <p className="text-sm text-muted-foreground">Platform Margin</p>
                  <p className="text-3xl font-headline font-bold text-primary mt-2">
                    R{Number(payload.metrics.totalMargin).toFixed(2)}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-3xl font-headline font-bold text-foreground mt-2">
                    {payload.metrics.transactionCount}
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-headline font-bold text-xl text-foreground mb-4">
                  Monthly Performance
                </h2>
                {payload.monthlySeries.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon
                      name="ChartBarIcon"
                      size={44}
                      variant="outline"
                      className="text-muted-foreground mx-auto mb-3"
                    />
                    <p className="text-muted-foreground font-body">No completed transactions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payload.monthlySeries.map((row) => (
                      <div key={row.month} className="rounded-xl border border-border p-4 bg-muted/30">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-headline font-semibold text-foreground">{row.month}</p>
                          <div className="text-sm text-muted-foreground font-body">
                            Volume: R{Number(row.volume).toFixed(2)} | Savings: R
                            {Number(row.savings).toFixed(2)} | Margin: R
                            {Number(row.margin).toFixed(2)}
                          </div>
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

