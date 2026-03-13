import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';

export default function Controls() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
          <Settings className="w-5 h-5 text-[#00A89D]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Controls</h1>
          <p className="text-sm text-white/70">Sponsor-bank controls + fee configuration (Phase 2).</p>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Configuration placeholders</div>
          <Badge className="bg-white/10 border-white/10 text-white">Demo</Badge>
        </div>
        <ul className="text-sm text-white/70 list-disc pl-5 mt-3 space-y-1">
          <li>Revenue split (merchant payout %, member benefit %, platform %)</li>
          <li>Sponsor bank fee % (processing cost)</li>
          <li>Invoice cycle (monthly/weekly) + due date rules</li>
          <li>Settlement batch thresholds + approval rules</li>
          <li>Fraud/velocity limits + manual hold controls</li>
        </ul>
      </Card>
    </div>
  );
}

