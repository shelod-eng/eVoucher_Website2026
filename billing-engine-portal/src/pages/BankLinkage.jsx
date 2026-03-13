import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

const KYC_CHECKLIST = [
  'Company registration (CIPC)',
  'Bank confirmation letter',
  'Proof of address',
  'Director/owner ID',
  'Tax clearance (optional)',
];

export default function BankLinkage() {
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
          <Building2 className="w-5 h-5 text-[#00A89D]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Bank Linkage</h1>
          <p className="text-sm text-white/70">Merchant bank account verification + KYC placeholders.</p>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">FNB Sponsor Account → Merchant Accounts</div>
          <Badge className="bg-white/10 border-white/10 text-white">Demo</Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Super Precast</div>
              <Badge className="bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">verified</Badge>
            </div>
            <div className="text-sm text-white/70 mt-2">
              Bank: FNB • Branch: 250655 • Account: ****1234
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Pick n Pay</div>
              <Badge className="bg-yellow-500/15 text-yellow-200 border border-yellow-500/30">pending</Badge>
            </div>
            <div className="text-sm text-white/70 mt-2">
              Awaiting KYC docs + verification.
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold mb-2">KYC / Compliance checklist (placeholder)</div>
          <ul className="text-sm text-white/70 list-disc pl-5 space-y-1">
            {KYC_CHECKLIST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}

