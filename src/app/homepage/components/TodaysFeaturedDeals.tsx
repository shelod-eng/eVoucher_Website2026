'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const DEALS = [
  {
    merchant: 'Pick n Pay',
    logo: '/assets/images/merchants/picknpay.png',
    category: 'Fresh Food Voucher',
    savePct: 5,
    saveAmt: 50,
    badge: '🔥 Hot Deal',
    badgeColor: 'bg-red-500',
  },
  {
    merchant: 'Checkers',
    logo: '/assets/images/merchants/checkers.png',
    category: 'Grocery Voucher',
    savePct: 6,
    saveAmt: 61,
    badge: '⭐ Featured',
    badgeColor: 'bg-amber-500',
  },
  {
    merchant: 'Clicks',
    logo: '/assets/images/merchants/clicks.png',
    category: 'Healthcare Voucher',
    savePct: 4,
    saveAmt: 38,
    badge: '💊 Health',
    badgeColor: 'bg-blue-500',
  },
  {
    merchant: 'Shoprite',
    logo: '/assets/images/merchants/shoprite.png',
    category: 'Grocery Voucher',
    savePct: 5,
    saveAmt: 45,
    badge: '🛒 Popular',
    badgeColor: 'bg-orange-500',
  },
  {
    merchant: 'Woolworths',
    logo: '/assets/images/merchants/woolworths.png',
    category: 'Premium Voucher',
    savePct: 5,
    saveAmt: 74,
    badge: '💚 Premium',
    badgeColor: 'bg-green-600',
  },
  {
    merchant: 'Dis-Chem',
    logo: '/assets/images/merchants/dischem.png',
    category: 'Pharmacy Voucher',
    savePct: 4,
    saveAmt: 32,
    badge: '💊 Pharmacy',
    badgeColor: 'bg-red-600',
  },
  {
    merchant: 'Pep',
    logo: '/assets/images/merchants/pep.png',
    category: 'Fashion Voucher',
    savePct: 5,
    saveAmt: 35,
    badge: '👗 Fashion',
    badgeColor: 'bg-purple-500',
  },
  {
    merchant: 'Game',
    logo: '/assets/images/merchants/game.png',
    category: 'Electronics Voucher',
    savePct: 5,
    saveAmt: 55,
    badge: '🎮 Tech',
    badgeColor: 'bg-slate-600',
  },
];

function useLiveSavings(base: number) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const t = setInterval(
      () => setVal((v) => v + Math.floor(Math.random() * 3)),
      3000 + Math.random() * 2000
    );
    return () => clearInterval(t);
  }, []);
  return val;
}

function DealCard({ deal, index }: { deal: (typeof DEALS)[0]; index: number }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const liveSaved = useLiveSavings(deal.saveAmt);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 80);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-primary/20 hover:shadow-xl ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      {/* Top colour bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary to-teal-400" />

      <div className="flex flex-1 flex-col p-5">
        {/* Badge + logo row */}
        <div className="mb-4 flex items-start justify-between">
          <span className={`rounded-full px-2.5 py-1 font-headline text-[10px] font-bold text-white ${deal.badgeColor}`}>
            {deal.badge}
          </span>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
            {!failed ? (
              <img
                src={deal.logo}
                alt={deal.merchant}
                className="h-9 w-full object-contain transition-transform duration-300 group-hover:scale-110"
                onError={() => setFailed(true)}
              />
            ) : (
              <span className="font-headline text-sm font-bold text-primary">{deal.merchant[0]}</span>
            )}
          </div>
        </div>

        {/* Merchant + category */}
        <p className="font-headline text-base font-bold text-foreground">{deal.merchant}</p>
        <p className="mb-3 text-xs text-muted-foreground">{deal.category}</p>

        {/* Savings highlight */}
        <div className="mb-4 flex items-center justify-between rounded-xl bg-success/8 px-3 py-2.5">
          <div>
            <p className="font-headline text-xs font-semibold text-muted-foreground">You Save</p>
            <p className="font-headline text-xl font-bold text-success">R{liveSaved}</p>
          </div>
          <div className="text-right">
            <p className="font-headline text-xs font-semibold text-muted-foreground">Discount</p>
            <p className="font-headline text-xl font-bold text-primary">{deal.savePct}% OFF</p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="font-headline text-[10px] font-semibold text-emerald-600">Live deal · Updates in real-time</span>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push('/shop')}
          className="mt-auto w-full rounded-xl bg-primary py-2.5 font-headline text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
        >
          Buy Voucher →
        </button>
      </div>
    </article>
  );
}

export default function TodaysFeaturedDeals() {
  return (
    <section aria-label="Today's Featured Deals" className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 font-headline text-xs font-bold text-secondary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
                Live Today
              </span>
            </div>
            <h2 className="font-headline text-3xl font-bold text-foreground lg:text-4xl">
              Today&apos;s Featured Deals
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Instant savings on every voucher — no loyalty card, no hassle.
            </p>
          </div>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/shop';
            }}
            className="shrink-0 rounded-xl border border-primary px-6 py-2.5 font-headline text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white"
          >
            View All Deals →
          </button>
        </div>

        {/* Deal cards grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {DEALS.map((deal, i) => (
            <DealCard key={deal.merchant} deal={deal} index={i} />
          ))}
        </div>

        {/* Bottom trust strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-slate-200 pt-6">
          {[
            { icon: '🔒', text: 'POPIA Compliant' },
            { icon: '🏦', text: 'Bank-grade Security' },
            { icon: '⚡', text: 'Instant Voucher Delivery' },
            { icon: '🇿🇦', text: '9 Provinces Covered' },
          ].map((t) => (
            <div key={t.text} className="flex items-center gap-1.5">
              <span className="text-base">{t.icon}</span>
              <span className="font-headline text-xs font-semibold text-muted-foreground">{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
