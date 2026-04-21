import type { User } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { getPortalUserFromHeaders, requirePortalRole } from '@/server/utils/portal-auth';

export type PortalRole = 'admin' | 'finance_approver' | 'auditor';

export async function requirePortalUser(request: Request, allowedRoles: PortalRole[]) {
  const { user: sessionUser } = await getAuthenticatedUser();
  const user = sessionUser ?? (await getPortalUserFromHeaders(request));
  const isAuthenticated = Boolean(user);
  if (!user) {
    return {
      user: null as User | null,
      role: null as PortalRole | null,
      allowed: false,
      isAuthenticated,
    };
  }

  const { allowed, role } = await requirePortalRole(user, allowedRoles);
  return {
    user,
    role: (role as PortalRole | null) ?? null,
    allowed,
    isAuthenticated,
  };
}
