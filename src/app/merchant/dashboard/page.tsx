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

const GROCERY_PRESETS = [
  { label: 'R50 Essentials', productName: 'R50 Grocery Voucher', faceValue: 50, totalDiscountPct: 4 },
  { label: 'R100 Basket', productName: 'R100 Grocery Voucher', faceValue: 100, totalDiscountPct: 4 },
  { label: 'R200 Weekly Top-up', productName: 'R200 Grocery Voucher', faceValue: 200, totalDiscountPct: 4 },
  { label: 'R500 Family Pack', productName: 'R500 Grocery Voucher', faceValue: 500, totalDiscountPct: 5 },
  { label: 'R1000 Monthly Shop', productName: 'R1000 Grocery Voucher', faceValue: 1000, totalDiscountPct: 5 },
] as const;

export default function MerchantDashboard() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [merchantProducts, setMerchantProducts] = useState<MerchantProduct[]>([]);
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productMessage, setProductMessage] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    productName: '',
    faceValue: 100,
    totalDiscountPct: 4,
    redemptionScope: 'all_branches' as 'all_branches' | 'specific_branch' | 'province_wide' | 'national',
  });
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/merchant/login');
      return;
    }

    if (!authLoading && user) {
      if (Boolean(user.user_metadata?.must_change_password)) {
        router.push('/merchant/change-password');
        return;
      }
      const resolvedRole = String(role ?? user.user_metadata?.role ?? '').toLowerCase();
      if (resolvedRole && resolvedRole !== 'merchant') {
        router.push('/shop');
      }
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

      const [analyticsRes, productsRes] = await Promise.all([
        fetch('/api/v1/analytics/overview', {
          method: 'GET',
          credentials: 'include',
        }),
        fetch('/api/v1/merchant/products', {
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
    } catch (dashboardError: any) {
      setError(dashboardError?.message || 'Failed to load merchant dashboard.');
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

  const applyPreset = (preset: (typeof GROCERY_PRESETS)[number]) => {
    setProductForm({
      productName: preset.productName,
      faceValue: preset.faceValue,
      totalDiscountPct: preset.totalDiscountPct,
      redemptionScope: 'all_branches',
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
          validProvinces:
            productForm.redemptionScope === 'province_wide' && merchant?.province
              ? [merchant.province]
              : [],
          validBranchIds:
            productForm.redemptionScope === 'specific_branch' && merchant?.id ? [merchant.id] : [],
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
        redemptionScope: 'all_branches',
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
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-primary/5">
      <Header />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
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
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
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

            <div className="bg-gradient-to-br from-success to-success/80 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">Total Paid Out</p>
              <p className="text-4xl font-headline font-bold">R{totalPayouts.toFixed(2)}</p>
            </div>

            <div className="bg-gradient-to-br from-warning to-warning/80 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">Pending Payouts</p>
              <p className="text-4xl font-headline font-bold">R{pendingPayouts.toFixed(2)}</p>
            </div>

            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white shadow-lg">
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

              <p className="text-sm text-muted-foreground font-body mb-4">
                Grocery recommendation: use a total discount between 4% and 5%. For 4% total discount, consumer
                benefit is 2.8% and platform fee is 1.2%.
              </p>
              <p className="text-sm text-muted-foreground font-body mb-4">
                Example (R100 voucher @ 4%): consumer pays R97.20, platform retains R1.20, merchant settlement is
                R96.00.
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
                  min={0}
                  max={100}
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

              <div className="mt-6 space-y-3">
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
            </div>

            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
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
