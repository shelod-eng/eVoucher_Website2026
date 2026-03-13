import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';

type RewardTxn = {
  id: string;
  merchant_id?: string | null;
  voucher_code?: string | null;
  amount?: number | null;
  consumer_benefit_amount?: number | null;
  evoucher_benefit_amount?: number | null;
  total_discount_pct?: number | null;
  consumer_benefit_pct?: number | null;
  evoucher_benefit_pct?: number | null;
  payment_status?: string | null;
  created_at: string;
};

type VoucherRow = {
  id: string;
  is_active?: boolean | null;
  current_balance?: number | null;
};

const OFFER_CONSUMER_SAVINGS_PCT = 5.6;
const OFFER_PLATFORM_FEE_PCT = 2.4;
const OFFER_TOTAL_DISCOUNT_PCT = 8;

function round2(value: number) {
  return Number(value.toFixed(2));
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

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return NextResponse.json(
        { error: 'Rewards are available to consumer accounts only.', code: 'consumer_only' },
        { status: 403 }
      );
    }

    const [transactionsRes, vouchersRes] = await Promise.all([
      supabase
        .from('payment_transactions')
        .select(
          'id,merchant_id,voucher_code,amount,consumer_benefit_amount,evoucher_benefit_amount,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,payment_status,created_at'
        )
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase
        .from('customer_vouchers')
        .select('id,is_active,current_balance')
        .eq('customer_id', user.id)
        .limit(1000),
    ]);

    if (
      transactionsRes.error &&
      !isMissingRelation(transactionsRes.error, 'public.payment_transactions')
    ) {
      throw transactionsRes.error;
    }
    if (vouchersRes.error && !isMissingRelation(vouchersRes.error, 'public.customer_vouchers')) {
      throw vouchersRes.error;
    }

    const allTransactions = (transactionsRes.data ?? []) as RewardTxn[];
    const completedTransactions = allTransactions.filter(
      (transaction: RewardTxn) => transaction.payment_status === 'completed'
    );

    const merchantIds = Array.from(
      new Set(
        completedTransactions.map((tx: RewardTxn) => String(tx.merchant_id ?? '')).filter(Boolean)
      )
    );
    const merchantNames: Record<string, string> = {};
    if (merchantIds.length > 0) {
      try {
        const admin = createAdminClient();
        const { data: merchantRows, error: merchantError } = await admin
          .from('merchants')
          .select('id,business_name')
          .in('id', merchantIds);
        if (merchantError) throw merchantError;
        (merchantRows ?? []).forEach((merchant) => {
          merchantNames[merchant.id] = merchant.business_name;
        });
      } catch {
        // Best-effort name resolution. Consumer cashback data remains available without admin env.
      }
    }

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const totalSpent = completedTransactions.reduce(
      (sum: number, tx: RewardTxn) => sum + Number(tx.amount ?? 0),
      0
    );
    const totalCashSaved = completedTransactions.reduce(
      (sum: number, tx: RewardTxn) => sum + Number(tx.consumer_benefit_amount ?? 0),
      0
    );
    const totalPlatformFeeAmount = completedTransactions.reduce(
      (sum: number, tx: RewardTxn) => sum + Number(tx.evoucher_benefit_amount ?? 0),
      0
    );

    const thisMonthTransactions = completedTransactions.filter(
      (tx: RewardTxn) => new Date(tx.created_at).toISOString().slice(0, 7) === currentMonth
    );
    const thisMonthSpend = thisMonthTransactions.reduce(
      (sum: number, tx: RewardTxn) => sum + Number(tx.amount ?? 0),
      0
    );
    const thisMonthSavings = thisMonthTransactions.reduce(
      (sum: number, tx: RewardTxn) => sum + Number(tx.consumer_benefit_amount ?? 0),
      0
    );

    const monthMap = new Map<string, { month: string; spent: number; savings: number }>();
    completedTransactions.forEach((tx: RewardTxn) => {
      const month = new Date(tx.created_at).toISOString().slice(0, 7);
      const existing = monthMap.get(month) ?? { month, spent: 0, savings: 0 };
      existing.spent += Number(tx.amount ?? 0);
      existing.savings += Number(tx.consumer_benefit_amount ?? 0);
      monthMap.set(month, existing);
    });
    const monthlySeries = Array.from(monthMap.values())
      .map((entry) => ({
        month: entry.month,
        spent: round2(entry.spent),
        savings: round2(entry.savings),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const averageMonthlySavings =
      monthlySeries.length > 0 ? totalCashSaved / monthlySeries.length : 0;
    const averageAnnualSavings = averageMonthlySavings * 12;

    const savingsRatePct = OFFER_CONSUMER_SAVINGS_PCT;
    const cashbackPer100 = OFFER_CONSUMER_SAVINGS_PCT;
    const activeVouchers = ((vouchersRes.data ?? []) as VoucherRow[]).filter(
      (voucher: VoucherRow) => voucher.is_active && Number(voucher.current_balance ?? 0) > 0
    ).length;

    return NextResponse.json({
      totalCashSaved: round2(totalCashSaved),
      thisMonthSavings: round2(thisMonthSavings),
      averageAnnualSavings: round2(averageAnnualSavings),
      savingsRatePct: round2(savingsRatePct),
      totalSpent: round2(totalSpent),
      thisMonthSpend: round2(thisMonthSpend),
      totalPlatformFeeAmount: round2(totalPlatformFeeAmount),
      merchantDiscountPct: OFFER_TOTAL_DISCOUNT_PCT,
      consumerSavingsPct: OFFER_CONSUMER_SAVINGS_PCT,
      platformFeePct: OFFER_PLATFORM_FEE_PCT,
      cashbackPer100,
      activeVouchers,
      monthlySeries,
      recentTransactions: completedTransactions.slice(0, 12).map((tx: RewardTxn) => ({
        id: tx.id,
        merchantName: merchantNames[String(tx.merchant_id ?? '')] ?? 'Partner Merchant',
        amountPaid: round2(Number(tx.amount ?? 0)),
        savingsRealized: round2(Number(tx.consumer_benefit_amount ?? 0)),
        voucherCode: tx.voucher_code ?? null,
        createdAt: tx.created_at,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load rewards summary.' },
      { status: 500 }
    );
  }
}
