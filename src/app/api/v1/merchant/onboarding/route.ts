import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { submitMerchantOnboarding } from '@/server/utils/merchant-onboarding';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let actorId: string | null = null;
    let actorRole: string | null = 'public';

    try {
      const { supabase, user } = await getAuthenticatedUser();
      if (user) {
        actorId = user.id;
        const roleResult = await resolveUserRole(supabase as any, user);
        actorRole = roleResult.role;
      }
    } catch {
      // Public merchant onboarding does not require an authenticated session.
    }

    const result = await submitMerchantOnboarding({
      payload: body,
      actorId,
      actorRole,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      merchantId: result.merchantId,
      status: result.status,
      vettingStatus: result.vettingStatus,
      merchantType: result.merchantType,
      emailSent: result.emailSent,
      smsSent: result.smsSent,
      verificationEmailTo: result.verificationEmailTo,
      emailDeliveryError: result.emailDeliveryError,
      smsDeliveryError: result.smsDeliveryError,
      debug: result.debug,
      message:
        'Onboarding submitted. Confirm your email token to complete verification.',
    });
  } catch (error: any) {
    console.error('[api][merchant-onboarding][error]', {
      message: error?.message,
      stack: error?.stack,
      hint: error?.hint,
      details: error?.details,
      code: error?.code,
    });
    return NextResponse.json(
      { error: error?.message || 'Failed to submit merchant onboarding.' },
      { status: 500 }
    );
  }
}
