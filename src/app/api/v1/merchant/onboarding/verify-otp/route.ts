import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { verifyMerchantOtp } from '@/server/utils/merchant-onboarding';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let actorId: string | null = null;
    try {
      const { user } = await getAuthenticatedUser();
      actorId = user?.id ?? null;
    } catch {
      // OTP verification may happen before sign-in.
    }

    const result = await verifyMerchantOtp({
      merchantId: String(body?.merchantId ?? ''),
      otpCode: String(body?.otpCode ?? ''),
      actorId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const statusData = 'statusData' in result ? result.statusData : undefined;

    return NextResponse.json({
      approved: result.approved,
      status: result.status,
      vettingStatus: result.vettingStatus,
      emailVerified: result.emailVerified,
      phoneVerified: result.phoneVerified,
      approvalConfirmationSent:
        'approvalConfirmationSent' in result ? result.approvalConfirmationSent : undefined,
      approvalConfirmationError:
        'approvalConfirmationError' in result ? result.approvalConfirmationError : undefined,
      credentialsEmailSent: 'credentialsEmailSent' in result ? result.credentialsEmailSent : undefined,
      credentialsEmailRecipient:
        'credentialsEmailRecipient' in result ? result.credentialsEmailRecipient : undefined,
      credentialsEmailProvider:
        'credentialsEmailProvider' in result ? result.credentialsEmailProvider : undefined,
      credentialsEmailError: 'credentialsEmailError' in result ? result.credentialsEmailError : undefined,
      credentialsIssued: statusData?.credentialsIssued ?? false,
      mustResetPassword: statusData?.mustResetPassword ?? false,
      loginReady: statusData?.loginReady ?? false,
      merchantId: statusData?.merchantId ?? String(body?.merchantId ?? ''),
      message: result.message,
      statusData,
      debug: 'debug' in result ? result.debug : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to verify merchant OTP.' },
      { status: 500 }
    );
  }
}
