'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import MerchantDetailsModal from './MerchantDetailsModal';

interface DetailsContextType {
  open: (merchantId: string) => void;
}

const DetailsContext = createContext<DetailsContextType | null>(null);

export function MerchantDetailsProvider({ children }: { children: ReactNode }) {
  const [merchantId, setMerchantId] = useState<string | null>(null);

  return (
    <DetailsContext.Provider value={{ open: setMerchantId }}>
      {children}
      <MerchantDetailsModal merchantId={merchantId} onClose={() => setMerchantId(null)} />
    </DetailsContext.Provider>
  );
}

export function ViewDetailsButton({ merchantId }: { merchantId: string }) {
  const ctx = useContext(DetailsContext);
  if (!ctx) return null;

  return (
    <button
      onClick={() => ctx.open(merchantId)}
      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
    >
      View Details
    </button>
  );
}
