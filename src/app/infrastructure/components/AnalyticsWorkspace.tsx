'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, MapPin, Users, Download, Filter } from 'lucide-react';

const REVENUE_METRICS = [
  { label: 'Total Revenue (Jul)', value: 'R2.4m', trend: '+7.2% vs Jun', tone: 'success' },
  { label: 'Voucher Sales (Jul)', value: '32,420', trend: '+12% vs Jun', tone: 'success' },
  { label: 'Redemption Rate', value: '86.1%', trend: '+2.3pp vs Jun', tone: 'success' },
  { label: 'Avg Transaction Value', value: 'R74.10', trend: '+4.8% vs Jun', tone: 'success' },
  { label: 'Active Consumers', value: '12,847', trend: '+312 this week', tone: 'success' },
  { label: 'Active Merchants', value: '487', trend: '+18 this month', tone: 'success' },
  { label: 'Failed Transactions', value: '11', trend: '-18% vs Jun', tone: 'success' },
  { label: 'Settlement Processed', value: 'R684k', trend: '14 batches today', tone: 'warn' },
];

const PROVINCE_DATA = [
  {
    province: 'Gauteng',
    consumers: '4,812',
    vouchers: '12,400',
    revenue: 'R918k',
    merchants: 142,
    share: '38%',
  },
  {
    province: 'Western Cape',
    consumers: '2,104',
    vouchers: '5,200',
    revenue: 'R385k',
    merchants: 84,
    share: '16%',
  },
  {
    province: 'KwaZulu-Natal',
    consumers: '1,842',
    vouchers: '4,800',
    revenue: 'R355k',
    merchants: 72,
    share: '15%',
  },
  {
    province: 'Eastern Cape',
    consumers: '1,204',
    vouchers: '3,100',
    revenue: 'R230k',
    merchants: 48,
    share: '10%',
  },
  {
    province: 'Limpopo',
    consumers: '984',
    vouchers: '2,400',
    revenue: 'R178k',
    merchants: 38,
    share: '7%',
  },
  {
    province: 'Mpumalanga',
    consumers: '842',
    vouchers: '2,100',
    revenue: 'R155k',
    merchants: 32,
    share: '6%',
  },
  {
    province: 'North West',
    consumers: '624',
    vouchers: '1,600',
    revenue: 'R118k',
    merchants: 28,
    share: '5%',
  },
  {
    province: 'Free State',
    consumers: '312',
    vouchers: '800',
    revenue: 'R59k',
    merchants: 22,
    share: '2%',
  },
  {
    province: 'Northern Cape',
    consumers: '123',
    vouchers: '320',
    revenue: 'R24k',
    merchants: 21,
    share: '1%',
  },
];

const MERCHANT_PERFORMANCE = [
  {
    merchant: 'Shoprite Soweto',
    category: 'Grocery',
    redemptions: '4,812',
    revenue: 'R356k',
    avgBasket: 'R74',
    rating: '4.8',
  },
  {
    merchant: 'Pick n Pay Sandton',
    category: 'Grocery',
    redemptions: '3,204',
    revenue: 'R237k',
    avgBasket: 'R74',
    rating: '4.7',
  },
  {
    merchant: 'Boxer Gauteng North',
    category: 'Grocery',
    redemptions: '2,841',
    revenue: 'R210k',
    avgBasket: 'R74',
    rating: '4.6',
  },
  {
    merchant: 'Checkers Durban CBD',
    category: 'Grocery',
    redemptions: '2,104',
    revenue: 'R156k',
    avgBasket: 'R74',
    rating: '4.5',
  },
  {
    merchant: 'Spar Limpopo',
    category: 'Grocery',
    redemptions: '1,842',
    revenue: 'R136k',
    avgBasket: 'R74',
    rating: '4.4',
  },
];

type Panel = 'overview' | 'provinces' | 'merchants' | 'exports';

function toneClass(tone: string) {
  return tone === 'warn' ? 'text-[#92400E]' : 'text-[#166534]';
}

