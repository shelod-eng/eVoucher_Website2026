import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/auth/admin-auth';
import { Users } from 'lucide-react';

export default function UserRoles() {
  const { session, role, isFinanceApprover } = useAdminAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
          <Users className="w-5 h-5 text-[#00A89D]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">User Roles</h1>
          <p className="text-sm text-white/70">Admin vs Finance Approver (2-person control).</p>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/70">Current user</div>
            <div className="text-lg font-semibold">{session?.email || '—'}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/70">Role</div>
            <Badge className="bg-[#00A89D]/15 text-emerald-200 border border-[#00A89D]/30">
              {role}
            </Badge>
          </div>
        </div>

        <div className="mt-4 text-sm text-white/70 space-y-2">
          <div>
            <span className="text-white">Admin</span>: can generate invoices, create batches, export files, and manage configuration.
          </div>
          <div>
            <span className="text-white">Finance Approver</span>: must approve settlement batches before “submit to bank”.
          </div>
          <div>
            Current finance approver status:{' '}
            <span className={isFinanceApprover ? 'text-emerald-200' : 'text-yellow-200'}>
              {isFinanceApprover ? 'enabled' : 'not enabled'}
            </span>
          </div>
          <div className="text-xs text-white/60">
            Configure finance approvers via <code className="font-mono">VITE_FINANCE_APPROVER_EMAILS</code> in{' '}
            <code className="font-mono">billing-engine-portal/.env.local</code>.
          </div>
        </div>
      </Card>
    </div>
  );
}

