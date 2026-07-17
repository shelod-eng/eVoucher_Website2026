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
  totalCashSaved: number;
  thisMonthSavings: number;
  savingsRatePct: number;
}

function deriveBadge(saved: number) {
  if (saved >= 1000) return { label: 'Gold Saver', color: 'text-amber-600 bg-amber-50' };
  if (saved >= 250) return { label: 'Silver Saver', color: 'text-slate-500 bg-slate-100' };
  if (saved > 0) return { label: 'Bronze Saver', color: 'text-orange-600 bg-orange-50' };
  return { label: 'New Member', color: 'text-primary bg-primary/10' };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<ProfilePayload | null>(null);
  const [rewardData, setRewardData] = useState<RewardPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'activity' | 'settings'>('transactions');

  useEffect(() => {
    if (!authLoading && !user) router.push('/signin');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        setLoading(true); setError('');
        const [dashRes, rewRes] = await Promise.all([
          fetch('/api/v1/customer/dashboard', { credentials: 'include' }),
          fetch('/api/v1/customer/rewards', { credentials: 'include' }),
        ]);
        const dash = await dashRes.json();
        const rew = await rewRes.json();
        if (!dashRes.ok) throw new Error(dash.error || 'Failed to load profile.');
        if (!rewRes.ok) throw new Error(rew.error || 'Failed to load rewards.');
        setPayload({ profile: dash.profile ?? null, transactions: dash.transactions ?? [] });
        setRewardData({
          totalCashSaved: Number(rew.totalCashSaved ?? 0),
          thisMonthSavings: Number(rew.thisMonthSavings ?? 0),
          savingsRatePct: Number(rew.savingsRatePct ?? 0),
        });
      } catch (e: any) { setError(e?.message || 'Failed to load profile.'); }
      finally { setLoading(false); }
    };
    void load();
  }, [user]);

  const displayName = useMemo(() => {
    const n = payload?.profile?.full_name?.trim();
    if (n) return n;
    return String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Consumer').trim();
  }, [payload, user]);

  const firstName = displayName.split(' ')[0];
  const displayEmail = payload?.profile?.email || user?.email || '';
  const displayPhone = payload?.profile?.phone || '';
  const profileInitial = displayName.charAt(0).toUpperCase() || 'E';
  const joinedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }) : '';
  const totalSaved = rewardData?.totalCashSaved ?? 0;
  const badge = deriveBadge(totalSaved);

  const QUICK_ACTIONS = [
    { icon: 'WalletIcon', label: 'Top Up', color: 'bg-primary/10 text-primary', onClick: () => router.push('/buy-vouchers?walletTopup=1') },
    { icon: 'GiftIcon', label: 'Refer', color: 'bg-secondary/10 text-secondary', onClick: () => {} },
    { icon: 'QuestionMarkCircleIcon', label: 'Support', color: 'bg-amber-50 text-amber-600', onClick: () => router.push('/support') },
    { icon: 'StarIcon', label: 'Benefits', color: 'bg-success/10 text-success', onClick: () => router.push('/benefits') },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="mx-auto max-w-4xl px-4 pt-24">
          <div className="animate-pulse space-y-4">
            <div className="h-48 rounded-3xl bg-muted" />
            <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted" />)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-20 lg:px-6">

        {error && (
          <div className="mb-4 rounded-xl border border-error/20 bg-error/10 p-4">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* ── Profile hero ── */}
        <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#0891b2] shadow-xl">
          <div className="p-6 pb-10 text-white">
            <p className="font-headline text-xs font-semibold uppercase tracking-widest text-white/60">My Account</p>
            <h1 className="font-headline text-2xl font-bold">Hello, {firstName} 👋</h1>
            <p className="mt-0.5 text-sm text-white/70">Member since {joinedDate}</p>
          </div>
          {/* Avatar card overlapping */}
          <div className="relative -mt-6 mx-4 mb-0 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white font-headline text-2xl font-bold text-primary shadow-md">
                {profileInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-headline text-lg font-bold text-white">{displayName}</p>
                {displayEmail && <p className="text-sm text-white/70 truncate">{displayEmail}</p>}
                {displayPhone && <p className="text-sm text-white/70">{displayPhone}</p>}
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 font-headline text-xs font-bold ${badge.color}`}>{badge.label}</span>
            </div>
          </div>
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-0 divide-x divide-white/10 p-5 pt-4">
            {[
              { label: 'Total Saved', value: `R${totalSaved.toFixed(0)}`, color: 'text-[#6ee7b7]' },
              { label: 'Transactions', value: String(payload?.transactions.length ?? 0), color: 'text-white' },
              { label: 'Savings Rate', value: `${(rewardData?.savingsRatePct ?? 0).toFixed(1)}%`, color: 'text-white' },
            ].map(s => (
              <div key={s.label} className="px-4 text-center">
                <p className={`font-headline text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quick Actions ── */}
        <section className="mb-6 grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(a => (
            <button key={a.label} onClick={a.onClick}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${a.color}`}>
                <Icon name={a.icon as any} size={20} variant="outline" />
              </div>
              <p className="font-headline text-xs font-bold text-foreground">{a.label}</p>
            </button>
          ))}
        </section>

        {/* ── Tabs ── */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex border-b border-border">
            {(['transactions', 'activity', 'settings'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3.5 font-headline text-sm font-bold capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Transactions tab */}
            {activeTab === 'transactions' && (
              (payload?.transactions ?? []).length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <span className="mb-3 text-4xl">📋</span>
                  <p className="font-headline font-semibold text-foreground">No transactions yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Your redemption history will appear here</p>
                  <button onClick={() => router.push('/shop')}
                    className="mt-4 rounded-xl bg-primary px-6 py-2.5 font-headline text-sm font-bold text-white hover:bg-primary/90">
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="relative space-y-0">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
                  {(payload?.transactions ?? []).map((tx, i) => {
                    const date = new Date(tx.created_at);
                    const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
                    const label = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
                    return (
                      <div key={tx.id} className={`relative flex gap-4 pb-4 ${i === (payload?.transactions.length ?? 0) - 1 ? 'pb-0' : ''}`}>
                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white text-xs font-bold text-primary">✓</div>
                        <div className="flex flex-1 items-start justify-between rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
                          <div>
                            <p className="font-headline text-sm font-bold text-foreground">{tx.merchant_name}</p>
                            <p className="text-[11px] text-muted-foreground capitalize">{tx.transaction_type.replace('_', ' ')} · {label}</p>
                          </div>
                          <p className="font-headline text-sm font-semibold text-foreground">R{Number(tx.amount).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Activity tab */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-border">
                  <div className="bg-gradient-to-r from-primary/5 to-teal-50 p-4">
                    <p className="font-headline text-xs font-semibold uppercase tracking-widest text-primary">This Month</p>
                    <p className="font-headline text-3xl font-bold text-foreground mt-1">
                      R{(rewardData?.thisMonthSavings ?? 0).toFixed(2)}
                      <span className="ml-2 font-headline text-sm font-semibold text-success">saved</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'All-time Savings', value: `R${totalSaved.toFixed(2)}`, icon: '💰' },
                    { label: 'Savings Rate', value: `${(rewardData?.savingsRatePct ?? 0).toFixed(1)}%`, icon: '📈' },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                      <span className="text-2xl">{s.icon}</span>
                      <p className="mt-2 font-headline text-xl font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* Achievement badges */}
                <div>
                  <p className="mb-3 font-headline text-sm font-bold text-foreground">Achievements</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'First Saver', achieved: totalSaved > 0, emoji: '🥉' },
                      { label: 'R500 Club', achieved: totalSaved >= 500, emoji: '🥈' },
                      { label: 'Gold Saver', achieved: totalSaved >= 1000, emoji: '🥇' },
                    ].map(a => (
                      <div key={a.label} className={`rounded-2xl border p-3 text-center ${a.achieved ? 'border-success/30 bg-success/5' : 'border-border bg-muted/20 opacity-50'}`}>
                        <span className="text-2xl">{a.emoji}</span>
                        <p className="mt-1 font-headline text-[11px] font-bold text-foreground">{a.label}</p>
                        <p className={`text-[10px] font-semibold ${a.achieved ? 'text-success' : 'text-muted-foreground'}`}>{a.achieved ? 'Achieved' : 'Locked'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Settings tab */}
            {activeTab === 'settings' && (
              <div className="space-y-3">
                {[
                  { icon: 'UserCircleIcon', label: 'Full Name', value: displayName },
                  { icon: 'EnvelopeIcon', label: 'Email', value: displayEmail },
                  { icon: 'PhoneIcon', label: 'Phone', value: displayPhone || 'Not set' },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={row.icon as any} size={18} variant="outline" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-headline text-xs font-semibold text-muted-foreground">{row.label}</p>
                      <p className="font-headline text-sm font-bold text-foreground truncate">{row.value}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <button
                    onClick={async () => { await signOut(); router.push('/signin'); }}
                    className="w-full rounded-2xl border border-error/30 bg-error/5 py-3.5 font-headline text-sm font-bold text-error transition-colors hover:bg-error/10">
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
