import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { verifyMerchantEmailToken } from '@/server/utils/merchant-onboarding';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let actorId: string | null = null;
    try {
      const { user } = await getAuthenticatedUser();
      actorId = user?.id ?? null;
    } catch {
      // Token verification may happen in a public session.
    }

    const result = await verifyMerchantEmailToken({
      merchantId: String(body?.merchantId ?? ''),
      token: String(body?.token ?? ''),
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
      { error: error?.message || 'Failed to verify merchant email token.' },
      { status: 500 }
    );
  }
}
