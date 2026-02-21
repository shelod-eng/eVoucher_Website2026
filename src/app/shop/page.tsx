'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { addCartItem } from '@/lib/cart';

const SHOP_CACHE_KEY = 'evoucher_shop_catalog_cache_v1';
const SHOP_CACHE_TTL_MS = 2 * 60 * 1000;

interface MerchantSummary {
  id: string;
  businessName: string;
  email: string;
  status: string;
  defaultTotalDiscountPct: number;
  productCount: number;
  averageDiscountPct: number;
}

interface CatalogProduct {
  id: string;
  merchant_id: string;
  merchant_name: string;
  product_name: string;
  face_value: number;
  total_discount_pct: number;
  consumer_benefit_pct: number;
  consumer_benefit_amount: number;
  consumer_price: number;
  is_fallback?: boolean;
}

export default function ShopPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState('');
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ussdAccessCode, setUssdAccessCode] = useState('*120*384#');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const cachedCatalog = typeof window !== 'undefined' ? window.sessionStorage.getItem(SHOP_CACHE_KEY) : null;
    if (cachedCatalog) {
      try {
        const parsed = JSON.parse(cachedCatalog) as {
          merchants: MerchantSummary[];
          selectedMerchantId: string;
          productsByMerchant: Record<string, CatalogProduct[]>;
          ussdAccessCode: string;
          fetchedAt: number;
        };

        if (Date.now() - parsed.fetchedAt < SHOP_CACHE_TTL_MS) {
          setMerchants(parsed.merchants ?? []);
          const cachedSelectedMerchantId = parsed.selectedMerchantId ?? '';
          setSelectedMerchantId(cachedSelectedMerchantId);
          setProducts((parsed.productsByMerchant ?? {})[cachedSelectedMerchantId] ?? []);
          setUssdAccessCode(parsed.ussdAccessCode ?? '*120*384#');
          setLoading(false);
        }
      } catch {
        // Ignore invalid cached payload
      }
    }

    const fetchMerchantDirectory = async () => {
      try {
        setLoading(!cachedCatalog);
        setError('');
        const response = await fetch('/api/v1/shop/catalog', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load shop catalog.');

        setMerchants(data.merchants ?? []);
        if ((data.merchants ?? []).length > 0) {
          const initialMerchantId =
            selectedMerchantId && (data.merchants ?? []).some((merchant: MerchantSummary) => merchant.id === selectedMerchantId)
              ? selectedMerchantId
              : data.merchants[0].id;
          setSelectedMerchantId(initialMerchantId);
          await fetchProductsForMerchant(initialMerchantId, data.merchants ?? []);
        } else {
          setSelectedMerchantId('');
          setProducts([]);
        }
        setUssdAccessCode(data.ussdAccessCode ?? '*120*384#');
      } catch (catalogError: any) {
        setError(catalogError?.message || 'Failed to load shop catalog.');
      } finally {
        setLoading(false);
      }
    };

    const fetchProductsForMerchant = async (
      merchantId: string,
      merchantSnapshot: MerchantSummary[] = merchants
    ) => {
      try {
        if (!merchantId) {
          setProducts([]);
          return;
        }

        setProductsLoading(true);
        setError('');
        const response = await fetch(`/api/v1/shop/catalog?merchantId=${encodeURIComponent(merchantId)}`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load merchant products.');

        const merchantProducts = data.products ?? [];
        setProducts(merchantProducts);

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(
            SHOP_CACHE_KEY,
            JSON.stringify({
              merchants: merchantSnapshot,
              selectedMerchantId: merchantId,
              productsByMerchant: {
                [merchantId]: merchantProducts,
              },
              ussdAccessCode: data.ussdAccessCode ?? '*120*384#',
              fetchedAt: Date.now(),
            })
          );
        }
      } catch (productsError: any) {
        setError(productsError?.message || 'Failed to load merchant products.');
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    void fetchMerchantDirectory();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const timeout = window.setTimeout(async () => {
      try {
        setError('');
        const queryString = searchTerm.trim()
          ? `?q=${encodeURIComponent(searchTerm.trim())}`
          : '';
        const response = await fetch(`/api/v1/shop/catalog${queryString}`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to search merchants.');

        const merchantDirectory = data.merchants ?? [];
        setMerchants(merchantDirectory);
        setUssdAccessCode(data.ussdAccessCode ?? '*120*384#');

        if (!merchantDirectory.some((merchant: MerchantSummary) => merchant.id === selectedMerchantId)) {
          const fallbackId = merchantDirectory[0]?.id ?? '';
          setSelectedMerchantId(fallbackId);

          if (fallbackId) {
            const productsResponse = await fetch(
              `/api/v1/shop/catalog?merchantId=${encodeURIComponent(fallbackId)}`,
              {
                method: 'GET',
                credentials: 'include',
              }
            );
            const productsData = await productsResponse.json();
            if (!productsResponse.ok) {
              throw new Error(productsData.error || 'Failed to load merchant products.');
            }
            setProducts(productsData.products ?? []);
          } else {
            setProducts([]);
          }
        }
      } catch (searchError: any) {
        setError(searchError?.message || 'Failed to search merchants.');
      }
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [searchTerm, user]);

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedMerchantId) ?? null,
    [merchants, selectedMerchantId]
  );

  const handleAddToCart = (product: CatalogProduct) => {
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
    if (typeof window !== 'undefined') {
      window.setTimeout(() => setStatusMessage(''), 2400);
    }
  };

  const handleBuyNow = (product: CatalogProduct) => {
    const params = new URLSearchParams({
      merchantId: product.merchant_id,
      productId: product.id,
      faceValue: String(product.face_value),
    });
    router.push(`/buy-vouchers?${params.toString()}`);
  };

  const handleSelectMerchant = async (merchantId: string) => {
    try {
      if (!merchantId) return;
      setSelectedMerchantId(merchantId);
      setProductsLoading(true);
      setError('');

      const response = await fetch(`/api/v1/shop/catalog?merchantId=${encodeURIComponent(merchantId)}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load merchant products.');

      setProducts(data.products ?? []);
      setUssdAccessCode(data.ussdAccessCode ?? '*120*384#');
    } catch (merchantError: any) {
      setError(merchantError?.message || 'Failed to load merchant products.');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 px-4 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-24 bg-muted rounded-2xl" />
            <div className="grid md:grid-cols-3 gap-6">
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
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h1 className="font-headline font-bold text-3xl text-foreground">Shop</h1>
                <p className="text-muted-foreground font-body">Browse merchants and buy discounted products</p>
              </div>
              <button
                onClick={() => router.push('/cart')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-primary text-primary font-headline font-semibold hover:bg-primary/10"
              >
                <Icon name="ShoppingCartIcon" size={18} variant="outline" />
                <span>Cart</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="relative flex-1">
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
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm text-foreground font-body">
                  Offline access (USSD): <span className="font-headline font-bold">{ussdAccessCode}</span>
                </p>
              </div>
            </div>
          </div>

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

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="mb-4">
              <h2 className="font-headline font-bold text-xl text-foreground">Shopping At</h2>
              <p className="text-sm text-muted-foreground font-body">
                Select a merchant first, then choose products to add to cart.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {merchants.map((merchant) => (
                <button
                  key={merchant.id}
                  onClick={() => void handleSelectMerchant(merchant.id)}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    selectedMerchantId === merchant.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                    <Icon name="BuildingStorefrontIcon" size={20} variant="outline" />
                  </div>
                  <p className="font-headline font-semibold text-sm text-foreground line-clamp-2">
                    {merchant.businessName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{merchant.productCount} products</p>
                </button>
              ))}
              {merchants.length === 0 && (
                <div className="col-span-full rounded-xl border border-border p-6 text-center">
                  <p className="text-sm text-muted-foreground font-body">
                    No merchants found. Try another search term.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-headline font-bold text-xl text-foreground">
                Products {selectedMerchant ? `(${selectedMerchant.productCount} items)` : ''}
              </h2>
              {selectedMerchant && (
                <span className="text-sm text-muted-foreground font-body">
                  {selectedMerchant.businessName}
                </span>
              )}
            </div>

            {productsLoading ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-56 rounded-2xl bg-muted animate-pulse" />
                <div className="h-56 rounded-2xl bg-muted animate-pulse" />
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {products.length === 0 ? (
                  <div className="col-span-full p-10 text-center bg-card rounded-2xl border border-border">
                    <Icon
                      name="ShoppingBagIcon"
                      size={48}
                      variant="outline"
                      className="text-muted-foreground mx-auto mb-4"
                    />
                    <p className="text-muted-foreground font-body">
                      {selectedMerchant
                        ? 'No products available for this merchant yet.'
                        : 'Select a merchant to view products.'}
                    </p>
                  </div>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-primary font-headline font-semibold">
                            {product.merchant_name}
                          </p>
                          <h3 className="font-headline font-bold text-xl text-foreground">
                            {product.product_name}
                          </h3>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs bg-success/15 text-success font-headline font-semibold">
                          Save {Number(product.consumer_benefit_pct).toFixed(2)}%
                        </span>
                      </div>
                      {product.is_fallback && (
                        <p className="mb-3 text-xs text-warning font-body">
                          Starter catalog item (auto-generated until merchant publishes custom products).
                        </p>
                      )}

                      <div className="space-y-2 mb-5">
                        <div className="flex items-center justify-between text-sm font-body">
                          <span className="text-muted-foreground">Face value</span>
                          <span className="font-headline font-semibold text-foreground">
                            R{Number(product.face_value).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-body">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="font-headline font-semibold text-success">
                            {Number(product.total_discount_pct).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-body">
                          <span className="text-muted-foreground">Your savings</span>
                          <span className="font-headline font-semibold text-success">
                            -R{Number(product.consumer_benefit_amount).toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t border-border pt-2 flex items-center justify-between">
                          <span className="font-headline font-semibold text-foreground">You pay</span>
                          <span className="font-headline font-bold text-xl text-primary">
                            R{Number(product.consumer_price).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 px-4 py-3 rounded-lg border border-border font-headline font-semibold hover:bg-muted"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => handleBuyNow(product)}
                          className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-headline font-semibold hover:bg-primary/90"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
