'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

type VoucherStatus = 'active' | 'partial' | 'used' | 'expired';

interface RedeemVoucher {
  id: string;
  code: string;
  user_email: string;
  face_value: number;
  balance: number;
  status: VoucherStatus;
  redemption_scope: 'all_branches' | 'specific_branch' | 'province_wide' | 'national';
  merchant_name: string;
  parent_brand: string;
  product_name: string;
  expiry_date: string | null;
  merchant_id: string | null;
}

interface RedeemResult {
  success: boolean;
  message: string;
  newBalance: number;
  status: VoucherStatus;
}

function toCurrency(value: number) {
  return `R${Number(value ?? 0).toFixed(2)}`;
}

function getStatusClass(status: VoucherStatus) {
  if (status === 'active' || status === 'partial') return 'bg-success/15 text-success';
  if (status === 'expired') return 'bg-warning/15 text-warning';
  return 'bg-error/15 text-error';
}

function getScopeLabel(voucher: RedeemVoucher) {
  const scope = String(voucher.redemption_scope ?? 'all_branches').toLowerCase();
  if (scope === 'national') return 'Valid nationwide';
  if (scope === 'province_wide') return 'Valid in selected provinces';
  if (scope === 'specific_branch') return 'Valid at selected branches';
  return 'Valid at all locations';
}

