'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface ProfilePayload {
  profile: {
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
  } | null;
  transactions: Array<{
    id: string;
    merchant_name: string;
    amount: number;
    transaction_type: string;
    created_at: string;
  }>;
}

interface RewardPayload {
  tier: string;
  totalSavings: number;
  currentPoints: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<ProfilePayload | null>(null);
  const [rewardData, setRewardData] = useState<RewardPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'activity' | 'settings'>('transactions');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
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
          throw new Error(dashboardData.error || 'Failed to load profile dashboard.');
        }
        if (!rewardsRes.ok) {
          throw new Error(rewardsData.error || 'Failed to load rewards summary.');
        }

        setPayload({
          profile: dashboardData.profile ?? null,
          transactions: dashboardData.transactions ?? [],
        });
        setRewardData({
          tier: rewardsData.tier ?? 'Bronze',
          totalSavings: Number(rewardsData.totalSavings ?? 0),
          currentPoints: Number(rewardsData.currentPoints ?? 0),
        });
      } catch (profileError: any) {
        setError(profileError?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [user]);

  const displayName = useMemo(() => {
    const fromProfile = payload?.profile?.full_name?.trim();
    if (fromProfile) return fromProfile;
    return String(
      user?.user_metadata?.full_name ??
        user?.user_metadata?.name ??
        user?.email?.split('@')[0] ??
        'Consumer'
    ).trim();
  }, [payload?.profile?.full_name, user?.email, user?.user_metadata]);

  const displayEmail =
    payload?.profile?.email ||
    user?.email ||
    'consumer@evoucher.local';
  const profileInitial = displayName?.charAt(0)?.toUpperCase() || 'E';
  const joinedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString() : new Date().toLocaleDateString();

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
          {error && (
            <div className="p-4 rounded-lg border border-error/20 bg-error/10">
              <p className="text-sm text-error font-body">{error}</p>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-6 flex items-center justify-between">
              <h1 className="font-headline font-bold text-2xl text-white">Profile</h1>
              <Icon name="Cog6ToothIcon" size={20} variant="outline" className="text-white" />
            </div>

            <div className="px-6 pb-6">
              <div className="-mt-8 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-headline font-bold text-2xl border-4 border-card">
                  {profileInitial}
                </div>
              </div>
              <div className="text-center mt-3">
                <h2 className="font-headline font-bold text-3xl text-foreground">{displayName}</h2>
                <p className="text-muted-foreground">{displayEmail}</p>
                <p className="text-sm text-success mt-1">Verified Member since {joinedDate}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mt-6">
                <div className="rounded-xl bg-muted/40 border border-border p-4 text-center">
                  <p className="font-headline font-bold text-2xl text-foreground">R{Number(rewardData?.totalSavings ?? 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Saved</p>
                </div>
                <div className="rounded-xl bg-muted/40 border border-border p-4 text-center">
                  <p className="font-headline font-bold text-2xl text-foreground">{payload?.transactions.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>
                <div className="rounded-xl bg-muted/40 border border-border p-4 text-center">
                  <p className="font-headline font-bold text-2xl text-foreground">{rewardData?.tier ?? 'Bronze'}</p>
                  <p className="text-xs text-muted-foreground">Tier</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <button onClick={() => router.push('/wallet')} className="rounded-xl border border-border bg-card p-4 hover:bg-muted transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto mb-2">
                <Icon name="WalletIcon" size={18} variant="outline" />
              </div>
              <p className="text-sm font-headline font-semibold text-foreground text-center">Add Funds</p>
            </button>
            <button className="rounded-xl border border-border bg-card p-4 hover:bg-muted transition-colors">
              <div className="w-10 h-10 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto mb-2">
                <Icon name="GiftIcon" size={18} variant="outline" />
              </div>
              <p className="text-sm font-headline font-semibold text-foreground text-center">Refer</p>
            </button>
            <button onClick={() => router.push('/support')} className="rounded-xl border border-border bg-card p-4 hover:bg-muted transition-colors">
              <div className="w-10 h-10 rounded-full bg-warning/15 text-warning flex items-center justify-center mx-auto mb-2">
                <Icon name="QuestionMarkCircleIcon" size={18} variant="outline" />
              </div>
              <p className="text-sm font-headline font-semibold text-foreground text-center">Support</p>
            </button>
            <button className="rounded-xl border border-border bg-card p-4 hover:bg-muted transition-colors">
              <div className="w-10 h-10 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto mb-2">
                <Icon name="StarIcon" size={18} variant="outline" />
              </div>
              <p className="text-sm font-headline font-semibold text-foreground text-center">Rate</p>
            </button>
          </div>

          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="grid md:grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`rounded-lg px-4 py-2 text-sm font-headline font-semibold ${
                  activeTab === 'transactions' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`rounded-lg px-4 py-2 text-sm font-headline font-semibold ${
                  activeTab === 'activity' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                Activity
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`rounded-lg px-4 py-2 text-sm font-headline font-semibold ${
                  activeTab === 'settings' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                Settings
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-border p-5 min-h-36">
              {activeTab === 'transactions' && (
                <>
                  {(payload?.transactions ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-center py-10">No transactions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {(payload?.transactions ?? []).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div>
                            <p className="font-headline font-semibold text-foreground">{transaction.merchant_name}</p>
                            <p className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleString()}</p>
                          </div>
                          <p className="font-headline font-semibold text-foreground">R{Number(transaction.amount).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'activity' && (
                <div className="text-center py-10 text-muted-foreground">
                  Rewards points: <span className="font-headline font-semibold text-foreground">{rewardData?.currentPoints ?? 0}</span>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="text-center py-10 text-muted-foreground">
                  Account settings are managed via your secure authentication profile.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
