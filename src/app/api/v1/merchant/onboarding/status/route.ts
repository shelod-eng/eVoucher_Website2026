import { NextResponse } from 'next/server';
import { getMerchantOnboardingStatus } from '@/server/utils/merchant-onboarding';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = String(searchParams.get('merchantId') ?? '').trim();
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required.' }, { status: 400 });
    }

    const status = await getMerchantOnboardingStatus(merchantId);
    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    if (String(error?.message ?? '').toLowerCase().includes('invalid merchantid format')) {
      return NextResponse.json({ error: 'Invalid merchantId format.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to load merchant onboarding status.' },
      { status: 500 }
    );
  }
}