export default function AnalyticsWorkspace() {
  const [panel, setPanel] = useState<Panel>('overview');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">
              Business Intelligence
            </p>
            <h2 className="mt-1 font-headline text-2xl font-bold text-[#20324A]">
              Analytics & Reporting
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Revenue, province heatmaps, merchant performance, and exportable reports.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'overview', label: 'KPI Overview', icon: BarChart3 },
                { id: 'provinces', label: 'Province Heatmap', icon: MapPin },
                { id: 'merchants', label: 'Merchant Performance', icon: Users },
                { id: 'exports', label: 'Export Reports', icon: Download },
              ] as { id: Panel; label: string; icon: typeof BarChart3 }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPanel(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  panel === id
                    ? 'bg-[#20B8C5] text-white'
                    : 'border border-[#E6EEF5] bg-white text-[#20324A] hover:bg-[#EAFBFD]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {panel === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {REVENUE_METRICS.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-[#E6EEF5] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                {metric.label}
              </p>
              <p className="mt-2 font-headline text-3xl font-bold text-[#20324A]">{metric.value}</p>
              <p className={`mt-1 text-xs font-semibold ${toneClass(metric.tone)}`}>
                {metric.trend}
              </p>
            </div>
          ))}
        </div>
      )}

      {panel === 'provinces' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-5">
            <div>
              <h3 className="font-headline text-lg font-semibold text-[#20324A]">
                Province Performance Heatmap
              </h3>
              <p className="mt-1 text-sm text-[#64748B]">
                Consumer activity, voucher volume, and revenue by province.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[#E6EEF5] px-3 py-2 text-sm font-semibold text-[#20324A] hover:bg-[#F7F9FC]"
            >
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Province</th>
                  <th className="px-4 py-3 text-left">Consumers</th>
                  <th className="px-4 py-3 text-left">Vouchers</th>
                  <th className="px-4 py-3 text-left">Revenue</th>
                  <th className="px-4 py-3 text-left">Merchants</th>
                  <th className="px-4 py-3 text-left">Share</th>
                </tr>
              </thead>
              <tbody>
                {PROVINCE_DATA.map((p) => (
                  <tr key={p.province} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-semibold text-[#20324A]">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#108995]" />
                        {p.province}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{p.consumers}</td>
                    <td className="px-4 py-3 text-[#64748B]">{p.vouchers}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{p.revenue}</td>
                    <td className="px-4 py-3 text-[#64748B]">{p.merchants}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-[#E6EEF5]">
                          <div
                            className="h-1.5 rounded-full bg-[#20B8C5]"
                            style={{ width: p.share }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[#64748B]">{p.share}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'merchants' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="border-b border-[#E6EEF5] p-5">
            <h3 className="font-headline text-lg font-semibold text-[#20324A]">
              Top Merchant Performance
            </h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Redemption volume, revenue contribution, and average basket size.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Merchant</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Redemptions</th>
                  <th className="px-4 py-3 text-left">Revenue</th>
                  <th className="px-4 py-3 text-left">Avg Basket</th>
                  <th className="px-4 py-3 text-left">Rating</th>
                </tr>
              </thead>
              <tbody>
                {MERCHANT_PERFORMANCE.map((m, i) => (
                  <tr key={m.merchant} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-semibold text-[#20324A]">
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#EAFBFD] text-xs font-bold text-[#108995]">
                        {i + 1}
                      </span>
                      {m.merchant}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-xs font-semibold text-[#108995]">
                        {m.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{m.redemptions}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{m.revenue}</td>
                    <td className="px-4 py-3 text-[#64748B]">{m.avgBasket}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#166534]">★ {m.rating}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'exports' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: 'Monthly Revenue Report',
              desc: 'Total revenue, transaction volume, and channel breakdown for the month.',
              action: 'Export PDF',
              icon: TrendingUp,
            },
            {
              title: 'Province Heatmap Export',
              desc: 'Consumer activity and revenue by province in spreadsheet format.',
              action: 'Export Excel',
              icon: MapPin,
            },
            {
              title: 'Merchant Performance Report',
              desc: 'Top merchants by redemption volume, revenue, and basket size.',
              action: 'Export CSV',
              icon: Users,
            },
            {
              title: 'Sponsor ROI Pack',
              desc: 'Campaign performance, beneficiary reach, and ROI per sponsor.',
              action: 'Export PDF',
              icon: BarChart3,
            },
            {
              title: 'Government Programme Report',
              desc: 'Budget utilisation, beneficiary counts, and redemption rates per programme.',
              action: 'Export PDF',
              icon: BarChart3,
            },
            {
              title: 'Executive Dashboard Pack',
              desc: 'Full KPI summary for board and executive reporting.',
              action: 'Export PDF',
              icon: Download,
            },
          ].map((report) => (
            <div key={report.title} className="rounded-lg border border-[#E6EEF5] bg-white p-5">
              <div className="flex items-start gap-3">
                <report.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#108995]" />
                <div className="flex-1">
                  <p className="font-semibold text-[#20324A]">{report.title}</p>
                  <p className="mt-1 text-sm text-[#64748B]">{report.desc}</p>
                  <button
                    type="button"
                    className="mt-3 rounded-lg bg-[#20B8C5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#108995]"
                  >
                    {report.action}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
