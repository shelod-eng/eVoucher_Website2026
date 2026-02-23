'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface RewardsPayload {
  totalCashSaved: number;
  thisMonthSavings: number;
  averageAnnualSavings: number;
  savingsRatePct: number;
  thisMonthSpend: number;
  cashbackPer100: number;
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

          <section className="rounded-2xl p-6 md:p-8 bg-gradient-to-b from-primary to-primary/85 text-white">
            <div className="text-center">
              <h1 className="font-headline font-bold text-5xl">Your Savings</h1>
              <p className="text-lg opacity-90 mt-4">Total Cash Saved</p>
              <p className="font-headline font-bold text-8xl mt-2">
                R{Number(data?.totalCashSaved ?? 0).toFixed(0)}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 rounded-xl overflow-hidden border border-white/20">
              <div className="p-4 text-center bg-black/15">
                <p className="text-sm opacity-90">This Month</p>
                <p className="font-headline font-bold text-3xl">
                  R{Number(data?.thisMonthSavings ?? 0).toFixed(0)}
                </p>
              </div>
              <div className="p-4 text-center bg-black/10 border-x border-white/20">
                <p className="text-sm opacity-90">Avg Annual</p>
                <p className="font-headline font-bold text-3xl">
                  R{Number(data?.averageAnnualSavings ?? 0).toFixed(0)}
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
                <h2 className="font-headline font-bold text-4xl text-foreground">Real Cash Impact</h2>
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
                R{Number(data?.thisMonthSpend ?? 0).toFixed(0)}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
