'use client';

import { useEffect, useState, useCallback } from 'react';

type SwState = 'idle' | 'registering' | 'ready' | 'update-available' | 'error';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWA_PROMPT_KEY = 'evoucher.pwa.prompt.shown.v1';

function isPwaInstalled() {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function hasShownPrompt() {
  try {
    return Boolean(window.localStorage.getItem(PWA_PROMPT_KEY));
  } catch {
    return true;
  }
}

function markPromptShown() {
  try {
    window.localStorage.setItem(PWA_PROMPT_KEY, '1');
  } catch {
    // ignore
  }
}

export default function PwaRegistrar() {
  const [swState, setSwState] = useState<SwState>('idle');
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);

  /* ---- Online/offline tracking ---- */
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  /* ---- Capture beforeinstallprompt ---- */
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  /* ---- First-login PWA modal: show once after auth, if not already installed ---- */
  useEffect(() => {
    if (isPwaInstalled() || hasShownPrompt()) return;
    // Delay slightly so the page settles after login redirect
    const timer = window.setTimeout(() => {
      setShowFirstLoginModal(true);
      markPromptShown();
    }, 2200);
    return () => window.clearTimeout(timer);
  }, []);

  /* ---- Service worker registration ---- */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSwState('error');
      return;
    }
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.NEXT_PUBLIC_ENABLE_PWA_DEV !== 'true'
    ) {
      setSwState('ready');
      return;
    }

    setSwState('registering');

    navigator.serviceWorker
      .register('/service-worker.js', { updateViaCache: 'none' })
      .then((registration) => {
        setSwState('ready');
        registration.update();

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setSwState('update-available');
              setTimeout(() => {
                navigator.serviceWorker.ready.then((reg) => {
                  reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
                });
              }, 1000);
            }
          });
        });

        setInterval(
          () => {
            registration.update().catch(() => {});
          },
          5 * 60 * 1000
        );
      })
      .catch((error) => {
        console.warn('[PWA] Service worker registration failed:', error);
        setSwState('error');
      });
  }, []);

  const applyUpdate = useCallback(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
    navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    });
  }, []);

  const installApp = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === 'accepted') {
      setInstallEvent(null);
    }
    setShowFirstLoginModal(false);
  }, [installEvent]);

  const dismissModal = () => setShowFirstLoginModal(false);

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div
          role="alert"
          className="fixed bottom-0 left-0 right-0 z-[9999] bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white"
        >
          You are offline. Some features may be unavailable.
        </div>
      )}

      {/* Update available banner */}
      {swState === 'update-available' && (
        <div
          role="alert"
          className="fixed bottom-16 left-4 right-4 z-[9999] mx-auto max-w-md rounded-lg bg-teal-600 px-4 py-3 text-center text-sm text-white shadow-lg"
        >
          <span>A new version is available.</span>
          <button
            onClick={applyUpdate}
            className="ml-3 inline-block rounded bg-white px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50"
            type="button"
          >
            Update
          </button>
        </div>
      )}

      {/* ── First-login PWA install modal ── */}
      {showFirstLoginModal && (
        <div className="fixed inset-0 z-[9998] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#0891b2] px-6 py-8 text-center text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                  <rect width="40" height="40" rx="8" fill="#20B2AA" />
                  <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="white" opacity="0.9" />
                  <path d="M20 15L24 18V22L20 25L16 22V18L20 15Z" fill="#FF7A00" />
                  <circle cx="20" cy="20" r="3" fill="white" />
                </svg>
              </div>
              <h2 className="font-headline text-2xl font-bold">Install eVoucher</h2>
              <p className="mt-1 text-sm text-white/80">Get the full app experience</p>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <ul className="mb-5 space-y-3">
                {[
                  { icon: '⚡', text: 'Instant access from your home screen' },
                  { icon: '📴', text: 'Works offline — no data needed' },
                  { icon: '🔔', text: 'Push notifications for deals & vouchers' },
                  { icon: '🔒', text: 'Secure, fast & no app store required' },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <span className="text-xl leading-none">{item.icon}</span>
                    <p className="text-sm text-slate-600">{item.text}</p>
                  </li>
                ))}
              </ul>

              {installEvent ? (
                <button
                  onClick={() => void installApp()}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#0d9488] to-[#0891b2] py-3.5 font-headline text-sm font-bold text-white shadow-md hover:opacity-90"
                >
                  Install eVoucher App
                </button>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs font-semibold text-slate-600">
                    To install on this browser:
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tap the browser menu → <strong>Add to Home Screen</strong> or{' '}
                    <strong>Install App</strong>
                  </p>
                </div>
              )}

              <button
                onClick={dismissModal}
                className="mt-3 w-full rounded-2xl border border-slate-200 py-3 font-headline text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback install banner (when modal is dismissed but prompt still available) */}
      {!showFirstLoginModal && installEvent && swState === 'ready' && (
        <div
          role="alert"
          className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md rounded-2xl bg-gradient-to-r from-[#0d9488] to-[#0891b2] px-4 py-3 shadow-lg"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">
              Install eVoucher for the best experience
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => void installApp()}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50"
                type="button"
              >
                Install
              </button>
              <button
                onClick={() => setInstallEvent(null)}
                className="px-2 py-1 text-xs text-white/70 hover:text-white"
                type="button"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
