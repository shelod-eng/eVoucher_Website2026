'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { addCartItem, getCartItems } from '@/lib/cart';

interface BrandLocation {
  id: string;
  business_name: string;
  branch_name: string;
  branch_code: string | null;
  city: string | null;
  province: string | null;
  physical_address: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
}

interface BrandSummary {
  brandKey: string;
  displayName: string;
  category: string;
  assetPath: string;
  merchantCount: number;
  productCount: number;
  merchantId: string | null;
  merchantName: string | null;
  defaultTotalDiscountPct: number;
  matchesSearch: boolean;
  provinceCount: number;
  locations: BrandLocation[];
}

interface CatalogProduct {
  id: string;
  brandKey: string;
  source: 'db' | 'starter';
  merchant_id: string | null;
  merchant_name: string;
  parent_brand: string;
  product_name: string;
  face_value: number;
  total_discount_pct: number;
  consumer_benefit_pct: number;
  consumer_benefit_amount: number;
  consumer_price: number;
  redemption_scope: 'all_branches' | 'specific_branch' | 'province_wide' | 'national';
  valid_provinces: string[];
  valid_branch_ids: string[];
  valid_location_count: number;
  is_special?: boolean;
  special_title?: string | null;
  special_end_at?: string | null;
  display_priority?: number;
}

function getCategoryIcon(category: string) {
  const normalized = String(category).toLowerCase();
  if (normalized.includes('health')) return 'BeakerIcon';
  if (normalized.includes('fuel')) return 'TruckIcon';
  if (normalized.includes('cloth')) return 'ShoppingBagIcon';
  return 'ShoppingCartIcon';
}

function getRedemptionScopeLabel(product: CatalogProduct, selectedBrand: BrandSummary | null) {
  if (product.redemption_scope === 'national') return 'Valid nationwide';
  if (product.redemption_scope === 'province_wide') {
    return product.valid_provinces.length > 0
      ? `Valid in ${product.valid_provinces.join(', ')}`
      : 'Valid province-wide';
  }
  if (product.redemption_scope === 'specific_branch') {
    const branchCount = product.valid_branch_ids.length;
    return branchCount > 0
      ? `Valid at ${branchCount} selected branch${branchCount === 1 ? '' : 'es'}`
      : 'Valid at selected branches';
  }

  const locationCount = product.valid_location_count || selectedBrand?.merchantCount || 0;
  if (locationCount > 0) {
    return `Valid at all ${locationCount} location${locationCount === 1 ? '' : 's'}`;
  }
  return `Valid at all ${product.parent_brand} locations`;
}

const KALAPENG_PARTNER_LABEL = 'Kalapeng Pharmacy Group';
const KALAPENG_BRANCH_TARGET = 35;

