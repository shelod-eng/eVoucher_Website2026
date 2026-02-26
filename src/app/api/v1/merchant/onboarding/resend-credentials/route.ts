import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { resendMerchantCredentials } from '@/server/utils/merchant-onboarding';

function isAuthorized(request: Request, role: string | null) {
  if (role === 'admin') return true;
  const headerKey = String(request.headers.get('x-merchant-approval-key') ?? '').trim();
  const envKey = String(process.env.MERCHANT_APPROVAL_KEY ?? '').trim();
  return Boolean(envKey) && headerKey === envKey;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const merchantId = String(body?.merchantId ?? '').trim();
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required.' }, { status: 400 });
    }

    let actorId: string | null = null;
    let actorRole: string | null = null;
    try {
      const { supabase, user } = await getAuthenticatedUser();
      if (user) {
        actorId = user.id;
        const roleResult = await resolveUserRole(supabase as any, user);
        actorRole = roleResult.role;
      }
    } catch {
      // Header key flow supported for controlled demos.
    }

    if (!isAuthorized(request, actorRole)) {
      return NextResponse.json({ error: 'Unauthorized credentials resend attempt.' }, { status: 401 });
    }

    const result = await resendMerchantCredentials({
      merchantId,
      actorId,
      actorRole: actorRole ?? 'admin',
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      sent: result.sent,
      message: result.message,
      error: result.error,
      statusData: result.statusData,
      debug: 'debug' in result ? result.debug : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to resend merchant credentials.' },
      { status: 500 }
    );
  }
}

