'use client';

import { useRouter } from 'next/navigation';

const CATEGORIES = [
  {
    label: 'Groceries',
    emoji: '🛒',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
    products: 320,
    merchants: 8,
    gradient: 'from-emerald-900/85 via-emerald-800/60 to-transparent',
    accent: 'bg-emerald-500',
  },
  {
    label: 'Fashion',
    emoji: '👗',
    image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&q=80',
    products: 180,
    merchants: 5,
    gradient: 'from-purple-900/85 via-purple-800/60 to-transparent',
    accent: 'bg-purple-500',
  },
  {
    label: 'Pharmacy',
    emoji: '💊',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
    products: 95,
    merchants: 3,
    gradient: 'from-teal-900/85 via-teal-800/60 to-transparent',
    accent: 'bg-teal-500',
  },
  {
    label: 'Fuel',
    emoji: '⛽',
    image: 'https://images.unsplash.com/photo-1545262810-77515befe149?w=600&q=80',
    products: 12,
    merchants: 2,
    gradient: 'from-orange-900/85 via-orange-800/60 to-transparent',
    accent: 'bg-orange-500',
  },
  {
    label: 'Airtime & Data',
    emoji: '📱',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80',
    products: 45,
    merchants: 4,
    gradient: 'from-blue-900/85 via-blue-800/60 to-transparent',
    accent: 'bg-blue-500',
  },
  {
    label: 'Education',
    emoji: '📚',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
    products: 28,
    merchants: 2,
    gradient: 'from-indigo-900/85 via-indigo-800/60 to-transparent',
    accent: 'bg-indigo-500',
  },
  {
    label: 'Home & Living',
    emoji: '🏠',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
    products: 110,
    merchants: 4,
    gradient: 'from-rose-900/85 via-rose-800/60 to-transparent',
    accent: 'bg-rose-500',
  },
  {
    label: 'Hardware',
    emoji: '🔧',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80',
    products: 60,
    merchants: 3,
    gradient: 'from-yellow-900/85 via-yellow-800/60 to-transparent',
    accent: 'bg-yellow-500',
  },
];

export default function PopularCategories() {
  const router = useRouter();

  return (
    <section aria-label="Popular Categories" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        {/* Section heading */}
        <div className="mb-10 text-center">
          <p className="mb-2 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
            Browse by Category
          </p>
          <h2 className="font-headline text-4xl font-bold text-foreground">Popular Categories</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Browse thousands of products from trusted South African merchants.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => router.push(`/shop?q=${encodeURIComponent(cat.label)}`)}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Browse ${cat.label}`}
            >
              {/* Background image */}
              <div className="relative h-48 sm:h-56">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />

                {/* Strong gradient overlay — ensures text is always readable */}
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient}`} />

                {/* Accent dot */}
                <div
                  className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${cat.accent} shadow-lg ring-2 ring-white/40`}
                />

                {/* Content pinned to bottom */}
                <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-lg leading-none">{cat.emoji}</span>
                    <p className="font-headline text-base font-bold leading-tight text-white drop-shadow-md">
                      {cat.label}
                    </p>
                  </div>
                  <p className="mb-2.5 text-[11px] font-medium text-white/80">
                    {cat.products} products &middot; {cat.merchants} merchants
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 font-headline text-[11px] font-bold text-white backdrop-blur-sm ring-1 ring-white/30 transition-all group-hover:bg-white/35 group-hover:ring-white/50">
                    Explore →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
