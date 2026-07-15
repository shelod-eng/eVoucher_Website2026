'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { DATABASE_TABLES } from '../data/infrastructureData';

function displayAssetName(name: string) {
  return name
    .replace(/^auth\./, '')
    .replace(/^public\./, '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function displaySecurityLabel(label: string) {
  const map: Record<string, string> = {
    'System Protected': 'Enterprise Grade',
    'RLS Configured': 'Protected',
    'Admin Write Only': 'Controlled',
    'Public Read': 'Available',
    'RLS Secured': 'Secure',
    'Read Only Ledger': 'Verified Ledger',
    'FICA Compliant': 'Compliant',
    'Encrypted Vault': 'Encrypted',
    'WORM Ledger': 'Audit Grade',
  };

  return map[label] ?? label;
}

export default function DatabaseTab() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DATABASE_TABLES;
    return DATABASE_TABLES.filter(
      (t) =>
        t.category.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        displayAssetName(t.name).toLowerCase().includes(q) ||
        t.purpose.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-headline text-xl font-semibold text-[#20324A]">Database Assets</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Business-readable view of the core data assets that support eVoucher.
            </p>
          </div>
          <p className="text-sm text-[#64748B]">
            Showing <span className="font-semibold text-[#108995]">{filtered.length}</span> of{' '}
            {DATABASE_TABLES.length} assets
          </p>
        </div>

        <div className="relative mt-5 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search data assets..."
            className="w-full rounded-lg border border-[#E6EEF5] bg-white py-2.5 pl-10 pr-4 text-sm text-[#22324B] outline-none placeholder:text-[#94A3B8] focus:border-[#20B8C5] focus:ring-2 focus:ring-[#20B8C5]/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#E6EEF5] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#E6EEF5] bg-[#F7F9FC]">
              <th className="px-4 py-3 font-semibold text-[#20324A]">Name</th>
              <th className="px-4 py-3 font-semibold text-[#20324A]">Category</th>
              <th className="px-4 py-3 font-semibold text-[#20324A]">Business Purpose</th>
              <th className="px-4 py-3 font-semibold text-[#20324A]">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.name}
                className="border-b border-[#EDF2F7] transition-colors hover:bg-[#F7F9FC]"
              >
                <td className="px-4 py-3 font-semibold text-[#20324A]">
                  {displayAssetName(row.name)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[#EAFBFD] px-2.5 py-1 text-xs font-semibold text-[#108995]">
                    {row.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#64748B]">{row.purpose}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.securityTone === 'success'
                        ? 'bg-[#DCFCE7] text-[#166534]'
                        : 'bg-[#F1F5F9] text-[#20324A]'
                    }`}
                  >
                    {displaySecurityLabel(row.security)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
