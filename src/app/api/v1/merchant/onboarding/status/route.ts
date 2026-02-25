import { NextResponse } from 'next/server';
import { getMerchantOnboardingStatus } from '@/server/utils/merchant-onboarding';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = String(searchParams.get('merchantId') ?? '').trim();
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required.' }, { status: 400 });
    }

    const status = await getMerchantOnboardingStatus(merchantId);
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load merchant onboarding status.' },
      { status: 500 }
    );
  }
}
