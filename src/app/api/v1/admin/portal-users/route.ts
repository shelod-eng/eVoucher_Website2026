import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { requirePortalRole } from '@/server/utils/portal-auth';
import { writeAuditEvent } from '@/server/utils/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_PORTAL_ROLES = new Set(['admin', 'finance_approver', 'auditor']);

function normalizeEmail(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function normalizeRole(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(
    { length: 14 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join('');
}

async function findAuthUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  const perPage = 200;
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find((user) => String(user.email ?? '').toLowerCase() === email);
    if (match) return match;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allowed, role } = await requirePortalRole(user, ['admin']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as {
      email?: string;
      role?: string;
      password?: string;
      generatePassword?: boolean;
    };

    const email = normalizeEmail(body.email);
    const portalRole = normalizeRole(body.role);
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }
    if (!ALLOWED_PORTAL_ROLES.has(portalRole)) {
      return NextResponse.json(
        { error: 'role must be admin, finance_approver, or auditor.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const password =
      String(body.password ?? '').trim() ||
      (body.generatePassword === false ? '' : generateTemporaryPassword());

    let authUser = await findAuthUserByEmail(admin, email);
    if (!authUser) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: password || generateTemporaryPassword(),
        email_confirm: true,
        user_metadata: { portal_role: portalRole },
      });
      if (error) throw error;
      authUser = data?.user ?? null;
    } else if (password) {
      const { error } = await admin.auth.admin.updateUserById(authUser.id, {
        password,
        user_metadata: { portal_role: portalRole },
      });
      if (error) throw error;
    }

    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unable to provision portal user.' }, { status: 500 });
    }

    const { error: roleError } = await admin.from('portal_user_roles').upsert({
      user_id: authUser.id,
      role: portalRole,
    });
    if (roleError) throw roleError;

    if (portalRole === 'admin') {
      await admin.from('user_profiles').update({ role: 'admin' }).eq('id', authUser.id);
    }

    try {
      await writeAuditEvent(admin, {
        actorId: user.id,
        actorRole: role ?? 'admin',
        entityType: 'portal_user_roles',
        entityId: authUser.id,
        action: 'portal_user_provisioned',
        metadata: { email, portalRole },
        requestId: authUser.id,
      });
    } catch (auditError: any) {
      console.warn('[portal-users][audit][warn]', auditError?.message || auditError);
    }

    return NextResponse.json({
      message: 'Portal user provisioned.',
      user: {
        id: authUser.id,
        email,
        role: portalRole,
      },
      temporaryPassword: password || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to provision portal user.' },
      { status: 500 }
    );
  }
}
