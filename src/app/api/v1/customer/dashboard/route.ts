import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';
import { BrandKey, listMerchantBrands } from '@/lib/merchant-brand-catalog';
import { buildStarterProductsForBrand } from '@/lib/starter-products';
import { DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';

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

const DEMO_BRANDS: BrandKey[] = [
  'shoprite',
  'checkers',
  'picknpay',
  'usave',
  'boxer',
  'clicks',
  'pep',
  'engen',
];

function generateDemoVouchers() {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now + 90 * dayMs).toISOString();
  const catalog = listMerchantBrands();

  return DEMO_BRANDS.map((brandKey, index) => {
    const brand = catalog.find((entry) => entry.brandKey === brandKey)!;
    const starterProduct = buildStarterProductsForBrand({
      brandKey,
      merchantId: null,
      merchantName: brand.displayName,
      defaultTotalDiscountPct: DEFAULT_TOTAL_DISCOUNT_PCT,
    })[0];

    const prefix = brand.displayName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4) || 'DEMO';
    const voucherCode = `${prefix}-${(index + 1).toString().padStart(2, '0')}EH4`;
    const issuedAt = new Date(now - index * dayMs).toISOString();

    return {
      id: `demo-voucher-${brandKey}-${index + 1}`,
      merchant_id: null,
      product_id: null,
      merchant_name: brand.displayName,
      parent_brand: brand.displayName,
      voucher_code: voucherCode,
      face_value: starterProduct.face_value,
      discount_percent: starterProduct.total_discount_pct,
      current_balance: starterProduct.face_value,
      is_active: true,
      expires_at: expiresAt,
      issued_at: issuedAt,
      total_discount_pct: starterProduct.total_discount_pct,
      consumer_benefit_pct: starterProduct.consumer_benefit_pct,
      evoucher_benefit_pct: starterProduct.evoucher_benefit_pct,
      total_discount_amount: starterProduct.total_discount_amount,
      consumer_benefit_amount: starterProduct.consumer_benefit_amount,
      evoucher_benefit_amount: starterProduct.evoucher_benefit_amount,
      consumer_price: starterProduct.consumer_price,
      merchant_receivable_after_total_discount: starterProduct.merchant_receivable_after_total_discount,
      merchant_receivable_after_evoucher_benefit: starterProduct.merchant_receivable_after_evoucher_benefit,
      redemption_scope: 'all_branches',
      valid_provinces: [],
      valid_branch_ids: [],
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(voucherCode)}`,
      redeemed_at_merchant_id: null,
      redeemed_at_branch: null,
      redeemed_at: null,
    };
  });
}

function generateDemoPaymentTransactions(vouchers: Array<{ voucher_code: string; consumer_price: number }>) {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  return vouchers.map((voucher, index) => ({
    id: `demo-payment-${index + 1}`,
    voucher_code: voucher.voucher_code,
    amount: voucher.consumer_price,
    card_brand: 'Visa',
    card_last_four: `10${index}${index}`,
    payment_status: 'completed',
    created_at: new Date(now - index * hourMs).toISOString(),
  }));
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
          'id,merchant_id,product_id,merchant_name,parent_brand,voucher_code,face_value,discount_percent,current_balance,is_active,expires_at,issued_at,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,total_discount_amount,consumer_benefit_amount,evoucher_benefit_amount,consumer_price,merchant_receivable_after_total_discount,merchant_receivable_after_evoucher_benefit,redemption_scope,valid_provinces,valid_branch_ids,qr_code_url,redeemed_at_merchant_id,redeemed_at_branch,redeemed_at'
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

    const liveVouchers = vouchersRes.data ?? [];
    const livePaymentTransactions = paymentsRes.data ?? [];

    const vouchersPayload = liveVouchers.length > 0 ? liveVouchers : generateDemoVouchers();
    const paymentTransactionsPayload =
      livePaymentTransactions.length > 0
        ? livePaymentTransactions
        : generateDemoPaymentTransactions(
            vouchersPayload.map((voucher: any) => ({
              voucher_code: String(voucher.voucher_code ?? ''),
              consumer_price: Number(voucher.consumer_price ?? 0),
            }))
          );

    return NextResponse.json({
      profile,
      vouchers: vouchersPayload,
      transactions: transactionsRes.data ?? [],
      paymentMethods: Array.from(paymentMethodsMap.values()),
      customerPaymentMethods,
      paymentTransactions: paymentTransactionsPayload,
      diagnostics: {
        role,
        hasAdminEnv: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        voucherCount: vouchersPayload.length,
        transactionCount: transactionsRes.data?.length ?? 0,
        demoSeededVouchers: liveVouchers.length === 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load customer dashboard.', code: 'customer_dashboard_failed' },
      { status: 500 }
    );
  }
}
