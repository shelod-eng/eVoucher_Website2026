'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROMO_MERCHANTS = [
  { name: 'Pick n Pay', logo: '/assets/images/merchants/picknpay.png' },
  { name: 'Shoprite', logo: '/assets/images/merchants/shoprite.png' },
  { name: 'Checkers', logo: '/assets/images/merchants/checkers.png' },
  { name: 'Pep', logo: '/assets/images/merchants/pep.png' },
  { name: 'Game', logo: '/assets/images/merchants/game.png' },
  { name: 'Boxer', logo: '/assets/images/merchants/boxer.png' },
];

function MerchantPill({ name, logo }: { name: string; logo: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
      {!failed ? (
        <img
          src={logo}
          alt={name}
          className="h-5 w-5 object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="h-5 w-5 rounded-full bg-white/20 text-center text-[10px] leading-5 text-white font-bold">
          {name[0]}
        </span>
      )}
      <span className="font-headline text-xs font-semibold text-white">{name}</span>
    </div>
  );
}

export default function BigSavingsBanner() {
  const router = useRouter();

  return (
    <section aria-label="Big Savings This Week" className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#0891b2] px-8 py-12 shadow-2xl"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 50%, rgba(255,122,0,0.15) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(110,231,183,0.1) 0%, transparent 50%)`,
          }}
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-12 left-1/4 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left">
            {/* Left: copy */}
            <div className="flex-1">
              <span className="mb-3 inline-block rounded-full bg-secondary/90 px-4 py-1 font-headline text-xs font-bold text-white">
                🎉 This Week Only
              </span>
              <h2 className="mb-2 font-headline text-4xl font-bold text-white lg:text-5xl">
                Save up to <span className="text-[#6ee7b7]">15%</span>
              </h2>
              <p className="mb-6 max-w-md text-base text-white/80">
                Shop at South Africa's biggest retailers and save instantly with your eVoucher
                wallet. No loyalty card. No hassle.
              </p>

              <div className="mb-6 flex flex-wrap justify-center gap-2 lg:justify-start">
                {PROMO_MERCHANTS.map((m) => (
                  <MerchantPill key={m.name} name={m.name} logo={m.logo} />
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                <button
                  onClick={() => router.push('/shop')}
                  className="rounded-xl bg-white px-7 py-3.5 font-headline text-sm font-bold text-primary shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  Claim Your Savings →
                </button>
                <button
                  onClick={() => router.push('/merchant-partnership')}
                  className="rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 font-headline text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Become a Merchant
                </button>
              </div>
            </div>

            {/* Right: savings counter */}
            <div className="flex shrink-0 flex-col items-center gap-4 lg:items-end">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur-sm">
                <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-white/60">
                  Community Savings
                </p>
                <p className="font-headline text-5xl font-bold text-white">R2.5M+</p>
                <p className="mt-1 text-sm text-white/70">saved by South Africans</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-center backdrop-blur-sm">
                  <p className="font-headline text-2xl font-bold text-[#6ee7b7]">16+</p>
                  <p className="text-[11px] text-white/70">Merchants</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-center backdrop-blur-sm">
                  <p className="font-headline text-2xl font-bold text-[#6ee7b7]">2.5%</p>
                  <p className="text-[11px] text-white/70">Instant Saving</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
