import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload } from 'lucide-react';

export default function BulkUpload() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
          <Upload className="w-5 h-5 text-[#00A89D]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Bulk Upload</h1>
          <p className="text-sm text-white/70">Upload settlement confirmations / bank statements (Phase 2).</p>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Coming soon</div>
          <Badge className="bg-white/10 border-white/10 text-white">Placeholder</Badge>
        </div>
        <div className="text-sm text-white/70 mt-3">
          We’ll support CSV/XLS uploads to:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Match bank confirmations → settlement batches</li>
            <li>Auto-reconcile ledger vs bank file</li>
            <li>Flag variances for manual review</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

