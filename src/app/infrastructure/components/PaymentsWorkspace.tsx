'use client';

import { useState } from 'react';
import {
  CreditCard,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
} from 'lucide-react';

const TRANSACTIONS = [
  { id: 'TXN-84201', consumer: 'Thabo Nkosi', method: 'PayFast', amount: 'R250.00', type: 'Purchase', status: 'Success', time: '10:54 SAST' },
  { id: 'TXN-84202', consumer: 'Lerato Mokoena', method: 'Ozow EFT', amount: 'R500.00', type: 'Wallet Load', status: 'Success', time: '10:51 SAST' },
  { id: 'TXN-84203', consumer: 'Sipho Mthembu', method: 'USSD', amount: 'R50.00', type: 'Purchase', status: 'Failed', time: '10:48 SAST' },
  { id: 'TXN-84204', consumer: 'Nomsa Dlamini', method: 'Cash (Shoprite)', amount: 'R100.00', type: 'Wallet Load', status: 'Success', time: '10:42 SAST' },
  { id: 'TXN-84205', consumer: 'Bongani Zulu', method: 'PayFast', amount: 'R350.00', type: 'Purchase', status: 'Pending', time: '10:38 SAST' },
];

const SETTLEMENT_BATCHES = [
  { id: 'BATCH-2026-07-14-A', merchants: 14, total: 'R42,400', bankserv: 'ACK', status: 'Approved', processed: '09:00 SAST' },
  { id: 'BATCH-2026-07-14-B', merchants: 8, total: 'R18,200', bankserv: 'Pending', status: 'Pending approval', processed: '—' },
  { id: 'BATCH-2026-07-13-A', merchants: 12, total: 'R38,600', bankserv: 'ACK', status: 'Settled', processed: '09:00 SAST' },
];

const PAYMENT_PROVIDERS = [
  { name: 'PayFast', type: 'Card / EFT', status: 'Operational', txToday: '1,204', successRate: '99.8%' },
  { name: 'Ozow', type: 'Instant EFT', status: 'Operational', txToday: '842', successRate: '99.6%' },
  { name: 'Bankserv ACB', type: 'Settlement', status: 'Operational', txToday: '14 batches', successRate: 'T+1' },
  { name: 'USSD *120*384#', type: 'USSD Payment', status: 'Operational', txToday: '4,812', successRate: '99.4%' },
  { name: 'Cash (Shoprite/Boxer)', type: 'Retail Cash', status: 'Operational', txToday: '312', successRate: '100%' },
];

const REFUND_QUEUE = [
  { id: 'REF-041', consumer: 'Sipho Mthembu', amount: 'R50.00', reason: 'Failed transaction', status: 'Pending', raised: '1h ago' },
  { id: 'REF-042', consumer: 'Zanele Khumalo', amount: 'R100.00', reason: 'Duplicate charge', status: 'Under review', raised: '3h ago' },
];

type Panel = 'transactions' | 'settlement' | 'providers' | 'refunds';

function txStatusBadge(status: string) {
  if (status === 'Success') return 'bg-[#DCFCE7] text-[#166534]';
  if (status === 'Failed') return 'bg-[#FEE2E2] text-[#B91C1C]';
  return 'bg-[#FEF3C7] text-[#92400E]';
}

