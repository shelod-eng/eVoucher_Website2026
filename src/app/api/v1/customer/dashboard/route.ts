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
    const [profileRes, vouchersRes, transactionsRes] = await Promise.all([
      admin.from('user_profiles').select('full_name,email,phone,role').eq('id', user.id).maybeSingle(),
      admin
        .from('customer_vouchers')
        .select(
          'id,merchant_id,merchant_name,voucher_code,face_value,discount_percent,current_balance,is_active,expires_at,issued_at'
        )
        .eq('customer_id', user.id)
        .eq('is_active', true)
        .order('issued_at', { ascending: false }),
      admin
        .from('redemption_history')
        .select('id,merchant_name,amount,transaction_type,created_at')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (vouchersRes.error) throw vouchersRes.error;
    if (transactionsRes.error) throw transactionsRes.error;

    return NextResponse.json({
      profile: profileRes.data ?? null,
      vouchers: vouchersRes.data ?? [],
      transactions: transactionsRes.data ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load customer dashboard.' },
      { status: 500 }
    );
  }
}
