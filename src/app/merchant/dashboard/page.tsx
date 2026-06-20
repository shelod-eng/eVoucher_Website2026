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

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  grossAmount: number;
  bankFee: number;
  platformRevenue: number;
  consumerBenefit: number;
  settlementTarget: string;
  status: string;
  batchId: string | null;
  batchNumber: string | null;
  ackNckStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  payout_date: string | null;
  created_at: string;
  bankserv_batch_id: string | null;
  bankserv_file_ref: string | null;
  ack_nck_status: string | null;
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

interface LogisticsInventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
  unitPrice: number;
  sourceProductId?: string;
}

interface LogisticsOrderItem {
  inventoryId: string;
  name: string;
  quantity: number;
}

interface LogisticsOrder {
  id: string;
  status: 'pending' | 'packed' | 'in_transit' | 'delivered';
  created_at: string;
  destination: string;
  reference: string;
  items: LogisticsOrderItem[];
}

function buildDefaultProductForm(defaultDiscountPct = 4) {
  return {
    productName: '',
    faceValue: 100,
    totalDiscountPct: Number(defaultDiscountPct),
    validityDays: 90,
    redemptionScope: 'all_branches' as
      | 'all_branches'
      | 'specific_branch'
      | 'province_wide'
      | 'national',
    isSpecial: false,
    specialTitle: 'Weekend Special',
    specialEndAt: '',
    displayPriority: 0,
    validBranchIds: [] as string[],
  };
}

const PROMOTION_BADGES = [
  'Weekend Special',
  'Flash Sale',
  'Monthly Deal',
  'Clearance',
  'Member Exclusive',
] as const;

