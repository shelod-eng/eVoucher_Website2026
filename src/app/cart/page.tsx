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

const BRAND_LOGOS: Record<string, string> = {
  shoprite: '/assets/images/merchants/shoprite.png',
  'pick n pay': '/assets/images/merchants/picknpay.png',
  picknpay: '/assets/images/merchants/picknpay.png',
  checkers: '/assets/images/merchants/checkers.png',
  clicks: '/assets/images/merchants/clicks.png',
  'dis-chem': '/assets/images/merchants/dischem.png',
  dischem: '/assets/images/merchants/dischem.png',
  pep: '/assets/images/merchants/pep.png',
  game: '/assets/images/merchants/game.png',
  boxer: '/assets/images/merchants/boxer.png',
  woolworths: '/assets/images/merchants/woolworths.png',
  engen: '/assets/images/merchants/engen.png',
  'mr price': '/assets/images/merchants/mr-price.png',
  mrprice: '/assets/images/merchants/mr-price.png',
  usave: '/assets/images/merchants/usave.png',
  kalapeng: '/assets/images/merchants/kalapeng.png',
};
const PLACEHOLDER = '/assets/images/merchants/placeholder-merchant.svg';

function getMerchantLogo(name: string) {
  const key = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  return BRAND_LOGOS[key] ?? PLACEHOLDER;
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/signin'); return; }
    setItems(getCartItems(user?.id));
  }, [authLoading, user, router]);

  const summary = getCartSummary(items);
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const handleRemove = (productId: string, merchantId: string, selectedBranchId?: string | null) =>
    setItems(removeCartItem(productId, user?.id, merchantId, selectedBranchId));

  const handleQty = (productId: string, merchantId: string, quantity: number, selectedBranchId?: string | null) =>
    setItems(updateCartQuantity(productId, quantity, user?.id, merchantId, selectedBranchId));

  const handleCheckout = () => {
    if (items.length === 0) return;
    router.push('/buy-vouchers?cartCheckout=1');
  };

  if (authLoading) return <div className="min-h-screen bg-background"><Header /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-20 lg:px-6">

        {/* ── Hero header ── */}
        <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#0891b2] p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-headline text-xs font-semibold uppercase tracking-widest text-white/60">eVoucher</p>
              <h1 className="font-headline text-3xl font-bold">My Cart 🛒</h1>
              <p className="mt-1 text-sm text-white/70">{itemCount} item{itemCount !== 1 ? 's' : ''} ready for checkout</p>
            </div>
            {summary.totalSavings > 0 && (
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-right backdrop-blur-sm">
                <p className="font-headline text-xl font-bold text-[#6ee7b7]">R{summary.totalSavings.toFixed(2)}</p>
                <p className="text-[11px] text-white/70">You're saving</p>
              </div>
            )}
          </div>
        </section>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-20 text-center shadow-sm">
            <span className="mb-4 text-6xl">🛒</span>
            <p className="font-headline text-lg font-bold text-foreground">Your cart is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">Browse our merchants and add vouchers to get started</p>
            <button onClick={() => router.push('/shop')}
              className="mt-6 rounded-2xl bg-primary px-8 py-3 font-headline font-bold text-white shadow-md hover:bg-primary/90">
              Shop Now →
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

            {/* ── Cart items ── */}
            <div className="space-y-4">
              {items.map((item) => {
                const logo = getMerchantLogo(item.parentBrand || item.merchantName || '');
                const savingsPct = item.faceValue > 0
                  ? ((item.consumerBenefitAmount / item.faceValue) * 100).toFixed(1)
                  : '0';
                return (
                  <div key={`${item.merchantId}:${item.productId}:${item.selectedBranchId ?? 'all'}`}
                    className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:shadow-md">
                    {/* Colour strip */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary to-teal-400" />
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Logo */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-white p-1.5 shadow-sm">
                          <img src={logo} alt={item.merchantName}
                            className="h-10 w-10 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-headline text-xs font-semibold uppercase tracking-wide text-primary">{item.merchantName}</p>
                          <h2 className="font-headline text-lg font-bold text-foreground leading-tight">{item.productName}</h2>
                          {item.selectedBranchName && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              📍 {item.selectedBranchName}{item.selectedBranchCity ? ` · ${item.selectedBranchCity}` : ''}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-muted px-2.5 py-0.5 font-headline text-[11px] font-semibold text-muted-foreground line-through">
                              R{item.faceValue.toFixed(2)}
                            </span>
                            <span className="rounded-full bg-success/10 px-2.5 py-0.5 font-headline text-[11px] font-bold text-success">
                              Save {savingsPct}% · R{item.consumerBenefitAmount.toFixed(2)} off
                            </span>
                          </div>
                        </div>

                        {/* Remove */}
                        <button onClick={() => handleRemove(item.productId, item.merchantId, item.selectedBranchId)}
                          className="shrink-0 rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:border-error/30 hover:bg-error/10 hover:text-error">
                          <Icon name="TrashIcon" size={16} variant="outline" />
                        </button>
                      </div>

                      {/* Qty + price row */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1">
                          <button onClick={() => handleQty(item.productId, item.merchantId, item.quantity - 1, item.selectedBranchId)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-foreground hover:bg-white">−</button>
                          <span className="min-w-8 text-center font-headline text-sm font-bold text-foreground">{item.quantity}</span>
                          <button onClick={() => handleQty(item.productId, item.merchantId, item.quantity + 1, item.selectedBranchId)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-foreground hover:bg-white">+</button>
                        </div>
                        <div className="text-right">
                          <p className="font-headline text-2xl font-bold text-foreground">R{(item.consumerPrice * item.quantity).toFixed(2)}</p>
                          <p className="text-[11px] text-muted-foreground">You pay</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button onClick={() => { clearCart(user?.id); setItems([]); }}
                className="rounded-xl border border-border bg-white px-4 py-2 font-headline text-sm font-semibold text-muted-foreground hover:border-error/30 hover:text-error transition-colors">
                Clear cart
              </button>
            </div>

            {/* ── Order summary ── */}
            <div className="h-fit overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="bg-gradient-to-br from-[#064e3b] to-[#0d9488] p-5 text-white">
                <h3 className="font-headline text-lg font-bold">Order Summary</h3>
                <p className="text-sm text-white/70">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Face Value</span>
                  <span className="font-headline font-semibold text-foreground">R{summary.totalFaceValue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your Savings</span>
                  <span className="font-headline font-semibold text-success">−R{summary.totalSavings.toFixed(2)}</span>
                </div>
                <div className="rounded-xl bg-success/10 px-4 py-2 flex items-center justify-between">
                  <span className="font-headline text-sm font-bold text-success">Instant Saving</span>
                  <span className="font-headline text-sm font-bold text-success">R{summary.totalSavings.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <span className="font-headline text-base font-bold text-foreground">You Pay</span>
                  <span className="font-headline text-3xl font-bold text-primary">R{summary.totalConsumerPrice.toFixed(2)}</span>
                </div>
                <button onClick={handleCheckout}
                  className="w-full rounded-2xl bg-primary py-4 font-headline text-base font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95">
                  Checkout →
                </button>
                <button onClick={() => router.push('/shop')}
                  className="w-full rounded-2xl border border-border py-3 font-headline text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
