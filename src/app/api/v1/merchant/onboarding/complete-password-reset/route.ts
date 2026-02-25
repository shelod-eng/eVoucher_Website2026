import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { completeMerchantPasswordReset } from '@/server/utils/merchant-onboarding';

export async function POST() {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await completeMerchantPasswordReset(user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to complete password reset.' },
      { status: 500 }
    );
  }
}
