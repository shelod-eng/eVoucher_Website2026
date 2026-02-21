import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';

function isMissingAdminEnvError(error: any) {
  return String(error?.message ?? '').includes(
    'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL'
  );
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        {
          error: 'You must be signed in as a consumer to view this dashboard.',
          code: 'unauthenticated',
        },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return NextResponse.json(
        {
          error: 'This dashboard is only available to consumer accounts.',
          code: 'consumer_only_dashboard',
          diagnostics: { role },
        },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const [profileRes, vouchersRes, transactionsRes, paymentsRes] = await Promise.all([
      admin.from('user_profiles').select('full_name,email,phone,role').eq('id', user.id).maybeSingle(),
      admin
        .from('customer_vouchers')
        .select(
          'id,merchant_id,merchant_name,voucher_code,face_value,discount_percent,current_balance,is_active,expires_at,issued_at'
        )
        .eq('customer_id', user.id)
        .order('issued_at', { ascending: false }),
      admin
        .from('redemption_history')
        .select('id,merchant_name,amount,transaction_type,created_at')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      admin
        .from('payment_transactions')
        .select('id,card_brand,card_last_four,payment_status,created_at')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (vouchersRes.error) throw vouchersRes.error;
    if (transactionsRes.error) throw transactionsRes.error;
    if (paymentsRes.error) throw paymentsRes.error;

    const paymentMethodsMap = new Map<string, { brand: string; lastFour: string }>();
    (paymentsRes.data ?? []).forEach((payment) => {
      if (!payment.card_brand || !payment.card_last_four) return;
      const key = `${payment.card_brand}-${payment.card_last_four}`;
      if (!paymentMethodsMap.has(key)) {
        paymentMethodsMap.set(key, {
          brand: payment.card_brand,
          lastFour: payment.card_last_four,
        });
      }
    });

    const profile =
      profileRes.data ?? {
        full_name: String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''),
        email: user.email ?? '',
        phone: user.phone ?? '',
        role,
      };

    return NextResponse.json({
      profile,
      vouchers: vouchersRes.data ?? [],
      transactions: transactionsRes.data ?? [],
      paymentMethods: Array.from(paymentMethodsMap.values()),
      diagnostics: {
        role,
        hasAdminEnv: true,
        voucherCount: vouchersRes.data?.length ?? 0,
        transactionCount: transactionsRes.data?.length ?? 0,
      },
    });
  } catch (error: any) {
    if (isMissingAdminEnvError(error)) {
      return NextResponse.json(
        {
          error:
            'Server is missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. Add them to load dashboard data.',
          code: 'missing_admin_env',
          diagnostics: { hasAdminEnv: false },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to load customer dashboard.', code: 'customer_dashboard_failed' },
      { status: 500 }
    );
  }
}