export default function PaymentsWorkspace() {
  const [panel, setPanel] = useState<Panel>('transactions');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#20B8C5]">Treasury</p>
            <h2 className="mt-1 font-headline text-2xl font-bold text-[#20324A]">Payments & Settlement</h2>
            <p className="mt-1 text-sm text-[#64748B]">Transaction monitoring, settlement batches, payment providers, and refund management.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'transactions', label: 'Transactions', icon: CreditCard },
              { id: 'settlement', label: 'Settlement', icon: ArrowUpRight },
              { id: 'providers', label: 'Providers', icon: TrendingUp },
              { id: 'refunds', label: `Refunds (${REFUND_QUEUE.length})`, icon: ArrowDownLeft },
            ] as { id: Panel; label: string; icon: typeof CreditCard }[]).map(({ id, label, icon: Icon }) => (
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

      {panel === 'transactions' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-4">
            <p className="font-semibold text-[#20324A]">Live Transaction Feed</p>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EAFBFD] px-3 py-1 text-xs font-bold text-[#108995]">
              <RefreshCw className="h-3 w-3" /> Auto-refresh
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Transaction ID</th>
                  <th className="px-4 py-3 text-left">Consumer</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map((tx) => (
                  <tr key={tx.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{tx.id}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{tx.consumer}</td>
                    <td className="px-4 py-3 text-[#64748B]">{tx.method}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{tx.amount}</td>
                    <td className="px-4 py-3 text-[#64748B]">{tx.type}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${txStatusBadge(tx.status)}`}>{tx.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{tx.time}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#108995] hover:bg-[#EAFBFD]">View</button>
                        {tx.status === 'Failed' && (
                          <button type="button" className="rounded px-2 py-1 text-xs font-semibold text-[#92400E] hover:bg-[#FEF3C7]">Refund</button>
                        )}
                        <button type="button" className="rounded px-2 py-1 text-[#94A3B8] hover:bg-[#F7F9FC]">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'settlement' && (
        <div className="rounded-lg border border-[#E6EEF5] bg-white">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] p-5">
            <div>
              <h3 className="font-headline text-lg font-semibold text-[#20324A]">Settlement Batches</h3>
              <p className="mt-1 text-sm text-[#64748B]">Bankserv ACB file generation and approval workflow.</p>
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[#20B8C5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#108995]">
              <CheckCircle2 className="h-4 w-4" /> Approve Batch
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 text-left">Batch ID</th>
                  <th className="px-4 py-3 text-left">Merchants</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Bankserv</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Processed</th>
                </tr>
              </thead>
              <tbody>
                {SETTLEMENT_BATCHES.map((batch) => (
                  <tr key={batch.id} className="border-b border-[#EDF2F7] hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3 font-mono text-xs text-[#108995]">{batch.id}</td>
                    <td className="px-4 py-3 text-[#64748B]">{batch.merchants}</td>
                    <td className="px-4 py-3 font-semibold text-[#20324A]">{batch.total}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${batch.bankserv === 'ACK' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                        {batch.bankserv}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${batch.status === 'Settled' ? 'bg-[#EAFBFD] text-[#108995]' : batch.status === 'Approved' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{batch.processed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === 'providers' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PAYMENT_PROVIDERS.map((provider) => (
            <div key={provider.name} className="rounded-lg border border-[#E6EEF5] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-headline text-base font-semibold text-[#20324A]">{provider.name}</p>
                  <p className="text-xs text-[#64748B]">{provider.type}</p>
                </div>
                <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-xs font-bold text-[#166534]">{provider.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#F7F9FC] px-3 py-2">
                  <p className="text-xs text-[#94A3B8]">Today</p>
                  <p className="font-semibold text-[#20324A]">{provider.txToday}</p>
                </div>
                <div className="rounded-lg bg-[#F7F9FC] px-3 py-2">
                  <p className="text-xs text-[#94A3B8]">Success rate</p>
                  <p className="font-semibold text-[#166534]">{provider.successRate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {panel === 'refunds' && (
        <div className="space-y-4">
          {REFUND_QUEUE.map((refund) => (
            <div key={refund.id} className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#92400E]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#64748B]">{refund.id}</span>
                      <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-bold text-[#92400E]">{refund.status}</span>
                    </div>
                    <p className="mt-1 font-semibold text-[#20324A]">{refund.consumer} — {refund.amount}</p>
                    <p className="text-sm text-[#64748B]">Reason: {refund.reason} · {refund.raised}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="rounded-lg border border-[#E6EEF5] bg-white px-3 py-1.5 text-xs font-semibold text-[#20324A] hover:bg-[#F7F9FC]">Review</button>
                  <button type="button" className="rounded-lg bg-[#20B8C5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#108995]">Process Refund</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
