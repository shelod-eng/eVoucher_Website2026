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
  merchant_id?: string | null;
  voucher_code: string | null;
  amount: number | null;
  card_brand: string | null;
  card_last_four: string | null;
  payment_status: string | null;
  created_at: string;
}

interface MerchantOption {
  id: string;
  businessName: string;
}

type WalletTab = 'active' | 'partial' | 'used' | 'expired';
const WALLET_TOPUP_HINT_KEY = 'evoucher.wallet.topup.hint.v1';
const TOPUP_HINT_MAX_AGE_MS = 1000 * 60 * 30; // 30 minutes

interface WalletTopupHint {
  userId: string;
  transactionReference: string | null;
  walletBalance: number;
  amount: number;
  createdAt: string;
}

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
  if (scope === 'national') return 'Redeemable at any participating eVoucher store nationwide';
  return 'Redeemable at any participating eVoucher store';
}

function getVoucherQrUrl(voucher: Voucher) {
  if (voucher.qr_code_url) return voucher.qr_code_url;
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    voucher.voucher_code
  )}`;
}

function getPaymentDerivedWalletBalance(paymentTransactions: PaymentTransaction[]) {
  const credits = paymentTransactions.reduce((sum, tx) => {
    const status = String(tx.payment_status ?? '')
      .toLowerCase()
      .trim();
    const isCompleted =
      !status || status === 'completed' || status === 'paid' || status === 'success';
    if (!isCompleted) return sum;
    if (tx.voucher_code || tx.merchant_id) return sum;
    const amount = Number(tx.amount ?? 0);
    return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
  }, 0);

  const debits = paymentTransactions.reduce((sum, tx) => {
    const status = String(tx.payment_status ?? '')
      .toLowerCase()
      .trim();
    const isCompleted =
      !status || status === 'completed' || status === 'paid' || status === 'success';
    if (!isCompleted) return sum;
    const cardBrand = String(tx.card_brand ?? '')
      .toUpperCase()
      .trim();
    if (cardBrand !== 'WALLET') return sum;
    const amount = Number(tx.amount ?? 0);
    return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
  }, 0);

  return Number(Math.max(credits - debits, 0).toFixed(2));
}

function readWalletTopupHint(userId: string): WalletTopupHint | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(WALLET_TOPUP_HINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WalletTopupHint;
    if (!parsed || parsed.userId !== userId) return null;
    const createdAtMs = new Date(parsed.createdAt).getTime();
    if (!Number.isFinite(createdAtMs) || Date.now() - createdAtMs > TOPUP_HINT_MAX_AGE_MS) {
      return null;
    }
    const walletBalance = Number(parsed.walletBalance ?? 0);
    if (!Number.isFinite(walletBalance) || walletBalance < 0) return null;
    return {
      ...parsed,
      walletBalance: Number(walletBalance.toFixed(2)),
    };
  } catch {
    return null;
  }
}

function clearWalletTopupHint() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(WALLET_TOPUP_HINT_KEY);
  } catch {
    // Ignore localStorage failures.
  }
}

export default function WalletPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<WalletTab>('active');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [copyMessage, setCopyMessage] = useState('');
  const [topupHintBalance, setTopupHintBalance] = useState<number>(0);
  const [walletRefreshKey, setWalletRefreshKey] = useState(0);
  const [addVoucherOpen, setAddVoucherOpen] = useState(false);
  const [addVoucherCode, setAddVoucherCode] = useState('');
  const [addVoucherAmount, setAddVoucherAmount] = useState('100');
  const [addVoucherMerchantId, setAddVoucherMerchantId] = useState('');
  const [addVoucherMerchants, setAddVoucherMerchants] = useState<MerchantOption[]>([]);
  const [addVoucherProcessing, setAddVoucherProcessing] = useState(false);
  const [addVoucherError, setAddVoucherError] = useState('');
  const topUpHref = '/buy-vouchers?walletTopup=1';

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
        const response = await fetch(`/api/v1/customer/dashboard?_ts=${Date.now()}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load wallet.');
        const walletBalanceFromServer = Number(data.walletBalance ?? 0);
        const paymentDerivedBalance = getPaymentDerivedWalletBalance(
          data.paymentTransactions ?? []
        );
        const resolvedWalletBalance = Number(
          Math.max(walletBalanceFromServer, paymentDerivedBalance, topupHintBalance).toFixed(2)
        );
        setVouchers(data.vouchers ?? []);
        setWalletBalance(resolvedWalletBalance);
        setTransactions(data.transactions ?? []);
        setPaymentTransactions(data.paymentTransactions ?? []);
        if (resolvedWalletBalance >= topupHintBalance && topupHintBalance > 0) {
          clearWalletTopupHint();
          setTopupHintBalance(0);
        }
      } catch (walletError: any) {
        setError(walletError?.message || 'Failed to load wallet.');
      } finally {
        setLoading(false);
      }
    };

    void loadWallet();
  }, [user, topupHintBalance, walletRefreshKey]);

  useEffect(() => {
    if (!user || !addVoucherOpen) return;

    const loadMerchants = async () => {
      try {
        const response = await fetch('/api/v1/merchants/active', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Failed to load merchants.');
        const merchants = Array.isArray(data?.merchants)
          ? data.merchants.map((merchant: any) => ({
              id: String(merchant.id ?? ''),
              businessName: String(
                merchant.businessName ?? merchant.business_name ?? 'Participating Merchant'
              ),
            }))
          : [];
        setAddVoucherMerchants(merchants.filter((merchant: MerchantOption) => merchant.id));
      } catch {
        setAddVoucherMerchants([]);
      }
    };

    void loadMerchants();
  }, [user, addVoucherOpen]);

  useEffect(() => {
    if (!addVoucherOpen) return;
    if (addVoucherMerchantId) return;
    if (addVoucherMerchants.length === 0) return;
    setAddVoucherMerchantId(addVoucherMerchants[0].id);
  }, [addVoucherMerchantId, addVoucherMerchants, addVoucherOpen]);

  useEffect(() => {
    if (!user?.id) return;
    const hint = readWalletTopupHint(user.id);
    if (hint) {
      setTopupHintBalance(hint.walletBalance);
      setWalletBalance((previous) => Math.max(previous, hint.walletBalance));
    } else {
      setTopupHintBalance(0);
    }
  }, [user?.id]);

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

  const totalVoucherBalance = useMemo(
    () =>
      voucherStatusBuckets.active.reduce(
        (sum, voucher) => sum + Number(voucher.current_balance ?? 0),
        0
      ),
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
        merchant: tx.voucher_code ? 'Voucher Purchase' : 'Wallet Top-Up',
        type: tx.voucher_code ? 'purchase' : 'wallet_topup',
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

  const handleAddVoucher = async () => {
    const normalizedCode = addVoucherCode.trim().toUpperCase();
    const amount = Number(addVoucherAmount);

    if (!normalizedCode) {
      setAddVoucherError('Voucher code is required.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setAddVoucherError('Enter a valid voucher amount.');
      return;
    }

    setAddVoucherProcessing(true);
    setAddVoucherError('');

    try {
      const response = await fetch('/api/v1/wallet/add-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          voucherCode: normalizedCode,
          amount,
          merchantId: addVoucherMerchantId || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add voucher to wallet.');
      }

      setCopyMessage(
        data.duplicate
          ? `Voucher ${normalizedCode} is already in your wallet.`
          : `Voucher ${data.voucherCode ?? normalizedCode} added to your wallet.`
      );
      window.setTimeout(() => setCopyMessage(''), 1800);
      setAddVoucherOpen(false);
      setAddVoucherCode('');
      setAddVoucherAmount('100');
      setAddVoucherError('');
      setWalletRefreshKey((previous) => previous + 1);
      setTab('active');
    } catch (addVoucherRequestError: any) {
      setAddVoucherError(addVoucherRequestError?.message || 'Failed to add voucher to wallet.');
    } finally {
      setAddVoucherProcessing(false);
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
      <div className="pt-24 pb-24 px-4">
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

          <section className="rounded-3xl p-6 md:p-7 bg-[linear-gradient(120deg,#0f766e_0%,#0d9488_58%,#14b8a6_100%)] text-white shadow-xl border border-teal-300/40">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="font-headline font-bold text-4xl">Wallet</h1>
                <p className="text-sm text-white/95 mt-1">{deriveSavingsBadge(totalSaved)}</p>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5 border border-white/20">
                <Icon name="QrCodeIcon" size={20} variant="outline" className="text-white" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-2xl bg-white/22 p-5 border border-white/25">
                <p className="text-sm text-white/95">Wallet Cash Balance</p>
                <p className="font-headline font-bold text-5xl mt-1">{toCurrency(walletBalance)}</p>
              </div>
              <div className="rounded-2xl bg-white/22 p-5 border border-white/25">
                <p className="text-sm text-white/95">Voucher Balance</p>
                <p className="font-headline font-bold text-5xl mt-1">
                  {toCurrency(totalVoucherBalance)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                onClick={() => setAddVoucherOpen(true)}
                className="rounded-xl bg-white text-primary font-headline font-semibold py-2.5 hover:bg-white/95"
              >
                Add Voucher
              </button>
              <button
                onClick={() => router.push('/shop')}
                className="rounded-xl bg-white text-primary font-headline font-semibold py-2.5 hover:bg-white/95"
              >
                Buy More
              </button>
              <button
                onClick={() => router.push(topUpHref)}
                className="rounded-xl bg-white text-primary font-headline font-semibold py-2.5 hover:bg-white/95"
              >
                Top Up Wallet
              </button>
              <button
                onClick={() => router.push('/redeem')}
                className="rounded-xl bg-white/30 text-white font-headline font-semibold py-2.5 border border-white/30 hover:bg-white/35"
              >
                Redeem
              </button>
              <button
                onClick={() => router.push('/benefits')}
                className="rounded-xl bg-white/30 text-white font-headline font-semibold py-2.5 border border-white/30 hover:bg-white/35"
              >
                Benefits
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="font-headline font-bold text-2xl text-foreground">Top Up Wallet</h2>
                <p className="text-sm text-muted-foreground">
                  Add value using card, PayFast, or EFT payment options.
                </p>
              </div>
              <button
                onClick={() => router.push(topUpHref)}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-headline font-semibold hover:bg-primary/90"
              >
                Top Up Now
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

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedVouchers.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground bg-card">
                <span className="mb-3 block text-4xl">🎁</span>
                <p className="font-headline font-semibold text-foreground">No {tab} vouchers</p>
                {tab === 'active' && (
                  <button onClick={() => router.push('/shop')} className="mt-4 rounded-xl bg-primary px-6 py-2.5 font-headline text-sm font-bold text-white hover:bg-primary/90">Shop Now</button>
                )}
              </div>
            ) : (
              displayedVouchers.map((voucher) => {
                const face = Number(voucher.face_value ?? 0);
                const paid = Number(voucher.consumer_price ?? face);
                const saved = Number(voucher.consumer_benefit_amount ?? Math.max(0, face - paid));
                const balance = Number(voucher.current_balance ?? 0);
                const status = classifyVoucher(voucher);
                const pct = face > 0 ? Math.round((balance / face) * 100) : 0;
                const expiry = new Date(voucher.expires_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: '2-digit' });
                const merchantKey = (voucher.parent_brand || voucher.merchant_name || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
                const LOGOS: Record<string, string> = {
                  shoprite: '/assets/images/merchants/shoprite.png',
                  'pick n pay': '/assets/images/merchants/picknpay.png', picknpay: '/assets/images/merchants/picknpay.png',
                  checkers: '/assets/images/merchants/checkers.png', clicks: '/assets/images/merchants/clicks.png',
                  'dis-chem': '/assets/images/merchants/dischem.png', dischem: '/assets/images/merchants/dischem.png',
                  pep: '/assets/images/merchants/pep.png', game: '/assets/images/merchants/game.png',
                  boxer: '/assets/images/merchants/boxer.png', woolworths: '/assets/images/merchants/woolworths.png',
                  engen: '/assets/images/merchants/engen.png', 'mr price': '/assets/images/merchants/mr-price.png',
                  mrprice: '/assets/images/merchants/mr-price.png', usave: '/assets/images/merchants/usave.png',
                  kalapeng: '/assets/images/merchants/kalapeng.png',
                };
                const logoSrc = LOGOS[merchantKey] ?? '/assets/images/merchants/placeholder-merchant.svg';

                return (
                  <article key={voucher.id} className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    {/* Colour strip */}
                    <div className={`h-1.5 w-full ${status === 'active' ? 'bg-gradient-to-r from-primary to-teal-400' : status === 'partial' ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-muted'}`} />
                    <div className="p-4">
                      {/* Header row */}
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white p-1 shadow-sm">
                          <img src={logoSrc} alt={voucher.parent_brand || voucher.merchant_name} className="h-8 w-8 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/merchants/placeholder-merchant.svg'; }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-headline text-sm font-bold text-foreground line-clamp-1">{voucher.parent_brand || voucher.merchant_name}</p>
                          <p className="text-[11px] text-muted-foreground">{toCurrency(face)} Voucher</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 font-headline text-[10px] font-bold capitalize ${
                          status === 'active' ? 'bg-success/10 text-success' :
                          status === 'partial' ? 'bg-amber-50 text-amber-600' :
                          'bg-muted text-muted-foreground'
                        }`}>{status}</span>
                      </div>

                      {/* Balance */}
                      <p className="font-headline text-3xl font-bold text-foreground">{toCurrency(balance)}</p>
                      <p className="mb-2 text-[11px] text-muted-foreground">Balance remaining</p>

                      {/* Progress bar */}
                      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>

                      {/* Meta row */}
                      <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Expires {expiry}</span>
                        {saved > 0 && <span className="font-semibold text-success">Saved {toCurrency(saved)}</span>}
                      </div>

                      {/* Code */}
                      <p className="mb-3 rounded-lg bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">{voucher.voucher_code}</p>

                      {/* Actions */}
                      {(status === 'active' || status === 'partial') ? (
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => setSelectedVoucher(voucher)}
                            className="rounded-xl border border-primary py-2 font-headline text-xs font-bold text-primary hover:bg-primary/10">QR</button>
                          <button onClick={() => void handleCopyVoucherCode(voucher.voucher_code)}
                            className="rounded-xl border border-border py-2 font-headline text-xs font-bold text-foreground hover:bg-muted">Copy</button>
                          <button onClick={() => router.push(`/redeem?code=${encodeURIComponent(voucher.voucher_code)}`)}
                            className="rounded-xl bg-primary py-2 font-headline text-xs font-bold text-white hover:bg-primary/90">Redeem</button>
                        </div>
                      ) : (
                        <p className="text-center text-[11px] text-muted-foreground">{getScopeLabel(voucher)}</p>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <section className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-headline font-bold text-2xl text-foreground mb-4">Recent Activity</h2>
              {recentActivity.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet.</p>
              ) : (
                <div className="relative space-y-0">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
                  {recentActivity.map((activity, i) => {
                    const date = new Date(activity.createdAt);
                    const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
                    const label = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : date.toLocaleDateString('en-ZA', { weekday: 'long' });
                    const typeLabel = activity.type === 'wallet_topup' ? 'Wallet Top-Up' : activity.type === 'purchase' ? 'Voucher Purchase' : 'Redemption';
                    return (
                      <div key={activity.id} className={`relative flex gap-4 pb-4 ${i === recentActivity.length - 1 ? 'pb-0' : ''}`}>
                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white text-xs font-bold text-primary">✓</div>
                        <div className="flex flex-1 items-start justify-between rounded-xl border border-border bg-white px-3 py-2.5 shadow-sm">
                          <div>
                            <p className="font-headline text-sm font-bold text-foreground">{activity.merchant}</p>
                            <p className="text-[11px] text-muted-foreground">{typeLabel} · {label}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-headline text-sm font-semibold text-foreground">{toCurrency(activity.amount)}</p>
                            {Number(activity.savings) > 0 && <p className="text-[11px] font-semibold text-success">Saved {toCurrency(Number(activity.savings))}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
              <div>
                <h2 className="font-headline font-bold text-2xl text-foreground mb-2">
                  Savings Insights
                </h2>
                <p className="text-sm text-muted-foreground">
                  Every R100 spent = instant savings on voucher checkout.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This month saved:{' '}
                  <span className="font-headline text-success">{toCurrency(thisMonthSavings)}</span>
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
                      <span className="font-headline font-semibold text-foreground">
                        {entry.merchant}
                      </span>
                      <span className="font-headline font-bold text-success">
                        {toCurrency(entry.savings)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div>
                <h3 className="font-headline font-bold text-xl text-foreground mb-2">
                  Achievements
                </h3>
                <div className="grid gap-2">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`rounded-lg border px-3 py-2 flex items-center justify-between ${
                        achievement.achieved
                          ? 'border-success/30 bg-success/10'
                          : 'border-border bg-muted/20'
                      }`}
                    >
                      <span className="font-headline font-semibold text-foreground">
                        {achievement.label}
                      </span>
                      <span
                        className={`text-xs font-headline ${achievement.achieved ? 'text-success' : 'text-muted-foreground'}`}
                      >
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

      {addVoucherOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline font-bold text-2xl text-foreground">
                  Add Voucher To Wallet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add an eVoucher code directly into your wallet.
                </p>
              </div>
              <button
                onClick={() => {
                  setAddVoucherOpen(false);
                  setAddVoucherError('');
                }}
                className="px-3 py-2 rounded-lg border border-border hover:bg-muted"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                  Voucher Code
                </label>
                <input
                  value={addVoucherCode}
                  onChange={(event) => setAddVoucherCode(event.target.value.toUpperCase())}
                  placeholder="EVS-12345"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                  Face Value
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={addVoucherAmount}
                  onChange={(event) => setAddVoucherAmount(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                  Participating Merchant
                </label>
                <select
                  value={addVoucherMerchantId}
                  onChange={(event) => setAddVoucherMerchantId(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                >
                  {addVoucherMerchants.length === 0 ? (
                    <option value="">Default participating merchant</option>
                  ) : (
                    addVoucherMerchants.map((merchant) => (
                      <option key={merchant.id} value={merchant.id}>
                        {merchant.businessName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {addVoucherError && (
                <div className="rounded-lg border border-error/20 bg-error/10 p-3">
                  <p className="text-sm text-error">{addVoucherError}</p>
                </div>
              )}

              <button
                onClick={() => void handleAddVoucher()}
                disabled={addVoucherProcessing}
                className="w-full rounded-xl bg-primary py-3 text-primary-foreground font-headline font-semibold hover:bg-primary/90 disabled:opacity-60"
              >
                {addVoucherProcessing ? 'Adding Voucher...' : 'Add Voucher To Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
