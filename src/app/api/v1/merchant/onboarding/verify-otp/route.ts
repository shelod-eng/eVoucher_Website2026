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

    return NextResponse.json({
      approved: result.approved,
      status: result.status,
      vettingStatus: result.vettingStatus,
      emailVerified: result.emailVerified,
      phoneVerified: result.phoneVerified,
      message: result.message,
      debug: 'debug' in result ? result.debug : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to verify merchant OTP.' },
      { status: 500 }
    );
  }
}
