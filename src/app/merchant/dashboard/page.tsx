'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';

interface Merchant {
  id: string;
  business_name: string;
  parent_brand?: string | null;
  branch_name?: string | null;
  branch_code?: string | null;
  city?: string | null;
  province?: string | null;
  status: string;
  onboarding_fee_paid: boolean;
  charity_donation_amount: number;
  default_total_discount_pct: number;
  created_at: string;
  approved_at: string | null;
  email: string;
  phone: string;
  bank_name: string | null;
  merchant_type?: string | null;
  parent_merchant_id?: string | null;
  is_branch?: boolean | null;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  payout_date: string | null;
  created_at: string;
}

interface MerchantProduct {
  id: string;
  product_name: string;
  parent_brand?: string | null;
  redemption_scope?: 'all_branches' | 'specific_branch' | 'province_wide' | 'national';
  valid_provinces?: string[] | null;
  valid_branch_ids?: string[] | null;
  face_value: number;
  total_discount_pct: number;
  consumer_benefit_pct: number;
  evoucher_benefit_pct: number;
  consumer_price: number;
  merchant_receivable_after_total_discount: number;
  is_active: boolean;
  is_special?: boolean;
  special_title?: string | null;
  special_end_at?: string | null;
  display_priority?: number;
  created_at: string;
}

interface AnalyticsMetrics {
  totalVolume: number;
  totalSavings: number;
  totalMargin: number;
  pendingSettlements: number;
  paidSettlements: number;
  transactionCount: number;
  averageDiscountPct: number;
  roiPct: number;
}

interface MerchantBranch {
  id: string;
  business_name: string | null;
  branch_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  status: string | null;
}

const PROMOTION_BADGES = [
  'Weekend Special',
  'Flash Sale',
  'Monthly Deal',
  'Clearance',
  'Member Exclusive',
] as const;

const GROCERY_PRESETS = [
  { label: 'R50 Essentials', productName: 'R50 Grocery Voucher', faceValue: 50, totalDiscountPct: 4 },
  { label: 'R100 Basket', productName: 'R100 Grocery Voucher', faceValue: 100, totalDiscountPct: 4 },
  { label: 'R200 Weekly Top-up', productName: 'R200 Grocery Voucher', faceValue: 200, totalDiscountPct: 4 },
  { label: 'R500 Family Pack', productName: 'R500 Grocery Voucher', faceValue: 500, totalDiscountPct: 5 },
  { label: 'R1000 Monthly Shop', productName: 'R1000 Grocery Voucher', faceValue: 1000, totalDiscountPct: 5 },
] as const;

function toFriendlyDashboardError(message: string) {
  const normalized = String(message ?? '').toLowerCase();
  if (normalized.includes('invalid input syntax for type integer')) {
    return 'Merchant profile mapping is out of sync. Please refresh, then complete onboarding again if this persists.';
  }
  if (normalized.includes('merchant profile not found')) {
    return 'Merchant profile not found. Complete onboarding first, then sign in again.';
  }
  return message || 'Failed to load merchant dashboard.';
}

