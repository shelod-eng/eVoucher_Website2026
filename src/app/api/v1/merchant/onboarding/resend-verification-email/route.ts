import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resendMerchantVerificationEmail } from '@/server/utils/merchant-onboarding';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const merchantId = String(body?.merchantId ?? '').trim();
    const email = String(body?.email ?? '').trim();
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required.' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: 'email is required.' }, { status: 400 });
    }

    let actorId: string | null = null;
    let actorRole: string | null = 'public';
    try {
      const { user } = await getAuthenticatedUser();
      if (user) {
        actorId = user.id;
        actorRole =
          String(user.user_metadata?.role ?? '')
            .trim()
            .toLowerCase() || 'authenticated';
      }
    } catch {
      // Public onboarding flow can request verification resend.
    }

    const result = await resendMerchantVerificationEmail({
      merchantId,
      email,
      actorId,
      actorRole,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      sent: result.sent,
      recipient: 'recipient' in result ? result.recipient : undefined,
      message: result.message,
      error: result.error,
      statusData: result.statusData,
      debug: 'debug' in result ? result.debug : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to resend merchant verification email.' },
      { status: 500 }
    );
  }
}
