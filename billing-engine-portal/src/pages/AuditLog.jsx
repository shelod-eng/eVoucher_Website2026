import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listAuditEvents } from '@/audit/audit-log';
import { FileText } from 'lucide-react';

export default function AuditLog() {
  const events = useMemo(() => listAuditEvents(), []);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
          <FileText className="w-5 h-5 text-[#00A89D]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-white/70">Who did what, and when (demo: stored locally).</p>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 text-white p-4">
        {events.length === 0 ? (
          <div className="text-sm text-white/70">No events yet.</div>
        ) : (
          <div className="space-y-2">
            {events.map((evt) => (
              <div key={evt.id} className="flex items-start justify-between gap-4 border-b border-white/10 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/10 border-white/10 text-white">{evt.action}</Badge>
                    <span className="text-xs text-white/60">{evt.createdAt}</span>
                  </div>
                  <pre className="text-xs text-white/70 mt-2 whitespace-pre-wrap">
                    {JSON.stringify(evt.details || {}, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

