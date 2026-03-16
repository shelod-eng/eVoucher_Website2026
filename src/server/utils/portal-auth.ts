import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

const PORTAL_ROLES = new Set(['admin', 'finance_approver', 'auditor']);

type PortalRole = 'admin' | 'finance_approver' | 'auditor';

function normalizeRole(role: unknown): string {
  return String(role ?? '').trim().toLowerCase();
}

async function resolvePortalRole(admin: ReturnType<typeof createAdminClient>, user: User) {
  const { data, error } = await admin
    .from('portal_user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!error && data?.role) {
    const role = normalizeRole(data.role);
    if (PORTAL_ROLES.has(role)) {
      return role as PortalRole;
    }
  }

  const { data: profile } = await admin
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const fallbackRole = normalizeRole(profile?.role);
  if (fallbackRole === 'admin') {
    return 'admin' as PortalRole;
  }

  return null;
}

export async function requirePortalRole(user: User, allowedRoles: PortalRole[]) {
  const admin = createAdminClient();
  const role = await resolvePortalRole(admin, user);
  if (!role || !allowedRoles.includes(role)) {
    return { role: null, allowed: false };
  }
  return { role, allowed: true };
}

export function isPortalRoleAllowed(role: string | null, allowedRoles: PortalRole[]) {
  if (!role) return false;
  return allowedRoles.includes(role as PortalRole);
}
