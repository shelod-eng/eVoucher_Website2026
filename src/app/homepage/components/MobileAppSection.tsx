'use client';

import { useEffect, useState } from 'react';

const APK_PATH = '/downloads/eVoucher_APK_14-July-2026_BuildVersion1.apk';

const CHANNELS = [
  {
    icon: '📱',
    title: 'Android App',
    subtitle: 'Download APK',
    desc: 'Full-featured app with offline voucher scanning and wallet management.',
    badge: 'Available Now',
    badgeColor: 'bg-[#6ee7b7]/20 text-[#6ee7b7]',
    action: 'apk',
  },
  {
    icon: '🌐',
    title: 'Install as App',
    subtitle: 'Progressive Web App',
    desc: 'Add to your home screen from any browser. Works like a native app.',
    badge: 'Available Now',
    badgeColor: 'bg-[#6ee7b7]/20 text-[#6ee7b7]',
    action: 'pwa',
  },
  {
    icon: '📞',
    title: 'USSD',
    subtitle: 'Dial *120*384#',
    desc: 'Works on any phone — no smartphone or data needed. Perfect for feature phones.',
    badge: 'No Data Needed',
    badgeColor: 'bg-amber-400/20 text-amber-300',
    action: 'ussd',
  },
  {
    icon: '💻',
    title: 'Web Platform',
    subtitle: 'evoucher.co.za',
    desc: 'Full desktop and mobile browser experience. Shop, manage wallet, redeem.',
    badge: 'Live Now',
    badgeColor: 'bg-[#6ee7b7]/20 text-[#6ee7b7]',
    action: 'web',
  },
];

export default function MobileAppSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches) setPwaInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handlePwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setPwaInstalled(true);
  };

  return (
    <section aria-label="Access eVoucher Anywhere" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1 font-headline text-xs font-bold text-primary">
            Omnichannel Platform
          </span>
          <h2 className="font-headline text-3xl font-bold text-foreground lg:text-4xl">
            Access eVoucher Anywhere
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Choose the way that suits you best — smartphone, web browser, or feature phone.
            eVoucher works for everyone.
          </p>
        </div>

        {/* 4-channel grid */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((ch) => {
            const isApk = ch.action === 'apk';
            const isPwa = ch.action === 'pwa';
            const isUssd = ch.action === 'ussd';

            const cardContent = (
              <div className="group flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-md">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                    {ch.icon}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 font-headline text-[10px] font-bold ${ch.badgeColor}`}>
                    {ch.badge}
                  </span>
                </div>
                <h3 className="mb-0.5 font-headline text-lg font-bold text-foreground">{ch.title}</h3>
                <p className="mb-2 font-headline text-sm font-semibold text-primary">{ch.subtitle}</p>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{ch.desc}</p>
                <div className="mt-4">
                  {isApk && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-headline text-sm font-bold text-white shadow-sm group-hover:bg-primary/90">
                      ⬇ Download APK
                    </span>
                  )}
                  {isPwa && (
                    <span className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-headline text-sm font-bold shadow-sm ${pwaInstalled ? 'bg-success/10 text-success' : 'bg-primary px-4 py-2 text-white group-hover:bg-primary/90'}`}>
                      {pwaInstalled ? '✅ Installed' : '🌐 Install App'}
                    </span>
                  )}
                  {isUssd && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2 font-accent text-base font-bold text-amber-700">
                      *120*384#
                    </span>
                  )}
                  {ch.action === 'web' && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 font-headline text-sm font-bold text-primary">
                      Open Platform →
                    </span>
                  )}
                </div>
              </div>
            );

            if (isApk) {
              return (
                <a key={ch.title} href={APK_PATH} download className="block h-full">
                  {cardContent}
                </a>
              );
            }
            if (isPwa) {
              return (
                <button
                  key={ch.title}
                  onClick={pwaInstalled ? undefined : handlePwa}
                  className="block h-full w-full text-left"
                >
                  {cardContent}
                </button>
              );
            }
            return <div key={ch.title} className="h-full">{cardContent}</div>;
          })}
        </div>

        {/* Bottom banner */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#0891b2] shadow-xl">
          <div className="grid items-center gap-0 lg:grid-cols-[1fr_auto]">
            <div className="p-8 lg:p-10">
              <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-white/60">
                Real Savings on Every Purchase
              </p>
              <h3 className="mb-2 font-headline text-2xl font-bold text-white lg:text-3xl">
                Thousands of Merchants. Instant Savings.
              </h3>
              <p className="mb-6 max-w-lg text-sm text-white/80">
                Shoprite, Pick n Pay, Checkers, Clicks, Dis-Chem and hundreds more. Save 5–8% every
                time you shop — online, in-store, or via USSD.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={APK_PATH}
                  download
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-headline text-sm font-bold text-foreground shadow-md transition-all hover:scale-105"
                >
                  🤖 Download Android APK
                </a>
                <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 backdrop-blur-sm">
                  <span className="text-lg">☎️</span>
                  <div>
                    <p className="text-[10px] text-white/60">No smartphone needed</p>
                    <p className="font-accent text-base font-bold text-white">*120*384#</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 opacity-70">
                  <span>▶️</span>
                  <div>
                    <p className="text-[10px] text-white/50">Coming Soon</p>
                    <p className="font-headline text-sm font-bold text-white">Google Play</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 opacity-70">
                  <span>🍎</span>
                  <div>
                    <p className="text-[10px] text-white/50">Coming Soon</p>
                    <p className="font-headline text-sm font-bold text-white">App Store</p>
                  </div>
                </div>
              </div>
            </div>
            {/* QR */}
            <div className="hidden items-center justify-center p-10 lg:flex">
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-2xl border-4 border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 49 }).map((_, i) => {
                      const filled = [
                        0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,
                        8,9,10,11,12,15,19,22,26,29,33,36,37,38,39,40,24,16,17,18,23,25,30,31,32,
                      ].includes(i);
                      return (
                        <div key={i} className={`h-4 w-4 rounded-sm ${filled ? 'bg-white' : 'bg-white/10'}`} />
                      );
                    })}
                  </div>
                </div>
                <p className="font-headline text-sm font-semibold text-white/80">Scan to download</p>
                <p className="text-xs text-white/50">Android APK · Build v1 · July 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
