import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { isPaymentSandboxEnabled } from '@/server/services/payment/payment-provider-factory';

export async function requireSandboxAccess() {
  if (!isPaymentSandboxEnabled()) {
    return {
      allowed: false as const,
      status: 404,
      body: { error: 'Sandbox payments are disabled.', code: 'sandbox_disabled' },
    };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return {
      allowed: false as const,
      status: 401,
      body: { error: 'You must be signed in to use sandbox payments.', code: 'unauthenticated' },
    };
  }

  const { role } = await resolveUserRole(supabase, user);
  const allowlist = String(process.env.PAYMENT_SANDBOX_ROLE_ALLOWLIST ?? 'admin,qa,finance')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!allowlist.includes(role.toLowerCase())) {
    return {
      allowed: false as const,
      status: 403,
      body: { error: 'Your role is not allowed to use the sandbox.', code: 'sandbox_forbidden' },
    };
  }

  return {
    allowed: true as const,
    user,
    role,
  };
}
