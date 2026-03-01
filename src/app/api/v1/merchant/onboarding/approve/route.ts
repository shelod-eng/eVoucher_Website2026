import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { approveMerchantManually } from '@/server/utils/merchant-onboarding';
import { resolveUserRole } from '@/server/utils/role';

function isApprovalAuthorized(request: Request, role: string | null) {
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
      // Header-based approval key flow is supported for controlled demos.
    }

    if (!isApprovalAuthorized(request, actorRole)) {
      return NextResponse.json({ error: 'Unauthorized merchant approval attempt.' }, { status: 401 });
    }

    const result = await approveMerchantManually({
      merchantId,
      actorId,
      actorRole: actorRole ?? 'admin',
    });

    if (!result.ok) {
      return NextResponse.json({ error: 'Merchant approval failed.' }, { status: result.httpStatus });
    }

    return NextResponse.json({
      approved: result.approved,
      status: result.status,
      vettingStatus: result.vettingStatus,
      message: result.message,
      approvalConfirmationSent:
        'approvalConfirmationSent' in result ? result.approvalConfirmationSent : undefined,
      approvalConfirmationError:
        'approvalConfirmationError' in result ? result.approvalConfirmationError : undefined,
      credentialsEmailSent: 'credentialsEmailSent' in result ? result.credentialsEmailSent : undefined,
      credentialsEmailError: 'credentialsEmailError' in result ? result.credentialsEmailError : undefined,
      statusData: 'statusData' in result ? result.statusData : undefined,
      debug: 'debug' in result ? result.debug : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to approve merchant.' },
      { status: 500 }
    );
  }
}
