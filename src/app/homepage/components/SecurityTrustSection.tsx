'use client';

import { useEffect, useRef, useState } from 'react';

const TRUST_CARDS = [
  {
    icon: '🔒',
    title: 'POPIA Compliant',
    desc: 'Your personal data is protected under South African law. Full consent management and data subject rights.',
    color: 'border-emerald-200 bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: '🏦',
    title: 'Bank-Grade Security',
    desc: 'AES-256 encryption, TLS 1.3, and multi-factor authentication protect every transaction.',
    color: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    icon: '💳',
    title: 'PCI Ready',
    desc: 'Payment card data is tokenised and handled within a PCI-scoped gateway boundary.',
    color: 'border-purple-200 bg-purple-50',
    badge: 'bg-purple-100 text-purple-700',
  },
  {
    icon: '🇿🇦',
    title: 'South African Platform',
    desc: 'Built in South Africa, for South Africans. Data sovereignty and local compliance first.',
    color: 'border-orange-200 bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
  },
  {
    icon: '📱',
    title: 'USSD Enabled',
    desc: 'Works on any phone — no data, no smartphone required. Inclusive by design.',
    color: 'border-teal-200 bg-teal-50',
    badge: 'bg-teal-100 text-teal-700',
  },
  {
    icon: '🛡️',
    title: '24/7 Fraud Monitoring',
    desc: 'Real-time fraud detection, device fingerprinting, and automated risk scoring on every transaction.',
    color: 'border-red-200 bg-red-50',
    badge: 'bg-red-100 text-red-700',
  },
];

export default function SecurityTrustSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-label="Security and Trust" className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <div className="mb-10 text-center">
          <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-primary">
            Your Safety First
          </p>
          <h2 className="font-headline text-3xl font-bold text-foreground">Security & Trust</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            eVoucher is built on enterprise-grade security infrastructure trusted by banks and
            government.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {TRUST_CARDS.map((card, i) => (
            <div
              key={card.title}
              className={`flex flex-col rounded-2xl border p-5 transition-all duration-500 ${card.color} ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="mb-3 text-3xl">{card.icon}</span>
              <span
                className={`mb-2 self-start rounded-full px-2 py-0.5 font-headline text-[10px] font-bold ${card.badge}`}
              >
                Verified
              </span>
              <p className="mb-1 font-headline text-sm font-bold text-foreground">{card.title}</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-border bg-white px-8 py-5 shadow-sm">
          {[
            'FNB Partner',
            'DTI Aligned',
            'PASA Compliant',
            'FICA / KYC',
            'AML Monitoring',
            'Bankserv ACB',
          ].map((badge) => (
            <div key={badge} className="flex items-center gap-2">
              <span className="text-success text-sm">✓</span>
              <span className="font-headline text-xs font-semibold text-foreground">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
