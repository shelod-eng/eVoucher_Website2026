'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';
import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT, DiscountPricingBreakdown } from '@/lib/pricing';

interface MerchantOption {
  id: string;
  businessName: string;
  email: string;
  status: string;
  defaultTotalDiscountPct: number;
}

type PaymentMethod = 'visa' | 'payfast' | 'eft' | 'debit_credit';
type PurchaseStatus = 'pending' | 'completed' | 'failed' | null;

export default function BuyVouchers() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [voucherAmount, setVoucherAmount] = useState<number>(100);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [transactionReference, setTransactionReference] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [pricingResult, setPricingResult] = useState<DiscountPricingBreakdown | null>(null);
  const [blockingReason, setBlockingReason] = useState<string | null>(null);
  const [blockingCode, setBlockingCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const faceValueFromQuery = Number(searchParams.get('faceValue') ?? '');
  const merchantIdFromQuery = searchParams.get('merchantId');
  const productIdFromQuery = searchParams.get('productId');
  const selectedMerchantDetails = merchants.find((merchant) => merchant.id === selectedMerchant) ?? null;
  const amountOptions = useMemo(() => {
    const defaults = [100, 200, 300, 500, 1000];
    if (Number.isFinite(faceValueFromQuery) && faceValueFromQuery > 0) {
      defaults.push(faceValueFromQuery);
    }
    return Array.from(new Set(defaults)).sort((a, b) => a - b);
  }, [faceValueFromQuery]);
  const previewPricing = calculateDiscountPricing(
    voucherAmount,
    selectedMerchantDetails?.defaultTotalDiscountPct ?? DEFAULT_TOTAL_DISCOUNT_PCT
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const role = String(user.user_metadata?.role ?? '').toLowerCase();
    if (role === 'merchant') {
      setBlockingCode('consumer_only_purchase');
      setBlockingReason('Only consumer accounts can buy vouchers. Please sign in as a consumer.');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void fetchMerchants();
    }
  }, [user]);

  useEffect(() => {
    if (!merchants.length) return;

    if (merchantIdFromQuery && merchants.some((merchant) => merchant.id === merchantIdFromQuery)) {
      setSelectedMerchant(merchantIdFromQuery);
    }

    if (Number.isFinite(faceValueFromQuery) && faceValueFromQuery > 0) {
      setVoucherAmount(faceValueFromQuery);
    }

    if (productIdFromQuery) {
      setSelectedProductId(productIdFromQuery);
    }
  }, [merchants, merchantIdFromQuery, faceValueFromQuery, productIdFromQuery]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      setBlockingReason(null);
      setBlockingCode(null);
      const response = await fetch('/api/v1/merchants/active', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        setBlockingCode(data.code ?? null);
        setBlockingReason(data.error ?? 'Unable to load merchants for purchase.');
        throw new Error(data.error || 'Failed to fetch merchants');
      }
      setMerchants(data.merchants || []);
      if (data.blockReason === 'no_active_merchants') {
        setBlockingCode('no_active_merchants');
        setBlockingReason(
          'No active merchants are available for voucher purchase right now. Please onboard/approve merchants first.'
        );
      }
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Failed to fetch merchants.');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: 'visa' as PaymentMethod,
      name: 'VISA',
      icon: 'CreditCardIcon',
      description: 'Pay securely with VISA card',
    },
    {
      id: 'payfast' as PaymentMethod,
      name: 'PayFast',
      icon: 'BanknotesIcon',
      description: 'Fast and secure payment gateway',
    },
    {
      id: 'eft' as PaymentMethod,
      name: 'EFT',
      icon: 'BuildingLibraryIcon',
      description: 'Electronic Funds Transfer',
    },
    {
      id: 'debit_credit' as PaymentMethod,
      name: 'Debit/Credit Card',
      icon: 'CreditCardIcon',
      description: 'Pay with any debit or credit card',
    },
  ];

  const handlePurchase = async () => {
    if (!selectedMerchant || !selectedPaymentMethod || blockingReason) return;

    setProcessing(true);
    setError('');
    setPurchaseStatus(null);
    setPricingResult(null);

    try {
      const response = await fetch('/api/v1/vouchers/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          merchantId: selectedMerchant,
          productId: selectedProductId ?? undefined,
          faceValue: voucherAmount,
          paymentMethod: selectedPaymentMethod,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setBlockingCode(data.code ?? null);
        if (data.code === 'consumer_only_purchase') {
          setBlockingReason('This route is consumer-only. Sign in as a consumer account to continue.');
        } else if (data.code === 'missing_admin_env') {
          setBlockingReason(
            'Server configuration is incomplete. Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.'
          );
        }
        throw new Error(data.error || 'Failed to process purchase');
      }

      setPurchaseStatus(data.status);
      setVoucherCode(data.voucherCode || null);
      setTransactionReference(data.transactionReference || null);
      setCheckoutUrl(data.checkoutUrl || null);
      setPricingResult(data.pricing ?? previewPricing);
    } catch (purchaseError: any) {
      setPurchaseStatus('failed');
      setError(purchaseError?.message || 'Failed to process payment. Please try again.');
      setPricingResult(previewPricing);
    } finally {
      setProcessing(false);
    }
  };

  const handleRefreshPurchaseStatus = async () => {
    if (!transactionReference) return;
    try {
      setRefreshingStatus(true);
      setError('');
      const response = await fetch(
        `/api/v1/vouchers/purchase?transactionReference=${encodeURIComponent(transactionReference)}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh payment status.');
      }

      setPurchaseStatus(data.status);
      setVoucherCode(data.voucherCode || null);
      setCheckoutUrl(data.checkoutUrl || null);
    } catch (statusError: any) {
      setError(statusError?.message || 'Failed to refresh payment status.');
    } finally {
      setRefreshingStatus(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-muted rounded-2xl" />
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 bg-muted rounded-2xl" />
                <div className="h-64 bg-muted rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (purchaseStatus) {
    const statusClasses =
      purchaseStatus === 'completed'
        ? { bg: 'bg-success/10', text: 'text-success' }
        : purchaseStatus === 'pending'
          ? { bg: 'bg-warning/10', text: 'text-warning' }
          : { bg: 'bg-error/10', text: 'text-error' };
    const statusIcon =
      purchaseStatus === 'completed'
        ? 'CheckCircleIcon'
        : purchaseStatus === 'pending'
          ? 'ClockIcon'
          : 'ExclamationCircleIcon';
    const statusTitle =
      purchaseStatus === 'completed'
        ? 'Payment Completed'
        : purchaseStatus === 'pending'
          ? 'Payment Pending'
          : 'Payment Failed';

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Header />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${statusClasses.bg}`}>
                <Icon name={statusIcon as any} size={48} variant="solid" className={statusClasses.text} />
              </div>
              <h2 className="font-headline font-bold text-3xl text-foreground mb-3">{statusTitle}</h2>
              <p className="text-muted-foreground font-body mb-6">
                {purchaseStatus === 'completed' && 'Your voucher has been issued and is ready to use.'}
                {purchaseStatus === 'pending' && 'Your payment is pending confirmation. Your voucher will be issued once confirmed.'}
                {purchaseStatus === 'failed' && 'Your payment could not be processed.'}
              </p>

              <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left space-y-2">
                <p className="text-sm font-body text-muted-foreground">
                  <span className="font-semibold text-foreground">Payment status:</span> {purchaseStatus}
                </p>
                {pricingResult && (
                  <>
                    <p className="text-sm font-body text-muted-foreground">
                      <span className="font-semibold text-foreground">Face value:</span> R
                      {pricingResult.faceValue.toFixed(2)}
                    </p>
                    <p className="text-sm font-body text-muted-foreground">
                      <span className="font-semibold text-foreground">You paid:</span> R
                      {pricingResult.consumerPrice.toFixed(2)}
                    </p>
                    <p className="text-sm font-body text-muted-foreground">
                      <span className="font-semibold text-foreground">Consumer benefit:</span>{' '}
                      {pricingResult.consumerBenefitPct.toFixed(2)}%
                    </p>
                  </>
                )}
                {transactionReference && (
                  <p className="text-sm font-body text-muted-foreground">
                    <span className="font-semibold text-foreground">Transaction ref:</span> {transactionReference}
                  </p>
                )}
                {voucherCode && (
                  <p className="text-sm font-body text-muted-foreground">
                    <span className="font-semibold text-foreground">Voucher issued:</span> {voucherCode}
                  </p>
                )}
                {checkoutUrl && (
                  <p className="text-sm font-body text-muted-foreground">
                    <span className="font-semibold text-foreground">Checkout URL:</span> Available
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {purchaseStatus === 'pending' && checkoutUrl && (
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full py-3 text-center bg-warning text-white rounded-lg font-headline font-semibold hover:opacity-90 transition-all duration-300"
                  >
                    Open Checkout
                  </a>
                )}

                {purchaseStatus === 'pending' && (
                  <button
                    onClick={() => void handleRefreshPurchaseStatus()}
                    disabled={refreshingStatus}
                    className="w-full py-3 bg-card border border-border rounded-lg font-headline font-semibold hover:bg-muted transition-all duration-300 disabled:opacity-60"
                  >
                    {refreshingStatus ? 'Refreshing...' : 'I Have Paid - Refresh Status'}
                  </button>
                )}

                <button
                  onClick={() => router.push('/customer/dashboard')}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-headline font-semibold hover:bg-primary/90 transition-all duration-300"
                >
                  Go to Customer Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-2">Buy Vouchers</h1>
            <p className="text-muted-foreground font-body">
              Secure purchase with server-side billing. You only see safe payment status and voucher output.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error font-body">{error}</p>
            </div>
          )}

          {blockingReason && (
            <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning font-body">{blockingReason}</p>
              {blockingCode === 'consumer_only_purchase' && (
                <button
                  onClick={() => router.push('/customer/login')}
                  className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-headline font-semibold"
                >
                  Go to Consumer Login
                </button>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
              <div className="flex items-center space-x-3 mb-6">
                <Icon name="BuildingStorefrontIcon" size={24} variant="solid" className="text-primary" />
                <h2 className="font-headline font-bold text-2xl text-foreground">Select Merchant</h2>
              </div>

              <div className="space-y-3">
                {merchants.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon
                      name="BuildingStorefrontIcon"
                      size={48}
                      variant="outline"
                      className="text-muted-foreground mx-auto mb-4"
                    />
                    <p className="text-muted-foreground font-body">No active merchants available</p>
                  </div>
                ) : (
                  merchants.map((merchant) => (
                    <button
                      key={merchant.id}
                      onClick={() => setSelectedMerchant(merchant.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                        selectedMerchant === merchant.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10">
                          <Icon name="BuildingStorefrontIcon" size={24} variant="solid" className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-headline font-bold text-foreground">{merchant.businessName}</h3>
                          <p className="text-sm text-muted-foreground font-body">{merchant.email}</p>
                          <p className="text-xs text-primary font-body mt-1">
                            Discount budget: {merchant.defaultTotalDiscountPct.toFixed(2)}%
                          </p>
                        </div>
                        {selectedMerchant === merchant.id && (
                          <Icon name="CheckCircleIcon" size={24} variant="solid" className="text-primary" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                  Voucher Amount (R)
                </label>
                <select
                  value={voucherAmount}
                  onChange={(e) => setVoucherAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 font-body"
                >
                  {amountOptions.map((amount) => (
                    <option key={amount} value={amount}>
                      R{amount}
                    </option>
                  ))}
                </select>
                {selectedProductId && (
                  <p className="mt-2 text-xs text-muted-foreground font-body">
                    Product-based checkout preselected from Shop/Cart.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
              <div className="flex items-center space-x-3 mb-6">
                <Icon name="CreditCardIcon" size={24} variant="solid" className="text-primary" />
                <h2 className="font-headline font-bold text-2xl text-foreground">Payment Method</h2>
              </div>

              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      selectedPaymentMethod === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon name={method.icon as any} size={24} variant="solid" className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-headline font-bold text-foreground">{method.name}</h3>
                        <p className="text-sm text-muted-foreground font-body">{method.description}</p>
                      </div>
                      {selectedPaymentMethod === method.id && (
                        <Icon name="CheckCircleIcon" size={24} variant="solid" className="text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-body">Face Value</span>
                  <span className="font-headline font-bold text-foreground">R{previewPricing.faceValue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-body">
                    Total Discount Budget ({previewPricing.totalDiscountPct.toFixed(2)}%)
                  </span>
                  <span className="font-headline font-bold text-success">-R{previewPricing.totalDiscountAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-body">
                    Consumer Benefit ({previewPricing.consumerBenefitPct.toFixed(2)}%)
                  </span>
                  <span className="font-headline font-bold text-success">
                    -R{previewPricing.consumerBenefitAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-body">
                    eVoucher Benefit ({previewPricing.evoucherBenefitPct.toFixed(2)}%)
                  </span>
                  <span className="font-headline font-bold text-primary">
                    R{previewPricing.evoucherBenefitAmount.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-semibold text-foreground">You Pay</span>
                    <span className="font-headline font-bold text-2xl text-primary">
                      R{previewPricing.consumerPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-body">Merchant Receivable (FV - Total Discount)</span>
                    <span className="font-headline font-semibold text-foreground">
                      R{previewPricing.merchantReceivableAfterTotalDiscount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={!selectedMerchant || !selectedPaymentMethod || processing || Boolean(blockingReason)}
                className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-headline font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {processing ? 'Processing...' : 'Complete Purchase'}
              </button>

              <p className="text-xs text-muted-foreground font-body text-center mt-4">
                Billing internals and provider secrets are processed server-side only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