function isKalapengLabel(value: string) {
  return String(value ?? '')
    .toLowerCase()
    .includes('kalapeng');
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ShopPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedBrandKey, setSelectedBrandKey] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [ussdAccessCode, setUssdAccessCode] = useState('*120*384#');
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [locationsModalOpen, setLocationsModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branchSelectionMode, setBranchSelectionMode] = useState<'nearest' | 'manual'>('nearest');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const refreshCartCount = () => {
      const count = getCartItems(user.id).reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };

    refreshCartCount();
    window.addEventListener('evoucher-cart-updated', refreshCartCount);
    window.addEventListener('storage', refreshCartCount);
    return () => {
      window.removeEventListener('evoucher-cart-updated', refreshCartCount);
      window.removeEventListener('storage', refreshCartCount);
    };
  }, [user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    if (!user) return;

    const loadCatalog = async () => {
      try {
        setError('');
        const initialLoad = brands.length === 0 && !selectedBrandKey && !debouncedSearch;
        if (initialLoad) {
          setLoading(true);
        } else {
          setProductsLoading(true);
        }

        const params = new URLSearchParams();
        if (selectedBrandKey) params.set('brandKey', selectedBrandKey);
        if (debouncedSearch) params.set('q', debouncedSearch);
        const queryString = params.toString();
        const response = await fetch(
          `/api/v1/shop/catalog${queryString ? `?${queryString}` : ''}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load shop catalog.');
        }

        const incomingBrands = (data.brands ?? []) as BrandSummary[];
        setBrands(incomingBrands);
        setProducts((data.products ?? []) as CatalogProduct[]);
        setUssdAccessCode(String(data.ussdAccessCode ?? '*120*384#'));

        const resolvedBrandKey = String(data.selectedBrandKey ?? '');
        if (resolvedBrandKey && resolvedBrandKey !== selectedBrandKey) {
          setSelectedBrandKey(resolvedBrandKey);
        }
      } catch (catalogError: any) {
        setError(catalogError?.message || 'Failed to load shop.');
        setProducts([]);
      } finally {
        setLoading(false);
        setProductsLoading(false);
      }
    };

    void loadCatalog();
  }, [user, selectedBrandKey, debouncedSearch, brands.length]);

  const orderedBrands = useMemo(() => {
    return [...brands].sort((a, b) => Number(b.matchesSearch) - Number(a.matchesSearch));
  }, [brands]);

  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.brandKey === selectedBrandKey) ?? null,
    [brands, selectedBrandKey]
  );
  const selectedBrandIsKalapeng = useMemo(() => {
    if (!selectedBrand) return false;
    return (
      selectedBrand.brandKey === 'kalapeng' ||
      isKalapengLabel(selectedBrand.displayName) ||
      isKalapengLabel(selectedBrand.merchantName ?? '')
    );
  }, [selectedBrand]);
  const brandSupportsBranchSelection = useMemo(
    () => Boolean(selectedBrand && selectedBrand.locations.length > 1),
    [selectedBrand]
  );
  const selectedBranch = useMemo(() => {
    if (!selectedBrand) return null;
    if (!brandSupportsBranchSelection) {
      return selectedBrand.locations[0] ?? null;
    }
    if (!selectedBranchId) return null;
    return selectedBrand.locations.find((location) => location.id === selectedBranchId) ?? null;
  }, [brandSupportsBranchSelection, selectedBrand, selectedBranchId]);
  const branchSelectionRequired = brandSupportsBranchSelection && !selectedBranch;

  useEffect(() => {
    if (!selectedBrand) {
      setSelectedBranchId('');
      setBranchSelectionMode('nearest');
      return;
    }
    if (!brandSupportsBranchSelection) {
      setSelectedBranchId(selectedBrand.locations[0]?.id ?? '');
      setBranchSelectionMode('manual');
      return;
    }
    setSelectedBranchId('');
    setBranchSelectionMode('manual');
  }, [brandSupportsBranchSelection, selectedBrand?.brandKey]);

  const handleSelectBrand = (brandKey: string) => {
    if (brandKey === selectedBrandKey) return;
    setSelectedBrandKey(brandKey);
    setSelectedBranchId('');
    setBranchSelectionMode('manual');
  };

  const handleSelectBranch = (branchId: string, mode: 'nearest' | 'manual' = 'manual') => {
    setSelectedBranchId(branchId);
    setBranchSelectionMode(mode);
    setLocationsModalOpen(false);
    setStatusMessage('Branch selected. You can now continue shopping.');
    window.setTimeout(() => setStatusMessage(''), 1600);
  };

  const handleAutoSelectNearestBranch = () => {
    if (!selectedBrand || selectedBrand.locations.length === 0) return;
    const locationsWithCoords = selectedBrand.locations.filter(
      (location) =>
        Number.isFinite(Number(location.location_lat)) &&
        Number.isFinite(Number(location.location_lng))
    );

    if (locationsWithCoords.length === 0) {
      handleSelectBranch(selectedBrand.locations[0]?.id ?? '', 'nearest');
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      handleSelectBranch(selectedBrand.locations[0]?.id ?? '', 'nearest');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = locationsWithCoords
          .map((location) => ({
            location,
            km: haversineDistanceKm(
              { lat: position.coords.latitude, lng: position.coords.longitude },
              {
                lat: Number(location.location_lat),
                lng: Number(location.location_lng),
              }
            ),
          }))
          .sort((a, b) => a.km - b.km)[0]?.location;
        handleSelectBranch(nearest?.id ?? selectedBrand.locations[0]?.id ?? '', 'nearest');
      },
      () => {
        handleSelectBranch(selectedBrand.locations[0]?.id ?? '', 'nearest');
      },
      { maximumAge: 300000, timeout: 3500 }
    );
  };

  const handleAddToCart = (product: CatalogProduct) => {
    if (branchSelectionRequired) {
      setStatusMessage('Choose a branch before adding products for this merchant.');
      setLocationsModalOpen(true);
      window.setTimeout(() => setStatusMessage(''), 2200);
      return;
    }
    const resolvedMerchantId = product.merchant_id;
    if (!resolvedMerchantId) {
      setStatusMessage('No merchant account is currently linked to this brand for checkout.');
      window.setTimeout(() => setStatusMessage(''), 2200);
      return;
    }

    const scopedUserId = user?.id;

    addCartItem(
      {
        id: product.id,
        merchantId: resolvedMerchantId,
        merchantName: product.merchant_name,
        selectedBranchId: selectedBranch?.id ?? undefined,
        selectedBranchName: selectedBranch?.branch_name || selectedBranch?.business_name,
        selectedBranchCity: selectedBranch?.city ?? undefined,
        selectedBranchProvince: selectedBranch?.province ?? undefined,
        branchSelectionMode: selectedBranch ? branchSelectionMode : undefined,
        productId: product.id,
        productName: product.product_name,
        faceValue: Number(product.face_value),
        consumerPrice: Number(product.consumer_price),
        consumerBenefitAmount: Number(product.consumer_benefit_amount),
        totalDiscountPct: Number(product.total_discount_pct),
        quantity: 1,
        parentBrand: product.parent_brand,
        redemptionScope: product.redemption_scope,
      },
      scopedUserId
    );
    setStatusMessage(`${product.product_name} added to cart.`);
    window.setTimeout(() => setStatusMessage(''), 1600);
  };

  const handleBuyNow = (product: CatalogProduct) => {
    if (branchSelectionRequired) {
      setStatusMessage('Choose a branch before buying from this merchant.');
      setLocationsModalOpen(true);
      window.setTimeout(() => setStatusMessage(''), 2200);
      return;
    }
    if (!product.merchant_id) {
      setStatusMessage('No merchant account is currently linked to this brand for checkout.');
      window.setTimeout(() => setStatusMessage(''), 2200);
      return;
    }

    const params = new URLSearchParams({
      merchantId: String(product.merchant_id ?? ''),
      brandKey: product.brandKey,
      faceValue: String(product.face_value),
    });
    if (selectedBranch) {
      params.set('selectedBranchId', selectedBranch.id);
      params.set(
        'selectedBranchName',
        String(selectedBranch.branch_name || selectedBranch.business_name)
      );
      if (selectedBranch.city) params.set('selectedBranchCity', selectedBranch.city);
      if (selectedBranch.province) params.set('selectedBranchProvince', selectedBranch.province);
      params.set('branchSelectionMode', branchSelectionMode);
    }

    if (product.source === 'db' && !product.id.startsWith('starter-')) {
      params.set('productId', product.id);
    }

    router.push(`/buy-vouchers?${params.toString()}`);
  };

  const markLogoFailed = (brandKey: string) => {
    setFailedLogos((current) => {
      const next = new Set(current);
      next.add(brandKey);
      return next;
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 px-4 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-28 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="h-56 bg-muted rounded-2xl" />
              <div className="h-56 bg-muted rounded-2xl" />
              <div className="h-56 bg-muted rounded-2xl" />
              <div className="h-56 bg-muted rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const SHOP_CATEGORIES = [
    { label: 'Groceries', emoji: '🛒', q: 'Groceries' },
    { label: 'Pharmacy', emoji: '💊', q: 'Pharmacy' },
    { label: 'Fashion', emoji: '👗', q: 'Fashion' },
    { label: 'Fuel', emoji: '⛽', q: 'Fuel' },
    { label: 'Airtime', emoji: '📱', q: 'Airtime' },
    { label: 'Home', emoji: '🏠', q: 'Home' },
    { label: 'Education', emoji: '📚', q: 'Education' },
    { label: 'Hardware', emoji: '🔧', q: 'Hardware' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── 1. Search bar ── */}
          <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#0891b2] p-6 text-white shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-headline text-xs font-semibold uppercase tracking-widest text-white/60">eVoucher Shop</p>
                <h1 className="font-headline text-3xl font-bold">What are you shopping for?</h1>
                <p className="mt-1 text-sm text-white/70">Save on every purchase from trusted SA merchants</p>
              </div>
              <button onClick={() => router.push('/cart')}
                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 border border-white/30 hover:bg-white/30">
                <Icon name="ShoppingCartIcon" size={22} variant="outline" className="text-white" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white">{cartCount}</span>
                )}
              </button>
            </div>
            <div className="relative">
              <Icon name="MagnifyingGlassIcon" size={18} variant="outline" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products, brands, or locations..."
                className="w-full rounded-2xl border-0 bg-white py-4 pl-11 pr-4 font-body text-foreground shadow-sm outline-none focus:ring-2 focus:ring-white/50" />
            </div>
          </section>

          {error && <div className="rounded-xl border border-error/20 bg-error/10 p-4"><p className="text-sm text-error">{error}</p></div>}
          {statusMessage && <div className="rounded-xl border border-success/20 bg-success/10 p-4"><p className="text-sm text-success">{statusMessage}</p></div>}

          {/* ── 2. Featured Offer banner ── */}
          <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-white to-teal-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-headline text-xs font-semibold uppercase tracking-widest text-primary">Featured Partner</p>
                <h2 className="font-headline text-2xl font-bold text-foreground mt-1">{KALAPENG_PARTNER_LABEL}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-success/10 px-3 py-1 font-headline text-xs font-bold text-success">{KALAPENG_BRANCH_TARGET} Branches</span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 font-headline text-xs font-bold text-amber-600">Loyalty Enabled</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-headline text-xs font-bold text-primary">Save up to 8%</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Earn loyalty points on every eVoucher purchase. Refill reminders &amp; cross-branch support.</p>
              </div>
              <button onClick={() => handleSelectBrand('kalapeng')}
                className="shrink-0 rounded-2xl bg-primary px-6 py-3 font-headline font-bold text-white shadow-md hover:bg-primary/90 hover:shadow-lg transition-all">
                Shop Kalapeng →
              </button>
            </div>
          </section>

          {/* ── 3. Today's Savings strip ── */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-foreground">Today&apos;s Savings</h2>
              <span className="rounded-full bg-secondary/10 px-3 py-1 font-headline text-xs font-bold text-secondary">🔥 Live deals</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[{ label: 'Groceries', save: '2.5%', emoji: '🛒' }, { label: 'Pharmacy', save: '5%', emoji: '💊' }, { label: 'Fashion', save: '3%', emoji: '👗' }, { label: 'Fuel', save: '2%', emoji: '⛽' }].map(s => (
                <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <span className="text-2xl">{s.emoji}</span>
                  <div>
                    <p className="font-headline text-sm font-bold text-foreground">{s.label}</p>
                    <p className="font-headline text-xs font-semibold text-success">Save {s.save}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 4. Popular Categories ── */}
          <section>
            <h2 className="mb-3 font-headline text-xl font-bold text-foreground">Popular Categories</h2>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {SHOP_CATEGORIES.map(cat => (
                <button key={cat.label} onClick={() => setSearchTerm(cat.q)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    debouncedSearch.toLowerCase() === cat.q.toLowerCase() ? 'border-primary bg-primary/10' : 'border-border bg-white'
                  }`}>
                  <span className="text-2xl">{cat.emoji}</span>
                  <p className="font-headline text-[11px] font-bold text-foreground text-center leading-tight">{cat.label}</p>
                </button>
              ))}
            </div>
          </section>

          {/* ── 5. Featured Merchants ── */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-foreground">Featured Merchants</h2>
              {selectedBrandKey && (
                <button onClick={() => { setSelectedBrandKey(''); setSelectedBranchId(''); }}
                  className="font-headline text-sm font-semibold text-primary hover:underline">View All</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {orderedBrands.map((brand) => (
                <button key={brand.brandKey} onClick={() => handleSelectBrand(brand.brandKey)}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    selectedBrandKey === brand.brandKey
                      ? 'border-primary bg-primary/10 shadow-md'
                      : brand.matchesSearch || !debouncedSearch
                        ? 'border-border bg-white hover:border-primary/50'
                        : 'border-border bg-white opacity-50'
                  }`}>
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                    {failedLogos.has(brand.brandKey) || !brand.assetPath ? (
                      <span className="text-2xl">{brand.category.includes('Health') ? '💊' : brand.category.includes('Fuel') ? '⛽' : brand.category.includes('Cloth') ? '👗' : '🛒'}</span>
                    ) : (
                      <img src={brand.assetPath} alt={brand.displayName} className="h-12 w-12 object-contain"
                        onError={() => markLogoFailed(brand.brandKey)} />
                    )}
                  </div>
                  <p className="font-headline font-bold text-sm text-foreground line-clamp-1">{brand.displayName}</p>
                  <p className="text-[11px] text-muted-foreground">{brand.category}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-headline text-[11px] font-semibold text-primary">{brand.merchantCount} location{brand.merchantCount === 1 ? '' : 's'}</span>
                    {brand.defaultTotalDiscountPct > 0 && (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 font-headline text-[10px] font-bold text-success">Save {brand.defaultTotalDiscountPct.toFixed(0)}%</span>
                    )}
                  </div>
                  {selectedBrandKey === brand.brandKey && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary to-teal-400" />
                  )}
                </button>
              ))}
            </div>

            {selectedBrand && selectedBrand.locations.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 bg-background">
                <div>
                  <p className="font-headline font-semibold text-foreground">
                    {selectedBrand.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedBrand.merchantCount} locations across {selectedBrand.provinceCount}{' '}
                    provinces
                  </p>
                  {selectedBrand.merchantCount > selectedBrand.locations.length && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Showing key coverage nodes. Additional locations are available nationwide.
                    </p>
                  )}
                  {brandSupportsBranchSelection && selectedBranch && (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary font-headline font-semibold">
                          Active Branch
                        </span>
                        <span className="text-sm font-headline font-semibold text-foreground">
                          {selectedBranch.branch_name || selectedBranch.business_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {selectedBranch.city || 'City N/A'}
                          {selectedBranch.province ? `, ${selectedBranch.province}` : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void handleAutoSelectNearestBranch()}
                          className="px-3 py-2 rounded-lg border border-primary text-primary font-headline font-semibold hover:bg-primary/10"
                        >
                          Auto-select nearest branch
                        </button>
                        <select
                          value={selectedBranchId}
                          onChange={(event) => {
                            setSelectedBranchId(event.target.value);
                            setBranchSelectionMode('manual');
                          }}
                          className="px-3 py-2 rounded-lg border border-border bg-card text-sm"
                        >
                          {selectedBrand.locations.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.branch_name || location.business_name}
                              {location.city ? ` - ${location.city}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  {branchSelectionRequired && (
                    <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
                      <p className="text-sm font-headline font-semibold text-warning">
                        Choose a branch before adding products to cart or checkout.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {selectedBrandIsKalapeng && (
                    <button
                      onClick={() =>
                        router.push(
                          `/benefits?merchant=kalapeng${
                            selectedBranch?.id
                              ? `&branchId=${encodeURIComponent(selectedBranch.id)}`
                              : ''
                          }`
                        )
                      }
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-headline font-semibold hover:bg-primary/90"
                    >
                      Join Kalapeng Loyalty
                    </button>
                  )}
                  <button
                    onClick={() => setLocationsModalOpen(true)}
                    className="px-4 py-2 rounded-lg border border-primary text-primary font-headline font-semibold hover:bg-primary/10"
                  >
                    {brandSupportsBranchSelection ? 'Choose Branch' : 'View Locations'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ── 6. Products ── */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-foreground">
                Products{products.length > 0 && <span className="ml-2 font-normal text-base text-muted-foreground">({products.length} available)</span>}
              </h2>
              {ussdAccessCode && (
                <span className="hidden rounded-xl border border-border bg-muted px-3 py-1.5 font-headline text-xs font-semibold text-muted-foreground sm:inline">USSD: {ussdAccessCode}</span>
              )}
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                <span className="mb-3 text-5xl">🛒</span>
                <p className="font-headline font-semibold text-foreground">
                  {selectedBrand ? 'No vouchers available for this brand yet.' : 'Select a merchant above to view products.'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Try another brand or clear your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const brandKey = (product.parent_brand || product.merchant_name || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
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
                  const logoSrc = LOGOS[brandKey] ?? (selectedBrand?.assetPath || '/assets/images/merchants/placeholder-merchant.svg');
                  return (
                    <article key={product.id}
                      className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      {/* Savings badge */}
                      <div className="absolute left-3 top-3 z-10 rounded-full bg-secondary px-2.5 py-1 font-headline text-[11px] font-bold text-white shadow">
                        Save {Number(product.consumer_benefit_pct).toFixed(1)}%
                      </div>
                      {product.is_special && (
                        <div className="absolute right-3 top-3 z-10 rounded-full bg-amber-500 px-2.5 py-1 font-headline text-[11px] font-bold text-white shadow">
                          {product.special_title || 'Special'}
                        </div>
                      )}
                      {/* Merchant header */}
                      <div className="h-1.5 w-full bg-gradient-to-r from-primary to-teal-400" />
                      <div className="p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white p-1 shadow-sm">
                            <img src={logoSrc} alt={product.parent_brand}
                              className="h-7 w-7 object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/merchants/placeholder-merchant.svg'; }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-headline text-xs font-bold text-foreground line-clamp-1">{product.parent_brand}</p>
                            <p className="text-[10px] text-muted-foreground">{product.merchant_name}</p>
                          </div>
                        </div>
                        <h3 className="mb-3 font-headline text-sm font-bold leading-snug text-foreground line-clamp-2">{product.product_name}</h3>
                        {/* Pricing */}
                        <div className="mb-2 flex items-end gap-2">
                          <span className="font-headline text-xl font-bold text-foreground">R{Number(product.consumer_price).toFixed(2)}</span>
                          <span className="mb-0.5 text-xs text-muted-foreground line-through">R{Number(product.face_value).toFixed(2)}</span>
                        </div>
                        <div className="mb-3 flex items-center justify-between rounded-lg bg-success/10 px-3 py-1.5">
                          <span className="font-headline text-xs font-semibold text-success">You Save</span>
                          <span className="font-headline text-sm font-bold text-success">R{Number(product.consumer_benefit_amount).toFixed(2)}</span>
                        </div>
                        <p className="mb-3 text-[11px] text-muted-foreground">{getRedemptionScopeLabel(product, selectedBrand)}</p>
                        {product.is_special && product.special_end_at && (
                          <p className="mb-2 text-[11px] text-amber-600">Ends: {new Date(product.special_end_at).toLocaleDateString()}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => handleAddToCart(product)} disabled={!product.merchant_id}
                            className="rounded-xl border border-primary py-2 font-headline text-xs font-bold text-primary transition-all hover:bg-primary/10 disabled:opacity-50">Add</button>
                          <button onClick={() => handleBuyNow(product)} disabled={!product.merchant_id}
                            className="rounded-xl bg-primary py-2 font-headline text-xs font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50">Buy Now</button>
                        </div>
                        {branchSelectionRequired && (
                          <p className="mt-2 text-center text-[11px] text-amber-600">Branch selection required.</p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {locationsModalOpen && selectedBrand && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-headline font-bold text-2xl text-foreground">
                  {selectedBrand.displayName} Locations
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedBrand.merchantCount} locations available for redemption
                </p>
              </div>
              <button
                onClick={() => setLocationsModalOpen(false)}
                className="px-3 py-2 rounded-lg border border-border hover:bg-muted"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {selectedBrand.locations.map((location) => (
                <div
                  key={location.id}
                  className="rounded-xl border border-border p-4 bg-background"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-headline font-semibold text-foreground">
                          {location.branch_name || location.business_name}
                        </p>
                        {selectedBranchId === location.id && (
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-headline font-semibold text-primary">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {location.city || 'Unknown City'}{' '}
                        {location.province ? `, ${location.province}` : ''}
                      </p>
                      {location.physical_address && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {location.physical_address}
                        </p>
                      )}
                      {location.branch_code && (
                        <p className="text-xs text-primary mt-1">
                          Branch Code: {location.branch_code}
                        </p>
                      )}
                    </div>
                    {brandSupportsBranchSelection && (
                      <button
                        onClick={() => handleSelectBranch(location.id, 'manual')}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-headline font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        {selectedBranchId === location.id ? 'Selected Branch' : 'Select Branch'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
