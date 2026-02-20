'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import {
  CartItem,
  clearCart,
  getCartItems,
  getCartSummary,
  removeCartItem,
  updateCartQuantity,
} from '@/lib/cart';

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
      return;
    }
    setItems(getCartItems());
  }, [authLoading, user, router]);

  const summary = getCartSummary(items);

  const handleRemove = (productId: string) => {
    setItems(removeCartItem(productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setItems(updateCartQuantity(productId, quantity));
  };

  const handleClear = () => {
    clearCart();
    setItems([]);
  };

  const handleCheckoutItem = (item: CartItem) => {
    const params = new URLSearchParams({
      merchantId: item.merchantId,
      productId: item.productId,
      faceValue: String(item.faceValue),
    });
    router.push(`/buy-vouchers?${params.toString()}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-headline font-bold text-3xl text-foreground">Cart</h1>
                <p className="text-muted-foreground font-body">
                  Review selected vouchers and proceed to secure checkout.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/shop')}
                  className="px-4 py-3 rounded-lg border border-border font-headline font-semibold"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={handleClear}
                  disabled={items.length === 0}
                  className="px-4 py-3 rounded-lg bg-error text-white font-headline font-semibold disabled:opacity-50"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-10 text-center">
              <Icon
                name="ShoppingCartIcon"
                size={48}
                variant="outline"
                className="text-muted-foreground mx-auto mb-4"
              />
              <p className="text-muted-foreground font-body">Your cart is empty.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-primary font-headline font-semibold">
                          {item.merchantName}
                        </p>
                        <h2 className="font-headline font-bold text-xl text-foreground">
                          {item.productName}
                        </h2>
                        <p className="text-sm text-muted-foreground font-body">
                          Face Value: R{item.faceValue.toFixed(2)} | You Pay: R
                          {item.consumerPrice.toFixed(2)} | Save: R
                          {item.consumerBenefitAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="text-sm text-muted-foreground font-body">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) =>
                            handleQuantityChange(item.productId, Number(event.target.value || 1))
                          }
                          className="w-20 px-3 py-2 border border-border rounded-lg"
                        />
                        <button
                          onClick={() => handleCheckoutItem(item)}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-headline font-semibold"
                        >
                          Checkout
                        </button>
                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="px-4 py-2 rounded-lg border border-border font-headline font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-headline font-bold text-xl text-foreground mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm font-body">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total face value</span>
                    <span className="font-headline font-semibold text-foreground">
                      R{summary.totalFaceValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total savings</span>
                    <span className="font-headline font-semibold text-success">
                      -R{summary.totalSavings.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex items-center justify-between">
                    <span className="font-headline font-semibold text-foreground">Total you pay</span>
                    <span className="font-headline font-bold text-2xl text-primary">
                      R{summary.totalConsumerPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
