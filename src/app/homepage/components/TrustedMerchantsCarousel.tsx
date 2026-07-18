'use client';

import { useRef, useState } from 'react';

// Only merchants whose logo files are confirmed in public/assets/images/merchants/
const LOGOS = [
  { name: 'Pick n Pay', src: '/assets/images/merchants/picknpay.png' },
  { name: 'Checkers', src: '/assets/images/merchants/checkers.png' },
  { name: 'Shoprite', src: '/assets/images/merchants/shoprite.png' },
  { name: 'Clicks', src: '/assets/images/merchants/clicks.png' },
  { name: 'Dis-Chem', src: '/assets/images/merchants/dischem.png' },
  { name: 'Pep', src: '/assets/images/merchants/pep.png' },
  { name: 'Game', src: '/assets/images/merchants/game.png' },
  { name: 'Boxer', src: '/assets/images/merchants/boxer.png' },
  { name: 'Woolworths', src: '/assets/images/merchants/woolworths.png' },
  { name: 'Edgars', src: '/assets/images/merchants/edgars.png' },
  { name: 'Mr Price', src: '/assets/images/merchants/mr-price.png' },
  { name: 'Engen', src: '/assets/images/merchants/engen.png' },
  { name: 'Cell C', src: '/assets/images/merchants/cellc.png' },
  { name: 'Telkom', src: '/assets/images/merchants/telkom.jpg' },
  { name: 'uSave', src: '/assets/images/merchants/usave.png' },
];

function LogoItem({ name, src }: { name: string; src: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="group mx-4 flex h-24 w-44 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-5 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:shadow-xl hover:ring-2 hover:ring-primary/10">
      {!failed ? (
        <img
          src={src}
          alt={name}
          className="h-14 w-full object-contain transition-all duration-300 group-hover:scale-110"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-center font-headline text-sm font-bold text-muted-foreground group-hover:text-primary">
          {name}
        </span>
      )}
      <span className="hidden font-headline text-[10px] font-semibold text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 lg:block">
        Trusted Partner
      </span>
    </div>
  );
}

export default function TrustedMerchantsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const doubled = [...LOGOS, ...LOGOS];

  return (
    <section aria-label="Trusted Merchants" className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <div className="mb-10 text-center">
          <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
            Our Partners
          </p>
          <h2 className="font-headline text-3xl font-bold text-foreground">
            Trusted by South Africa&apos;s Leading Retailers
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Over 16 national merchants already on the eVoucher platform.
          </p>
        </div>

        {/* Carousel — pauses on hover via CSS group */}
        <div
          className="group relative overflow-hidden"
          role="region"
          aria-label="Merchant logo carousel"
        >
          {/* Wide fade edges for premium look */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-slate-50 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-slate-50 to-transparent" />

          <div
            ref={trackRef}
            className="flex animate-ticker-slow group-hover:[animation-play-state:paused]"
          >
            {doubled.map((logo, i) => (
              <LogoItem key={`${logo.name}-${i}`} name={logo.name} src={logo.src} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
