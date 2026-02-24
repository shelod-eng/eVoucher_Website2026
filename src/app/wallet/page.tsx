'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface Voucher {
  id: string;
  merchant_name: string;
  parent_brand: string | null;
  voucher_code: string;
  current_balance: number;
  face_value: number;
  consumer_price?: number | null;
  consumer_benefit_amount?: number | null;
  is_active: boolean;
  expires_at: string;
  redemption_scope?: 'all_branches' | 'specific_branch' | 'province_wide' | 'national' | null;
  valid_provinces?: string[] | null;
  valid_branch_ids?: string[] | null;
  qr_code_url?: string | null;
  redeemed_at_branch?: string | null;
  redeemed_at?: string | null;
}

interface WalletTransaction {
  id: string;
  merchant_name: string;
  amount: number;
  transaction_type: string;
  created_at: string;
}

interface PaymentTransaction {
  id: string;
  voucher_code: string | null;
  amount: number | null;
  card_brand: string | null;
  card_last_four: string | null;
  payment_status: string | null;
  created_at: string;
}

type WalletTab = 'active' | 'partial' | 'used' | 'expired';

function toCurrency(value: number) {
  return `R${Number(value).toFixed(2)}`;
}

function classifyVoucher(voucher: Voucher): WalletTab {
  const balance = Number(voucher.current_balance ?? 0);
  const face = Number(voucher.face_value ?? 0);
  const isExpired = new Date(voucher.expires_at).getTime() <= Date.now();
  if (isExpired && balance > 0) return 'expired';
  if (balance <= 0 || !voucher.is_active) return 'used';
  if (balance < face) return 'partial';
  return 'active';
}

function deriveSavingsBadge(totalSaved: number) {
  if (totalSaved >= 1000) return 'Gold Saver';
  if (totalSaved >= 250) return 'Silver Saver';
  if (totalSaved > 0) return 'Bronze Saver';
  return 'New Saver';
}

function formatPaymentMethod(tx?: PaymentTransaction) {
  if (!tx) return 'Not captured';
  const brand = String(tx.card_brand ?? '').trim();
  const lastFour = String(tx.card_last_four ?? '').trim();
  if (brand && lastFour) return `${brand.toUpperCase()} ****${lastFour}`;
  if (brand) return brand.toUpperCase();
  return 'Not captured';
}

function getScopeLabel(voucher: Voucher) {
  const scope = String(voucher.redemption_scope ?? 'all_branches').toLowerCase();
  const brand = voucher.parent_brand || voucher.merchant_name;
  if (scope === 'national') return 'Valid nationwide';
  if (scope === 'province_wide') {
    const provinces = Array.isArray(voucher.valid_provinces) ? voucher.valid_provinces : [];
    return provinces.length > 0
      ? `Valid in ${provinces.join(', ')}`
      : `Valid province-wide for ${brand}`;
  }
  if (scope === 'specific_branch') {
    const branches = Array.isArray(voucher.valid_branch_ids) ? voucher.valid_branch_ids : [];
    return branches.length > 0
      ? `Valid at ${branches.length} selected branch${branches.length === 1 ? '' : 'es'}`
      : 'Valid at selected branches';
  }
  return `Valid at all ${brand} locations`;
}

