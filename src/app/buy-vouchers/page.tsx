'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';
import {
  calculateDiscountPricing,
  DEFAULT_TOTAL_DISCOUNT_PCT,
  DiscountPricingBreakdown,
  normalizeTotalDiscountPct,
} from '@/lib/pricing';
import { CartItem, clearCart, getCartItems, getCartSummary } from '@/lib/cart';

interface MerchantOption {
  id: string;
  businessName: string;
  email: string;
  status: string;
  defaultTotalDiscountPct: number;
  parentBrand?: string | null;
  branchName?: string | null;
  city?: string | null;
  province?: string | null;
  productCount?: number;
  products?: {
    id: string;
    productName: string;
    faceValue: number;
    totalDiscountPct: number;
    consumerPrice: number;
    consumerBenefitAmount: number;
    parentBrand?: string | null;
  }[];
}

type PaymentMethod = 'visa_secure' | 'debit_credit' | 'payfast' | 'eft' | 'wallet';
type PurchaseStatus = 'pending' | 'completed' | 'failed' | null;
const WALLET_TOPUP_HINT_KEY = 'evoucher.wallet.topup.hint.v1';

function persistWalletTopupHint(payload: {
  userId: string;
  transactionReference: string | null;
  walletBalance: number;
  amount: number;
}) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      WALLET_TOPUP_HINT_KEY,
      JSON.stringify({
        userId: payload.userId,
        transactionReference: payload.transactionReference,
        walletBalance: Number(payload.walletBalance.toFixed(2)),
        amount: Number(payload.amount.toFixed(2)),
        createdAt: new Date().toISOString(),
      })
    );
  } catch {
    // Ignore localStorage failures (private mode/quota) and continue.
  }
}

async function parseApiResponse(response: Response) {
  const contentType = String(response.headers.get('content-type') ?? '').toLowerCase();
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  const compactText = text.replace(/\s+/g, ' ').trim();
  return {
    error: compactText.slice(0, 220) || `Request failed with status ${response.status}.`,
    code: 'non_json_response',
    raw: compactText,
  };
}

function BuyVouchersContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [voucherAmount, setVoucherAmount] = useState<number>(100);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [checkoutCartItems, setCheckoutCartItems] = useState<CartItem[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [issuedVouchers, setIssuedVouchers] = useState<
    { code: string; faceValue: number; expiresAt?: string | null }[]
  >([]);
  const [transactionReference, setTransactionReference] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [pricingResult, setPricingResult] = useState<DiscountPricingBreakdown | null>(null);
  const [blockingReason, setBlockingReason] = useState<string | null>(null);
  const [blockingCode, setBlockingCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  // Payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [payfastEmail, setPayfastEmail] = useState('');
  const [eftReference, setEftReference] = useState('');
  const [eftProofName, setEftProofName] = useState<string | null>(null);
  const [walletBalanceMock, setWalletBalanceMock] = useState<number>(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const faceValueFromQuery = Number(searchParams.get('faceValue') ?? '');
  const merchantIdFromQuery = searchParams.get('merchantId');
  const brandKeyFromQuery = searchParams.get('brandKey');
  const productIdFromQuery = searchParams.get('productId');
  const selectedBranchIdFromQuery = searchParams.get('selectedBranchId');
  const selectedBranchNameFromQuery = searchParams.get('selectedBranchName');
  const selectedBranchCityFromQuery = searchParams.get('selectedBranchCity');
  const selectedBranchProvinceFromQuery = searchParams.get('selectedBranchProvince');
  const branchSelectionModeFromQuery = searchParams.get('branchSelectionMode');
  const walletTopupMode = searchParams.get('walletTopup') === '1';
  const cartCheckout = searchParams.get('cartCheckout') === '1';
  const merchantLocked = Boolean(merchantIdFromQuery);
  const selectedMerchantDetails =
    merchants.find((merchant) => merchant.id === selectedMerchant) ?? null;
  const selectedMerchantProducts = useMemo(
    () => selectedMerchantDetails?.products ?? [],
    [selectedMerchantDetails]
  );
  const amountOptions = useMemo(() => {
    const defaults = [100, 200, 300, 500, 1000];
    selectedMerchantProducts.forEach((product) => {
      if (Number.isFinite(Number(product.faceValue)) && Number(product.faceValue) > 0) {
        defaults.push(Number(product.faceValue));
      }
    });
    if (Number.isFinite(faceValueFromQuery) && faceValueFromQuery > 0) {
      defaults.push(faceValueFromQuery);
    }
    return Array.from(new Set(defaults)).sort((a, b) => a - b);
  }, [faceValueFromQuery, selectedMerchantProducts]);
  const previewPricing = calculateDiscountPricing(
    voucherAmount,
    normalizeTotalDiscountPct(
      selectedMerchantDetails?.defaultTotalDiscountPct,
      DEFAULT_TOTAL_DISCOUNT_PCT
    )
  );
  const cartSummary = useMemo(() => getCartSummary(checkoutCartItems), [checkoutCartItems]);
  const checkoutPricing = useMemo<DiscountPricingBreakdown>(() => {
    if (!cartCheckout) return previewPricing;
    const totalFaceValue = checkoutCartItems.reduce(
      (sum, item) => sum + Number(item.faceValue) * Number(item.quantity),
      0
    );
    const totalDiscountAmount = checkoutCartItems.reduce((sum, item) => {
      const lineFaceValue = Number(item.faceValue) * Number(item.quantity);
      return sum + lineFaceValue * (Number(item.totalDiscountPct) / 100);
    }, 0);
    const consumerPrice = cartSummary.totalConsumerPrice;
    const consumerBenefitAmount = cartSummary.totalSavings;
    const evoucherBenefitAmount = Number(
      Math.max(totalDiscountAmount - consumerBenefitAmount, 0).toFixed(2)
    );
    const merchantReceivableAfterTotalDiscount = Number(
      Math.max(totalFaceValue - totalDiscountAmount, 0).toFixed(2)
    );
    const merchantReceivableAfterEvoucherBenefit = Number(
      Math.max(merchantReceivableAfterTotalDiscount - evoucherBenefitAmount, 0).toFixed(2)
    );

    if (totalFaceValue <= 0) {
      return {
        faceValue: 0,
        totalDiscountPct: 0,
        consumerBenefitPct: 0,
        evoucherBenefitPct: 0,
        totalDiscountAmount: 0,
        consumerBenefitAmount: 0,
        evoucherBenefitAmount: 0,
        consumerPrice: 0,
        merchantReceivableAfterTotalDiscount: 0,
        merchantReceivableAfterEvoucherBenefit: 0,
      };
    }

    return {
      faceValue: Number(totalFaceValue.toFixed(2)),
      totalDiscountPct: Number(((totalDiscountAmount / totalFaceValue) * 100).toFixed(2)),
      consumerBenefitPct: Number(((consumerBenefitAmount / totalFaceValue) * 100).toFixed(2)),
      evoucherBenefitPct: Number(((evoucherBenefitAmount / totalFaceValue) * 100).toFixed(2)),
      totalDiscountAmount: Number(totalDiscountAmount.toFixed(2)),
      consumerBenefitAmount: Number(consumerBenefitAmount.toFixed(2)),
      evoucherBenefitAmount,
      consumerPrice: Number(consumerPrice.toFixed(2)),
      merchantReceivableAfterTotalDiscount,
      merchantReceivableAfterEvoucherBenefit,
    };
  }, [
    cartCheckout,
    previewPricing,
    checkoutCartItems,
    cartSummary.totalConsumerPrice,
    cartSummary.totalSavings,
  ]);

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
      if (walletTopupMode) {
        setLoading(false);
      } else {
        void fetchMerchants();
      }
      void fetchWalletBalance();
    }
  }, [user, walletTopupMode]);

  useEffect(() => {
    if (cartCheckout || walletTopupMode) return;
    if (!selectedMerchantDetails) return;

    const merchantProducts = selectedMerchantDetails.products ?? [];
    if (merchantProducts.length === 0) {
      if (selectedProductId && !productIdFromQuery) {
        setSelectedProductId(null);
      }
      return;
    }

    const querySelectedProduct = productIdFromQuery
      ? merchantProducts.find((product) => product.id === productIdFromQuery)
      : null;
    if (querySelectedProduct) {
      if (selectedProductId !== querySelectedProduct.id) {
        setSelectedProductId(querySelectedProduct.id);
      }
      if (voucherAmount !== Number(querySelectedProduct.faceValue)) {
        setVoucherAmount(Number(querySelectedProduct.faceValue));
      }
      return;
    }

    const currentSelection = selectedProductId
      ? merchantProducts.find((product) => product.id === selectedProductId)
      : null;
    if (currentSelection) {
      if (voucherAmount !== Number(currentSelection.faceValue)) {
        setVoucherAmount(Number(currentSelection.faceValue));
      }
      return;
    }

    const firstProduct = merchantProducts[0];
    setSelectedProductId(firstProduct.id);
    setVoucherAmount(Number(firstProduct.faceValue));
  }, [
    cartCheckout,
    walletTopupMode,
    selectedMerchantDetails,
    selectedProductId,
    productIdFromQuery,
    voucherAmount,
  ]);

  useEffect(() => {
    if (!user) return;
    if (!cartCheckout) {
      setCheckoutCartItems([]);
      return;
    }

    const refreshCart = () => {
      setCheckoutCartItems(getCartItems(user.id));
    };

    refreshCart();
    window.addEventListener('evoucher-cart-updated', refreshCart);
    window.addEventListener('storage', refreshCart);
    return () => {
      window.removeEventListener('evoucher-cart-updated', refreshCart);
      window.removeEventListener('storage', refreshCart);
    };
  }, [cartCheckout, user]);

  useEffect(() => {
    if (cartCheckout) return;
    if (!merchants.length) return;

    if (merchantLocked) {
      setSelectedMerchant(merchants[0]?.id ?? null);
    } else if (
      merchantIdFromQuery &&
      merchants.some((merchant) => merchant.id === merchantIdFromQuery)
    ) {
      setSelectedMerchant(merchantIdFromQuery);
    } else if (!selectedMerchant) {
      setSelectedMerchant(merchants[0]?.id ?? null);
    }

    if (Number.isFinite(faceValueFromQuery) && faceValueFromQuery > 0) {
      setVoucherAmount(faceValueFromQuery);
    }

    if (productIdFromQuery && !productIdFromQuery.startsWith('fallback-')) {
      setSelectedProductId(productIdFromQuery);
    }
  }, [
    merchants,
    merchantIdFromQuery,
    faceValueFromQuery,
    productIdFromQuery,
    selectedMerchant,
    merchantLocked,
    cartCheckout,
  ]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      setBlockingReason(null);
      setBlockingCode(null);
      const query = merchantLocked
        ? `?merchantId=${encodeURIComponent(String(merchantIdFromQuery))}`
        : '';
      const response = await fetch(`/api/v1/merchants/active${query}`, {
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
      if (merchantLocked && (!data.merchants || data.merchants.length === 0)) {
        setBlockingCode('merchant_context_unavailable');
        setBlockingReason(
          'The merchant selected from Shop is no longer available for voucher purchase.'
        );
      }
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

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/v1/customer/dashboard', {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      setWalletBalanceMock(Number(data?.walletBalance ?? 0));
    } catch {
      setWalletBalanceMock(0);
    }
  };

  const handleSelectMerchant = (merchantId: string) => {
    setSelectedMerchant(merchantId);
    if (productIdFromQuery) return;
    setSelectedProductId(null);
  };

  const handleSelectMerchantProduct = (productId: string) => {
    const product = selectedMerchantProducts.find((item) => item.id === productId);
    if (!product) return;
    setSelectedProductId(product.id);
    setVoucherAmount(Number(product.faceValue));
  };

  const paymentMethods = [
    {
      id: 'visa_secure' as PaymentMethod,
      name: 'VISA Secure (3DS2)',
      icon: 'CreditCardIcon',
      description: 'Card + 3D Secure badge and OTP challenge',
    },
    {
      id: 'debit_credit' as PaymentMethod,
      name: 'Debit / Credit Card',
      icon: 'CreditCardIcon',
      description: 'Standard card payment (mocked gateway)',
    },
    {
      id: 'payfast' as PaymentMethod,
      name: 'PayFast',
      icon: 'BanknotesIcon',
      description: 'Redirect to PayFast checkout',
    },
    {
      id: 'eft' as PaymentMethod,
      name: 'EFT',
      icon: 'BuildingLibraryIcon',
      description: 'Pay by bank transfer (upload proof)',
    },
    {
      id: 'wallet' as PaymentMethod,
      name: 'eVoucher Wallet',
      icon: 'WalletIcon',
      description: 'Use your wallet cash balance',
    },
  ].filter((method) => !(walletTopupMode && method.id === 'wallet'));

  const resetErrors = () => setFormErrors({});

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedPaymentMethod) {
      errs.paymentMethod = 'Select a payment method.';
    }
    if (selectedPaymentMethod === 'visa_secure' || selectedPaymentMethod === 'debit_credit') {
      const digits = cardNumber.replace(/\s+/g, '');
      if (digits.length < 13) errs.cardNumber = 'Enter a valid card number.';
      if (!cardName.trim()) errs.cardName = 'Cardholder name required.';
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) errs.cardExpiry = 'Use MM/YY.';
      if (!/^\d{3,4}$/.test(cardCvv)) errs.cardCvv = 'CVV must be 3-4 digits.';
      if (!billingAddress.trim()) errs.billingAddress = 'Billing address required.';
    }
    if (selectedPaymentMethod === 'payfast') {
      if (!payfastEmail.trim() || !payfastEmail.includes('@'))
        errs.payfastEmail = 'Valid email required.';
    }
    if (selectedPaymentMethod === 'eft') {
      if (!eftReference.trim()) errs.eftReference = 'Reference required.';
      if (!eftProofName) errs.eftProofName = 'Proof of payment is required.';
    }
    if (selectedPaymentMethod === 'wallet') {
      if (checkoutPricing.consumerPrice > walletBalanceMock) {
        errs.wallet = 'Insufficient wallet balance for this payment.';
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePurchase = async () => {
    if (!selectedPaymentMethod || blockingReason) return;
    if (!cartCheckout && !walletTopupMode && !selectedMerchant) return;
    if (cartCheckout && checkoutCartItems.length === 0) {
      setError('Your cart is empty. Add items from Shop before checkout.');
      return;
    }

    setProcessing(true);
    setError('');
    setPurchaseStatus(null);
    setIssuedVouchers([]);
    setPricingResult(null);
    resetErrors();

    if (!validateForm()) {
      setProcessing(false);
      return;
    }

    try {
      const submitPurchase = async (payload: {
        merchantId: string;
        productId?: string;
        faceValue?: number;
        selectedBranchId?: string;
        selectedBranchName?: string;
        selectedBranchCity?: string;
        selectedBranchProvince?: string;
        branchSelectionMode?: 'nearest' | 'manual';
      }) => {
        const response = await fetch('/api/v1/vouchers/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...payload,
            paymentMethod: selectedPaymentMethod,
            cardLastFour: cardNumber.slice(-4),
            cardBrand: selectedPaymentMethod === 'visa_secure' ? 'VISA' : 'CARD',
            eftReference,
            payfastEmail,
            billingAddress,
            eftProofName,
            selectedBranchId: payload.selectedBranchId,
            selectedBranchName: payload.selectedBranchName,
            selectedBranchCity: payload.selectedBranchCity,
            selectedBranchProvince: payload.selectedBranchProvince,
            branchSelectionMode: payload.branchSelectionMode,
          }),
        });
        const data = await parseApiResponse(response);
        if (!response.ok) {
          setBlockingCode(data.code ?? null);
          if (data.code === 'consumer_only_purchase') {
            setBlockingReason(
              'This route is consumer-only. Sign in as a consumer account to continue.'
            );
          } else if (data.code === 'missing_admin_env') {
            setBlockingReason(
              'Server configuration is incomplete. Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.'
            );
          }
          throw new Error(data.error || 'Failed to process purchase');
        }
        return data;
      };

      if (walletTopupMode) {
        const topupResponse = await fetch('/api/v1/wallet/topup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            amount: voucherAmount,
            paymentMethod: selectedPaymentMethod,
            cardLastFour: cardNumber.slice(-4),
            cardBrand: selectedPaymentMethod === 'visa_secure' ? 'VISA' : 'CARD',
            eftReference,
            payfastEmail,
            billingAddress,
            eftProofName,
          }),
        });
        const topupData = await parseApiResponse(topupResponse);
        if (!topupResponse.ok) {
          throw new Error(topupData.error || 'Failed to top up wallet');
        }

        setPurchaseStatus(topupData.status);
        setVoucherCode(null);
        setIssuedVouchers([]);
        setTransactionReference(topupData.transactionReference || null);
        setCheckoutUrl(topupData.checkoutUrl || null);
        const resolvedTopupBalance = Number(topupData.walletBalance ?? walletBalanceMock);
        setWalletBalanceMock(resolvedTopupBalance);
        if (user?.id && topupData.status === 'completed') {
          persistWalletTopupHint({
            userId: user.id,
            transactionReference: topupData.transactionReference ?? null,
            walletBalance: resolvedTopupBalance,
            amount: Number(voucherAmount),
          });
        }
        setPricingResult({
          faceValue: Number(voucherAmount.toFixed(2)),
          totalDiscountPct: 0,
          consumerBenefitPct: 0,
          evoucherBenefitPct: 0,
          totalDiscountAmount: 0,
          consumerBenefitAmount: 0,
          evoucherBenefitAmount: 0,
          consumerPrice: Number(voucherAmount.toFixed(2)),
          merchantReceivableAfterTotalDiscount: Number(voucherAmount.toFixed(2)),
          merchantReceivableAfterEvoucherBenefit: Number(voucherAmount.toFixed(2)),
        });
      } else if (cartCheckout) {
        const expandedItems = checkoutCartItems.flatMap((item) =>
          Array.from({ length: Math.max(1, Number(item.quantity) || 1) }, () => item)
        );

        const results = [];
        for (const item of expandedItems) {
          const result = await submitPurchase({
            merchantId: item.merchantId,
            productId:
              item.productId &&
              !item.productId.startsWith('fallback-') &&
              !item.productId.startsWith('starter-')
                ? item.productId
                : undefined,
            faceValue: Number(item.faceValue),
            selectedBranchId: item.selectedBranchId,
            selectedBranchName: item.selectedBranchName,
            selectedBranchCity: item.selectedBranchCity,
            selectedBranchProvince: item.selectedBranchProvince,
            branchSelectionMode: item.branchSelectionMode,
          });
          results.push(result);
        }

        const hasFailed = results.some((result: any) => String(result.status) === 'failed');
        const hasPending = results.some((result: any) => String(result.status) === 'pending');
        const mergedIssuedVouchers = results.flatMap((result: any) =>
          Array.isArray(result.issuedVouchers) ? result.issuedVouchers : []
        );
        const firstTransactionRef =
          (results.find((result: any) => result?.transactionReference)?.transactionReference as
            | string
            | null) ?? null;
        const firstCheckoutUrl =
          (results.find((result: any) => result?.checkoutUrl)?.checkoutUrl as string | null) ??
          null;

        setPurchaseStatus(hasFailed ? 'failed' : hasPending ? 'pending' : 'completed');
        setVoucherCode(mergedIssuedVouchers[0]?.code ?? null);
        setIssuedVouchers(mergedIssuedVouchers);
        setTransactionReference(firstTransactionRef);
        setCheckoutUrl(firstCheckoutUrl);
        setPricingResult(checkoutPricing);
        if (!hasPending && !hasFailed) {
          clearCart(user?.id);
        }
      } else {
        const data = await submitPurchase({
          merchantId: selectedMerchant as string,
          productId:
            selectedProductId && !selectedProductId.startsWith('fallback-')
              ? selectedProductId
              : undefined,
          faceValue: voucherAmount,
          selectedBranchId: selectedBranchIdFromQuery ?? undefined,
          selectedBranchName: selectedBranchNameFromQuery ?? undefined,
          selectedBranchCity: selectedBranchCityFromQuery ?? undefined,
          selectedBranchProvince: selectedBranchProvinceFromQuery ?? undefined,
          branchSelectionMode: branchSelectionModeFromQuery === 'manual' ? 'manual' : 'nearest',
        });

        setPurchaseStatus(data.status);
        setVoucherCode(data.voucherCode || null);
        if (Array.isArray(data.issuedVouchers)) setIssuedVouchers(data.issuedVouchers);
        setTransactionReference(data.transactionReference || null);
        setCheckoutUrl(data.checkoutUrl || null);
        setPricingResult(data.pricing ?? previewPricing);
        if (data.status === 'completed') {
          clearCart(user?.id);
        }
      }
    } catch (purchaseError: any) {
      setPurchaseStatus('failed');
      setError(purchaseError?.message || 'Failed to process payment. Please try again.');
      setPricingResult(checkoutPricing);
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
      const data = await parseApiResponse(response);
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
    const paymentMethodLabel =
      paymentMethods.find((method) => method.id === selectedPaymentMethod)?.name ?? 'N/A';

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Header />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border text-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${statusClasses.bg}`}
              >
                <Icon
                  name={statusIcon as any}
                  size={48}
                  variant="solid"
                  className={statusClasses.text}
                />
              </div>
              <h2 className="font-headline font-bold text-3xl text-foreground mb-3">
                {statusTitle}
              </h2>
              <p className="text-muted-foreground font-body mb-6">
                {purchaseStatus === 'completed' &&
                  (walletTopupMode
                    ? 'Your wallet top-up completed successfully.'
                    : 'Your voucher has been issued and is ready to use.')}
                {purchaseStatus === 'pending' &&
                  (walletTopupMode
                    ? 'Your top-up payment is pending confirmation.'
                    : 'Your payment is pending confirmation. Your voucher will be issued once confirmed.')}
                {purchaseStatus === 'failed' && 'Your payment could not be processed.'}
              </p>

              <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left space-y-2">
                <p className="text-sm font-body text-muted-foreground">
                  <span className="font-semibold text-foreground">Payment status:</span>{' '}
                  {purchaseStatus}
                </p>
                <p className="text-sm font-body text-muted-foreground">
                  <span className="font-semibold text-foreground">Payment method:</span>{' '}
                  {paymentMethodLabel}
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
                      <span className="font-semibold text-foreground">Your savings:</span>{' '}
                      {pricingResult.consumerBenefitPct.toFixed(2)}%
                    </p>
                  </>
                )}
                {transactionReference && (
                  <p className="text-sm font-body text-muted-foreground">
                    <span className="font-semibold text-foreground">Transaction ref:</span>{' '}
                    {transactionReference}
                  </p>
                )}
                {voucherCode && (
                  <p className="text-sm font-body text-muted-foreground">
                    <span className="font-semibold text-foreground">Voucher issued:</span>{' '}
                    {voucherCode}
                  </p>
                )}
                {issuedVouchers.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm font-semibold text-foreground mb-2">Issued voucher(s)</p>
                    <div className="space-y-2">
                      {issuedVouchers.map((voucher) => (
                        <div key={voucher.code} className="rounded-lg border border-border p-2">
                          <p className="text-xs text-muted-foreground font-body">
                            Code:{' '}
                            <span className="font-semibold text-foreground">{voucher.code}</span>
                          </p>
                          <p className="text-xs text-muted-foreground font-body">
                            Face value: R{Number(voucher.faceValue ?? 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground font-body">
                            Expiry:{' '}
                            {voucher.expiresAt
                              ? new Date(voucher.expiresAt).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
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
                  onClick={() => router.push(walletTopupMode ? '/wallet' : '/customer/dashboard')}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-headline font-semibold hover:bg-primary/90 transition-all duration-300"
                >
                  {walletTopupMode ? 'Go to Wallet' : 'Go to Customer Dashboard'}
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
            <h1 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-2">
              {walletTopupMode ? 'Top Up Wallet' : 'Buy Vouchers'}
            </h1>
            <p className="text-muted-foreground font-body">
              {walletTopupMode
                ? 'Choose amount, merchant, and payment method to add new voucher value to your wallet.'
                : 'Secure purchase with server-side billing. You only see safe payment status and voucher output.'}
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
                <Icon
                  name="BuildingStorefrontIcon"
                  size={24}
                  variant="solid"
                  className="text-primary"
                />
                <h2 className="font-headline font-bold text-2xl text-foreground">
                  {walletTopupMode
                    ? 'Top-Up Amount'
                    : cartCheckout
                      ? 'Checkout Cart'
                      : 'Select Merchant'}
                </h2>
              </div>
              {walletTopupMode ? (
                <p className="text-sm text-muted-foreground">
                  Choose the top-up amount, then select a payment method to fund your wallet
                  balance.
                </p>
              ) : cartCheckout ? (
                <div className="space-y-3">
                  {checkoutCartItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-body">
                      Your cart is empty. Add products from Shop to continue.
                    </p>
                  ) : (
                    checkoutCartItems.map((item) => (
                      <div
                        key={`${item.merchantId}:${item.productId}`}
                        className="rounded-xl border border-border p-3 bg-background"
                      >
                        <p className="text-xs uppercase tracking-wide text-primary font-headline font-semibold">
                          {item.merchantName}
                        </p>
                        <p className="font-headline font-semibold text-foreground">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty {item.quantity} x R{Number(item.consumerPrice).toFixed(2)} = R
                          {(Number(item.consumerPrice) * Number(item.quantity)).toFixed(2)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ) : merchantLocked ? (
                <div className="rounded-xl border-2 border-primary bg-primary/5 p-4">
                  {selectedMerchantDetails ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10">
                        <Icon
                          name="BuildingStorefrontIcon"
                          size={24}
                          variant="solid"
                          className="text-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-headline font-bold text-foreground">
                          {selectedMerchantDetails.businessName}
                        </h3>
                        <p className="text-sm text-muted-foreground font-body">
                          {selectedMerchantDetails.email}
                        </p>
                        <p className="text-xs text-primary font-body mt-1">
                          Discount budget:{' '}
                          {selectedMerchantDetails.defaultTotalDiscountPct.toFixed(2)}%
                        </p>
                        {brandKeyFromQuery && (
                          <p className="text-xs text-muted-foreground font-body mt-1">
                            Source: Shop brand {brandKeyFromQuery}
                          </p>
                        )}
                      </div>
                      <Icon
                        name="LockClosedIcon"
                        size={20}
                        variant="solid"
                        className="text-primary"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground font-body">
                      Selected merchant context is locked from Shop.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {merchants.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon
                        name="BuildingStorefrontIcon"
                        size={48}
                        variant="outline"
                        className="text-muted-foreground mx-auto mb-4"
                      />
                      <p className="text-muted-foreground font-body">
                        No active merchants available
                      </p>
                    </div>
                  ) : (
                    merchants.map((merchant) => (
                      <button
                        key={merchant.id}
                        onClick={() => handleSelectMerchant(merchant.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                          selectedMerchant === merchant.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10">
                            <Icon
                              name="BuildingStorefrontIcon"
                              size={24}
                              variant="solid"
                              className="text-primary"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-headline font-bold text-foreground">
                              {merchant.businessName}
                            </h3>
                            <p className="text-sm text-muted-foreground font-body">
                              {merchant.email}
                            </p>
                            <p className="text-xs text-primary font-body mt-1">
                              Discount budget: {merchant.defaultTotalDiscountPct.toFixed(2)}%
                            </p>
                            <p className="text-xs text-muted-foreground font-body mt-1">
                              {merchant.productCount ?? merchant.products?.length ?? 0} product
                              {(merchant.productCount ?? merchant.products?.length ?? 0) === 1
                                ? ''
                                : 's'}{' '}
                              available
                            </p>
                          </div>
                          {selectedMerchant === merchant.id && (
                            <Icon
                              name="CheckCircleIcon"
                              size={24}
                              variant="solid"
                              className="text-primary"
                            />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {!walletTopupMode &&
                !cartCheckout &&
                selectedMerchantDetails &&
                selectedMerchantProducts.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <label className="block text-sm font-headline font-semibold text-foreground">
                        Actual Products Sold
                      </label>
                      <span className="text-xs text-muted-foreground font-body">
                        {selectedMerchantProducts.length} shown
                      </span>
                    </div>
                    <div className="space-y-2">
                      {selectedMerchantProducts.map((product) => {
                        const isSelected = selectedProductId === product.id;
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSelectMerchantProduct(product.id)}
                            className={`w-full rounded-xl border p-3 text-left transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-headline font-semibold text-foreground">
                                  {product.productName}
                                </p>
                                <p className="text-xs text-muted-foreground font-body mt-1">
                                  Face value R{Number(product.faceValue).toFixed(2)} · Save R
                                  {Number(product.consumerBenefitAmount).toFixed(2)} · Pay R
                                  {Number(product.consumerPrice).toFixed(2)}
                                </p>
                              </div>
                              <span className="px-2 py-1 rounded-full text-xs bg-success/10 text-success font-headline font-semibold">
                                {Number(product.totalDiscountPct).toFixed(1)}% off
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {!cartCheckout && (
                <div className="mt-6">
                  <label
                    htmlFor="voucher-amount-select"
                    className="block text-sm font-headline font-semibold text-foreground mb-2"
                  >
                    {selectedMerchantProducts.length > 0
                      ? 'Selected Product Face Value (R)'
                      : 'Voucher Amount (R)'}
                  </label>
                  <select
                    id="voucher-amount-select"
                    value={voucherAmount}
                    onChange={(e) => {
                      const nextAmount = Number(e.target.value);
                      setVoucherAmount(nextAmount);
                      if (
                        selectedMerchantProducts.length > 0 &&
                        !selectedMerchantProducts.some(
                          (product) => Number(product.faceValue) === Number(nextAmount)
                        )
                      ) {
                        setSelectedProductId(null);
                      }
                    }}
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
              )}
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
                    onClick={() => {
                      setSelectedPaymentMethod(method.id);
                      resetErrors();
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      selectedPaymentMethod === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon
                          name={method.icon as any}
                          size={24}
                          variant="solid"
                          className="text-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-headline font-bold text-foreground">{method.name}</h3>
                        <p className="text-sm text-muted-foreground font-body">
                          {method.description}
                        </p>
                      </div>
                      {selectedPaymentMethod === method.id && (
                        <Icon
                          name="CheckCircleIcon"
                          size={24}
                          variant="solid"
                          className="text-primary"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {formErrors.paymentMethod && (
                <p className="text-xs text-error font-body mb-4">{formErrors.paymentMethod}</p>
              )}

              {(selectedPaymentMethod === 'visa_secure' ||
                selectedPaymentMethod === 'debit_credit') && (
                <div className="rounded-xl border border-border p-4 mb-6 space-y-3">
                  {selectedPaymentMethod === 'visa_secure' && (
                    <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                      <p className="text-xs font-semibold text-primary">VISA Secure 3DS2</p>
                      <p className="text-xs text-muted-foreground">OTP challenge simulated</p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="card-number"
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      Card Number
                    </label>
                    <input
                      id="card-number"
                      type="text"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(event) => setCardNumber(event.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      placeholder="4111 1111 1111 1111"
                    />
                    {formErrors.cardNumber && (
                      <p className="text-xs text-error mt-1">{formErrors.cardNumber}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="card-name" className="block text-xs text-muted-foreground mb-1">
                      Cardholder Name
                    </label>
                    <input
                      id="card-name"
                      type="text"
                      value={cardName}
                      onChange={(event) => setCardName(event.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      placeholder="Name on card"
                    />
                    {formErrors.cardName && (
                      <p className="text-xs text-error mt-1">{formErrors.cardName}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="card-expiry"
                        className="block text-xs text-muted-foreground mb-1"
                      >
                        Expiry (MM/YY)
                      </label>
                      <input
                        id="card-expiry"
                        type="text"
                        value={cardExpiry}
                        onChange={(event) => setCardExpiry(event.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg"
                        placeholder="12/29"
                      />
                      {formErrors.cardExpiry && (
                        <p className="text-xs text-error mt-1">{formErrors.cardExpiry}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="card-cvv"
                        className="block text-xs text-muted-foreground mb-1"
                      >
                        CVV
                      </label>
                      <input
                        id="card-cvv"
                        type="password"
                        inputMode="numeric"
                        value={cardCvv}
                        onChange={(event) => setCardCvv(event.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg"
                        placeholder="123"
                      />
                      {formErrors.cardCvv && (
                        <p className="text-xs text-error mt-1">{formErrors.cardCvv}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="billing-address"
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      Billing Address
                    </label>
                    <input
                      id="billing-address"
                      type="text"
                      value={billingAddress}
                      onChange={(event) => setBillingAddress(event.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      placeholder="Street, City, Postal Code"
                    />
                    {formErrors.billingAddress && (
                      <p className="text-xs text-error mt-1">{formErrors.billingAddress}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'payfast' && (
                <div className="rounded-xl border border-border p-4 mb-6 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    PayFast redirect checkout (simulated)
                  </p>
                  <div>
                    <label
                      htmlFor="payfast-email"
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      Receipt Email
                    </label>
                    <input
                      id="payfast-email"
                      type="email"
                      value={payfastEmail}
                      onChange={(event) => setPayfastEmail(event.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      placeholder="you@example.com"
                    />
                    {formErrors.payfastEmail && (
                      <p className="text-xs text-error mt-1">{formErrors.payfastEmail}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'eft' && (
                <div className="rounded-xl border border-border p-4 mb-6 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    EFT Details: FNB Business Account | Acc: 62834910251 | Branch: 250655
                  </p>
                  <div>
                    <label
                      htmlFor="eft-reference"
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      EFT Reference
                    </label>
                    <input
                      id="eft-reference"
                      type="text"
                      value={eftReference}
                      onChange={(event) => setEftReference(event.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      placeholder="Your bank transfer reference"
                    />
                    {formErrors.eftReference && (
                      <p className="text-xs text-error mt-1">{formErrors.eftReference}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="eft-proof" className="block text-xs text-muted-foreground mb-1">
                      Proof of Payment Upload
                    </label>
                    <input
                      id="eft-proof"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(event) => setEftProofName(event.target.files?.[0]?.name ?? null)}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    />
                    {eftProofName && (
                      <p className="text-xs text-muted-foreground mt-1">Selected: {eftProofName}</p>
                    )}
                    {formErrors.eftProofName && (
                      <p className="text-xs text-error mt-1">{formErrors.eftProofName}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'wallet' && (
                <div className="rounded-xl border border-border p-4 mb-6 space-y-2">
                  <p className="text-sm text-muted-foreground">Available eVoucher Wallet Balance</p>
                  <p className="text-2xl font-headline font-bold text-foreground">
                    R{walletBalanceMock.toFixed(2)}
                  </p>
                  {formErrors.wallet && (
                    <p className="text-xs text-error mt-1">{formErrors.wallet}</p>
                  )}
                </div>
              )}

              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-body">Face Value</span>
                  <span className="font-headline font-bold text-foreground">
                    R{checkoutPricing.faceValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-body">
                    Total Discount Budget ({checkoutPricing.totalDiscountPct.toFixed(2)}%)
                  </span>
                  <span className="font-headline font-bold text-success">
                    -R{checkoutPricing.totalDiscountAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-body">
                    Your Savings ({checkoutPricing.consumerBenefitPct.toFixed(2)}%)
                  </span>
                  <span className="font-headline font-bold text-success">
                    -R{checkoutPricing.consumerBenefitAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-body">
                    Platform Fee ({checkoutPricing.evoucherBenefitPct.toFixed(2)}%)
                  </span>
                  <span className="font-headline font-bold text-primary">
                    R{checkoutPricing.evoucherBenefitAmount.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-semibold text-foreground">You Pay</span>
                    <span className="font-headline font-bold text-2xl text-primary">
                      R{checkoutPricing.consumerPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-body">
                      Merchant Receivable (FV - Total Discount)
                    </span>
                    <span className="font-headline font-semibold text-foreground">
                      R{checkoutPricing.merchantReceivableAfterTotalDiscount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={
                  (!cartCheckout && !walletTopupMode && !selectedMerchant) ||
                  (cartCheckout && checkoutCartItems.length === 0) ||
                  !selectedPaymentMethod ||
                  processing ||
                  Boolean(blockingReason)
                }
                className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-headline font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {processing ? 'Processing...' : 'Complete Purchase'}
              </button>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-muted/40 px-2 py-2 text-center text-xs">
                  SSL Secure
                </div>
                <div className="rounded-lg border border-border bg-muted/40 px-2 py-2 text-center text-xs">
                  PCI-DSS
                </div>
                <div className="rounded-lg border border-border bg-muted/40 px-2 py-2 text-center text-xs">
                  VISA Secure
                </div>
                <div className="rounded-lg border border-border bg-muted/40 px-2 py-2 text-center text-xs">
                  FNB Acquiring
                </div>
              </div>

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

function BuyVouchersPageFallback() {
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

export default function BuyVouchersPage() {
  return (
    <Suspense fallback={<BuyVouchersPageFallback />}>
      <BuyVouchersContent />
    </Suspense>
  );
}
