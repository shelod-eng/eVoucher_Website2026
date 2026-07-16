'use client';

import { useEffect, useState } from 'react';

const APK_PATH = '/downloads/eVoucher_APK_14-July-2026_BuildVersion1.apk';

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
    <section aria-label="Download eVoucher App" className="bg-[#F2FBFA]">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#0891b2] shadow-2xl">
          <div className="grid items-center gap-0 lg:grid-cols-2">
            {/* Left: copy */}
            <div className="p-10 lg:p-14">
              <span className="mb-4 inline-block rounded-full bg-white/15 px-4 py-1 font-headline text-xs font-bold text-white">
                📲 Available Now
              </span>
              <h2 className="mb-3 font-headline text-4xl font-bold text-white">Shop on the Go</h2>
              <p className="mb-8 max-w-md text-base text-white/80">
                Download the eVoucher app for Android. Scan vouchers, manage your wallet, and save
                money — even offline.
              </p>

              <div className="flex flex-wrap gap-3">
                {/* Android APK */}
                <a
                  href={APK_PATH}
                  download
                  className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  <span className="text-2xl">🤖</span>
                  <div>
                    <p className="font-headline text-[10px] font-semibold text-muted-foreground">
                      Download for
                    </p>
                    <p className="font-headline text-sm font-bold text-foreground">Android APK</p>
                  </div>
                </a>

                {/* PWA */}
                {!pwaInstalled ? (
                  deferredPrompt ? (
                    <button
                      onClick={handlePwa}
                      className="flex items-center gap-3 rounded-xl border border-white/30 bg-white/10 px-5 py-3 backdrop-blur-sm transition-all hover:bg-white/20"
                    >
                      <span className="text-2xl">🌐</span>
                      <div className="text-left">
                        <p className="font-headline text-[10px] font-semibold text-white/70">
                          Install as
                        </p>
                        <p className="font-headline text-sm font-bold text-white">Web App (PWA)</p>
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-white/30 bg-white/10 px-5 py-3 backdrop-blur-sm">
                      <span className="text-2xl">🌐</span>
                      <div>
                        <p className="font-headline text-[10px] font-semibold text-white/70">
                          Open in browser
                        </p>
                        <p className="font-headline text-sm font-bold text-white">Install PWA</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3">
                    <span className="text-lg">✅</span>
                    <p className="font-headline text-sm font-bold text-white">App Installed</p>
                  </div>
                )}

                {/* Google Play — coming soon */}
                <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-5 py-3 opacity-60">
                  <span className="text-2xl">▶️</span>
                  <div>
                    <p className="font-headline text-[10px] font-semibold text-white/60">
                      Coming Soon
                    </p>
                    <p className="font-headline text-sm font-bold text-white">Google Play</p>
                  </div>
                </div>

                {/* App Store — coming soon */}
                <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-5 py-3 opacity-60">
                  <span className="text-2xl">🍎</span>
                  <div>
                    <p className="font-headline text-[10px] font-semibold text-white/60">
                      Coming Soon
                    </p>
                    <p className="font-headline text-sm font-bold text-white">App Store</p>
                  </div>
                </div>
              </div>

              {/* USSD */}
              <div className="mt-8 flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <span className="text-2xl">☎️</span>
                <div>
                  <p className="text-xs text-white/70">No smartphone? No problem.</p>
                  <p className="font-accent text-lg font-bold text-white">Dial *120*384#</p>
                </div>
              </div>
            </div>

            {/* Right: phone mockup */}
            <div
              className="relative hidden items-center justify-center overflow-hidden lg:flex"
              style={{ minHeight: 420 }}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              {/* QR code placeholder */}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="rounded-2xl border-4 border-white/20 bg-white/10 p-6 backdrop-blur-sm">
                  {/* Simple QR grid visual */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 49 }).map((_, i) => {
                      const corners = [
                        0, 1, 2, 3, 4, 5, 6, 7, 13, 14, 20, 21, 27, 28, 34, 35, 41, 42, 43, 44, 45,
                        46, 47, 48,
                      ];
                      const inner = [8, 9, 10, 11, 12, 15, 19, 22, 26, 29, 33, 36, 37, 38, 39, 40];
                      const filled =
                        corners.includes(i) ||
                        i === 24 ||
                        [16, 17, 18, 23, 25, 30, 31, 32].includes(i);
                      return (
                        <div
                          key={i}
                          className={`h-4 w-4 rounded-sm ${filled ? 'bg-white' : 'bg-white/10'}`}
                        />
                      );
                    })}
                  </div>
                </div>
                <p className="font-headline text-sm font-semibold text-white/80">
                  Scan to download
                </p>
                <p className="text-xs text-white/50">Android APK · Build v1 · July 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