function normalizeCode(value: string) {
  return String(value ?? '').trim().toUpperCase();
}

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `redeem-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function RedeemPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [voucher, setVoucher] = useState<RedeemVoucher | null>(null);
  const [searchError, setSearchError] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const prefillCode = normalizeCode(searchParams.get('code') ?? '');
    if (!prefillCode) return;
    setCode(prefillCode);
  }, [searchParams]);

  const canRedeemVoucher = useMemo(
    () => voucher && (voucher.status === 'active' || voucher.status === 'partial'),
    [voucher]
  );

  const searchVoucherByCode = async (voucherCode: string) => {
    const formattedCode = normalizeCode(voucherCode);
    if (!formattedCode) {
      setSearchError('Please enter a voucher code.');
      return;
    }

    setCode(formattedCode);
    setSearching(true);
    setSearchError('');
    setResult(null);

    try {
      const response = await fetch(`/api/v1/vouchers/redeem?code=${encodeURIComponent(formattedCode)}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No voucher found with this code.');
      }

      const foundVoucher = data.voucher as RedeemVoucher;
      setVoucher(foundVoucher);
      setRedeemAmount(String(Number(foundVoucher.balance ?? foundVoucher.face_value).toFixed(2)));
    } catch (error: any) {
      setVoucher(null);
      setSearchError(error?.message || 'No voucher found with this code.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const prefillCode = normalizeCode(searchParams.get('code') ?? '');
    if (!prefillCode) return;
    void searchVoucherByCode(prefillCode);
  }, [searchParams, user]);

  const handleSearch = async () => {
    await searchVoucherByCode(code);
  };

  const simulatePOSValidation = async (candidateVoucher: RedeemVoucher, amountToRedeem: number) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (candidateVoucher.status === 'used') {
      return { success: false, message: 'Voucher already redeemed.' };
    }
    if (candidateVoucher.status === 'expired') {
      return { success: false, message: 'Voucher has expired.' };
    }

    const availableBalance = Number(candidateVoucher.balance ?? candidateVoucher.face_value ?? 0);
    if (amountToRedeem > availableBalance) {
      return { success: false, message: 'Amount exceeds available voucher balance.' };
    }

    return { success: true };
  };

  const handleRedeem = async () => {
    if (!voucher) return;

    const amount = Number(redeemAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setResult({
        success: false,
        message: 'Please enter a valid redemption amount.',
        newBalance: Number(voucher.balance ?? voucher.face_value ?? 0),
        status: voucher.status,
      });
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const posResult = await simulatePOSValidation(voucher, amount);
      if (!posResult.success) {
        setResult({
          success: false,
          message: posResult.message || 'Voucher could not be validated.',
          newBalance: Number(voucher.balance ?? voucher.face_value ?? 0),
          status: voucher.status,
        });
        return;
      }

      const response = await fetch('/api/v1/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          voucherCode: voucher.code,
          amount,
          merchantId: voucher.merchant_id ?? undefined,
          idempotencyKey: createIdempotencyKey(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Redemption failed.');
      }

      const newBalance = Number(payload.newBalance ?? payload.remainingBalance ?? 0);
      const newStatus = (String(payload.status ?? (newBalance <= 0 ? 'used' : 'partial')) as VoucherStatus);

      setVoucher((current) =>
        current
          ? {
              ...current,
              balance: newBalance,
              status: newStatus,
            }
          : current
      );
      setRedeemAmount(String(newBalance.toFixed(2)));
      setResult({
        success: true,
        message: payload.message || 'Voucher redeemed successfully.',
        newBalance,
        status: newStatus,
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error?.message || 'Redemption failed.',
        newBalance: Number(voucher.balance ?? voucher.face_value ?? 0),
        status: voucher.status,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRedeemAnother = () => {
    setVoucher(null);
    setResult(null);
    setSearchError('');
    setRedeemAmount('');
    setCode('');
  };

  if (authLoading) {
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
        <div className="max-w-xl mx-auto space-y-5">
          <section>
            <div className="flex items-start gap-3">
              <button
                onClick={() => router.push('/wallet')}
                className="mt-1 rounded-full p-2 bg-muted hover:bg-muted/80"
              >
                <Icon name="ChevronLeftIcon" size={18} variant="outline" />
              </button>
              <div>
                <h1 className="font-headline font-bold text-5xl text-foreground">Redeem Voucher</h1>
                <p className="text-muted-foreground">Enter your voucher code to redeem at a merchant</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-success/20 bg-success/10 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center text-success">
                <Icon name="QrCodeIcon" size={20} variant="outline" />
              </div>
              <div>
                <p className="font-headline font-semibold text-success text-xl">QR Code Scanning</p>
                <p className="text-sm text-success/90">
                  In-store QR scanning coming soon. Enter your voucher code manually below.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-headline font-bold text-3xl text-foreground mb-3">Enter Voucher Code</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="e.g. PICK-56EEH4"
                className="w-full px-3 py-3 border border-border rounded-lg bg-background font-body uppercase"
              />
              <button
                onClick={() => void handleSearch()}
                disabled={searching}
                className="px-4 rounded-lg bg-primary text-primary-foreground font-headline font-semibold disabled:opacity-60"
              >
                {searching ? (
                  <span className="inline-flex items-center gap-2">
                    <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                    ...
                  </span>
                ) : (
                  <Icon name="MagnifyingGlassIcon" size={18} variant="outline" />
                )}
              </button>
            </div>
            {searchError && <p className="text-sm text-error mt-3">{searchError}</p>}
          </section>

          {voucher && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-headline font-bold text-4xl text-foreground">
                    {voucher.parent_brand || voucher.merchant_name}
                  </h3>
                  <p className="text-muted-foreground">{voucher.product_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-headline font-semibold ${getStatusClass(voucher.status)}`}>
                  {voucher.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="font-headline font-bold text-5xl text-foreground">{toCurrency(voucher.balance)}</p>
                </div>
                <div className="rounded-xl bg-success/10 p-4">
                  <p className="text-sm text-muted-foreground">Face Value</p>
                  <p className="font-headline font-bold text-5xl text-success">{toCurrency(voucher.face_value)}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{getScopeLabel(voucher)}</p>
              <p className="text-sm text-muted-foreground mb-4">
                Expires: {voucher.expiry_date ? new Date(voucher.expiry_date).toLocaleDateString() : 'N/A'}
              </p>

              {canRedeemVoucher ? (
                <>
                  <label htmlFor="redeem-amount" className="block text-sm font-headline font-semibold text-foreground mb-2">
                    Amount to Redeem (R)
                  </label>
                  <input
                    id="redeem-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={redeemAmount}
                    onChange={(event) => setRedeemAmount(event.target.value)}
                    className="w-full px-3 py-3 border border-border rounded-lg bg-background font-body mb-2"
                  />
                  <p className="text-xs text-muted-foreground mb-3">
                    Enter full amount to fully redeem, or a partial amount to keep remaining balance.
                  </p>
                  <button
                    onClick={() => void handleRedeem()}
                    disabled={processing}
                    className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-headline font-semibold disabled:opacity-60"
                  >
                    {processing ? 'Processing at POS...' : `Redeem ${toCurrency(Number(redeemAmount || 0))}`}
                  </button>
                </>
              ) : (
                <div className="rounded-lg border border-error/20 bg-error/10 p-3">
                  <p className="text-sm text-error">
                    This voucher cannot be redeemed because it is {voucher.status}.
                  </p>
                </div>
              )}
            </section>
          )}

          {result && (
            <section
              className={`rounded-2xl border p-4 ${
                result.success ? 'border-success/20 bg-success/10' : 'border-error/20 bg-error/10'
              }`}
            >
              <p className={`font-headline font-semibold ${result.success ? 'text-success' : 'text-error'}`}>
                {result.message}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                New balance: {toCurrency(result.newBalance)}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => router.push('/wallet')}
                  className="py-2 rounded-lg border border-primary text-primary font-headline font-semibold hover:bg-primary/10"
                >
                  View Wallet
                </button>
                <button
                  onClick={handleRedeemAnother}
                  className="py-2 rounded-lg bg-primary text-primary-foreground font-headline font-semibold hover:bg-primary/90"
                >
                  Redeem Another
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function RedeemPageFallback() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
    </div>
  );
}

export default function RedeemPage() {
  return (
    <Suspense fallback={<RedeemPageFallback />}>
      <RedeemPageContent />
    </Suspense>
  );
}
