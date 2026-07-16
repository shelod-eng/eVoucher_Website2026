'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PublicMerchant {
  id: string;
  name: string;
  category: string;
  logoPath: string | null;
  brandKey: string | null;
}

const MERCHANT_META: Record<
  string,
  { banner: string; products: number; rating: number; promo: string }
> = {
  shoprite: {
    banner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=70',
    products: 120,
    rating: 4.7,
    promo: 'Up to 15% off groceries',
  },
  picknpay: {
    banner: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=70',
    products: 98,
    rating: 4.6,
    promo: 'Weekly specials live',
  },
  checkers: {
    banner: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&q=70',
    products: 85,
    rating: 4.8,
    promo: 'Fresh produce deals',
  },
  clicks: {
    banner: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=70',
    products: 60,
    rating: 4.5,
    promo: 'Healthcare savings',
  },
  dischem: {
    banner: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=70',
    products: 55,
    rating: 4.6,
    promo: 'Pharmacy deals',
  },
  pep: {
    banner: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&q=70',
    products: 70,
    rating: 4.4,
    promo: 'Fashion from R49',
  },
  boxer: {
    banner: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&q=70',
    products: 90,
    rating: 4.5,
    promo: 'Budget grocery deals',
  },
  game: {
    banner: 'https://images.unsplash.com/photo-1593640408182-31c228b29976?w=600&q=70',
    products: 45,
    rating: 4.3,
    promo: 'Electronics savings',
  },
  woolworths: {
    banner: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=70',
    products: 65,
    rating: 4.9,
    promo: 'Premium quality',
  },
  engen: {
    banner: 'https://images.unsplash.com/photo-1545262810-77515befe149?w=600&q=70',
    products: 12,
    rating: 4.4,
    promo: 'Fuel savings',
  },
  cellc: {
    banner: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=70',
    products: 30,
    rating: 4.2,
    promo: 'Data bundles',
  },
  telkom: {
    banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=70',
    products: 25,
    rating: 4.1,
    promo: 'Connectivity deals',
  },
};

function getMeta(brandKey: string | null, name: string) {
  const key = (brandKey ?? name).toLowerCase().replace(/\s+/g, '');
  return (
    MERCHANT_META[key] ?? {
      banner: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=70',
      products: 20,
      rating: 4.3,
      promo: 'Exclusive eVoucher deals',
    }
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          viewBox="0 0 20 20"
          className={`h-3 w-3 ${s <= Math.round(rating) ? 'fill-warning' : 'fill-muted'}`}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-[11px] text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

function MerchantCard({ merchant }: { merchant: PublicMerchant }) {
  const router = useRouter();
  const [logoFailed, setLogoFailed] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  const meta = getMeta(merchant.brandKey, merchant.name);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      {/* Banner */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        {!bannerFailed ? (
          <img
            src={meta.banner}
            alt={`${merchant.name} store`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setBannerFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="font-headline text-3xl font-bold text-primary/30">
              {merchant.name[0]}
            </span>
          </div>
        )}
        {/* Promo badge */}
        <div className="absolute bottom-2 left-2 rounded-full bg-secondary/90 px-2.5 py-0.5 font-headline text-[10px] font-bold text-white backdrop-blur-sm">
          {meta.promo}
        </div>
      </div>

      {/* Logo + info */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-white p-1.5 shadow-sm -mt-8 relative z-10">
            {merchant.logoPath && !logoFailed ? (
              <img
                src={merchant.logoPath}
                alt={merchant.name}
                className="h-8 w-8 object-contain"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className="font-headline text-sm font-bold text-primary">
                {merchant.name[0]}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="font-headline text-sm font-bold text-foreground line-clamp-1">
              {merchant.name}
            </p>
            <p className="text-[11px] text-muted-foreground">{merchant.category}</p>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <StarRating rating={meta.rating} />
          <span className="text-[11px] text-muted-foreground">{meta.products} products</span>
        </div>

        <button
          onClick={() =>
            router.push(`/shop?q=${encodeURIComponent(merchant.brandKey ?? merchant.name)}`)
          }
          className="mt-auto w-full rounded-xl bg-primary py-2.5 font-headline text-sm font-bold text-white transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
        >
          Shop Now
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-white">
      <div className="h-32 bg-muted" />
      <div className="p-4">
        <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
        <div className="mb-3 h-3 w-1/2 rounded bg-muted" />
        <div className="h-9 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export default function FeaturedMerchants() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<PublicMerchant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/merchants/public', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { merchants: [] }))
      .then((d) => setMerchants((d.merchants ?? []) as PublicMerchant[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section aria-label="Featured Merchants" className="bg-[#F2FBFA]">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
              Trusted Partners
            </p>
            <h2 className="font-headline text-3xl font-bold text-foreground">Featured Merchants</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Shop from South Africa's most trusted brands and save instantly.
            </p>
          </div>
          <button
            onClick={() => router.push('/merchants')}
            className="hidden rounded-xl border border-primary px-5 py-2.5 font-headline text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-white sm:block"
          >
            All Merchants →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : merchants.slice(0, 8).map((m) => <MerchantCard key={m.id} merchant={m} />)}
        </div>
      </div>
    </section>
  );
}
