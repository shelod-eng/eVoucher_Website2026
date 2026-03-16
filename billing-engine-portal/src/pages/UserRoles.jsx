import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/auth/admin-auth';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { provisionPortalUser } from '@/api/portal-api';

export default function UserRoles() {
  const { session, role, isFinanceApprover } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [portalRole, setPortalRole] = useState('admin');
  const [password, setPassword] = useState('');
  const [generatePassword, setGeneratePassword] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dataMode = (import.meta.env.VITE_BILLING_DATA_MODE || 'mock').toLowerCase();
  const usePortalApi = dataMode === 'portal';

  async function handleProvisionUser(event) {
    event.preventDefault();
    setError('');
    setStatusMessage('');
    setTempPassword('');

    if (!email.trim()) {
      setError('Please enter an email address.');
      return;
    }
    if (role !== 'admin') {
      setError('Only admins can provision portal users.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: email.trim(),
        role: portalRole,
        password: password.trim() || undefined,
        generatePassword: password.trim() ? false : generatePassword,
      };
      const response = await provisionPortalUser(payload, session, role);
      setStatusMessage(response?.message || 'Portal user provisioned.');
      setTempPassword(response?.temporaryPassword || '');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to provision user.');
    } finally {
      setSubmitting(false);
    }
  }

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

      <Card className="bg-white/5 border-white/10 text-white p-4 space-y-4">
        <div>
          <div className="text-lg font-semibold">Portal Users</div>
          <p className="text-sm text-white/70">
            Create or reset portal users (admin-only). This calls the Phase 2 backend endpoint and writes to
            <code className="ml-1 font-mono">portal_user_roles</code>.
          </p>
          {!usePortalApi ? (
            <p className="text-xs text-yellow-200 mt-2">
              Set <code className="font-mono">VITE_BILLING_DATA_MODE=portal</code> to use the live endpoint.
            </p>
          ) : null}
        </div>

        <form onSubmit={handleProvisionUser} className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-1">
            <label className="text-xs text-white/70">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
              className="mt-1"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-white/70">Role</label>
            <Select value={portalRole} onValueChange={setPortalRole}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="finance_approver">Finance Approver</SelectItem>
                <SelectItem value="auditor">Auditor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-white/70">Temporary Password (optional)</label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to auto-generate"
              className="mt-1"
              type="password"
            />
          </div>
          <div className="md:col-span-1 flex items-end gap-2">
            <label className="flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={generatePassword}
                onChange={(e) => setGeneratePassword(e.target.checked)}
              />
              Auto-generate if blank
            </label>
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Provisioning…' : 'Create / Reset Portal User'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEmail('');
                setPassword('');
                setStatusMessage('');
                setTempPassword('');
                setError('');
              }}
            >
              Clear
            </Button>
          </div>
        </form>

        {error ? (
          <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-md p-2">
            {error}
          </div>
        ) : null}
        {statusMessage ? (
          <div className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 rounded-md p-2 space-y-2">
            <div>{statusMessage}</div>
            {tempPassword ? (
              <div className="text-xs text-emerald-100">
                Temporary password: <span className="font-mono">{tempPassword}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
