'use client';

import { useEffect, useState } from 'react';

const CHANNELS = [
  {
    emoji: '🌐',
    title: 'Web Platform',
    subtitle: 'Shop instantly in your browser.',
    status: 'Live',
    statusColor: 'bg-success/15 text-success',
    action: { label: 'Open', href: '/' },
  },
  {
    emoji: '📲',
    title: 'Install eVoucher',
    subtitle: 'Install the web app on your phone for faster access.',
    status: 'Available',
    statusColor: 'bg-primary/10 text-primary',
    action: null, // handled by PWA install button
  },
  {
    emoji: '🤖',
    title: 'Android App',
    subtitle: 'Faster shopping, offline access, voucher scanning.',
    status: 'Available',
    statusColor: 'bg-primary/10 text-primary',
    action: {
      label: 'Download APK',
      href: '/downloads/eVoucher_APK_14-July-2026_BuildVersion1.apk',
      download: true,
    },
  },
  {
    emoji: '☎',
    title: 'USSD',
    subtitle: 'No smartphone needed.',
    status: 'Available',
    statusColor: 'bg-primary/10 text-primary',
    action: { label: 'Dial *120*384#', href: 'tel:*120*384#' },
  },
  {
    emoji: '🍎',
    title: 'iOS',
    subtitle: 'iPhone app coming soon.',
    status: 'Coming Soon',
    statusColor: 'bg-muted text-muted-foreground',
    action: { label: 'Notify Me', href: '#notify-ios' },
  },
] as const;

export default function PlatformAccessSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setPwaInstalled(true);
  };

  return (
    <section aria-label="Access eVoucher Anywhere">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-primary font-headline font-semibold mb-1">
          Multi-Channel Platform
        </p>
        <h2 className="font-headline font-bold text-2xl text-foreground">
          Access eVoucher Anywhere
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Use eVoucher on the channel that suits you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {CHANNELS.map((channel) => {
          const isPwa = channel.title === 'Install eVoucher';

          return (
            <div
              key={channel.title}
              className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3 hover:border-primary hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{channel.emoji}</span>
                <span
                  className={`text-xs font-headline font-semibold px-2 py-0.5 rounded-full ${channel.statusColor}`}
                >
                  {channel.status}
                </span>
              </div>

              <div className="flex-1">
                <p className="font-headline font-bold text-sm text-foreground mb-1">
                  {channel.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{channel.subtitle}</p>
              </div>

              {isPwa ? (
                pwaInstalled ? (
                  <span className="text-xs font-headline font-semibold text-success">
                    ✓ Installed
                  </span>
                ) : deferredPrompt ? (
                  <button
                    onClick={handlePwaInstall}
                    className="text-xs font-headline font-semibold text-primary hover:underline text-left"
                  >
                    Install →
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">Open in browser to install</span>
                )
              ) : channel.action ? (
                <a
                  href={channel.action.href}
                  className="text-xs font-headline font-semibold text-primary hover:underline"
                  {...('download' in channel.action && channel.action.download
                    ? { download: true }
                    : {})}
                >
                  {channel.action.label} →
                </a>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
