'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

const WALLET_CACHE_KEY = 'evoucher_wallet_cache_v1';
const WALLET_CACHE_TTL_MS = 60 * 1000;

interface Voucher {
  id: string;
  merchant_name: string;
  voucher_code: string;
  current_balance: number;
  face_value: number;
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
  is_active: boolean;
  created_at: string;
}

export default function WalletPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [legacyPaymentMethods, setLegacyPaymentMethods] = useState<LegacyPaymentMethod[]>([]);
  const [managedMethods, setManagedMethods] = useState<ManagedPaymentMethod[]>([]);
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
        const cachedPayload =
          typeof window !== 'undefined' ? window.sessionStorage.getItem(WALLET_CACHE_KEY) : null;
        if (cachedPayload) {
          try {
            const parsed = JSON.parse(cachedPayload) as {
              vouchers: Voucher[];
              transactions: Transaction[];
              paymentMethods: LegacyPaymentMethod[];
              fetchedAt: number;
            };

            if (Date.now() - parsed.fetchedAt < WALLET_CACHE_TTL_MS) {
              setVouchers(parsed.vouchers ?? []);
              setTransactions(parsed.transactions ?? []);
              setLegacyPaymentMethods(parsed.paymentMethods ?? []);
              setLoading(false);
            }
          } catch {
            // Ignore invalid cache payload
          }
        }

        setLoading(!cachedPayload);
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

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(
            WALLET_CACHE_KEY,
            JSON.stringify({
              vouchers: data.vouchers ?? [],
              transactions: data.transactions ?? [],
              paymentMethods: data.paymentMethods ?? [],
              fetchedAt: Date.now(),
            })
          );
        }

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

  const walletBalance = useMemo(
    () => vouchers.reduce((total, voucher) => total + Number(voucher.current_balance ?? 0), 0),
    [vouchers]
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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h1 className="font-headline font-bold text-3xl text-foreground">Wallet</h1>
            <p className="text-muted-foreground font-body">
              Manage vouchers, payment methods, and transaction history synced with your mobile
              profile.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg border border-error/20 bg-error/10">
              <p className="text-sm text-error font-body">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-6">
              <p className="text-sm opacity-90">Current Wallet Balance</p>
              <p className="text-4xl font-headline font-bold mt-2">R{walletBalance.toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-sm text-muted-foreground font-body">Active vouchers</p>
              <p className="text-4xl font-headline font-bold text-foreground mt-2">{vouchers.length}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-sm text-muted-foreground font-body">Saved payment methods</p>
              <p className="text-4xl font-headline font-bold text-foreground mt-2">{savedMethodCount}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline font-bold text-xl text-foreground">My Vouchers</h2>
                <Icon name="TicketIcon" size={22} variant="solid" className="text-primary" />
              </div>
              <div className="space-y-3">
                {vouchers.length === 0 ? (
                  <p className="text-muted-foreground font-body">No vouchers available.</p>
                ) : (
                  vouchers.map((voucher) => (
                    <div key={voucher.id} className="rounded-xl border border-border p-4 bg-muted/30">
                      <p className="font-headline font-semibold text-foreground">{voucher.merchant_name}</p>
                      <p className="text-sm text-muted-foreground font-body">{voucher.voucher_code}</p>
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-muted-foreground">
                          Balance: R{Number(voucher.current_balance).toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">
                          Expires: {new Date(voucher.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline font-bold text-xl text-foreground">Payment Methods</h2>
                <Icon name="CreditCardIcon" size={22} variant="solid" className="text-primary" />
              </div>

              <div className="space-y-3 mb-6">
                {managedMethods.length > 0 ? (
                  managedMethods.map((method) => (
                    <div key={method.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-headline font-semibold text-foreground uppercase">
                            {method.provider}
                          </p>
                          <p className="text-sm text-muted-foreground font-body">
                            {method.method_type} | {method.masked_reference}
                          </p>
                          {method.is_default && (
                            <p className="text-xs text-success font-body mt-1">Default</p>
                          )}
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
                      <p className="text-sm text-muted-foreground font-body">**** {method.lastFour}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground font-body">No saved methods yet.</p>
                )}
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted/30 mb-6">
                <h3 className="font-headline font-bold text-lg text-foreground mb-3">Add Payment Method</h3>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <select
                    value={methodType}
                    onChange={(event) =>
                      setMethodType(event.target.value as 'card' | 'eft' | 'wallet' | 'other')
                    }
                    className="px-3 py-2 border border-border rounded-lg bg-background font-body"
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
                    className="px-3 py-2 border border-border rounded-lg bg-background font-body"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    value={maskedReference}
                    onChange={(event) => setMaskedReference(event.target.value)}
                    placeholder="Masked ref (e.g. **** 1234)"
                    className="px-3 py-2 border border-border rounded-lg bg-background font-body"
                  />
                  <label className="flex items-center space-x-2 text-sm font-body text-foreground">
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

              <h3 className="font-headline font-bold text-lg text-foreground mb-3">Recent Transactions</h3>
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground font-body">No transactions yet.</p>
                ) : (
                  transactions.slice(0, 8).map((transaction) => (
                    <div key={transaction.id} className="rounded-xl border border-border p-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <p className="font-headline font-semibold text-foreground">
                          {transaction.merchant_name}
                        </p>
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
