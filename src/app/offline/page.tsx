'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function OfflinePage() {
  useEffect(() => {
    document.title = 'Offline - eVoucher';
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-black bg-amber-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <svg
            className="h-10 w-10 text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-black uppercase tracking-tight text-black">
          You're Offline
        </h1>

        <p className="mb-6 text-base text-gray-700">
          It looks like you've lost your internet connection. Don't worry &mdash; your saved pages
          are still available.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full rounded-xl border-4 border-black bg-teal-500 px-6 py-3 text-center text-sm font-bold uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Go to Home
          </Link>

          <button
            onClick={() => window.location.reload()}
            type="button"
            className="block w-full rounded-xl border-4 border-black bg-white px-6 py-3 text-center text-sm font-bold uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Try Again
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Once you reconnect, all features will resume automatically.
        </p>
      </div>
    </div>
  );
}
