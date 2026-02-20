import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';

export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: merchant, error: merchantError } = await admin
      .from('merchants')
      .select(
        'id,business_name,status,onboarding_fee_paid,charity_donation_amount,created_at,approved_at,email,phone,bank_name'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (merchantError) throw merchantError;
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    }

    const { data: payouts, error: payoutsError } = await admin
      .from('merchant_payouts')
      .select('id,amount,status,payout_date,created_at')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });

    if (payoutsError) throw payoutsError;

    return NextResponse.json({
      merchant,
      payouts: payouts ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load merchant dashboard.' },
      { status: 500 }
    );
  }
}
