'use client';

import { useEffect, useMemo, useState } from 'react';
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
    setItems(getCartItems(user?.id));
  }, [authLoading, user, router]);

  const summary = getCartSummary(items);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const handleRemove = (productId: string) => {
    setItems(removeCartItem(productId, user?.id));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setItems(updateCartQuantity(productId, quantity, user?.id));
  };

  const handleCheckout = () => {
    if (items.length === 0) return;

    const first = items[0];
    const params = new URLSearchParams({
      merchantId: first.merchantId,
      faceValue: String(first.faceValue),
    });
    if (!first.productId.startsWith('fallback-') && !first.productId.startsWith('starter-')) {
      params.set('productId', first.productId);
    }
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
          <div>
            <h1 className="font-headline font-bold text-5xl text-foreground">Cart</h1>
            <p className="text-muted-foreground">{itemCount} items in your cart</p>
          </div>

          {items.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-10 text-center">
              <Icon
                name="ShoppingCartIcon"
                size={48}
                variant="outline"
                className="text-muted-foreground mx-auto mb-4"
              />
              <p className="text-muted-foreground">Your cart is empty.</p>
              <button
                onClick={() => router.push('/shop')}
                className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-headline font-semibold"
              >
                Go to Shop
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_300px] gap-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="bg-card rounded-2xl border border-border p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-primary font-headline font-semibold">
                          {item.merchantName}
                        </p>
                        <h2 className="font-headline font-bold text-2xl text-foreground">
                          {item.productName}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Face: R{item.faceValue.toFixed(2)} | You pay: R
                          {item.consumerPrice.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="text-error hover:bg-error/10 rounded-lg p-2"
                      >
                        <Icon name="TrashIcon" size={16} variant="outline" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg border border-border"
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center font-headline font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg border border-border"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-headline font-bold text-3xl text-foreground">
                        R{(item.consumerPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    clearCart(user?.id);
                    setItems([]);
                  }}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-headline font-semibold"
                >
                  Clear cart
                </button>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5 h-fit">
                <h3 className="font-headline font-bold text-2xl text-foreground mb-4">
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Face Value</span>
                    <span className="font-headline font-semibold">
                      R{summary.totalFaceValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Your Savings</span>
                    <span className="font-headline font-semibold text-success">
                      -R{summary.totalSavings.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex items-center justify-between">
                    <span className="font-headline font-bold text-foreground text-3xl">
                      You Pay
                    </span>
                    <span className="font-headline font-bold text-primary text-4xl">
                      R{summary.totalConsumerPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="mt-4 w-full py-3 rounded-lg bg-primary text-primary-foreground font-headline font-semibold"
                >
                  Checkout →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
