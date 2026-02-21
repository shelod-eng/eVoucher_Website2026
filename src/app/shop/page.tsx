'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { addCartItem, getCartItems } from '@/lib/cart';
import { BrandKey } from '@/lib/merchant-brand-catalog';

interface BrandSummary {
  brandKey: BrandKey;
  displayName: string;
  category: string;
  assetPath: string;
  merchantCount: number;
  productCount: number;
  merchantId: string | null;
  merchantName: string | null;
  defaultTotalDiscountPct: number;
  matchesSearch: boolean;
}

interface CatalogProduct {
  id: string;
  brandKey: BrandKey;
  source: 'db' | 'starter';
  merchant_id: string | null;
  merchant_name: string;
  product_name: string;
  face_value: number;
  total_discount_pct: number;
  consumer_benefit_pct: number;
  consumer_benefit_amount: number;
  consumer_price: number;
}

function getCategoryIcon(category: string) {
  const normalized = String(category).toLowerCase();
  if (normalized.includes('health')) return 'BeakerIcon';
  if (normalized.includes('fuel')) return 'TruckIcon';
  if (normalized.includes('cloth')) return 'ShoppingBagIcon';
  return 'ShoppingCartIcon';
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
  const [selectedBrandKey, setSelectedBrandKey] = useState<BrandKey | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [ussdAccessCode, setUssdAccessCode] = useState('*120*384#');
  const [failedLogos, setFailedLogos] = useState<Set<BrandKey>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const refreshCartCount = () => {
      const count = getCartItems().reduce((sum, item) => sum + item.quantity, 0);
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
        const response = await fetch(`/api/v1/shop/catalog${queryString ? `?${queryString}` : ''}`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load shop catalog.');
        }

        const incomingBrands = (data.brands ?? []) as BrandSummary[];
        setBrands(incomingBrands);
        setProducts((data.products ?? []) as CatalogProduct[]);
        setUssdAccessCode(String(data.ussdAccessCode ?? '*120*384#'));

        const resolvedBrandKey = (data.selectedBrandKey ?? '') as BrandKey | '';
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

  const handleSelectBrand = (brandKey: BrandKey) => {
    if (brandKey === selectedBrandKey) return;
    setSelectedBrandKey(brandKey);
  };

  const handleAddToCart = (product: CatalogProduct) => {
    if (!product.merchant_id) {
      setStatusMessage('No merchant account is currently linked to this brand for checkout.');
      window.setTimeout(() => setStatusMessage(''), 2200);
      return;
    }

    addCartItem({
      id: product.id,
      merchantId: product.merchant_id,
      merchantName: product.merchant_name,
      productId: product.id,
      productName: product.product_name,
      faceValue: Number(product.face_value),
      consumerPrice: Number(product.consumer_price),
      consumerBenefitAmount: Number(product.consumer_benefit_amount),
      totalDiscountPct: Number(product.total_discount_pct),
      quantity: 1,
    });
    setStatusMessage(`${product.product_name} added to cart.`);
    window.setTimeout(() => setStatusMessage(''), 1600);
  };

  const handleBuyNow = (product: CatalogProduct) => {
    if (!product.merchant_id) {
      setStatusMessage('No merchant account is currently linked to this brand for checkout.');
      window.setTimeout(() => setStatusMessage(''), 2200);
      return;
    }

    const params = new URLSearchParams({
      merchantId: product.merchant_id,
      brandKey: product.brandKey,
      faceValue: String(product.face_value),
    });

    if (product.source === 'db' && !product.id.startsWith('starter-')) {
      params.set('productId', product.id);
    }

    router.push(`/buy-vouchers?${params.toString()}`);
  };

  const markLogoFailed = (brandKey: BrandKey) => {
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
                <p className="text-muted-foreground">Browse merchants and buy discounted products</p>
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
                  placeholder="Search products or merchants..."
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background font-body"
                />
              </div>
              <div className="inline-flex items-center px-3 py-2 rounded-lg border border-border text-sm text-foreground bg-background">
                Offline access (USSD): <span className="ml-1 font-headline font-semibold">{ussdAccessCode}</span>
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
            <h2 className="font-headline font-bold text-3xl text-foreground mb-1">Shopping at</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select a merchant brand first, then choose products to add to cart.
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
                    {failedLogos.has(brand.brandKey) ? (
                      <Icon name={getCategoryIcon(brand.category) as any} size={24} variant="outline" />
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
                </button>
              ))}
            </div>
          </section>

          <section className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-headline font-bold text-3xl text-foreground mb-4">
              Products ({products.length} items)
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
                    ? 'No products available for this brand yet. Try another brand or clear search.'
                    : 'Select a brand to view products.'}
                </p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <article key={product.id} className="rounded-2xl border border-success/20 bg-success/5 overflow-hidden">
                    <div className="p-4 border-b border-success/20 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-primary font-headline font-semibold">
                        {product.merchant_name}
                      </p>
                      <span className="px-2 py-1 rounded-full text-xs bg-success/20 text-success font-headline font-semibold">
                        Save {Number(product.consumer_benefit_pct).toFixed(1)}%
                      </span>
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
                          <span className="text-muted-foreground">Discount</span>
                          <span className="font-headline font-semibold">
                            {Number(product.total_discount_pct).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Your Savings</span>
                          <span className="font-headline font-semibold text-success">
                            -R{Number(product.consumer_benefit_amount).toFixed(2)}
                          </span>
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
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
