import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';

function round2(value: number) {
  return Number(value.toFixed(2));
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

    const admin = createAdminClient();
    const [transactionsRes, vouchersRes] = await Promise.all([
      admin
        .from('payment_transactions')
        .select(
          'id,merchant_id,voucher_code,amount,consumer_benefit_amount,evoucher_benefit_amount,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,payment_status,created_at'
        )
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000),
      admin
        .from('customer_vouchers')
        .select('id,is_active,current_balance')
        .eq('customer_id', user.id)
        .limit(1000),
    ]);

    if (transactionsRes.error) throw transactionsRes.error;
    if (vouchersRes.error) throw vouchersRes.error;

    const allTransactions = transactionsRes.data ?? [];
    const completedTransactions = allTransactions.filter(
      (transaction) => transaction.payment_status === 'completed'
    );

    const merchantIds = Array.from(
      new Set(completedTransactions.map((tx) => String(tx.merchant_id ?? '')).filter(Boolean))
    );
    const merchantNames: Record<string, string> = {};
    if (merchantIds.length > 0) {
      const { data: merchantRows, error: merchantError } = await admin
        .from('merchants')
        .select('id,business_name')
        .in('id', merchantIds);
      if (merchantError) throw merchantError;
      (merchantRows ?? []).forEach((merchant) => {
        merchantNames[merchant.id] = merchant.business_name;
      });
    }

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const totalSpent = completedTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount ?? 0),
      0
    );
    const totalCashSaved = completedTransactions.reduce(
      (sum, tx) => sum + Number(tx.consumer_benefit_amount ?? 0),
      0
    );
    const totalPlatformFeeAmount = completedTransactions.reduce(
      (sum, tx) => sum + Number(tx.evoucher_benefit_amount ?? 0),
      0
    );

    const thisMonthTransactions = completedTransactions.filter(
      (tx) => new Date(tx.created_at).toISOString().slice(0, 7) === currentMonth
    );
    const thisMonthSpend = thisMonthTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount ?? 0),
      0
    );
    const thisMonthSavings = thisMonthTransactions.reduce(
      (sum, tx) => sum + Number(tx.consumer_benefit_amount ?? 0),
      0
    );

    const monthMap = new Map<string, { month: string; spent: number; savings: number }>();
    completedTransactions.forEach((tx) => {
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
      monthlySeries.length > 0
        ? totalCashSaved / monthlySeries.length
        : 0;
    const averageAnnualSavings = averageMonthlySavings * 12;

    const totalDiscountPctAvg =
      completedTransactions.length > 0
        ? completedTransactions.reduce((sum, tx) => sum + Number(tx.total_discount_pct ?? 0), 0) /
          completedTransactions.length
        : 0;
    const consumerSavingsPctAvg =
      completedTransactions.length > 0
        ? completedTransactions.reduce((sum, tx) => sum + Number(tx.consumer_benefit_pct ?? 0), 0) /
          completedTransactions.length
        : 0;
    const platformFeePctAvg =
      completedTransactions.length > 0
        ? completedTransactions.reduce((sum, tx) => sum + Number(tx.evoucher_benefit_pct ?? 0), 0) /
          completedTransactions.length
        : 0;

    const savingsRatePct =
      totalSpent > 0 ? (totalCashSaved / totalSpent) * 100 : consumerSavingsPctAvg;

    const cashbackPer100 = round2((consumerSavingsPctAvg / 100) * 100);
    const activeVouchers = (vouchersRes.data ?? []).filter(
      (voucher) => voucher.is_active && Number(voucher.current_balance ?? 0) > 0
    ).length;

    return NextResponse.json({
      totalCashSaved: round2(totalCashSaved),
      thisMonthSavings: round2(thisMonthSavings),
      averageAnnualSavings: round2(averageAnnualSavings),
      savingsRatePct: round2(savingsRatePct),
      totalSpent: round2(totalSpent),
      thisMonthSpend: round2(thisMonthSpend),
      totalPlatformFeeAmount: round2(totalPlatformFeeAmount),
      merchantDiscountPct: round2(totalDiscountPctAvg),
      consumerSavingsPct: round2(consumerSavingsPctAvg),
      platformFeePct: round2(platformFeePctAvg),
      cashbackPer100,
      activeVouchers,
      monthlySeries,
      recentTransactions: completedTransactions.slice(0, 12).map((tx) => ({
        id: tx.id,
        merchantName: merchantNames[String(tx.merchant_id ?? '')] ?? 'Unknown Merchant',
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
