'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const LINKS = {
  platform: [
    { label: 'Shop', href: '/shop' },
    { label: 'Merchants', href: '/merchants' },
    { label: 'My Wallet', href: '/wallet' },
    { label: 'Redeem', href: '/redeem' },
    { label: 'Buy Vouchers', href: '/buy-vouchers' },
  ],
  company: [
    { label: 'About eVoucher', href: '/homepage' },
    { label: 'Merchant Partnership', href: '/merchant-partnership' },
    { label: 'Government Alignment', href: '/government-alignment' },
    { label: 'Financial Model', href: '/financial-model' },
    { label: 'Careers', href: '#' },
  ],
  support: [
    { label: 'Help Centre', href: '/support' },
    { label: 'Contact Us', href: '/support' },
    { label: 'USSD *120*384#', href: 'tel:*120*384#' },
    { label: 'Downloads', href: '/downloads/eVoucher_APK_14-July-2026_BuildVersion1.apk' },
    { label: 'Consumer App', href: '/consumer-experience' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/security-compliance' },
    { label: 'Terms of Use', href: '/security-compliance' },
    { label: 'POPIA Notice', href: '/security-compliance' },
    { label: 'Cookie Policy', href: '/security-compliance' },
  ],
};

export default function Footer() {
  const [year, setYear] = useState('2026');
  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="border-t border-border bg-[#0f172a] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                  <path d="M20 6L32 13V27L20 34L8 27V13L20 6Z" fill="white" opacity="0.9" />
                  <path d="M20 13L26 17V23L20 27L14 23V17L20 13Z" fill="#FF7A00" />
                  <circle cx="20" cy="20" r="3" fill="white" />
                </svg>
              </div>
              <div>
                <p className="font-headline text-lg font-bold leading-tight text-white">eVoucher</p>
                <p className="text-xs text-white/50">Dignified Impact</p>
              </div>
            </Link>
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-white/60">
              South Africa's smart savings platform. Real products, real merchants, real savings —
              powered by digital vouchers.
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
              <span className="text-lg">☎️</span>
              <div>
                <p className="text-[10px] text-white/50">USSD Access</p>
                <p className="font-accent text-base font-bold text-white">*120*384#</p>
              </div>
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="mb-4 font-headline text-xs font-bold uppercase tracking-widest text-white/40">
              Platform
            </p>
            <ul className="space-y-2.5">
              {LINKS.platform.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="mb-4 font-headline text-xs font-bold uppercase tracking-widest text-white/40">
              Company
            </p>
            <ul className="space-y-2.5">
              {LINKS.company.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="mb-4 font-headline text-xs font-bold uppercase tracking-widest text-white/40">
              Support
            </p>
            <ul className="space-y-2.5">
              {LINKS.support.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-4 font-headline text-xs font-bold uppercase tracking-widest text-white/40">
              Legal
            </p>
            <ul className="space-y-2.5">
              {LINKS.legal.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/40">
            © {year} eVoucher Platform (Pty) Ltd. All rights reserved. South Africa.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {['POPIA Compliant', 'Bank-Grade Security', 'PCI Ready', 'SA Platform'].map((b) => (
              <div key={b} className="flex items-center gap-1.5">
                <span className="text-emerald-400 text-xs">✓</span>
                <span className="text-xs text-white/40">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
