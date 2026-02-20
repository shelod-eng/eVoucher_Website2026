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
    const { data, error } = await admin
      .from('merchants')
      .select('id,business_name,email,status,default_total_discount_pct')
      .in('status', ['active', 'approved'])
      .order('business_name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      merchants: (data ?? []).map((merchant) => ({
        id: merchant.id,
        businessName: merchant.business_name,
        email: merchant.email,
        status: merchant.status,
        defaultTotalDiscountPct: Number(merchant.default_total_discount_pct ?? 5),
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch active merchants.' },
      { status: 500 }
    );
  }
}
