import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileDown } from 'lucide-react';

export default function BankServ() {
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
          <FileDown className="w-5 h-5 text-[#00A89D]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">BankServ</h1>
          <p className="text-sm text-white/70">Settlement file formatting + submission workflow (Phase 2).</p>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 text-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">EFT Export Requirements</div>
          <Badge className="bg-white/10 border-white/10 text-white">Placeholder</Badge>
        </div>

        <ul className="text-sm text-white/70 list-disc pl-5 space-y-1">
          <li>Transaction code (EFT credit)</li>
          <li>Source bank (FNB sponsor account)</li>
          <li>Destination merchant bank details</li>
          <li>Reference: invoice / batch reference</li>
          <li>Action date: settlement date</li>
        </ul>

        <div className="text-xs text-white/60">
          Next: implement “Export EFT/CSV” from settlement batches and require Finance Approver approval.
        </div>
      </Card>
    </div>
  );
}

