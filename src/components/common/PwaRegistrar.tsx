'use client';

import { useEffect, useState, useCallback } from 'react';

type SwState = 'idle' | 'registering' | 'ready' | 'update-available' | 'error';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * PWA Registrar — handles:
 * 1. Service worker registration with update detection
 * 2. Install prompt for browsers supporting A2HS
 * 3. Offline status detection
 */
export default function PwaRegistrar() {
  const [swState, setSwState] = useState<SwState>('idle');
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(true);

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

  /* ---- Install prompt: capture beforeinstallprompt event ---- */
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  /* ---- Service worker registration ---- */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSwState('error');
      return;
    }
    // Skip in dev unless explicitly enabled
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.NEXT_PUBLIC_ENABLE_PWA_DEV !== 'true'
    ) {
      setSwState('ready');
      return;
    }

    setSwState('registering');

    navigator.serviceWorker
      .register('/service-worker.js', { updateViaCache: 'none' }) // Force bypass cache
      .then((registration) => {
        setSwState('ready');

        // AGGRESSIVE: Check for updates immediately
        registration.update();

        // Check for updates on every page load
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // A new version is available - auto-reload for Edge
              setSwState('update-available');
              console.log('[PWA] Update detected, auto-reloading...');
              setTimeout(() => {
                navigator.serviceWorker.ready.then((reg) => {
                  reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
                });
              }, 1000);
            }
          });
        });

        // Check for updates every 5 minutes (aggressive for Edge)
        setInterval(
          () => {
            registration.update().catch(() => {
              // Silently ignore update check failures
            });
          },
          5 * 60 * 1000 // 5 minutes instead of 1 hour
        );
      })
      .catch((error) => {
        console.warn('[PWA] Service worker registration failed:', error);
        setSwState('error');
      });
  }, []);

  /* ---- Apply update: tell SW to skip waiting, then reload ---- */
  const applyUpdate = useCallback(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
    navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    });
  }, []);

  /* ---- Install app (A2HS) ---- */
  const installApp = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === 'accepted') {
      setInstallEvent(null);
    }
  }, [installEvent]);

  /* ---- Show install banner if available ---- */
  const showInstallBanner = installEvent !== null && swState === 'ready';

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

      {/* Install prompt banner */}
      {showInstallBanner && (
        <div
          role="alert"
          className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md rounded-lg bg-blue-600 px-4 py-3 text-center text-sm text-white shadow-lg"
        >
          <span>Install eVoucher for the best experience.</span>
          <button
            onClick={installApp}
            className="ml-3 inline-block rounded bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            type="button"
          >
            Install
          </button>
          <button
            onClick={() => setInstallEvent(null)}
            className="ml-2 inline-block px-2 py-1 text-xs text-white/70 hover:text-white"
            type="button"
          >
            Not now
          </button>
        </div>
      )}
    </>
  );
}
