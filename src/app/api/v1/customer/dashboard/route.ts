import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const relation = relationName.toLowerCase();
  const bareRelation = relation.includes('.') ? relation.split('.').at(-1) ?? relation : relation;
  return (
    message.includes(`relation "${relation}" does not exist`) ||
    message.includes(`relation "${bareRelation}" does not exist`) ||
    message.includes(`could not find the table '${relation}' in the schema cache`) ||
    message.includes(`could not find the table '${bareRelation}' in the schema cache`)
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

    const [profileRes, vouchersRes, transactionsRes, paymentsRes] = await Promise.all([
      supabase.from('user_profiles').select('full_name,email,phone,role').eq('id', user.id).maybeSingle(),
      supabase
        .from('customer_vouchers')
        .select(
          'id,merchant_id,product_id,merchant_name,voucher_code,face_value,discount_percent,current_balance,is_active,expires_at,issued_at,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,total_discount_amount,consumer_benefit_amount,evoucher_benefit_amount,consumer_price,merchant_receivable_after_total_discount,merchant_receivable_after_evoucher_benefit'
        )
        .eq('customer_id', user.id)
        .order('issued_at', { ascending: false }),
      supabase
        .from('redemption_history')
        .select('id,merchant_name,amount,transaction_type,created_at')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('payment_transactions')
        .select('id,voucher_code,amount,card_brand,card_last_four,payment_status,created_at')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (profileRes.error) throw profileRes.error;
    const vouchersError =
      vouchersRes.error && !isMissingRelation(vouchersRes.error, 'public.customer_vouchers')
        ? vouchersRes.error
        : null;
    const transactionsError =
      transactionsRes.error && !isMissingRelation(transactionsRes.error, 'public.redemption_history')
        ? transactionsRes.error
        : null;
    const paymentsError =
      paymentsRes.error && !isMissingRelation(paymentsRes.error, 'public.payment_transactions')
        ? paymentsRes.error
        : null;
    if (vouchersError) throw vouchersError;
    if (transactionsError) throw transactionsError;
    if (paymentsError) throw paymentsError;

    const paymentMethodsMap = new Map<string, { brand: string; lastFour: string }>();
    (paymentsRes.data ?? []).forEach((payment: any) => {
      if (!payment.card_brand || !payment.card_last_four) return;
      const key = `${payment.card_brand}-${payment.card_last_four}`;
      if (!paymentMethodsMap.has(key)) {
        paymentMethodsMap.set(key, {
          brand: payment.card_brand,
          lastFour: payment.card_last_four,
        });
      }
    });

    let customerPaymentMethods: Array<{
      id: string;
      method_type: string;
      provider: string;
      masked_reference: string;
      is_default: boolean;
      is_active: boolean;
      created_at: string;
    }> = [];

    const methodsRes = await supabase
      .from('customer_payment_methods')
      .select('id,method_type,provider,masked_reference,is_default,is_active,created_at')
      .eq('customer_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (!methodsRes.error) {
      customerPaymentMethods = methodsRes.data ?? [];
    } else if (!isMissingRelation(methodsRes.error, 'public.customer_payment_methods')) {
      throw methodsRes.error;
    }

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
      customerPaymentMethods,
      paymentTransactions: paymentsRes.data ?? [],
      diagnostics: {
        role,
        hasAdminEnv: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        voucherCount: vouchersRes.data?.length ?? 0,
        transactionCount: transactionsRes.data?.length ?? 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load customer dashboard.', code: 'customer_dashboard_failed' },
      { status: 500 }
    );
  }
}
