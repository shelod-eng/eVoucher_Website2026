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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="bg-card rounded-2xl border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h1 className="font-headline font-bold text-5xl text-foreground">Shop</h1>
                <p className="text-muted-foreground">Browse brand vouchers and buy instantly</p>
              </div>
              <button
                onClick={() => router.push('/cart')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-primary text-primary font-headline font-semibold hover:bg-primary/10"
              >
                <Icon name="ShoppingCartIcon" size={18} variant="outline" />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="inline-flex min-w-5 h-5 px-1 items-center justify-center text-xs rounded-full bg-primary text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            <div className="grid lg:grid-cols-[1fr_auto] gap-3">
              <div className="relative">
                <Icon
                  name="MagnifyingGlassIcon"
                  size={18}
                  variant="outline"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search products, brands, or locations..."
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background font-body"
                />
              </div>
              <div className="inline-flex items-center px-3 py-2 rounded-lg border border-border text-sm text-foreground bg-background">
                Offline access (USSD):{' '}
                <span className="ml-1 font-headline font-semibold">{ussdAccessCode}</span>
              </div>
            </div>
          </section>

          {error && (
            <div className="p-4 rounded-lg border border-error/20 bg-error/10">
              <p className="text-sm text-error font-body">{error}</p>
            </div>
          )}

          {statusMessage && (
            <div className="p-4 rounded-lg border border-success/20 bg-success/10">
              <p className="text-sm text-success font-body">{statusMessage}</p>
            </div>
          )}

          <section className="bg-card rounded-2xl border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-primary font-headline font-semibold">
                  Featured Partner Networks
                </p>
                <h2 className="font-headline font-bold text-3xl text-foreground mt-1">
                  Enterprise Merchant Groups
                </h2>
                <p className="text-sm text-muted-foreground">
                  Strategic partner networks with branch-level loyalty and cross-branch redemption.
                </p>
              </div>
              <button
                onClick={() => handleSelectBrand('kalapeng')}
                className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-headline font-semibold hover:bg-primary/90"
              >
                Shop Kalapeng
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-headline font-bold text-foreground">{KALAPENG_PARTNER_LABEL}</p>
                <span className="px-2 py-1 rounded-full text-xs bg-success/15 text-success font-headline font-semibold">
                  {KALAPENG_BRANCH_TARGET} Branches
                </span>
                <span className="px-2 py-1 rounded-full text-xs bg-warning/15 text-warning font-headline font-semibold">
                  Loyalty Enabled
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Earn Kalapeng loyalty points on every eVoucher purchase. Refill reminders, branch
                offers, and cross-branch support included.
              </p>
            </div>
          </section>

          <section className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-headline font-bold text-3xl text-foreground mb-1">Shopping at</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select one brand, then browse products valid across multiple branches.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3">
              {orderedBrands.map((brand) => (
                <button
                  key={brand.brandKey}
                  onClick={() => handleSelectBrand(brand.brandKey)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    selectedBrandKey === brand.brandKey
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : brand.matchesSearch || !debouncedSearch
                        ? 'border-border hover:bg-muted'
                        : 'border-border opacity-50'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-2 overflow-hidden">
                    {failedLogos.has(brand.brandKey) || !brand.assetPath ? (
                      <Icon
                        name={getCategoryIcon(brand.category) as any}
                        size={24}
                        variant="outline"
                      />
                    ) : (
                      <img
                        src={brand.assetPath}
                        alt={brand.displayName}
                        className="w-10 h-10 object-contain"
                        onError={() => markLogoFailed(brand.brandKey)}
                      />
                    )}
                  </div>
                  <p className="font-headline font-semibold text-sm text-foreground line-clamp-1">
                    {brand.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">{brand.category}</p>
                  <p className="text-xs text-primary font-headline">
                    {brand.merchantCount} location{brand.merchantCount === 1 ? '' : 's'}
                  </p>
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

          <section className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-headline font-bold text-3xl text-foreground mb-4">
              Vouchers ({products.length} available)
            </h2>

            {productsLoading ? (
              <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="h-56 rounded-2xl bg-muted animate-pulse" />
                <div className="h-56 rounded-2xl bg-muted animate-pulse" />
                <div className="h-56 rounded-2xl bg-muted animate-pulse" />
                <div className="h-56 rounded-2xl bg-muted animate-pulse" />
              </div>
            ) : products.length === 0 ? (
              <div className="p-10 text-center bg-card rounded-2xl border border-border">
                <Icon
                  name="ShoppingBagIcon"
                  size={48}
                  variant="outline"
                  className="text-muted-foreground mx-auto mb-4"
                />
                <p className="text-muted-foreground font-body">
                  {selectedBrand
                    ? 'No vouchers available for this brand yet. Try another brand or clear search.'
                    : 'Select a brand to view products.'}
                </p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <article
                    key={product.id}
                    className="rounded-2xl border border-success/20 bg-success/5 overflow-hidden"
                  >
                    <div className="p-4 border-b border-success/20 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-primary font-headline font-semibold">
                        {product.parent_brand}
                      </p>
                      <div className="flex items-center gap-2">
                        {product.is_special && (
                          <span className="px-2 py-1 rounded-full text-xs bg-warning/20 text-warning font-headline font-semibold">
                            {product.special_title || 'Special'}
                          </span>
                        )}
                        <span className="px-2 py-1 rounded-full text-xs bg-success/20 text-success font-headline font-semibold">
                          Save {Number(product.consumer_benefit_pct).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-headline font-bold text-2xl text-foreground line-clamp-2 mb-3">
                        {product.product_name}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Face Value</span>
                          <span className="font-headline font-semibold">
                            R{Number(product.face_value).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Total Discount ({Number(product.total_discount_pct).toFixed(1)}%)
                          </span>
                          <span className="font-headline font-semibold text-success">
                            -R
                            {(
                              Number(product.face_value) *
                              (Number(product.total_discount_pct) / 100)
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pl-3">
                          <span className="text-xs text-muted-foreground">
                            ↳ Your Savings ({Number(product.consumer_benefit_pct).toFixed(1)}%)
                          </span>
                          <span className="text-xs font-headline font-semibold text-success">
                            -R{Number(product.consumer_benefit_amount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pl-3">
                          <span className="text-xs text-muted-foreground">
                            ↳ Platform Fee (
                            {(
                              Number(product.total_discount_pct) -
                              Number(product.consumer_benefit_pct)
                            ).toFixed(1)}
                            %)
                          </span>
                          <span className="text-xs font-headline font-semibold text-primary">
                            R
                            {(
                              Number(product.face_value) *
                              ((Number(product.total_discount_pct) -
                                Number(product.consumer_benefit_pct)) /
                                100)
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="rounded-lg bg-background border border-border px-2 py-1">
                          <p className="text-xs text-muted-foreground">
                            {getRedemptionScopeLabel(product, selectedBrand)}
                          </p>
                          {product.is_special && product.special_end_at && (
                            <p className="text-xs text-warning mt-1">
                              Ends: {new Date(product.special_end_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-success/20 mt-3 pt-3 flex items-center justify-between">
                        <span className="text-muted-foreground">You pay</span>
                        <span className="font-headline font-bold text-4xl text-foreground">
                          R{Number(product.consumer_price).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.merchant_id}
                          className="px-3 py-2 rounded-lg border border-primary text-primary font-headline font-semibold hover:bg-primary/10 disabled:opacity-50"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => handleBuyNow(product)}
                          disabled={!product.merchant_id}
                          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-headline font-semibold hover:bg-primary/90 disabled:opacity-50"
                        >
                          Buy Now
                        </button>
                      </div>
                      {branchSelectionRequired && (
                        <p className="mt-2 text-xs text-warning">
                          Branch selection required for this merchant.
                        </p>
                      )}
                    </div>
                  </article>
                ))}
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
