'use client';

import { useEffect } from 'react';

export default function PwaRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_PWA_DEV !== 'true') {
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('[pwa][service-worker]', error);
      });
    });
  }, []);

  return null;
}