function getVoucherQrUrl(voucher: Voucher) {
  if (voucher.qr_code_url) return voucher.qr_code_url;
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    voucher.voucher_code
  )}`;
}

export default function WalletPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<WalletTab>('active');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const loadWallet = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/v1/customer/dashboard', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load wallet.');
        setVouchers(data.vouchers ?? []);
        setTransactions(data.transactions ?? []);
        setPaymentTransactions(data.paymentTransactions ?? []);
      } catch (walletError: any) {
        setError(walletError?.message || 'Failed to load wallet.');
      } finally {
        setLoading(false);
      }
    };

    void loadWallet();
  }, [user]);

  const voucherStatusBuckets = useMemo(() => {
    const buckets: Record<WalletTab, Voucher[]> = {
      active: [],
      partial: [],
      used: [],
      expired: [],
    };
    vouchers.forEach((voucher) => {
      buckets[classifyVoucher(voucher)].push(voucher);
    });
    return buckets;
  }, [vouchers]);

  const displayedVouchers = voucherStatusBuckets[tab];

  const totalBalance = useMemo(
    () => voucherStatusBuckets.active.reduce((sum, voucher) => sum + Number(voucher.current_balance ?? 0), 0),
    [voucherStatusBuckets]
  );

  const totalSaved = useMemo(
    () =>
      vouchers.reduce((sum, voucher) => {
        const face = Number(voucher.face_value ?? 0);
        const paid = Number(voucher.consumer_price ?? face);
        return sum + Number(voucher.consumer_benefit_amount ?? Math.max(0, face - paid));
      }, 0),
    [vouchers]
  );

  const voucherPaymentMap = useMemo(() => {
    const map = new Map<string, PaymentTransaction>();
    paymentTransactions.forEach((tx) => {
      if (!tx.voucher_code) return;
      if (!map.has(tx.voucher_code)) {
        map.set(tx.voucher_code, tx);
      }
    });
    return map;
  }, [paymentTransactions]);

  const recentActivity = useMemo(() => {
    const redemptionRows = transactions.map((tx) => ({
      id: `redemption-${tx.id}`,
      merchant: tx.merchant_name,
      type: tx.transaction_type || 'redemption',
      amount: Number(tx.amount ?? 0),
      savings: 0,
      createdAt: tx.created_at,
    }));

    const purchaseRows = paymentTransactions
      .filter((tx) => String(tx.payment_status ?? '').toLowerCase() === 'completed')
      .map((tx) => ({
        id: `purchase-${tx.id}`,
        merchant: 'Voucher Purchase',
        type: 'purchase',
        amount: Number(tx.amount ?? 0),
        savings: 0,
        createdAt: tx.created_at,
      }));

    return [...redemptionRows, ...purchaseRows]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [paymentTransactions, transactions]);

  const savingsByMerchant = useMemo(() => {
    const buckets = new Map<string, number>();
    vouchers.forEach((voucher) => {
      const merchant = voucher.parent_brand || voucher.merchant_name || 'Partner Merchant';
      const face = Number(voucher.face_value ?? 0);
      const paid = Number(voucher.consumer_price ?? face);
      const saved = Number(voucher.consumer_benefit_amount ?? Math.max(0, face - paid));
      buckets.set(merchant, (buckets.get(merchant) ?? 0) + saved);
    });
    return Array.from(buckets.entries())
      .map(([merchant, savings]) => ({ merchant, savings }))
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 4);
  }, [vouchers]);

  const thisMonthSavings = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return paymentTransactions
      .filter((tx) => tx.created_at.slice(0, 7) === currentMonth)
      .reduce((sum, tx) => {
        const matchVoucher = vouchers.find((voucher) => voucher.voucher_code === tx.voucher_code);
        if (!matchVoucher) return sum;
        const face = Number(matchVoucher.face_value ?? 0);
        const paid = Number(matchVoucher.consumer_price ?? face);
        return sum + Number(matchVoucher.consumer_benefit_amount ?? Math.max(0, face - paid));
      }, 0);
  }, [paymentTransactions, vouchers]);

  const achievements = useMemo(() => {
    const hasFirstSaver = totalSaved > 0;
    const hasR500Club = totalSaved >= 500;
    const hasLoyalShopper = paymentTransactions.length >= 5;
    return [
      { id: 'first-saver', label: 'First Saver', achieved: hasFirstSaver },
      { id: 'r500-club', label: 'R500 Club', achieved: hasR500Club },
      { id: 'loyal-shopper', label: 'Loyal Shopper', achieved: hasLoyalShopper },
    ];
  }, [paymentTransactions.length, totalSaved]);

  const handleCopyVoucherCode = async (voucherCode: string) => {
    try {
      await navigator.clipboard.writeText(voucherCode);
      setCopyMessage(`Copied ${voucherCode}`);
      window.setTimeout(() => setCopyMessage(''), 1400);
    } catch {
      setCopyMessage('Clipboard copy failed');
      window.setTimeout(() => setCopyMessage(''), 1400);
    }
  };

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

          {copyMessage && (
            <div className="p-3 rounded-lg border border-success/20 bg-success/10">
              <p className="text-xs text-success font-body">{copyMessage}</p>
            </div>
          )}

          <section className="rounded-2xl p-6 bg-gradient-to-r from-primary to-primary/85 text-white shadow-lg">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="font-headline font-bold text-4xl">Wallet</h1>
                <p className="text-sm opacity-90 mt-1">{deriveSavingsBadge(totalSaved)}</p>
              </div>
              <Icon name="QrCodeIcon" size={22} variant="outline" className="text-white" />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-white/15 p-5">
                <p className="text-sm opacity-90">Total Balance</p>
                <p className="font-headline font-bold text-5xl mt-1">{toCurrency(totalBalance)}</p>
              </div>
              <div className="rounded-xl bg-white/15 p-5">
                <p className="text-sm opacity-90">Total Saved</p>
                <p className="font-headline font-bold text-5xl mt-1">{toCurrency(totalSaved)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => router.push('/shop')}
                className="rounded-lg bg-white text-primary font-headline font-semibold py-2 hover:bg-white/90"
              >
                Add Voucher
              </button>
              <button
                onClick={() => router.push('/shop')}
                className="rounded-lg bg-white text-primary font-headline font-semibold py-2 hover:bg-white/90"
              >
                Buy More
              </button>
              <button
                onClick={() => router.push('/redeem')}
                className="rounded-lg bg-white/20 text-white font-headline font-semibold py-2"
              >
                Redeem
              </button>
              <button
                onClick={() => router.push('/benefits')}
                className="rounded-lg bg-white/20 text-white font-headline font-semibold py-2"
              >
                Benefits
              </button>
            </div>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-xl border border-border bg-card p-2">
            {(['active', 'partial', 'used', 'expired'] as WalletTab[]).map((status) => (
              <button
                key={status}
                onClick={() => setTab(status)}
                className={`rounded-lg py-2 text-sm font-headline font-semibold capitalize ${
                  tab === status ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                {status} ({voucherStatusBuckets[status].length})
              </button>
            ))}
          </section>

          <section className="space-y-3">
            {displayedVouchers.length === 0 ? (
              <div className="rounded-2xl border border-border p-10 text-center text-muted-foreground bg-card">
                No {tab} vouchers found.
              </div>
            ) : (
              displayedVouchers.map((voucher) => {
                const face = Number(voucher.face_value ?? 0);
                const paid = Number(voucher.consumer_price ?? face);
                const saved = Number(voucher.consumer_benefit_amount ?? Math.max(0, face - paid));
                const paymentMethod = formatPaymentMethod(voucherPaymentMap.get(voucher.voucher_code));
                const status = classifyVoucher(voucher);

                return (
                  <article key={voucher.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-headline font-bold text-3xl text-foreground">{voucher.voucher_code}</h3>
                        <p className="text-primary font-headline font-semibold">
                          {voucher.parent_brand || voucher.merchant_name}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs bg-success/15 text-success font-headline font-semibold capitalize">
                        {status}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Face Value</p>
                        <p className="font-headline font-bold text-3xl">{toCurrency(face)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Amount Paid</p>
                        <p className="font-headline font-bold text-3xl">{toCurrency(paid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="font-headline font-bold text-3xl text-success">
                          {toCurrency(Number(voucher.current_balance ?? 0))}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border grid md:grid-cols-2 gap-3">
                      <p className="text-sm text-muted-foreground">
                        Savings: <span className="font-headline text-success">- {toCurrency(saved)}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(voucher.expires_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Status: {status}</p>
                      <p className="text-sm text-muted-foreground">Payment Method: {paymentMethod}</p>
                      <p className="text-sm text-muted-foreground md:col-span-2">
                        Redemption: {getScopeLabel(voucher)}
                      </p>
                      {voucher.redeemed_at_branch && (
                        <p className="text-sm text-muted-foreground md:col-span-2">
                          Last redeemed at: {voucher.redeemed_at_branch}
                        </p>
                      )}
                    </div>

                    {(status === 'active' || status === 'partial') && (
                      <div className="mt-3 grid sm:grid-cols-3 gap-2">
                        <button
                          onClick={() => setSelectedVoucher(voucher)}
                          className="py-2 rounded-lg border border-primary text-primary font-headline font-semibold hover:bg-primary/10"
                        >
                          Show QR
                        </button>
                        <button
                          onClick={() => void handleCopyVoucherCode(voucher.voucher_code)}
                          className="py-2 rounded-lg border border-border text-foreground font-headline font-semibold hover:bg-muted"
                        >
                          Copy Code
                        </button>
                        <button
                          onClick={() =>
                            router.push(`/redeem?code=${encodeURIComponent(voucher.voucher_code)}`)
                          }
                          className="py-2 rounded-lg bg-primary text-primary-foreground font-headline font-semibold hover:bg-primary/90"
                        >
                          Redeem in Store
                        </button>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>

          <section className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-headline font-bold text-2xl text-foreground mb-4">Recent Activity</h2>
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground">No transactions yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-headline font-semibold text-foreground">{activity.merchant}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.type} - {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-headline font-semibold text-foreground">
                            {toCurrency(activity.amount)}
                          </p>
                          <p className="text-xs text-success">
                            Saved {toCurrency(Number(activity.savings ?? 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
              <div>
                <h2 className="font-headline font-bold text-2xl text-foreground mb-2">Savings Insights</h2>
                <p className="text-sm text-muted-foreground">
                  Every R100 spent = instant savings on voucher checkout.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This month saved: <span className="font-headline text-success">{toCurrency(thisMonthSavings)}</span>
                </p>
              </div>

              <div className="space-y-2">
                {savingsByMerchant.length === 0 ? (
                  <p className="text-muted-foreground">No merchant savings yet.</p>
                ) : (
                  savingsByMerchant.map((entry) => (
                    <div
                      key={entry.merchant}
                      className="rounded-lg border border-border px-3 py-2 flex items-center justify-between"
                    >
                      <span className="font-headline font-semibold text-foreground">{entry.merchant}</span>
                      <span className="font-headline font-bold text-success">{toCurrency(entry.savings)}</span>
                    </div>
                  ))
                )}
              </div>

              <div>
                <h3 className="font-headline font-bold text-xl text-foreground mb-2">Achievements</h3>
                <div className="grid gap-2">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`rounded-lg border px-3 py-2 flex items-center justify-between ${
                        achievement.achieved ? 'border-success/30 bg-success/10' : 'border-border bg-muted/20'
                      }`}
                    >
                      <span className="font-headline font-semibold text-foreground">{achievement.label}</span>
                      <span className={`text-xs font-headline ${achievement.achieved ? 'text-success' : 'text-muted-foreground'}`}>
                        {achievement.achieved ? 'Achieved' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-headline font-bold text-2xl text-foreground">Voucher QR</h3>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="px-3 py-2 rounded-lg border border-border hover:bg-muted"
              >
                Close
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{selectedVoucher.voucher_code}</p>
            <div className="rounded-xl border border-border bg-background p-4">
              <img
                src={getVoucherQrUrl(selectedVoucher)}
                alt={`QR for ${selectedVoucher.voucher_code}`}
                className="w-full h-auto rounded-lg"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">{getScopeLabel(selectedVoucher)}</p>
            <button
              onClick={() => void handleCopyVoucherCode(selectedVoucher.voucher_code)}
              className="mt-3 w-full py-2 rounded-lg border border-primary text-primary font-headline font-semibold hover:bg-primary/10"
            >
              Copy Voucher Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
