import { redirect } from 'next/navigation';

import CommandCentreDashboard from './CommandCentreDashboard';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { requirePortalRole } from '@/server/utils/portal-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Command Centre | eVoucher Platform',
  description: 'Read-only 4D operational Command Centre for the eVoucher Platform.',
};

export default async function CommandCentrePage() {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    redirect('/portal/login');
  }

  const { allowed, role } = await requirePortalRole(user, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) {
    redirect('/shop');
  }

  return <CommandCentreDashboard userEmail={user.email ?? 'authorized user'} role={role} />;
}