const GROCERY_PRESETS = [
  {
    label: 'R50 Essentials',
    productName: 'R50 Grocery Voucher',
    faceValue: 50,
    totalDiscountPct: 4,
  },
  {
    label: 'R100 Basket',
    productName: 'R100 Grocery Voucher',
    faceValue: 100,
    totalDiscountPct: 4,
  },
  {
    label: 'R200 Weekly Top-up',
    productName: 'R200 Grocery Voucher',
    faceValue: 200,
    totalDiscountPct: 4,
  },
  {
    label: 'R500 Family Pack',
    productName: 'R500 Grocery Voucher',
    faceValue: 500,
    totalDiscountPct: 5,
  },
  {
    label: 'R1000 Monthly Shop',
    productName: 'R1000 Grocery Voucher',
    faceValue: 1000,
    totalDiscountPct: 5,
  },
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

function isDemoMerchantEmail(email: string | null | undefined) {
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase();
  return normalized.startsWith('demo-') && normalized.endsWith('@evoucher.co.za');
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
  const [activeMerchantTab, setActiveMerchantTab] = useState<
    'products' | 'studio' | 'payouts' | 'logistics' | 'ledger'
  >('studio');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerMeta, setLedgerMeta] = useState<{ total: number; hasMore: boolean; page: number }>(
    { total: 0, hasMore: false, page: 1 }
  );
  const [ledgerSettlementTarget, setLedgerSettlementTarget] = useState('sponsor_bank');
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [productsFilter, setProductsFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [productsSearch, setProductsSearch] = useState('');
  const [productsPage, setProductsPage] = useState(1);
  const [savingInlineEdit, setSavingInlineEdit] = useState(false);
  const [productForm, setProductForm] = useState(buildDefaultProductForm(4));
  const [logisticsInventory, setLogisticsInventory] = useState<LogisticsInventoryItem[]>([]);
  const [logisticsOrders, setLogisticsOrders] = useState<LogisticsOrder[]>([]);
  const [logisticsMessage, setLogisticsMessage] = useState('');
  const [logisticsForm, setLogisticsForm] = useState({
    inventoryId: '',
    quantity: 1,
    destination: '',
    reference: '',
  });
  const [seedingDemoData, setSeedingDemoData] = useState(false);
  const router = useRouter();
  const logisticsInventoryKey = useMemo(() => {
    return merchant?.id
      ? `evoucher_logistics_inventory_${merchant.id}`
      : 'evoucher_logistics_inventory_default';
  }, [merchant?.id]);
  const logisticsOrdersKey = useMemo(() => {
    return merchant?.id
      ? `evoucher_logistics_orders_${merchant.id}`
      : 'evoucher_logistics_orders_default';
  }, [merchant?.id]);

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
          const statePayload = await stateResponse.json().catch(() => ({}) as any);
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

  const fetchLedger = async (page = 1) => {
    try {
      setLedgerLoading(true);
      const res = await fetch(`/api/v1/merchant/ledger?page=${page}&limit=50`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) {
        setLedgerEntries(data.entries ?? []);
        setLedgerMeta(data.meta ?? { total: 0, hasMore: false, page });
        setLedgerSettlementTarget(data.settlementTarget ?? 'sponsor_bank');
      }
    } catch {
      // non-fatal
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const requestedTab = String(params.get('tab') ?? '').toLowerCase();
    if (requestedTab === 'payouts') {
      setActiveMerchantTab('payouts');
      return;
    }
    if (requestedTab === 'logistics') {
      setActiveMerchantTab('logistics');
      return;
    }
    if (requestedTab === 'products') {
      setActiveMerchantTab('products');
      return;
    }
    if (requestedTab === 'studio') {
      setActiveMerchantTab('studio');
    }
    if (requestedTab === 'ledger') {
      setActiveMerchantTab('ledger');
    }
  }, []);

  useEffect(() => {
    if (activeMerchantTab === 'ledger' && user) void fetchLedger(1);
  }, [activeMerchantTab, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        tab?: 'products' | 'studio' | 'payouts' | 'logistics';
      }>;
      const requestedTab = customEvent?.detail?.tab;
      if (!requestedTab) return;
      setActiveMerchantTab(requestedTab);
    };
    window.addEventListener('merchant-tab-change', handler as EventListener);
    return () => {
      window.removeEventListener('merchant-tab-change', handler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!merchant?.id) return;
    const storedInventory = window.localStorage.getItem(logisticsInventoryKey);
    if (storedInventory) {
      try {
        const parsed = JSON.parse(storedInventory) as LogisticsInventoryItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLogisticsInventory(parsed);
          return;
        }
      } catch {
        // ignore parse errors and re-seed
      }
    }
    if (logisticsInventory.length > 0) return;
    if (merchantProducts.length === 0) {
      setLogisticsInventory([]);
      return;
    }
    const seeded = merchantProducts.slice(0, 12).map((product, index) => ({
      id: product.id,
      name: product.product_name,
      sku: `SPC-${String(index + 1).padStart(3, '0')}`,
      stock: 25 + index * 3,
      reorderLevel: 12,
      unitPrice: Number(product.face_value ?? 0),
      sourceProductId: product.id,
    }));
    setLogisticsInventory(seeded);
  }, [merchant?.id, merchantProducts, logisticsInventoryKey, logisticsInventory.length]);

  useEffect(() => {
    if (!merchant?.id || merchantProducts.length === 0) return;
    setLogisticsInventory((prev) => {
      const existingSourceIds = new Set(
        prev.map((item) => String(item.sourceProductId ?? item.id))
      );
      const missingProducts = merchantProducts.filter(
        (product) => !existingSourceIds.has(String(product.id))
      );
      if (missingProducts.length === 0) return prev;
      const startIndex = prev.length;
      const additions = missingProducts.map((product, index) => ({
        id: String(product.id),
        name: String(product.product_name ?? 'Voucher Product'),
        sku: `SPC-${String(startIndex + index + 1).padStart(3, '0')}`,
        stock: 20 + index * 2,
        reorderLevel: 10,
        unitPrice: Number(product.face_value ?? 0),
        sourceProductId: String(product.id),
      }));
      return [...prev, ...additions];
    });
  }, [merchant?.id, merchantProducts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!merchant?.id) return;
    const storedOrders = window.localStorage.getItem(logisticsOrdersKey);
    if (storedOrders) {
      try {
        const parsed = JSON.parse(storedOrders) as LogisticsOrder[];
        setLogisticsOrders(parsed);
      } catch {
        setLogisticsOrders([]);
      }
    }
  }, [merchant?.id, logisticsOrdersKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(logisticsInventoryKey, JSON.stringify(logisticsInventory));
  }, [logisticsInventory, logisticsInventoryKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(logisticsOrdersKey, JSON.stringify(logisticsOrders));
  }, [logisticsOrders, logisticsOrdersKey]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const dashboardRes = await fetch('/api/v1/merchant/dashboard', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const dashboardData = await dashboardRes.json();
      if (dashboardRes.status === 401) {
        router.replace('/merchant/login');
        return;
      }
      if (!dashboardRes.ok) {
        throw new Error(dashboardData.error || 'Failed to load merchant dashboard');
      }
      setMerchant(dashboardData.merchant || null);
      setPayouts(dashboardData.payouts || []);

      const [analyticsRes, productsRes, branchesRes] = await Promise.all([
        fetch('/api/v1/analytics/overview', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/api/v1/merchant/products', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/api/v1/merchant/branches', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
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

      const branchesData = await branchesRes.json().catch(() => ({}) as any);
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
  const completedPayouts = useMemo(
    () => payouts.filter((payout) => String(payout.status).toLowerCase() === 'completed'),
    [payouts]
  );
  const pendingPayoutItems = useMemo(
    () => payouts.filter((payout) => String(payout.status).toLowerCase() === 'pending'),
    [payouts]
  );
  const nextPayoutDateLabel = useMemo(() => {
    const pendingWithDate = pendingPayoutItems.find((entry) => Boolean(entry.payout_date));
    if (pendingWithDate?.payout_date) {
      return new Date(pendingWithDate.payout_date).toLocaleDateString(undefined, {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    const nextFriday = new Date();
    const distanceToFriday = (5 - nextFriday.getDay() + 7) % 7 || 7;
    nextFriday.setDate(nextFriday.getDate() + distanceToFriday);
    return nextFriday.toLocaleDateString(undefined, {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [pendingPayoutItems]);

  const activeProducts = useMemo(
    () => merchantProducts.filter((product) => product.is_active).length,
    [merchantProducts]
  );
  const filteredProducts = useMemo(() => {
    const query = productsSearch.trim().toLowerCase();
    return merchantProducts.filter((product) => {
      const byFilter =
        productsFilter === 'all' ||
        (productsFilter === 'active' && product.is_active) ||
        (productsFilter === 'inactive' && !product.is_active);
      if (!byFilter) return false;
      if (!query) return true;
      return (
        String(product.product_name ?? '')
          .toLowerCase()
          .includes(query) ||
        String(product.parent_brand ?? '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [merchantProducts, productsFilter, productsSearch]);
  const productsPageSize = 5;
  const productsPageCount = Math.max(1, Math.ceil(filteredProducts.length / productsPageSize));
  const paginatedProducts = useMemo(() => {
    const start = (productsPage - 1) * productsPageSize;
    return filteredProducts.slice(start, start + productsPageSize);
  }, [filteredProducts, productsPage]);
  useEffect(() => {
    if (productsPage > productsPageCount) {
      setProductsPage(productsPageCount);
    }
  }, [productsPage, productsPageCount]);
  const estimatedTotalRevenue = useMemo(() => {
    return merchantProducts.reduce((sum, product) => {
      const base = Number(product.consumer_price ?? 0);
      const multiplier = product.is_active ? 12 : 4;
      return sum + base * multiplier;
    }, 0);
  }, [merchantProducts]);
  const estimatedVouchersSold = useMemo(() => {
    return merchantProducts.reduce((sum, product) => sum + (product.is_active ? 12 : 4), 0);
  }, [merchantProducts]);
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

  const logisticsSummary = useMemo(() => {
    const totalItems = logisticsInventory.reduce((sum, item) => sum + item.stock, 0);
    const lowStock = logisticsInventory.filter((item) => item.stock <= item.reorderLevel).length;
    const onHandValue = logisticsInventory.reduce(
      (sum, item) => sum + item.stock * item.unitPrice,
      0
    );
    return { totalItems, lowStock, onHandValue };
  }, [logisticsInventory]);

  const handleRestockItem = (inventoryId: string, amount = 10) => {
    setLogisticsInventory((prev) =>
      prev.map((item) => (item.id === inventoryId ? { ...item, stock: item.stock + amount } : item))
    );
    setLogisticsMessage('Inventory updated.');
  };

  const seedDemoMerchantActivity = async () => {
    if (!isDemoMerchantEmail(merchant?.email)) return;
    try {
      setSeedingDemoData(true);
      setProductMessage('Refreshing demo KPI and logistics seed...');
      await fetch('/api/v1/merchant/demo-seed', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
      await fetchDashboardData();
      setProductMessage('Demo data refreshed for this merchant dashboard.');
    } catch (seedError: any) {
      setProductMessage(seedError?.message || 'Failed to refresh demo data.');
    } finally {
      setSeedingDemoData(false);
    }
  };

  const handleCreateLogisticsOrder = () => {
    setLogisticsMessage('');
    const selectedItem = logisticsInventory.find((item) => item.id === logisticsForm.inventoryId);
    if (!selectedItem) {
      setLogisticsMessage('Select a product to dispatch.');
      return;
    }
    if (!logisticsForm.destination.trim()) {
      setLogisticsMessage('Add a delivery destination.');
      return;
    }
    if (logisticsForm.quantity <= 0) {
      setLogisticsMessage('Quantity must be at least 1.');
      return;
    }
    if (logisticsForm.quantity > selectedItem.stock) {
      setLogisticsMessage('Not enough stock available for that quantity.');
      return;
    }

    const newOrder: LogisticsOrder = {
      id: `ORD-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      destination: logisticsForm.destination.trim(),
      reference:
        logisticsForm.reference.trim() ||
        `${merchant?.business_name ?? 'Merchant'}-${new Date().getFullYear()}`,
      items: [
        {
          inventoryId: selectedItem.id,
          name: selectedItem.name,
          quantity: logisticsForm.quantity,
        },
      ],
    };

    setLogisticsOrders((prev) => [newOrder, ...prev]);
    setLogisticsInventory((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id ? { ...item, stock: item.stock - logisticsForm.quantity } : item
      )
    );
    setLogisticsForm({
      inventoryId: selectedItem.id,
      quantity: 1,
      destination: '',
      reference: '',
    });
    setLogisticsMessage('Dispatch order created.');
  };

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
            productForm.redemptionScope === 'specific_branch' ? productForm.validBranchIds : [],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product.');
      }

      setProductMessage('Voucher product created.');
      setProductForm(buildDefaultProductForm(Number(merchant?.default_total_discount_pct ?? 4)));
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

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      setProductMessage('');
      const response = await fetch(`/api/v1/merchant/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate product.');
      }
      setProductMessage(`${productName} deactivated.`);
      await fetchDashboardData();
    } catch (deleteError: any) {
      setProductMessage(deleteError?.message || 'Failed to deactivate product.');
    }
  };

  const handleInlineDiscountUpdate = async (product: MerchantProduct, nextDiscountPct: number) => {
    try {
      setSavingInlineEdit(true);
      setProductMessage('');
      const response = await fetch(`/api/v1/merchant/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productName: product.product_name,
          faceValue: Number(product.face_value),
          totalDiscountPct: Number(nextDiscountPct),
          isActive: Boolean(product.is_active),
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
        throw new Error(data.error || 'Failed to update discount.');
      }
      setProductMessage(`${product.product_name} discount updated.`);
      await fetchDashboardData();
    } catch (discountError: any) {
      setProductMessage(discountError?.message || 'Failed to update discount.');
    } finally {
      setSavingInlineEdit(false);
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
                Merchant-only operations: onboarding status, product catalogue, discounts, payouts,
                and performance.
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
                  <Icon
                    name="CheckBadgeIcon"
                    size={24}
                    variant="solid"
                    className="text-secondary"
                  />
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-headline font-semibold ${getStatusColor(merchant?.status || 'pending')}`}
                >
                  {merchant?.status?.toUpperCase()}
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-body mb-1">Onboarding Status</p>
              <p className="text-2xl font-headline font-bold text-foreground capitalize">
                {merchant?.status}
              </p>
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
                <h2 className="font-headline font-bold text-2xl text-foreground">
                  Performance KPIs
                </h2>
                <div className="flex gap-3">
                  {isDemoMerchantEmail(merchant?.email) && (
                    <button
                      type="button"
                      onClick={() => void seedDemoMerchantActivity()}
                      disabled={seedingDemoData}
                      className="px-4 py-2 rounded-lg border border-border font-headline font-semibold hover:bg-muted disabled:opacity-60"
                    >
                      {seedingDemoData ? 'Loading Demo Data...' : 'Load Demo Data'}
                    </button>
                  )}
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
                <h2 className="font-headline font-bold text-2xl text-foreground">
                  Voucher Product Studio
                </h2>
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
                <button
                  type="button"
                  onClick={() => setActiveMerchantTab('logistics')}
                  className={`px-3 py-1.5 rounded-md text-sm font-headline font-semibold transition-colors ${
                    activeMerchantTab === 'logistics'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Logistics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMerchantTab('payouts')}
                  className={`px-3 py-1.5 rounded-md text-sm font-headline font-semibold transition-colors ${
                    activeMerchantTab === 'payouts'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Payouts
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMerchantTab('ledger')}
                  className={`px-3 py-1.5 rounded-md text-sm font-headline font-semibold transition-colors ${
                    activeMerchantTab === 'ledger'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Ledger
                </button>
              </div>

              {activeMerchantTab === 'studio' && (
                <>
                  <p className="text-sm text-muted-foreground font-body mb-4">
                    Grocery recommendation: use a total discount between 3% and 15%. The 50/50 split
                    is enforced: consumer benefit and platform margin each receive half of total
                    discount.
                  </p>
                  <p className="text-sm text-muted-foreground font-body mb-4">
                    Example (R100 voucher @ 5%): consumer pays R97.50, platform retains R2.50,
                    merchant settlement is R95.00.
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
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-headline font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Product Name
                      </span>
                      <input
                        type="text"
                        value={productForm.productName}
                        onChange={(event) =>
                          setProductForm((prev) => ({ ...prev, productName: event.target.value }))
                        }
                        placeholder="e.g. R100 Grocery Voucher"
                        className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-headline font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Face Value (ZAR)
                      </span>
                      <input
                        type="number"
                        min={10}
                        value={productForm.faceValue}
                        onChange={(event) =>
                          setProductForm((prev) => ({
                            ...prev,
                            faceValue: Number(event.target.value || 0),
                          }))
                        }
                        className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-headline font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Total Discount (%)
                      </span>
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
                        className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                      />
                    </label>
                    <div className="md:col-span-3 rounded-lg border border-border bg-background px-4 py-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>
                          Discount slider ({Number(productForm.totalDiscountPct).toFixed(1)}%)
                        </span>
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
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-headline font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Redemption Scope
                      </span>
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
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-headline font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Validity Period
                      </span>
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
                    </label>
                    {productForm.redemptionScope === 'specific_branch' && (
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-headline font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Branch Selection
                        </span>
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
                              {branch.branch_name ||
                                branch.business_name ||
                                branch.email ||
                                branch.id}
                            </option>
                          ))}
                        </select>
                      </label>
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
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-headline font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Special Offer Label
                          </span>
                          <select
                            value={productForm.specialTitle}
                            onChange={(event) =>
                              setProductForm((prev) => ({
                                ...prev,
                                specialTitle: event.target.value,
                              }))
                            }
                            className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                          >
                            {PROMOTION_BADGES.map((badge) => (
                              <option key={badge} value={badge}>
                                {badge}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-headline font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Special Offer Ends
                          </span>
                          <input
                            type="datetime-local"
                            value={productForm.specialEndAt}
                            onChange={(event) =>
                              setProductForm((prev) => ({
                                ...prev,
                                specialEndAt: event.target.value,
                              }))
                            }
                            className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-headline font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Display Priority
                          </span>
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
                            className="px-4 py-3 border border-border rounded-lg bg-background font-body"
                          />
                        </label>
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

                  <p className="text-xs text-muted-foreground font-body">
                    Merchant-controlled setup: set your own discount %, specials, scope, and
                    priority before creating each product.
                  </p>

                  {productMessage && (
                    <p className="mt-3 text-sm text-muted-foreground font-body">{productMessage}</p>
                  )}
                </>
              )}

              {activeMerchantTab === 'products' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                      <p className="text-xs font-headline uppercase tracking-[0.14em] text-teal-700">
                        Active Products
                      </p>
                      <p className="text-4xl font-headline font-bold text-teal-700 mt-1">
                        {activeProducts}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-xs font-headline uppercase tracking-[0.14em] text-slate-300">
                        Total Revenue
                      </p>
                      <p className="text-4xl font-headline font-bold text-emerald-300 mt-1">
                        R{estimatedTotalRevenue.toFixed(0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs font-headline uppercase tracking-[0.14em] text-muted-foreground">
                        Vouchers Sold
                      </p>
                      <p className="text-4xl font-headline font-bold text-foreground mt-1">
                        {estimatedVouchersSold}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="inline-flex rounded-lg border border-border bg-muted p-1">
                      {(['all', 'active', 'inactive'] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => {
                            setProductsFilter(filter);
                            setProductsPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-md text-sm font-headline font-semibold transition-colors ${
                            productsFilter === filter
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {filter[0].toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="search"
                        value={productsSearch}
                        onChange={(event) => {
                          setProductsSearch(event.target.value);
                          setProductsPage(1);
                        }}
                        placeholder="Search products..."
                        className="w-56 rounded-lg border border-border bg-background px-3 py-2 text-sm font-body"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMerchantTab('studio');
                          setProductMessage(
                            'Tip: Use Product Studio to set discount %, specials, and scope, then click Create Product.'
                          );
                        }}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-headline font-semibold"
                      >
                        Add Product
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {paginatedProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground font-body">
                        No products found for this filter.
                      </p>
                    ) : (
                      paginatedProducts.map((product) => {
                        const estimatedSold = product.is_active ? 12 : 4;
                        const estimatedRevenue =
                          Number(product.consumer_price ?? 0) * estimatedSold;
                        const estimatedRedemptionRate = product.is_active ? 92 : 61;
                        return (
                          <div
                            key={product.id}
                            className="rounded-xl border border-border bg-card p-4 shadow-sm"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-headline font-semibold text-foreground text-lg">
                                    {product.product_name}
                                  </p>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-headline font-semibold ${product.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}
                                  >
                                    {product.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground font-body">
                                  Scope:{' '}
                                  {String(product.redemption_scope ?? 'all_branches').replace(
                                    '_',
                                    ' '
                                  )}
                                  {product.special_title
                                    ? ` | Special: ${product.special_title}`
                                    : ''}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 text-sm font-body">
                                  <span className="text-foreground font-headline">
                                    R{Number(product.face_value).toFixed(0)}{' '}
                                    <span className="text-muted-foreground font-body">
                                      face value
                                    </span>
                                  </span>
                                  <span className="text-primary font-headline">
                                    {Number(product.total_discount_pct).toFixed(1)}% discount
                                  </span>
                                  <span className="text-muted-foreground">
                                    You pay R{Number(product.consumer_price).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleToggleProduct(product)}
                                  className="rounded-lg border border-border px-2.5 py-2 text-xs font-headline font-semibold hover:bg-muted"
                                >
                                  {product.is_active ? 'Hide' : 'Show'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleInlineDiscountUpdate(
                                      product,
                                      Number(product.total_discount_pct)
                                    )
                                  }
                                  disabled={savingInlineEdit}
                                  className="rounded-lg border border-border px-2.5 py-2 text-xs font-headline font-semibold hover:bg-muted disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDeleteProduct(product.id, product.product_name)
                                  }
                                  className="rounded-lg border border-error/30 px-2.5 py-2 text-xs font-headline font-semibold text-error hover:bg-error/10"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 grid md:grid-cols-4 gap-3 text-sm">
                              <label className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Face Value</span>
                                <input
                                  type="number"
                                  min={10}
                                  defaultValue={Number(product.face_value)}
                                  onBlur={(event) => {
                                    const nextValue = Number(event.currentTarget.value || 0);
                                    if (
                                      !Number.isFinite(nextValue) ||
                                      nextValue <= 0 ||
                                      nextValue === Number(product.face_value)
                                    )
                                      return;
                                    void handleInlineDiscountUpdate(
                                      { ...product, face_value: nextValue },
                                      Number(product.total_discount_pct)
                                    );
                                  }}
                                  className="rounded-lg border border-border bg-background px-2.5 py-1.5"
                                />
                              </label>
                              <label className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Discount %</span>
                                <input
                                  type="number"
                                  min={3}
                                  max={15}
                                  step={0.1}
                                  defaultValue={Number(product.total_discount_pct)}
                                  onBlur={(event) => {
                                    const nextDiscount = Number(event.currentTarget.value || 0);
                                    if (
                                      !Number.isFinite(nextDiscount) ||
                                      nextDiscount < 3 ||
                                      nextDiscount > 15 ||
                                      nextDiscount === Number(product.total_discount_pct)
                                    )
                                      return;
                                    void handleInlineDiscountUpdate(product, nextDiscount);
                                  }}
                                  className="rounded-lg border border-border bg-background px-2.5 py-1.5"
                                />
                              </label>
                              <div className="rounded-lg border border-border bg-muted/20 px-2.5 py-1.5">
                                <p className="text-xs text-muted-foreground">Sold Count</p>
                                <p className="font-headline font-bold text-foreground">
                                  {estimatedSold}
                                </p>
                              </div>
                              <div className="rounded-lg border border-border bg-muted/20 px-2.5 py-1.5">
                                <p className="text-xs text-muted-foreground">Revenue</p>
                                <p className="font-headline font-bold text-primary">
                                  R{estimatedRevenue.toFixed(0)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground font-body">
                              Redemption rate:{' '}
                              <span className="font-headline font-semibold text-success">
                                {estimatedRedemptionRate}%
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {productsPageCount > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Page {productsPage} of {productsPageCount}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setProductsPage((prev) => Math.max(1, prev - 1))}
                          disabled={productsPage <= 1}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs font-headline font-semibold disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setProductsPage((prev) => Math.min(productsPageCount, prev + 1))
                          }
                          disabled={productsPage >= productsPageCount}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs font-headline font-semibold disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeMerchantTab === 'logistics' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                      <p className="text-xs font-headline uppercase tracking-[0.14em] text-teal-700">
                        Stock On Hand
                      </p>
                      <p className="text-4xl font-headline font-bold text-teal-700 mt-1">
                        {logisticsSummary.totalItems}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-headline uppercase tracking-[0.14em] text-amber-700">
                        Low Stock
                      </p>
                      <p className="text-4xl font-headline font-bold text-amber-700 mt-1">
                        {logisticsSummary.lowStock}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs font-headline uppercase tracking-[0.14em] text-muted-foreground">
                        Inventory Value
                      </p>
                      <p className="text-4xl font-headline font-bold text-foreground mt-1">
                        R{logisticsSummary.onHandValue.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  <div className="grid xl:grid-cols-[1.4fr,1fr] gap-4">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-headline font-semibold text-foreground">
                            Inventory (SuperPrecast catalogue)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Synced from merchant products for demo logistics workflows.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRestockItem(logisticsInventory[0]?.id ?? '', 25)}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs font-headline font-semibold"
                          disabled={logisticsInventory.length === 0}
                        >
                          Quick Restock +25
                        </button>
                      </div>

                      {logisticsInventory.length === 0 ? (
                        <p className="text-sm text-muted-foreground font-body">
                          No inventory available yet. Add products to populate logistics.
                        </p>
                      ) : (
                        <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
                          {logisticsInventory.map((item) => {
                            const isLow = item.stock <= item.reorderLevel;
                            return (
                              <div
                                key={item.id}
                                className={`rounded-lg border px-3 py-3 ${
                                  isLow
                                    ? 'border-amber-300 bg-amber-50'
                                    : 'border-border bg-background'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-headline font-semibold text-foreground">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      SKU: {item.sku} · Unit R{item.unitPrice.toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-headline font-bold text-foreground">
                                      {item.stock}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                      Reorder @{item.reorderLevel}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRestockItem(item.id, 10)}
                                    className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-headline font-semibold"
                                  >
                                    Restock +10
                                  </button>
                                  {isLow && (
                                    <span className="text-xs font-headline font-semibold text-amber-700">
                                      Low stock alert
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-headline font-semibold text-foreground">
                            Dispatch Order
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Create a shipment for sponsor review.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <select
                          value={logisticsForm.inventoryId}
                          onChange={(event) =>
                            setLogisticsForm((prev) => ({
                              ...prev,
                              inventoryId: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select product</option>
                          {logisticsInventory.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={logisticsForm.quantity}
                          onChange={(event) =>
                            setLogisticsForm((prev) => ({
                              ...prev,
                              quantity: Number(event.target.value || 1),
                            }))
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Quantity"
                        />
                        <input
                          type="text"
                          value={logisticsForm.destination}
                          onChange={(event) =>
                            setLogisticsForm((prev) => ({
                              ...prev,
                              destination: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Delivery destination"
                        />
                        <input
                          type="text"
                          value={logisticsForm.reference}
                          onChange={(event) =>
                            setLogisticsForm((prev) => ({
                              ...prev,
                              reference: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Reference (optional)"
                        />
                        <button
                          type="button"
                          onClick={handleCreateLogisticsOrder}
                          className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-headline font-semibold text-white"
                        >
                          Create Dispatch Order
                        </button>
                        {logisticsMessage && (
                          <p className="text-xs text-muted-foreground">{logisticsMessage}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-headline font-semibold text-foreground">Recent Orders</p>
                      <span className="text-xs text-muted-foreground">
                        {logisticsOrders.length} tracked
                      </span>
                    </div>
                    {logisticsOrders.length === 0 ? (
                      <p className="text-sm text-muted-foreground font-body">
                        No dispatch orders yet. Create one to start tracking logistics.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {logisticsOrders.slice(0, 5).map((order) => (
                          <div
                            key={order.id}
                            className="rounded-lg border border-border bg-background px-3 py-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-headline font-semibold text-foreground">
                                  {order.reference}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleString()} ·{' '}
                                  {order.destination}
                                </p>
                              </div>
                              <span className="text-xs font-headline font-semibold text-primary">
                                {order.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {order.items.map((item) => (
                                <div key={item.inventoryId}>
                                  {item.name} · Qty {item.quantity}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeMerchantTab === 'ledger' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-headline font-semibold text-foreground">
                        Billing Engine Ledger
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        Settlement target:{' '}
                        <span
                          className={`font-headline font-semibold ${
                            ledgerSettlementTarget === 'evoucher_bank'
                              ? 'text-primary'
                              : 'text-success'
                          }`}
                        >
                          {ledgerSettlementTarget === 'evoucher_bank'
                            ? 'eVoucher Bank Account'
                            : 'Sponsor Bank (FNB/RMB)'}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href="/api/v1/merchant/ledger?limit=100"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-headline font-semibold hover:bg-muted"
                      >
                        Download Statement
                      </a>
                      <button
                        type="button"
                        onClick={() => void fetchLedger(1)}
                        disabled={ledgerLoading}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-headline font-semibold disabled:opacity-50"
                      >
                        {ledgerLoading ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                      <p className="text-xs font-headline uppercase tracking-[0.14em] text-teal-700">
                        Total Entries
                      </p>
                      <p className="text-3xl font-headline font-bold text-teal-700 mt-1">
                        {ledgerMeta.total}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs font-headline uppercase tracking-[0.14em] text-muted-foreground">
                        Total Net Payable
                      </p>
                      <p className="text-3xl font-headline font-bold text-foreground mt-1">
                        R
                        {ledgerEntries
                          .reduce((sum, e) => sum + e.amount, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs font-headline uppercase tracking-[0.14em] text-muted-foreground">
                        Total Bank Fees
                      </p>
                      <p className="text-3xl font-headline font-bold text-error mt-1">
                        R
                        {ledgerEntries
                          .reduce((sum, e) => sum + e.bankFee, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {ledgerLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-20 bg-muted animate-pulse rounded-xl" />
                      ))}
                    </div>
                  ) : ledgerEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon
                        name="BanknotesIcon"
                        size={40}
                        variant="outline"
                        className="text-muted-foreground mx-auto mb-3"
                      />
                      <p className="text-sm text-muted-foreground font-body">
                        No ledger entries yet. Entries appear once settlements are processed.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ledgerEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-xl border border-border bg-card p-4 shadow-sm"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-headline font-semibold ${
                                    entry.status === 'confirmed'
                                      ? 'bg-success/10 text-success'
                                      : entry.status === 'submitted_to_bank'
                                        ? 'bg-primary/10 text-primary'
                                        : entry.status === 'pending'
                                          ? 'bg-warning/10 text-warning'
                                          : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {entry.status}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-headline font-semibold ${
                                    entry.settlementTarget === 'evoucher_bank'
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-teal-50 text-teal-700'
                                  }`}
                                >
                                  {entry.settlementTarget === 'evoucher_bank'
                                    ? 'eVoucher Bank'
                                    : 'Sponsor Bank'}
                                </span>
                                {entry.ackNckStatus && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-headline font-semibold ${
                                      entry.ackNckStatus === 'acked'
                                        ? 'bg-success/10 text-success'
                                        : entry.ackNckStatus === 'escalated' ||
                                            entry.ackNckStatus === 'failed'
                                          ? 'bg-error/10 text-error'
                                          : 'bg-warning/10 text-warning'
                                    }`}
                                  >
                                    ACK: {entry.ackNckStatus}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-body">
                                {entry.batchNumber && (
                                  <span className="font-mono">Batch: {entry.batchNumber}</span>
                                )}
                                <span>
                                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-headline font-bold text-foreground text-lg">
                                R{entry.amount.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Gross R{entry.grossAmount.toFixed(2)}
                              </p>
                              {entry.bankFee > 0 && (
                                <p className="text-xs text-error">
                                  Bank fee &minus;R{entry.bankFee.toFixed(2)}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Platform R{entry.platformRevenue.toFixed(2)} · Benefit R
                                {entry.consumerBenefit.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {ledgerMeta.hasMore && (
                        <button
                          type="button"
                          onClick={() => void fetchLedger(ledgerMeta.page + 1)}
                          className="w-full py-2 rounded-lg border border-border text-xs font-headline font-semibold hover:bg-muted"
                        >
                          Load more
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeMerchantTab === 'payouts' && (
                <div className="space-y-5">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-amber-700 font-headline">
                        Pending Payouts
                      </p>
                      <p className="mt-1 text-2xl font-headline font-bold text-amber-700">
                        R{pendingPayouts.toFixed(2)}
                      </p>
                      <p className="text-xs text-amber-700/80">
                        {pendingPayoutItems.length} transactions
                      </p>
                    </div>
                    <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-teal-700 font-headline">
                        Total Paid Out
                      </p>
                      <p className="mt-1 text-2xl font-headline font-bold text-teal-700">
                        R{totalPayouts.toFixed(2)}
                      </p>
                      <p className="text-xs text-teal-700/80">
                        {completedPayouts.length} completed
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-headline">
                        Next Payout
                      </p>
                      <p className="mt-1 text-lg font-headline font-bold text-foreground">
                        {nextPayoutDateLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">Weekly EFT cycle</p>
                    </div>
                  </div>

                  <div className="grid xl:grid-cols-[1.8fr,1fr] gap-4">
                    <div className="space-y-4">
                      <div className="rounded-xl border border-amber-200 overflow-hidden">
                        <div className="flex items-center justify-between bg-amber-50 px-4 py-2">
                          <p className="font-headline font-semibold text-amber-800">
                            Pending Payouts
                          </p>
                          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-headline font-semibold text-amber-800">
                            {pendingPayoutItems.length}
                          </span>
                        </div>
                        <div className="divide-y divide-border">
                          {pendingPayoutItems.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-muted-foreground font-body">
                              No pending payouts.
                            </p>
                          ) : (
                            pendingPayoutItems.map((payout, index) => (
                              <div
                                key={payout.id}
                                className="px-4 py-3 flex items-center justify-between gap-3"
                              >
                                <div>
                                  <p className="font-headline font-semibold text-foreground">
                                    PAY-{new Date(payout.created_at).getFullYear()}-
                                    {String(index + 1).padStart(3, '0')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(payout.created_at).toLocaleDateString()} ·{' '}
                                    {payout.status}
                                  </p>
                                  {payout.bankserv_batch_id && (
                                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                      Batch: {payout.bankserv_batch_id}
                                    </p>
                                  )}
                                  {payout.bankserv_file_ref && (
                                    <p className="text-xs text-muted-foreground font-mono">
                                      Ref: {payout.bankserv_file_ref}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-headline font-bold text-foreground">
                                    R{Number(payout.amount).toFixed(2)}
                                  </p>
                                  <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-headline font-semibold text-amber-800">
                                    Awaiting
                                  </span>
                                  {payout.ack_nck_status && (
                                    <p
                                      className={`text-[10px] font-headline font-semibold mt-0.5 ${
                                        payout.ack_nck_status === 'acked'
                                          ? 'text-success'
                                          : payout.ack_nck_status === 'escalated' ||
                                              payout.ack_nck_status === 'failed'
                                            ? 'text-error'
                                            : 'text-warning'
                                      }`}
                                    >
                                      ACK: {payout.ack_nck_status}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-emerald-200 overflow-hidden">
                        <div className="flex items-center justify-between bg-emerald-50 px-4 py-2">
                          <p className="font-headline font-semibold text-emerald-800">
                            Completed Payouts
                          </p>
                          <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-headline font-semibold text-emerald-800">
                            {completedPayouts.length}
                          </span>
                        </div>
                        <div className="divide-y divide-border">
                          {completedPayouts.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-muted-foreground font-body">
                              No completed payouts yet.
                            </p>
                          ) : (
                            completedPayouts.map((payout, index) => (
                              <div
                                key={payout.id}
                                className="px-4 py-3 flex items-center justify-between gap-3"
                              >
                                <div>
                                  <p className="font-headline font-semibold text-foreground">
                                    PAY-{new Date(payout.created_at).getFullYear()}-
                                    {String(index + 1).padStart(3, '0')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(payout.created_at).toLocaleDateString()} · EFT
                                    complete
                                  </p>
                                  {payout.bankserv_batch_id && (
                                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                      Batch: {payout.bankserv_batch_id}
                                    </p>
                                  )}
                                  {payout.bankserv_file_ref && (
                                    <p className="text-xs text-muted-foreground font-mono">
                                      Ref: {payout.bankserv_file_ref}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-headline font-bold text-foreground">
                                    R{Number(payout.amount).toFixed(2)}
                                  </p>
                                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-headline font-semibold text-emerald-800">
                                    Completed
                                  </span>
                                  {payout.ack_nck_status && (
                                    <p
                                      className={`text-[10px] font-headline font-semibold mt-0.5 ${
                                        payout.ack_nck_status === 'acked'
                                          ? 'text-success'
                                          : 'text-muted-foreground'
                                      }`}
                                    >
                                      ACK: {payout.ack_nck_status}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-border p-4 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <p className="font-headline font-semibold text-foreground">
                            Bank Details
                          </p>
                          <span className="text-xs text-primary font-headline">Edit</span>
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Bank</span>
                            <span className="font-headline font-semibold text-foreground">
                              {merchant?.bank_name || 'Not set'}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Account Type</span>
                            <span className="font-headline font-semibold text-foreground">
                              Business Cheque
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Account Number</span>
                            <span className="font-headline font-semibold text-foreground">
                              ******5678
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Branch Code</span>
                            <span className="font-headline font-semibold text-foreground">
                              {merchant?.branch_code || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-white">
                        <p className="font-headline font-semibold">Request Payout</p>
                        <p className="text-xs text-slate-300 mt-1">
                          Manually request an off-cycle payout. Processed within 1-2 business days.
                        </p>
                        <div className="mt-3 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                            Available Balance
                          </p>
                          <p className="text-3xl font-headline font-bold text-emerald-300">
                            R{pendingPayouts.toFixed(2)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setProductMessage('Payout request submitted (prototype mode).')
                          }
                          className="mt-3 w-full rounded-lg bg-teal-500 px-4 py-2.5 font-headline font-semibold text-slate-950 hover:bg-teal-400"
                        >
                          Request Payout Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {activeMerchantTab !== 'payouts' && activeMerchantTab !== 'ledger' && (
              <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
                <div className="mb-6 rounded-xl bg-slate-900 text-white p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300 font-headline">
                    Live Price Calculator
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Face Value</span>
                      <span className="font-headline font-semibold">
                        R{pricingPreview.faceValue.toFixed(2)}
                      </span>
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
                      50/50 split rule: Consumer benefit{' '}
                      {pricingPreview.consumerBenefitPct.toFixed(2)}% | Platform margin{' '}
                      {pricingPreview.platformBenefitPct.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-headline font-bold text-2xl text-foreground">
                    Merchant Operations
                  </h2>
                  <Icon
                    name="BuildingStorefrontIcon"
                    size={24}
                    variant="solid"
                    className="text-secondary"
                  />
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-headline font-semibold text-foreground">
                      Merchant Account
                    </p>
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
                    <p className="text-sm font-headline font-semibold text-foreground">
                      Compliance & Payout Setup
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      Onboarding fee: {merchant?.onboarding_fee_paid ? 'Paid' : 'Pending'}
                    </p>
                    <p className="text-xs text-muted-foreground font-body">
                      Bank: {merchant?.bank_name || 'Not configured'}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-headline font-semibold text-foreground">
                      Promotion Guidance
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      Keep discount budgets between 4% and 5% for grocery products to balance
                      conversion and payout.
                    </p>
                  </div>

                  {String(merchant?.merchant_type ?? '').toLowerCase() === 'chain' && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-headline font-semibold text-foreground">
                        Branch Management
                      </p>
                      <p className="text-xs text-muted-foreground font-body mt-1">
                        Parent/child branch hierarchy with branch-scoped product visibility.
                      </p>
                      <div className="mt-3 space-y-2 max-h-40 overflow-auto pr-1">
                        {branches.length === 0 ? (
                          <p className="text-xs text-muted-foreground font-body">
                            No branches linked yet.
                          </p>
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
            )}
          </div>

          {activeMerchantTab !== 'payouts' && (
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
                            className={
                              payout.status === 'completed' ? 'text-success' : 'text-warning'
                            }
                          />
                        </div>
                        <div>
                          <p className="font-headline font-semibold text-foreground capitalize">
                            {payout.status}
                          </p>
                          <p className="text-sm text-muted-foreground font-body">
                            {payout.payout_date
                              ? new Date(payout.payout_date).toLocaleDateString()
                              : 'Processing'}
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
          )}
        </div>
      </div>
    </div>
  );
}
