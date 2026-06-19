'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

type ImpactMetrics = {
  merchantsOnboarded: number;
  vouchersIssued: number;
  payoutsProcessed: number;
  payoutValueProcessed: number;
  consumersReached: number;
  nationalReachLabel: string;
};

const fallbackMetrics: ImpactMetrics = {
  merchantsOnboarded: 487,
  vouchersIssued: 34200,
  payoutsProcessed: 1280,
  payoutValueProcessed: 2400000,
  consumersReached: 12847,
  nationalReachLabel:
    'Designed for web, USSD, mobile onboarding, and sponsor-scale payout governance',
};

function formatInteger(value: number) {
  return Intl.NumberFormat('en-ZA').format(Number(value ?? 0));
}

function formatCurrency(value: number) {
  return `R ${Intl.NumberFormat('en-ZA', {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))}`;
}

export default function ImpactMetricsSection() {
  const [metrics, setMetrics] = useState<ImpactMetrics>(fallbackMetrics);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/impact/metrics', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled && payload) {
          setMetrics({ ...fallbackMetrics, ...payload });
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      label: 'Merchants onboarded',
      value: formatInteger(metrics.merchantsOnboarded),
      detail: 'Formal and township merchant network growth',
      icon: 'BuildingStorefrontIcon',
    },
    {
      label: 'Vouchers issued',
      value: formatInteger(metrics.vouchersIssued),
      detail: 'Traceable value instruments in circulation',
      icon: 'TicketIcon',
    },
    {
      label: 'Payouts processed',
      value: formatInteger(metrics.payoutsProcessed),
      detail: `${formatCurrency(metrics.payoutValueProcessed)} reconciled through sponsor controls`,
      icon: 'BanknotesIcon',
    },
    {
      label: 'Consumers reached',
      value: formatInteger(metrics.consumersReached),
      detail: 'Accessible via web, mobile, and USSD-ready journeys',
      icon: 'UserGroupIcon',
    },
  ];

  return (
    <section className="bg-[#07172e] py-16 text-white">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
              National impact telemetry
            </p>
            <h2 className="mt-4 font-headline text-3xl font-bold leading-tight lg:text-5xl">
              A sponsor-ready view of scale, reach, and settlement confidence.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">{metrics.nationalReachLabel}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <article
                key={card.label}
                className="rounded-lg border border-cyan-300/18 bg-[#102647] p-5 shadow-[0_24px_80px_rgba(2,8,23,0.32)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/22 bg-cyan-400/10 text-cyan-100">
                    <Icon name={card.icon as any} size={22} variant="solid" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                    {card.label}
                  </p>
                </div>
                <p className="mt-5 text-4xl font-semibold text-white">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{card.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
