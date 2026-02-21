'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface Voucher {
  id: string;
  merchant_name: string;
  voucher_code: string;
  current_balance: number;
  face_value: number;
  is_active: boolean;
  expires_at: string;
}

interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  transaction_type: string;
  created_at: string;
}

interface LegacyPaymentMethod {
  brand: string;
  lastFour: string;
}

interface ManagedPaymentMethod {
  id: string;
  method_type: string;
  provider: string;
  masked_reference: string;
  is_default: boolean;
}

type WalletTab = 'active' | 'used' | 'expired';

export default function WalletPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [legacyPaymentMethods, setLegacyPaymentMethods] = useState<LegacyPaymentMethod[]>([]);
  const [managedMethods, setManagedMethods] = useState<ManagedPaymentMethod[]>([]);
  const [tab, setTab] = useState<WalletTab>('active');
  const [methodType, setMethodType] = useState<'card' | 'eft' | 'wallet' | 'other'>('card');
  const [provider, setProvider] = useState('');
  const [maskedReference, setMaskedReference] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [methodMessage, setMethodMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const fetchWalletData = async () => {
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
        setLegacyPaymentMethods(data.paymentMethods ?? []);
        await fetchManagedPaymentMethods();
      } catch (walletError: any) {
        setError(walletError?.message || 'Failed to load wallet.');
      } finally {
        setLoading(false);
      }
    };

    void fetchWalletData();
  }, [user]);

  const fetchManagedPaymentMethods = async () => {
    const response = await fetch('/api/v1/customer/payment-methods', {
      method: 'GET',
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load saved payment methods.');
    }
    setManagedMethods(data.paymentMethods ?? []);
  };

  const handleAddPaymentMethod = async () => {
    try {
      setMethodMessage('');
      if (!provider.trim() || !maskedReference.trim()) {
        setMethodMessage('Provider and masked reference are required.');
        return;
      }

      const response = await fetch('/api/v1/customer/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          methodType,
          provider: provider.trim(),
          maskedReference: maskedReference.trim(),
          isDefault: makeDefault,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add payment method.');
      }

      setProvider('');
      setMaskedReference('');
      setMakeDefault(false);
      setMethodMessage('Payment method saved.');
      await fetchManagedPaymentMethods();
    } catch (addError: any) {
      setMethodMessage(addError?.message || 'Failed to add payment method.');
    }
  };

  const handleSetDefaultMethod = async (id: string) => {
    try {
      setMethodMessage('');
      const response = await fetch(`/api/v1/customer/payment-methods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to set default method.');
      }
      await fetchManagedPaymentMethods();
    } catch (setDefaultError: any) {
      setMethodMessage(setDefaultError?.message || 'Failed to set default payment method.');
    }
  };

  const handleRemoveMethod = async (id: string) => {
    try {
      setMethodMessage('');
      const response = await fetch(`/api/v1/customer/payment-methods/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove payment method.');
      }
      await fetchManagedPaymentMethods();
    } catch (removeError: any) {
      setMethodMessage(removeError?.message || 'Failed to remove payment method.');
    }
  };

  const activeVouchers = useMemo(
    () =>
      vouchers.filter(
        (voucher) =>
          voucher.is_active &&
          Number(voucher.current_balance) > 0 &&
          new Date(voucher.expires_at).getTime() > Date.now()
      ),
    [vouchers]
  );
  const usedVouchers = useMemo(
    () => vouchers.filter((voucher) => Number(voucher.current_balance) <= 0),
    [vouchers]
  );
  const expiredVouchers = useMemo(
    () =>
      vouchers.filter(
        (voucher) =>
          new Date(voucher.expires_at).getTime() <= Date.now() &&
          Number(voucher.current_balance) > 0
      ),
    [vouchers]
  );
  const displayedVouchers =
    tab === 'active' ? activeVouchers : tab === 'used' ? usedVouchers : expiredVouchers;

  const walletBalance = activeVouchers.reduce((total, voucher) => total + Number(voucher.current_balance), 0);
  const totalSaved = vouchers.reduce(
    (total, voucher) =>
      total + Math.max(0, Number(voucher.face_value) - Number(voucher.current_balance)),
    0
  );
  const savedMethodCount =
    managedMethods.length > 0 ? managedMethods.length : legacyPaymentMethods.length;

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

          <div className="rounded-2xl p-5 bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <h1 className="font-headline font-bold text-3xl">Wallet</h1>
              <Icon name="QrCodeIcon" size={22} variant="outline" className="text-white" />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-white/15 p-4">
                <p className="text-sm opacity-90">Total Balance</p>
                <p className="font-headline font-bold text-4xl mt-1">R{walletBalance.toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-white/15 p-4">
                <p className="text-sm opacity-90">Total Saved</p>
                <p className="font-headline font-bold text-4xl mt-1">R{totalSaved.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/buy-vouchers')}
                className="rounded-lg bg-white text-primary font-headline font-semibold py-2"
              >
                + Add Voucher
              </button>
              <button className="rounded-lg bg-white/20 text-white font-headline font-semibold py-2">
                🇿🇦
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-2 rounded-xl border border-border bg-card p-2">
            <button
              onClick={() => setTab('active')}
              className={`rounded-lg py-2 text-sm font-headline font-semibold ${
                tab === 'active' ? 'bg-muted text-foreground' : 'text-muted-foreground'
              }`}
            >
              Active ({activeVouchers.length})
            </button>
            <button
              onClick={() => setTab('used')}
              className={`rounded-lg py-2 text-sm font-headline font-semibold ${
                tab === 'used' ? 'bg-muted text-foreground' : 'text-muted-foreground'
              }`}
            >
              Used ({usedVouchers.length})
            </button>
            <button
              onClick={() => setTab('expired')}
              className={`rounded-lg py-2 text-sm font-headline font-semibold ${
                tab === 'expired' ? 'bg-muted text-foreground' : 'text-muted-foreground'
              }`}
            >
              Expired ({expiredVouchers.length})
            </button>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            {displayedVouchers.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">
                {tab === 'active'
                  ? 'No active vouchers found.'
                  : tab === 'used'
                    ? 'No used vouchers yet.'
                    : 'No expired vouchers.'}
              </p>
            ) : (
              <div className="space-y-3">
                {displayedVouchers.map((voucher) => (
                  <div key={voucher.id} className="rounded-xl border border-border p-4">
                    <p className="font-headline font-semibold text-foreground">{voucher.merchant_name}</p>
                    <p className="text-xs text-muted-foreground">{voucher.voucher_code}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-primary">Balance: R{Number(voucher.current_balance).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(voucher.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-headline font-bold text-xl text-foreground mb-4">Payment Methods</h2>
              <p className="text-sm text-muted-foreground mb-3">Saved methods: {savedMethodCount}</p>

              <div className="space-y-3 mb-6">
                {managedMethods.length > 0 ? (
                  managedMethods.map((method) => (
                    <div key={method.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-headline font-semibold text-foreground uppercase">{method.provider}</p>
                          <p className="text-sm text-muted-foreground">
                            {method.method_type} | {method.masked_reference}
                          </p>
                          {method.is_default && <p className="text-xs text-success mt-1">Default</p>}
                        </div>
                        <div className="flex gap-2">
                          {!method.is_default && (
                            <button
                              onClick={() => void handleSetDefaultMethod(method.id)}
                              className="px-3 py-1 rounded-lg border border-border text-xs font-headline font-semibold"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => void handleRemoveMethod(method.id)}
                            className="px-3 py-1 rounded-lg bg-error text-white text-xs font-headline font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : legacyPaymentMethods.length > 0 ? (
                  legacyPaymentMethods.map((method) => (
                    <div key={`${method.brand}-${method.lastFour}`} className="rounded-xl border border-border p-4">
                      <p className="font-headline font-semibold text-foreground uppercase">{method.brand}</p>
                      <p className="text-sm text-muted-foreground">**** {method.lastFour}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No saved methods yet.</p>
                )}
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted/30">
                <h3 className="font-headline font-bold text-lg text-foreground mb-3">Add Payment Method</h3>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <select
                    value={methodType}
                    onChange={(event) =>
                      setMethodType(event.target.value as 'card' | 'eft' | 'wallet' | 'other')
                    }
                    className="px-3 py-2 border border-border rounded-lg bg-background"
                  >
                    <option value="card">Card</option>
                    <option value="eft">EFT</option>
                    <option value="wallet">Wallet</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="text"
                    value={provider}
                    onChange={(event) => setProvider(event.target.value)}
                    placeholder="Provider (e.g. Visa, FNB)"
                    className="px-3 py-2 border border-border rounded-lg bg-background"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    value={maskedReference}
                    onChange={(event) => setMaskedReference(event.target.value)}
                    placeholder="Masked ref (e.g. **** 1234)"
                    className="px-3 py-2 border border-border rounded-lg bg-background"
                  />
                  <label className="flex items-center space-x-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={makeDefault}
                      onChange={(event) => setMakeDefault(event.target.checked)}
                    />
                    <span>Set as default</span>
                  </label>
                </div>
                <button
                  onClick={() => void handleAddPaymentMethod()}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-headline font-semibold"
                >
                  Save Method
                </button>
                {methodMessage && <p className="text-xs text-muted-foreground mt-2">{methodMessage}</p>}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-headline font-bold text-xl text-foreground mb-4">Recent Transactions</h2>
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground">No transactions yet.</p>
                ) : (
                  transactions.slice(0, 8).map((transaction) => (
                    <div key={transaction.id} className="rounded-xl border border-border p-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <p className="font-headline font-semibold text-foreground">{transaction.merchant_name}</p>
                        <p className="font-headline font-semibold text-foreground">
                          R{Number(transaction.amount).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.transaction_type} | {new Date(transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
