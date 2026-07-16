'use client';

import { useState } from 'react';

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
    <div className="group mx-6 flex h-16 w-28 shrink-0 items-center justify-center rounded-xl border border-border bg-white px-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      {!failed ? (
        <img
          src={src}
          alt={name}
          className="h-10 w-full object-contain grayscale transition-all duration-300 group-hover:grayscale-0"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-headline text-xs font-bold text-muted-foreground group-hover:text-primary">
          {name}
        </span>
      )}
    </div>
  );
}

export default function TrustedMerchantsCarousel() {
  const doubled = [...LOGOS, ...LOGOS];

  return (
    <section aria-label="Trusted Merchants" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="mb-8 text-center">
          <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
            Our Partners
          </p>
          <h2 className="font-headline text-2xl font-bold text-foreground">
            Trusted by South Africa's Best
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent" />

          <div className="flex animate-ticker-slow">
            {doubled.map((logo, i) => (
              <LogoItem key={`${logo.name}-${i}`} name={logo.name} src={logo.src} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