export default function MerchantDashboard() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [merchantProducts, setMerchantProducts] = useState<MerchantProduct[]>([]);
  const [branches, setBranches] = useState<MerchantBranch[]>([]);
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productMessage, setProductMessage] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [activeMerchantTab, setActiveMerchantTab] = useState<'products' | 'studio'>('studio');
  const [productForm, setProductForm] = useState({
    productName: '',
    faceValue: 100,
    totalDiscountPct: 4,
    validityDays: 90,
    redemptionScope: 'all_branches' as 'all_branches' | 'specific_branch' | 'province_wide' | 'national',
    isSpecial: false,
    specialTitle: 'Weekend Special',
    specialEndAt: '',
    displayPriority: 0,
    validBranchIds: [] as string[],
  });
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/merchant/login');
      return;
    }

    if (!authLoading && user) {
      let cancelled = false;
      const resolveGuard = async () => {
        try {
          const stateResponse = await fetch('/api/v1/merchant/auth-state', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          });
          const statePayload = await stateResponse.json().catch(() => ({} as any));
          if (cancelled) return;
          if (!stateResponse.ok) {
            throw new Error(statePayload?.error || 'Failed to verify merchant access.');
          }
          if (!statePayload?.isMerchant) {
            router.push('/shop');
            return;
          }
          if (Boolean(statePayload?.mustResetPassword)) {
            router.push('/merchant/change-password');
          }
        } catch {
          const resolvedRole = String(role ?? user.user_metadata?.role ?? '').toLowerCase();
          if (resolvedRole && resolvedRole !== 'merchant') {
            router.push('/shop');
          } else if (Boolean(user.user_metadata?.must_change_password)) {
            router.push('/merchant/change-password');
          }
        }
      };
      void resolveGuard();
      return () => {
        cancelled = true;
      };
    }
  }, [user, role, authLoading, router]);

  useEffect(() => {
    if (user) {
      void fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const dashboardRes = await fetch('/api/v1/merchant/dashboard', {
        method: 'GET',
        credentials: 'include',
      });
      const dashboardData = await dashboardRes.json();
      if (!dashboardRes.ok) {
        throw new Error(dashboardData.error || 'Failed to load merchant dashboard');
      }
      setMerchant(dashboardData.merchant || null);
      setPayouts(dashboardData.payouts || []);

      const [analyticsRes, productsRes, branchesRes] = await Promise.all([
        fetch('/api/v1/analytics/overview', {
          method: 'GET',
          credentials: 'include',
        }),
        fetch('/api/v1/merchant/products', {
          method: 'GET',
          credentials: 'include',
        }),
        fetch('/api/v1/merchant/branches', {
          method: 'GET',
          credentials: 'include',
        }),
      ]);

      const analyticsData = await analyticsRes.json();
      if (analyticsRes.ok) {
        setAnalyticsMetrics(analyticsData.metrics || null);
      }

      const productsData = await productsRes.json();
      if (productsRes.ok) {
        setMerchantProducts(productsData.products || []);
      } else {
        setProductMessage(productsData.error || 'Unable to load products.');
      }

      const branchesData = await branchesRes.json().catch(() => ({} as any));
      if (branchesRes.ok) {
        setBranches(Array.isArray(branchesData?.branches) ? branchesData.branches : []);
      }
    } catch (dashboardError: any) {
      setError(toFriendlyDashboardError(String(dashboardError?.message || '')));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/merchant/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success bg-success/10';
      case 'approved':
        return 'text-primary bg-primary/10';
      case 'pending':
        return 'text-warning bg-warning/10';
      case 'suspended':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const totalPayouts = payouts.reduce((sum, payout) => sum + Number(payout.amount), 0);
  const pendingPayouts = payouts
    .filter((payout) => payout.status === 'pending')
    .reduce((sum, payout) => sum + Number(payout.amount), 0);

  const activeProducts = useMemo(
    () => merchantProducts.filter((product) => product.is_active).length,
    [merchantProducts]
  );
  const pricingPreview = useMemo(() => {
    const faceValue = Number(productForm.faceValue || 0);
    const totalDiscountPct = Number(productForm.totalDiscountPct || 0);
    const consumerBenefitPct = totalDiscountPct / 2;
    const platformBenefitPct = totalDiscountPct / 2;
    const consumerPrice = faceValue * (1 - consumerBenefitPct / 100);
    const merchantReceivable = faceValue * (1 - totalDiscountPct / 100);
    const platformRevenue = faceValue * (platformBenefitPct / 100);
    return {
      faceValue,
      totalDiscountPct,
      consumerBenefitPct,
      platformBenefitPct,
      consumerPrice,
      merchantReceivable,
      platformRevenue,
    };
  }, [productForm.faceValue, productForm.totalDiscountPct]);

  const applyPreset = (preset: (typeof GROCERY_PRESETS)[number]) => {
    setProductForm({
      productName: preset.productName,
      faceValue: preset.faceValue,
      totalDiscountPct: preset.totalDiscountPct,
      validityDays: 90,
      redemptionScope: 'all_branches',
      isSpecial: false,
      specialTitle: 'Weekend Special',
      specialEndAt: '',
      displayPriority: 0,
      validBranchIds: [],
    });
    setProductMessage(`Applied preset: ${preset.label}`);
  };

  const handleCreateProduct = async () => {
    try {
      setSavingProduct(true);
      setProductMessage('');
      const response = await fetch('/api/v1/merchant/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productName: productForm.productName,
          faceValue: Number(productForm.faceValue),
          totalDiscountPct: Number(productForm.totalDiscountPct),
          redemptionScope: productForm.redemptionScope,
          isSpecial: productForm.isSpecial,
          specialTitle: productForm.isSpecial ? productForm.specialTitle : null,
          specialEndAt: productForm.isSpecial ? productForm.specialEndAt : null,
          displayPriority: Number(productForm.displayPriority ?? 0),
          validProvinces:
            productForm.redemptionScope === 'province_wide' && merchant?.province
              ? [merchant.province]
              : [],
          validBranchIds:
            productForm.redemptionScope === 'specific_branch'
              ? productForm.validBranchIds
              : [],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product.');
      }

      setProductMessage('Voucher product created.');
      setProductForm({
        productName: '',
        faceValue: 100,
        totalDiscountPct: 4,
        validityDays: 90,
        redemptionScope: 'all_branches',
        isSpecial: false,
        specialTitle: 'Weekend Special',
        specialEndAt: '',
        displayPriority: 0,
        validBranchIds: [],
      });
      await fetchDashboardData();
    } catch (productError: any) {
      setProductMessage(productError?.message || 'Failed to create product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleProduct = async (product: MerchantProduct) => {
    try {
      setProductMessage('');
      const response = await fetch(`/api/v1/merchant/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          isActive: !product.is_active,
          productName: product.product_name,
          faceValue: Number(product.face_value),
          totalDiscountPct: Number(product.total_discount_pct),
          isSpecial: Boolean(product.is_special),
          specialTitle: product.special_title ?? null,
          specialEndAt: product.special_end_at ?? null,
          displayPriority: Number(product.display_priority ?? 0),
          redemptionScope: product.redemption_scope ?? 'all_branches',
          validProvinces: product.valid_provinces ?? [],
          validBranchIds: product.valid_branch_ids ?? [],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product.');
      }

      setProductMessage(
        `${product.product_name} ${product.is_active ? 'deactivated' : 'activated'} successfully.`
      );
      await fetchDashboardData();
    } catch (toggleError: any) {
      setProductMessage(toggleError?.message || 'Failed to update product.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-muted rounded-2xl" />
              <div className="grid md:grid-cols-3 gap-6">
                <div className="h-48 bg-muted rounded-2xl" />
                <div className="h-48 bg-muted rounded-2xl" />
                <div className="h-48 bg-muted rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.16),_transparent_50%),#f4fbfa]">
      <Header />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 rounded-2xl border border-teal-300/40 bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-5 text-white shadow-xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-teal-100 font-headline">
              eVoucher Platform
            </p>
            <h2 className="mt-2 font-headline font-bold text-2xl">Merchant Business Portal</h2>
            <p className="mt-1 text-sm text-teal-100">
              Products, approvals, payouts, and analytics in one operating workspace.
            </p>
          </div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-2">
                {merchant?.business_name || 'Merchant Dashboard'}
              </h1>
              <p className="text-muted-foreground font-body">
                Merchant-only operations: onboarding status, product catalogue, discounts, payouts, and performance.
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-6 py-3 bg-card border border-border rounded-lg font-headline font-semibold hover:bg-muted transition-all duration-300"
            >
              <Icon name="ArrowRightOnRectangleIcon" size={20} variant="outline" />
              <span>Sign Out</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error font-body">{error}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void fetchDashboardData()}
                  className="px-3 py-1.5 rounded-lg bg-error text-white text-xs font-headline font-semibold"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/merchants')}
                  className="px-3 py-1.5 rounded-lg border border-error/40 text-error text-xs font-headline font-semibold"
                >
                  Open Onboarding
                </button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Icon name="CheckBadgeIcon" size={24} variant="solid" className="text-secondary" />
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-headline font-semibold ${getStatusColor(merchant?.status || 'pending')}`}
                >
                  {merchant?.status?.toUpperCase()}
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-body mb-1">Onboarding Status</p>
              <p className="text-2xl font-headline font-bold text-foreground capitalize">{merchant?.status}</p>
            </div>

            <div className="bg-gradient-to-br from-teal-600 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">Total Paid Out</p>
              <p className="text-4xl font-headline font-bold">R{totalPayouts.toFixed(2)}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">Pending Payouts</p>
              <p className="text-4xl font-headline font-bold">R{pendingPayouts.toFixed(2)}</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-600 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">Active Products</p>
              <p className="text-4xl font-headline font-bold">{activeProducts}</p>
            </div>
          </div>

          {analyticsMetrics && (
            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h2 className="font-headline font-bold text-2xl text-foreground">Performance KPIs</h2>
                <div className="flex gap-3">
                  <a
                    href="/api/v1/analytics/export?type=monthly"
                    className="px-4 py-2 rounded-lg border border-border font-headline font-semibold hover:bg-muted"
                  >
                    Export Monthly CSV
                  </a>
                  <a
                    href="/api/v1/analytics/export?type=transactions"
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-headline font-semibold"
                  >
                    Export Transactions CSV
                  </a>
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <p className="text-xl font-headline font-bold text-foreground">
                    R{Number(analyticsMetrics.totalVolume).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground">Platform Margin</p>
                  <p className="text-xl font-headline font-bold text-primary">
                    R{Number(analyticsMetrics.totalMargin).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground">Average Discount</p>
                  <p className="text-xl font-headline font-bold text-success">
                    {Number(analyticsMetrics.averageDiscountPct).toFixed(2)}%
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="text-xl font-headline font-bold text-foreground">
                    {analyticsMetrics.transactionCount}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid xl:grid-cols-[1.2fr,1fr] gap-8 mb-8">
            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline font-bold text-2xl text-foreground">Voucher Product Studio</h2>
                <Icon name="TicketIcon" size={24} variant="solid" className="text-primary" />
              </div>
              <div className="mb-4 inline-flex rounded-lg border border-border bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setActiveMerchantTab('products')}
                  className={`px-3 py-1.5 rounded-md text-sm font-headline font-semibold transition-colors ${
                    activeMerchantTab === 'products'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMerchantTab('studio')}
                  className={`px-3 py-1.5 rounded-md text-sm font-headline font-semibold transition-colors ${
                    activeMerchantTab === 'studio'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Product Studio
                </button>
              </div>

              {activeMerchantTab === 'studio' && (
                <>
                  <p className="text-sm text-muted-foreground font-body mb-4">
                    Grocery recommendation: use a total discount between 3% and 15%. The 50/50 split is enforced:
                    consumer benefit and platform margin each receive half of total discount.
                  </p>
                  <p className="text-sm text-muted-foreground font-body mb-4">
                    Example (R100 voucher @ 5%): consumer pays R97.50, platform retains R2.50, merchant settlement is
                    R95.00.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-5">
                    {GROCERY_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => applyPreset(preset)}
                        className="px-3 py-2 rounded-lg border border-border text-xs font-headline font-semibold hover:bg-muted"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 mb-4">
                <input
                  type="text"
                  value={productForm.productName}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, productName: event.target.value }))
                  }
                  placeholder="Product name (e.g. R100 Grocery Voucher)"
                  className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                />
                <input
                  type="number"
                  min={10}
                  value={productForm.faceValue}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, faceValue: Number(event.target.value || 0) }))
                  }
                  placeholder="Face value"
                  className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                />
                <input
                  type="number"
                  min={3}
                  max={15}
                  step={0.1}
                  value={productForm.totalDiscountPct}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      totalDiscountPct: Number(event.target.value || 0),
                    }))
                  }
                  placeholder="Total discount %"
                  className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                />
                <div className="md:col-span-3 rounded-lg border border-border bg-background px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Discount slider ({Number(productForm.totalDiscountPct).toFixed(1)}%)</span>
                    <span>3% - 15%</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={15}
                    step={0.5}
                    value={productForm.totalDiscountPct}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        totalDiscountPct: Number(event.target.value || 0),
                      }))
                    }
                    className="w-full accent-primary"
                  />
                </div>
                <select
                  value={productForm.redemptionScope}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      redemptionScope: event.target.value as
                        | 'all_branches'
                        | 'specific_branch'
                        | 'province_wide'
                        | 'national',
                    }))
                  }
                  className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                >
                  <option value="all_branches">All brand branches</option>
                  <option value="specific_branch">This branch only</option>
                  <option value="province_wide">Province-wide</option>
                  <option value="national">National</option>
                </select>
                <select
                  value={productForm.validityDays}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      validityDays: Number(event.target.value || 90),
                    }))
                  }
                  className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                >
                  <option value={30}>30 days validity</option>
                  <option value={60}>60 days validity</option>
                  <option value={90}>90 days validity</option>
                  <option value={180}>180 days validity</option>
                  <option value={365}>365 days validity</option>
                </select>
                {productForm.redemptionScope === 'specific_branch' && (
                  <select
                    value={productForm.validBranchIds[0] ?? ''}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        validBranchIds: event.target.value ? [event.target.value] : [],
                      }))
                    }
                    className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branch_name || branch.business_name || branch.email || branch.id}
                      </option>
                    ))}
                  </select>
                )}
                <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 text-sm font-body text-foreground">
                  <input
                    type="checkbox"
                    checked={productForm.isSpecial}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, isSpecial: event.target.checked }))
                    }
                  />
                  Mark as special offer
                </label>
                {productForm.isSpecial && (
                  <>
                    <select
                      value={productForm.specialTitle}
                      onChange={(event) =>
                        setProductForm((prev) => ({ ...prev, specialTitle: event.target.value }))
                      }
                      className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                    >
                      {PROMOTION_BADGES.map((badge) => (
                        <option key={badge} value={badge}>
                          {badge}
                        </option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      value={productForm.specialEndAt}
                      onChange={(event) =>
                        setProductForm((prev) => ({ ...prev, specialEndAt: event.target.value }))
                      }
                      className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                    />
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={productForm.displayPriority}
                      onChange={(event) =>
                        setProductForm((prev) => ({
                          ...prev,
                          displayPriority: Number(event.target.value || 0),
                        }))
                      }
                      placeholder="Display priority"
                      className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                    />
                  </>
                )}
                  </div>

                  <button
                    onClick={() => void handleCreateProduct()}
                    disabled={savingProduct}
                    className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-headline font-semibold disabled:opacity-50"
                  >
                    {savingProduct ? 'Saving Product...' : 'Create Product'}
                  </button>

                  {productMessage && (
                    <p className="mt-3 text-sm text-muted-foreground font-body">{productMessage}</p>
                  )}
                </>
              )}

              {activeMerchantTab === 'products' && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveMerchantTab('studio')}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-headline font-semibold"
                  >
                    New Product
                  </button>
                </div>
              )}

              {activeMerchantTab === 'products' && (
                <div className="mt-2 space-y-3">
                {merchantProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body">
                    No products yet. Start by applying a grocery preset.
                  </p>
                ) : (
                  merchantProducts.map((product) => (
                    <div key={product.id} className="rounded-xl border border-border p-4 bg-muted/30">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="font-headline font-semibold text-foreground">{product.product_name}</p>
                          <p className="text-sm text-muted-foreground font-body">
                            FV R{Number(product.face_value).toFixed(2)} | Discount{' '}
                            {Number(product.total_discount_pct).toFixed(2)}% | Consumer pays R
                            {Number(product.consumer_price).toFixed(2)} | Merchant receives R
                            {Number(product.merchant_receivable_after_total_discount).toFixed(2)}
                          </p>
                          <p className="text-xs text-primary font-body mt-1">
                            Scope: {String(product.redemption_scope ?? 'all_branches').replace('_', ' ')}
                          </p>
                          {product.is_special && (
                            <p className="text-xs text-warning font-body mt-1">
                              Special: {product.special_title || 'Limited offer'}
                              {product.special_end_at
                                ? ` (ends ${new Date(product.special_end_at).toLocaleString()})`
                                : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-headline font-semibold ${
                              product.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {product.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          <button
                            onClick={() => void handleToggleProduct(product)}
                            className="px-3 py-2 rounded-lg border border-border text-xs font-headline font-semibold hover:bg-muted"
                          >
                            {product.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                </div>
              )}
            </div>

            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
              <div className="mb-6 rounded-xl bg-slate-900 text-white p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300 font-headline">
                  Live Price Calculator
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Face Value</span>
                    <span className="font-headline font-semibold">R{pricingPreview.faceValue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Total Discount</span>
                    <span className="font-headline font-semibold">
                      {pricingPreview.totalDiscountPct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-px bg-slate-700 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Consumer Pays</span>
                    <span className="font-headline font-semibold text-emerald-300">
                      R{pricingPreview.consumerPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Merchant Receives</span>
                    <span className="font-headline font-semibold text-amber-300">
                      R{pricingPreview.merchantReceivable.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Platform Earns</span>
                    <span className="font-headline font-semibold text-cyan-300">
                      R{pricingPreview.platformRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-200">
                    50/50 split rule: Consumer benefit {pricingPreview.consumerBenefitPct.toFixed(2)}% |
                    Platform margin {pricingPreview.platformBenefitPct.toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline font-bold text-2xl text-foreground">Merchant Operations</h2>
                <Icon name="BuildingStorefrontIcon" size={24} variant="solid" className="text-secondary" />
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-headline font-semibold text-foreground">Merchant Account</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Business Name: {merchant?.business_name || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    Parent Brand: {merchant?.parent_brand || merchant?.business_name || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    Branch: {merchant?.branch_name || merchant?.business_name || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    Email: {merchant?.email || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    Merchant Type: {String(merchant?.merchant_type ?? 'private').toUpperCase()}
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-headline font-semibold text-foreground">Compliance & Payout Setup</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Onboarding fee: {merchant?.onboarding_fee_paid ? 'Paid' : 'Pending'}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    Bank: {merchant?.bank_name || 'Not configured'}
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-headline font-semibold text-foreground">Promotion Guidance</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Keep discount budgets between 4% and 5% for grocery products to balance conversion and payout.
                  </p>
                </div>

                {String(merchant?.merchant_type ?? '').toLowerCase() === 'chain' && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-headline font-semibold text-foreground">Branch Management</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      Parent/child branch hierarchy with branch-scoped product visibility.
                    </p>
                    <div className="mt-3 space-y-2 max-h-40 overflow-auto pr-1">
                      {branches.length === 0 ? (
                        <p className="text-xs text-muted-foreground font-body">No branches linked yet.</p>
                      ) : (
                        branches.map((branch) => (
                          <div
                            key={branch.id}
                            className="rounded-md border border-border bg-background px-2 py-2"
                          >
                            <p className="text-xs font-headline font-semibold text-foreground">
                              {branch.branch_name || branch.business_name || 'Branch'}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-body">
                              {branch.city || 'City n/a'} | {branch.province || 'Province n/a'} |{' '}
                              {String(branch.status ?? 'pending')}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline font-bold text-2xl text-foreground">Payout Status</h2>
              <Icon name="BanknotesIcon" size={24} variant="solid" className="text-success" />
            </div>

            <div className="space-y-4">
              {payouts.length === 0 ? (
                <div className="text-center py-12">
                  <Icon
                    name="BanknotesIcon"
                    size={48}
                    variant="outline"
                    className="text-muted-foreground mx-auto mb-4"
                  />
                  <p className="text-muted-foreground font-body">No payouts yet</p>
                </div>
              ) : (
                payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          payout.status === 'completed' ? 'bg-success/10' : 'bg-warning/10'
                        }`}
                      >
                        <Icon
                          name={payout.status === 'completed' ? 'CheckCircleIcon' : 'ClockIcon'}
                          size={20}
                          variant="solid"
                          className={payout.status === 'completed' ? 'text-success' : 'text-warning'}
                        />
                      </div>
                      <div>
                        <p className="font-headline font-semibold text-foreground capitalize">{payout.status}</p>
                        <p className="text-sm text-muted-foreground font-body">
                          {payout.payout_date ? new Date(payout.payout_date).toLocaleDateString() : 'Processing'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-headline font-bold text-lg text-foreground">
                        R{Number(payout.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
