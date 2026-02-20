'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';

interface MerchantOption {
  id: string;
  businessName: string;
  email: string;
  status: string;
}

type PaymentMethod = 'visa' | 'payfast' | 'eft' | 'debit_credit';
type PurchaseStatus = 'pending' | 'completed' | 'failed' | null;

export default function BuyVouchers() {
  const { user, loading: authLoading } = useAuth();
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [voucherAmount, setVoucherAmount] = useState<number>(100);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [transactionReference, setTransactionReference] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      void fetchMerchants();
    }
  }, [user]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/merchants/active', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch merchants');
      }
      setMerchants(data.merchants || []);
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
    if (!selectedMerchant || !selectedPaymentMethod) return;

    setProcessing(true);
    setError('');
    setPurchaseStatus(null);

    try {
      const response = await fetch('/api/v1/vouchers/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          merchantId: selectedMerchant,
          faceValue: voucherAmount,
          paymentMethod: selectedPaymentMethod,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process purchase');
      }

      setPurchaseStatus(data.status);
      setVoucherCode(data.voucherCode || null);
      setTransactionReference(data.transactionReference || null);
      setCheckoutUrl(data.checkoutUrl || null);
    } catch (purchaseError: any) {
      setPurchaseStatus('failed');
      setError(purchaseError?.message || 'Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
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
                  <option value={100}>R100</option>
                  <option value={200}>R200</option>
                  <option value={300}>R300</option>
                  <option value={500}>R500</option>
                  <option value={1000}>R1000</option>
                </select>
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
                  <span className="text-sm text-muted-foreground font-body">Voucher Amount</span>
                  <span className="font-headline font-bold text-foreground">R{voucherAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-body">Discount (15%)</span>
                  <span className="font-headline font-bold text-success">
                    -R{(voucherAmount * 0.15).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-semibold text-foreground">You Pay</span>
                    <span className="font-headline font-bold text-2xl text-primary">
                      R{(voucherAmount * 0.85).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={!selectedMerchant || !selectedPaymentMethod || processing}
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
