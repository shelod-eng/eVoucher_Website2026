'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { DATABASE_TABLES } from '../data/infrastructureData';

export default function DatabaseTab() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DATABASE_TABLES;
    return DATABASE_TABLES.filter(
      (t) =>
        t.category.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.purpose.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[280px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search database tables..."
            className="w-full rounded-xl border border-indigo-500/15 bg-[#0b132b] py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
        </div>
        <p className="text-sm text-slate-400">
          Showing <span className="font-semibold text-cyan-400">{filtered.length}</span> of{' '}
          {DATABASE_TABLES.length} tables
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-indigo-500/15">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-indigo-500/15 bg-[#0b132b]">
              <th className="px-4 py-3 font-semibold text-slate-300">Category</th>
              <th className="px-4 py-3 font-semibold text-slate-300">Table Name</th>
              <th className="px-4 py-3 font-semibold text-slate-300">Purpose / Description</th>
              <th className="px-4 py-3 font-semibold text-slate-300">Security Level</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.name}
                className="border-b border-indigo-500/10 bg-[#060b13] transition-colors hover:bg-[#0b132b]"
              >
                <td className="px-4 py-3">
                  <code className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs text-cyan-400">
                    {row.category}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs text-slate-200">{row.name}</code>
                </td>
                <td className="px-4 py-3 text-slate-400">{row.purpose}</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-semibold ${
                      row.securityTone === 'success' ? 'text-emerald-400' : 'text-violet-400'
                    }`}
                  >
                    {row.security}
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
