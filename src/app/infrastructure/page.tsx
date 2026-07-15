import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import InfrastructureDashboard from './InfrastructureDashboard';

const ALLOWED_ROLES = ['admin', 'finance_approver', 'auditor', 'sponsor', 'merchant'];

export const metadata = {
  title: 'Infrastructure Dashboard | eVoucher Platform',
  description: 'eVoucher Platform Infrastructure and Operations Dashboard',
};

export default async function InfrastructurePage() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect('/portal/login?next=/infrastructure');
  }

  const { role } = await resolveUserRole(supabase, user);

  if (!ALLOWED_ROLES.includes(role)) {
    redirect('/shop');
  }

  return <InfrastructureDashboard role={role} userEmail={user.email ?? ''} />;
}
