'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEALS = [
  {
    id: 1,
    name: 'Sunflower Cooking Oil 2L',
    category: 'Groceries',
    merchant: 'Shoprite',
    merchantLogo: '/assets/images/merchants/shoprite.png',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    normalPrice: 169,
    eVoucherPrice: 159,
    saved: 10,
    vouchers: 48,
  },
  {
    id: 2,
    name: 'Full Cream Milk 2L',
    category: 'Groceries',
    merchant: 'Pick n Pay',
    merchantLogo: '/assets/images/merchants/picknpay.png',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    normalPrice: 52,
    eVoucherPrice: 48,
    saved: 4,
    vouchers: 120,
  },
  {
    id: 3,
    name: 'White Bread 700g',
    category: 'Groceries',
    merchant: 'Checkers',
    merchantLogo: '/assets/images/merchants/checkers.png',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    normalPrice: 22,
    eVoucherPrice: 19,
    saved: 3,
    vouchers: 200,
  },
  {
    id: 4,
    name: 'School Shoes (Size 3–7)',
    category: 'Fashion',
    merchant: 'Pep',
    merchantLogo: '/assets/images/merchants/pep.png',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    normalPrice: 299,
    eVoucherPrice: 279,
    saved: 20,
    vouchers: 35,
  },
  {
    id: 5,
    name: 'Electricity Prepaid R200',
    category: 'Utilities',
    merchant: 'Shoprite',
    merchantLogo: '/assets/images/merchants/shoprite.png',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&q=80',
    normalPrice: 200,
    eVoucherPrice: 195,
    saved: 5,
    vouchers: 500,
  },
  {
    id: 6,
    name: 'Data Bundle 1GB',
    category: 'Airtime & Data',
    merchant: 'Cell C',
    merchantLogo: '/assets/images/merchants/cellc.png',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80',
    normalPrice: 149,
    eVoucherPrice: 139,
    saved: 10,
    vouchers: 80,
  },
  {
    id: 7,
    name: 'Petrol 20L Voucher',
    category: 'Fuel',
    merchant: 'Engen',
    merchantLogo: '/assets/images/merchants/engen.png',
    image: 'https://images.unsplash.com/photo-1545262810-a9b8b4b8b8b8?w=400&q=80',
    normalPrice: 500,
    eVoucherPrice: 487,
    saved: 13,
    vouchers: 22,
  },
  {
    id: 8,
    name: 'Mixed Grocery Basket',
    category: 'Groceries',
    merchant: 'Boxer',
    merchantLogo: '/assets/images/merchants/boxer.png',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
    normalPrice: 850,
    eVoucherPrice: 829,
    saved: 21,
    vouchers: 60,
  },
];

function DealCard({ deal }: { deal: (typeof DEALS)[0] }) {
  const router = useRouter();
  const [logoFailed, setLogoFailed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [fav, setFav] = useState(false);
  const savePct = Math.round((deal.saved / deal.normalPrice) * 100);

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl overflow-hidden">
      {/* Savings badge */}
      <div className="absolute left-3 top-3 z-10 rounded-full bg-secondary px-2.5 py-1 font-headline text-[11px] font-bold text-white shadow">
        Save {savePct}%
      </div>

      {/* Favourite */}
      <button
        onClick={() => setFav((f) => !f)}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition-transform hover:scale-110"
        aria-label="Favourite"
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${fav ? 'fill-secondary stroke-secondary' : 'fill-none stroke-muted-foreground'}`}
          strokeWidth={2}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {/* Product image */}
      <div className="relative h-44 overflow-hidden bg-[#F8FAFC]">
        {!imgFailed ? (
          <img
            src={deal.image}
            alt={deal.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🛒</div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Merchant logo + category */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-white p-0.5 shadow-sm">
            {!logoFailed ? (
              <img
                src={deal.merchantLogo}
                alt={deal.merchant}
                className="h-5 w-5 object-contain"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className="text-[10px] font-bold text-primary">{deal.merchant[0]}</span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{deal.category}</span>
        </div>

        <p className="mb-3 font-headline text-sm font-bold leading-snug text-foreground line-clamp-2">
          {deal.name}
        </p>

        {/* Pricing */}
        <div className="mb-3 flex items-end gap-2">
          <span className="font-headline text-xl font-bold text-foreground">
            R{deal.eVoucherPrice}
          </span>
          <span className="mb-0.5 text-xs text-muted-foreground line-through">
            R{deal.normalPrice}
          </span>
          <span className="mb-0.5 ml-auto rounded-full bg-success/10 px-2 py-0.5 font-headline text-[11px] font-bold text-success">
            Save R{deal.saved}
          </span>
        </div>

        <p className="mb-3 text-[11px] text-muted-foreground">{deal.vouchers} vouchers available</p>

        <button
          onClick={() => router.push('/shop')}
          className="mt-auto w-full rounded-xl bg-primary py-2.5 font-headline text-sm font-bold text-white transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
        >
          Shop Now
        </button>
      </div>
    </div>
  );
}

export default function TodaysDeals() {
  const router = useRouter();

  return (
    <section aria-label="Today's Deals" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-secondary">
              🔥 Hot Deals
            </p>
            <h2 className="font-headline text-3xl font-bold text-foreground">Today's Deals</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Real products. Real savings. Updated daily.
            </p>
          </div>
          <button
            onClick={() => router.push('/shop')}
            className="hidden rounded-xl border border-primary px-5 py-2.5 font-headline text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-white sm:block"
          >
            View All Deals →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {DEALS.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <button
            onClick={() => router.push('/shop')}
            className="rounded-xl border border-primary px-6 py-3 font-headline text-sm font-semibold text-primary"
          >
            View All Deals →
          </button>
        </div>
      </div>
    </section>
  );
}
