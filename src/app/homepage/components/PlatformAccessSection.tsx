'use client';

import { useEffect, useState } from 'react';

const CHANNELS = [
  {
    emoji: '🌐',
    gradient: 'from-[#0d9488] to-[#0891b2]',
    title: 'Web Platform',
    subtitle: 'Full shopping experience in any browser. No download needed.',
    status: 'Live',
    statusColor: 'bg-success/15 text-success',
    action: { label: 'Shop Now', href: '/shop' },
  },
  {
    emoji: '📲',
    gradient: 'from-[#7c3aed] to-[#0d9488]',
    title: 'Install App',
    subtitle: 'Add eVoucher to your home screen for instant one-tap access.',
    status: 'Available',
    statusColor: 'bg-primary/10 text-primary',
    action: null,
  },
  {
    emoji: '🤖',
    gradient: 'from-[#059669] to-[#0d9488]',
    title: 'Android App',
    subtitle: 'Offline access, voucher scanning, push notifications.',
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
    gradient: 'from-[#d97706] to-[#dc2626]',
    title: 'USSD *120*384#',
    subtitle: 'Works on any phone. No data or smartphone required.',
    status: 'Available',
    statusColor: 'bg-primary/10 text-primary',
    action: { label: 'Dial Now', href: 'tel:*120*384#' },
  },
  {
    emoji: '🍎',
    gradient: 'from-[#6b7280] to-[#374151]',
    title: 'iOS App',
    subtitle: 'iPhone app launching soon. Register to be notified.',
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
    if (window.matchMedia('(display-mode: standalone)').matches) setPwaInstalled(true);
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
      <div className="mb-8 text-center">
        <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
          Multi-Channel Platform
        </p>
        <h2 className="font-headline text-2xl font-bold text-foreground">
          Access eVoucher Anywhere
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Shop, save, and redeem on the channel that suits you — web, app, or basic phone.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CHANNELS.map((channel) => {
          const isPwa = channel.title === 'Install App';
          return (
            <div
              key={channel.title}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${channel.gradient} text-2xl shadow-sm`}
              >
                {channel.emoji}
              </div>
              <span
                className={`mb-3 inline-block self-start rounded-full px-2 py-0.5 font-headline text-[10px] font-semibold ${channel.statusColor}`}
              >
                {channel.status}
              </span>
              <div className="flex-1">
                <p className="mb-1 font-headline text-sm font-bold text-foreground">
                  {channel.title}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">{channel.subtitle}</p>
              </div>
              <div className="mt-4 border-t border-border pt-3">
                {isPwa ? (
                  pwaInstalled ? (
                    <span className="font-headline text-xs font-semibold text-success">
                      ✓ Installed
                    </span>
                  ) : deferredPrompt ? (
                    <button
                      onClick={handlePwaInstall}
                      className="font-headline text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      Install App →
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Open in browser to install
                    </span>
                  )
                ) : channel.action ? (
                  <a
                    href={channel.action.href}
                    className="font-headline text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                    {...('download' in channel.action && channel.action.download
                      ? { download: true }
                      : {})}
                  >
                    {channel.action.label} →
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
