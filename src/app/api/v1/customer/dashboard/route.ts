import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';
import { getWalletBalance } from '@/server/services/wallet/ledger';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function noStoreHeaders(existing?: HeadersInit): HeadersInit {
  return {
    ...(existing ?? {}),
    'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    Vary: 'Cookie, Authorization',
  };
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...(init ?? {}),
    headers: noStoreHeaders(init?.headers),
  });
}

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const relation = relationName.toLowerCase();
  const bareRelation = relation.includes('.') ? (relation.split('.').at(-1) ?? relation) : relation;
  return (
    message.includes(`relation "${relation}" does not exist`) ||
    message.includes(`relation "${bareRelation}" does not exist`) ||
    message.includes(`could not find the table '${relation}' in the schema cache`) ||
    message.includes(`could not find the table '${bareRelation}' in the schema cache`)
  );
}

function isMissingSchemaField(error: any, fieldName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const field = fieldName.toLowerCase();
  return (
    message.includes(`column "${field}" does not exist`) ||
    message.includes(`could not find the '${field}' column`) ||
    message.includes(`schema cache`) ||
    message.includes(`record "${field}" has no field`)
  );
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return jsonNoStore(
        {
          error: 'You must be signed in as a consumer to view this dashboard.',
          code: 'unauthenticated',
        },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return jsonNoStore(
        {
          error: 'This dashboard is only available to consumer accounts.',
          code: 'consumer_only_dashboard',
          diagnostics: { role },
        },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    // Fetch payment_transactions with merchant join; fall back to plain query if join fails.
    let rawPayments: any[] = [];
    const paymentsWithJoin = await admin
      .from('payment_transactions')
      .select(
        'id,merchant_id,voucher_code,amount,consumer_benefit_amount,card_brand,card_last_four,payment_method,payment_status,face_value,created_at,merchants(business_name,parent_brand)'
      )
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (!paymentsWithJoin.error) {
      rawPayments = paymentsWithJoin.data ?? [];
    } else {
      // Join failed (RLS or schema) — fall back without the relation
      const paymentsFallback = await admin
        .from('payment_transactions')
        .select(
          'id,merchant_id,voucher_code,amount,consumer_benefit_amount,card_brand,card_last_four,payment_method,payment_status,face_value,created_at'
        )
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (!paymentsFallback.error) {
        rawPayments = paymentsFallback.data ?? [];
      }
    }

    // Build merchant name lookup from the joined data or a separate query
    const merchantNameById = new Map<string, string>();
    const merchantBrandById = new Map<string, string>();
    rawPayments.forEach((tx: any) => {
      if (tx.merchant_id && tx.merchants) {
        merchantNameById.set(String(tx.merchant_id), String(tx.merchants.business_name ?? ''));
        merchantBrandById.set(
          String(tx.merchant_id),
          String(tx.merchants.parent_brand ?? tx.merchants.business_name ?? '')
        );
      }
    });

    // If join didn't populate names, do a single bulk merchant lookup
    const missingIds = [
      ...new Set(
        rawPayments
          .filter((tx: any) => tx.merchant_id && !merchantNameById.has(String(tx.merchant_id)))
          .map((tx: any) => String(tx.merchant_id))
      ),
    ];
    if (missingIds.length > 0) {
      const merchantsRes = await admin
        .from('merchants')
        .select('id,business_name,parent_brand')
        .in('id', missingIds);
      if (!merchantsRes.error) {
        (merchantsRes.data ?? []).forEach((m: any) => {
          merchantNameById.set(String(m.id), String(m.business_name ?? ''));
          merchantBrandById.set(String(m.id), String(m.parent_brand ?? m.business_name ?? ''));
        });
      }
    }

    // Normalise each transaction — attach merchant_name + merchant_brand
    const paymentTransactionsPayload = rawPayments.map((tx: any) => ({
      id: tx.id,
      merchant_id: tx.merchant_id ?? null,
      merchant_name: tx.merchant_id ? merchantNameById.get(String(tx.merchant_id)) || null : null,
      merchant_brand: tx.merchant_id ? merchantBrandById.get(String(tx.merchant_id)) || null : null,
      voucher_code: tx.voucher_code ?? null,
      amount: Number(tx.amount ?? 0),
      face_value: Number(tx.face_value ?? 0),
      consumer_benefit_amount: Number(tx.consumer_benefit_amount ?? 0),
      card_brand: tx.card_brand ?? null,
      card_last_four: tx.card_last_four ?? null,
      payment_method: tx.payment_method ?? null,
      payment_status: tx.payment_status ?? null,
      created_at: tx.created_at,
    }));

    const [profileRes, vouchersRes, transactionsRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('full_name,email,phone,role')
        .eq('id', user.id)
        .maybeSingle(),
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
    ]);

    if (profileRes.error) throw profileRes.error;

    let vouchersPayload = vouchersRes.data ?? [];
    let vouchersError =
      vouchersRes.error && !isMissingRelation(vouchersRes.error, 'public.customer_vouchers')
        ? vouchersRes.error
        : null;
    if (
      vouchersRes.error &&
      [
        'merchant_id',
        'product_id',
        'parent_brand',
        'total_discount_pct',
        'consumer_benefit_pct',
        'evoucher_benefit_pct',
        'total_discount_amount',
        'consumer_benefit_amount',
        'evoucher_benefit_amount',
        'consumer_price',
        'merchant_receivable_after_total_discount',
        'merchant_receivable_after_evoucher_benefit',
        'redemption_scope',
        'valid_provinces',
        'valid_branch_ids',
        'qr_code_url',
        'redeemed_at_merchant_id',
        'redeemed_at_branch',
        'redeemed_at',
      ].some((field) => isMissingSchemaField(vouchersRes.error, field))
    ) {
      const fallbackVouchersRes = await supabase
        .from('customer_vouchers')
        .select(
          'id,merchant_name,voucher_code,face_value,discount_percent,current_balance,is_active,expires_at,issued_at'
        )
        .eq('customer_id', user.id)
        .order('issued_at', { ascending: false });
      if (
        fallbackVouchersRes.error &&
        !isMissingRelation(fallbackVouchersRes.error, 'public.customer_vouchers')
      ) {
        vouchersError = fallbackVouchersRes.error;
      } else {
        vouchersError = null;
        vouchersPayload = (fallbackVouchersRes.data ?? []).map((voucher: any) => ({
          ...voucher,
          merchant_id: null,
          product_id: null,
          parent_brand: null,
          total_discount_pct: Number(voucher.discount_percent ?? 0),
          consumer_benefit_pct: Number(voucher.discount_percent ?? 0),
          evoucher_benefit_pct: 0,
          total_discount_amount: 0,
          consumer_benefit_amount: 0,
          evoucher_benefit_amount: 0,
          consumer_price: null,
          merchant_receivable_after_total_discount: null,
          merchant_receivable_after_evoucher_benefit: null,
          redemption_scope: null,
          valid_provinces: [],
          valid_branch_ids: [],
          qr_code_url: null,
          redeemed_at_merchant_id: null,
          redeemed_at_branch: null,
          redeemed_at: null,
        }));
      }
    }

    const transactionsError =
      transactionsRes.error &&
      !isMissingRelation(transactionsRes.error, 'public.redemption_history')
        ? transactionsRes.error
        : null;
    if (vouchersError) throw vouchersError;
    if (transactionsError) throw transactionsError;

    const paymentMethodsMap = new Map<string, { brand: string; lastFour: string }>();
    paymentTransactionsPayload.forEach((tx) => {
      if (!tx.card_brand || !tx.card_last_four) return;
      const key = `${tx.card_brand}-${tx.card_last_four}`;
      if (!paymentMethodsMap.has(key)) {
        paymentMethodsMap.set(key, { brand: tx.card_brand, lastFour: tx.card_last_four });
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

    const profile = profileRes.data ?? {
      full_name: String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''),
      email: user.email ?? '',
      phone: user.phone ?? '',
      role,
    };

    const walletBalanceFromLedger = (await getWalletBalance(admin, user.id)) ?? 0;
    const walletTopupCredits = paymentTransactionsPayload.reduce((sum, tx) => {
      const status = String(tx.payment_status ?? '')
        .toLowerCase()
        .trim();
      const isCompleted =
        !status || status === 'completed' || status === 'paid' || status === 'success';
      if (!isCompleted) return sum;
      if (tx.voucher_code || tx.merchant_id) return sum;
      return Number.isFinite(tx.amount) && tx.amount > 0 ? sum + tx.amount : sum;
    }, 0);
    const walletDebitsFromPurchases = paymentTransactionsPayload.reduce((sum, tx) => {
      const status = String(tx.payment_status ?? '')
        .toLowerCase()
        .trim();
      const isCompleted =
        !status || status === 'completed' || status === 'paid' || status === 'success';
      if (!isCompleted) return sum;
      if (
        String(tx.card_brand ?? '')
          .toUpperCase()
          .trim() !== 'WALLET'
      )
        return sum;
      return Number.isFinite(tx.amount) && tx.amount > 0 ? sum + tx.amount : sum;
    }, 0);
    const walletBalance = Number(
      Math.max(
        walletBalanceFromLedger,
        Math.max(walletTopupCredits - walletDebitsFromPurchases, 0)
      ).toFixed(2)
    );

    const completedPurchases = paymentTransactionsPayload.filter(
      (tx) => String(tx.payment_status ?? '').toLowerCase() === 'completed'
    );
    const totalTransactions = completedPurchases.length;
    const totalSaved = completedPurchases.reduce((s, tx) => s + tx.consumer_benefit_amount, 0);
    const totalSpent = completedPurchases.reduce((s, tx) => s + tx.amount, 0);
    const savingsRate = totalSpent > 0 ? Number(((totalSaved / totalSpent) * 100).toFixed(2)) : 0;

    return jsonNoStore({
      profile,
      vouchers: vouchersPayload,
      transactions: transactionsRes.data ?? [],
      purchaseTransactions: completedPurchases,
      paymentMethods: Array.from(paymentMethodsMap.values()),
      customerPaymentMethods,
      paymentTransactions: paymentTransactionsPayload,
      walletBalance,
      stats: {
        totalTransactions,
        totalSaved: Number(totalSaved.toFixed(2)),
        totalSpent: Number(totalSpent.toFixed(2)),
        savingsRate,
        walletBalance,
        voucherCount: vouchersPayload.length,
        activeVoucherCount: vouchersPayload.filter(
          (v: any) => v.is_active && Number(v.current_balance ?? 0) > 0
        ).length,
      },
      diagnostics: {
        role,
        hasAdminEnv: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        voucherCount: vouchersPayload.length,
        transactionCount: totalTransactions,
        demoSeededVouchers: false,
      },
    });
  } catch (error: any) {
    return jsonNoStore(
      {
        error: error?.message || 'Failed to load customer dashboard.',
        code: 'customer_dashboard_failed',
      },
      { status: 500 }
    );
  }
}
