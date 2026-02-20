'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';

interface MonthlySeriesItem {
  month: string;
  spent: number;
  savings: number;
}

interface RewardsPayload {
  points: number;
  currentPoints: number;
  lifetimePoints: number;
  pendingPoints: number;
  expiredPoints: number;
  expiringSoonPoints: number;
  tier: string;
  totalSpent: number;
  totalSavings: number;
  totalPlatformBenefit: number;
  activeVouchers: number;
  monthlySeries: MonthlySeriesItem[];
}

export default function RewardsPage() {
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
        if (!response.ok) throw new Error(payload.error || 'Failed to load rewards.');
        setData(payload);
      } catch (rewardsError: any) {
        setError(rewardsError?.message || 'Failed to load rewards.');
      } finally {
        setLoading(false);
      }
    };

    void fetchRewards();
  }, [user]);

  const nextTierThreshold = useMemo(() => {
    if (!data) return null;
    if (data.tier === 'Bronze') return 1500;
    if (data.tier === 'Silver') return 5000;
    if (data.tier === 'Gold') return 10000;
    return null;
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
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h1 className="font-headline font-bold text-3xl text-foreground">Rewards</h1>
            <p className="text-muted-foreground font-body">
              Track points, savings impact, and reward tier synced with your wallet activity.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg border border-error/20 bg-error/10">
              <p className="text-sm text-error font-body">{error}</p>
            </div>
          )}

          {data && (
            <>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-6">
                  <p className="text-sm opacity-90">Points Balance</p>
                  <p className="text-4xl font-headline font-bold mt-2">{data.currentPoints}</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <p className="text-sm text-muted-foreground">Current Tier</p>
                  <p className="text-3xl font-headline font-bold text-foreground mt-2">{data.tier}</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <p className="text-sm text-muted-foreground">Total Savings</p>
                  <p className="text-3xl font-headline font-bold text-success mt-2">
                    R{data.totalSavings.toFixed(2)}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <p className="text-sm text-muted-foreground">Active Vouchers</p>
                  <p className="text-3xl font-headline font-bold text-foreground mt-2">
                    {data.activeVouchers}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-card rounded-2xl border border-border p-6">
                  <p className="text-sm text-muted-foreground">Lifetime Points</p>
                  <p className="text-2xl font-headline font-bold text-foreground mt-2">
                    {data.lifetimePoints}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <p className="text-sm text-muted-foreground">Pending Points</p>
                  <p className="text-2xl font-headline font-bold text-warning mt-2">
                    {data.pendingPoints}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <p className="text-sm text-muted-foreground">Points Expiring Soon</p>
                  <p className="text-2xl font-headline font-bold text-error mt-2">
                    {data.expiringSoonPoints}
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-headline font-bold text-xl text-foreground mb-3">Tier Progress</h2>
                {nextTierThreshold ? (
                  <p className="text-muted-foreground font-body">
                    You need{' '}
                    <span className="font-headline font-semibold">
                      {Math.max(0, nextTierThreshold - data.currentPoints)}
                    </span>{' '}
                    more points to reach the next tier.
                  </p>
                ) : (
                  <p className="text-muted-foreground font-body">
                    You are on the highest tier. Keep transacting to grow your impact.
                  </p>
                )}
                {data.expiredPoints > 0 && (
                  <p className="text-sm text-warning font-body mt-2">
                    {data.expiredPoints} points are outside the 12-month rewards window.
                  </p>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-headline font-bold text-xl text-foreground mb-4">Monthly Rewards Activity</h2>
                <div className="space-y-3">
                  {data.monthlySeries.length === 0 ? (
                    <p className="text-muted-foreground font-body">No monthly rewards activity yet.</p>
                  ) : (
                    data.monthlySeries.map((entry) => (
                      <div key={entry.month} className="rounded-xl border border-border p-4 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <p className="font-headline font-semibold text-foreground">{entry.month}</p>
                          <p className="text-sm text-muted-foreground">Spent: R{entry.spent.toFixed(2)}</p>
                        </div>
                        <p className="text-sm text-success mt-1">
                          Savings earned: R{entry.savings.toFixed(2)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
