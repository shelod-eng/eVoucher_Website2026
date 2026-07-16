'use client';

import { useRouter } from 'next/navigation';

const CATEGORIES = [
  {
    label: 'Groceries',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=75',
    products: 320,
    merchants: 8,
    color: 'from-emerald-600/80',
  },
  {
    label: 'Fashion',
    image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500&q=75',
    products: 180,
    merchants: 5,
    color: 'from-purple-600/80',
  },
  {
    label: 'Fuel',
    image: 'https://images.unsplash.com/photo-1545262810-77515befe149?w=500&q=75',
    products: 12,
    merchants: 2,
    color: 'from-orange-600/80',
  },
  {
    label: 'Airtime & Data',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&q=75',
    products: 45,
    merchants: 4,
    color: 'from-blue-600/80',
  },
  {
    label: 'Pharmacy',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=75',
    products: 95,
    merchants: 3,
    color: 'from-teal-600/80',
  },
  {
    label: 'Education',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&q=75',
    products: 28,
    merchants: 2,
    color: 'from-indigo-600/80',
  },
  {
    label: 'Home & Living',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=75',
    products: 110,
    merchants: 4,
    color: 'from-rose-600/80',
  },
  {
    label: 'Hardware',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&q=75',
    products: 60,
    merchants: 3,
    color: 'from-yellow-700/80',
  },
];

export default function PopularCategories() {
  const router = useRouter();

  return (
    <section aria-label="Popular Categories" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <div className="mb-8 text-center">
          <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
            Browse by Category
          </p>
          <h2 className="font-headline text-3xl font-bold text-foreground">Popular Categories</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Find exactly what you need from South Africa's top categories.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => router.push(`/shop?q=${encodeURIComponent(cat.label)}`)}
              className="group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              aria-label={`Browse ${cat.label}`}
            >
              {/* Background image */}
              <div className="relative h-36 sm:h-44">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} to-transparent`} />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-3 text-left">
                  <p className="font-headline text-sm font-bold text-white drop-shadow">
                    {cat.label}
                  </p>
                  <p className="text-[11px] text-white/80">
                    {cat.products} products · {cat.merchants} merchants
                  </p>
                  <span className="mt-1.5 inline-block self-start rounded-full bg-white/20 px-2.5 py-0.5 font-headline text-[10px] font-semibold text-white backdrop-blur-sm transition-all group-hover:bg-white/30">
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
