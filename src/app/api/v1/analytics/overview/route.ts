import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';

function sumBy<T>(rows: T[], selector: (row: T) => number) {
  return rows.reduce((total, row) => total + selector(row), 0);
}

function toCurrency(value: number) {
  return Number(value.toFixed(2));
}

function buildMonthlySeries(
  transactions: Array<{
    created_at: string;
    merchant_id?: string | null;
    amount?: number | null;
    consumer_benefit_amount?: number | null;
    evoucher_benefit_amount?: number | null;
  }>
) {
  const byMonth = new Map<string, { month: string; volume: number; savings: number; margin: number }>();

  transactions.forEach((transaction) => {
    const month = new Date(transaction.created_at).toISOString().slice(0, 7);
    const existing = byMonth.get(month) ?? { month, volume: 0, savings: 0, margin: 0 };
    existing.volume += Number(transaction.amount ?? 0);
    existing.savings += Number(transaction.consumer_benefit_amount ?? 0);
    existing.margin += Number(transaction.evoucher_benefit_amount ?? 0);
    byMonth.set(month, existing);
  });

  return Array.from(byMonth.values())
    .map((entry) => ({
      month: entry.month,
      volume: toCurrency(entry.volume),
      savings: toCurrency(entry.savings),
      margin: toCurrency(entry.margin),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function buildMerchantSeries(
  transactions: Array<{
    merchant_id?: string | null;
    amount?: number | null;
    consumer_benefit_amount?: number | null;
  }>,
  merchantNames: Record<string, string>
) {
  const byMerchant = new Map<string, { merchantId: string; merchantName: string; spent: number; savings: number }>();
  transactions.forEach((transaction) => {
    const merchantId = String(transaction.merchant_id ?? 'unknown');
    const existing = byMerchant.get(merchantId) ?? {
      merchantId,
      merchantName: merchantNames[merchantId] ?? 'Unknown Merchant',
      spent: 0,
      savings: 0,
    };
    existing.spent += Number(transaction.amount ?? 0);
    existing.savings += Number(transaction.consumer_benefit_amount ?? 0);
    byMerchant.set(merchantId, existing);
  });

  return Array.from(byMerchant.values())
    .map((entry) => ({
      merchantId: entry.merchantId,
      merchantName: entry.merchantName,
      spent: toCurrency(entry.spent),
      savings: toCurrency(entry.savings),
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 12);
}

export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    const role = profile?.role ?? 'customer';
    if (role === 'customer') {
      const { data: customerTransactions, error: customerTransactionsError } = await admin
        .from('payment_transactions')
        .select('created_at,merchant_id,amount,consumer_benefit_amount,evoucher_benefit_amount,payment_status')
        .eq('customer_id', user.id)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(500);

      if (customerTransactionsError) throw customerTransactionsError;

      const completed = customerTransactions ?? [];
      const totalVolume = sumBy(completed, (row) => Number(row.amount ?? 0));
      const totalSavings = sumBy(completed, (row) => Number(row.consumer_benefit_amount ?? 0));
      const monthlySeries = buildMonthlySeries(completed);
      const merchantIds = Array.from(
        new Set(completed.map((row) => String(row.merchant_id ?? '')).filter(Boolean))
      );
      const merchantNames: Record<string, string> = {};
      if (merchantIds.length > 0) {
        const { data: merchantRows, error: merchantRowsError } = await admin
          .from('merchants')
          .select('id,business_name')
          .in('id', merchantIds);
        if (merchantRowsError) throw merchantRowsError;
        (merchantRows ?? []).forEach((merchant) => {
          merchantNames[merchant.id] = merchant.business_name;
        });
      }
      const merchantSeries = buildMerchantSeries(completed, merchantNames);

      return NextResponse.json({
        role,
        metrics: {
          totalVolume: toCurrency(totalVolume),
          totalSavings: toCurrency(totalSavings),
          totalMargin: toCurrency(sumBy(completed, (row) => Number(row.evoucher_benefit_amount ?? 0))),
          pendingSettlements: 0,
          paidSettlements: 0,
          transactionCount: completed.length,
          averageDiscountPct:
            totalVolume > 0 ? Number(((totalSavings / totalVolume) * 100).toFixed(2)) : 0,
          roiPct: totalVolume > 0 ? Number(((totalSavings / totalVolume) * 100).toFixed(2)) : 0,
        },
        monthlySeries,
        merchantSeries,
        recentTransactions: completed.slice(0, 8).map((row) => ({
          created_at: row.created_at,
          merchant_name: merchantNames[String(row.merchant_id ?? '')] ?? 'Unknown Merchant',
          amount: Number(row.amount ?? 0),
          savings: Number(row.consumer_benefit_amount ?? 0),
        })),
      });
    }

    let merchantId: string | null = null;
    if (role === 'merchant') {
      const { data: merchant, error: merchantError } = await admin
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (merchantError) throw merchantError;
      merchantId = merchant?.id ?? null;

      if (!merchantId) {
        return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
      }
    }

    let transactionsQuery = admin
      .from('payment_transactions')
      .select(
        'created_at,merchant_id,amount,consumer_benefit_amount,evoucher_benefit_amount,total_discount_pct,payment_status'
      )
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(2000);

    let payoutsQuery = admin
      .from('merchant_payouts')
      .select('amount,status,created_at')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (merchantId) {
      transactionsQuery = transactionsQuery.eq('merchant_id', merchantId);
      payoutsQuery = payoutsQuery.eq('merchant_id', merchantId);
    }

    const [transactionsRes, payoutsRes] = await Promise.all([transactionsQuery, payoutsQuery]);
    if (transactionsRes.error) throw transactionsRes.error;
    if (payoutsRes.error) throw payoutsRes.error;

    const transactions = transactionsRes.data ?? [];
    const payouts = payoutsRes.data ?? [];
    const totalVolume = sumBy(transactions, (row) => Number(row.amount ?? 0));
    const totalSavings = sumBy(transactions, (row) => Number(row.consumer_benefit_amount ?? 0));
    const totalMargin = sumBy(transactions, (row) => Number(row.evoucher_benefit_amount ?? 0));
    const pendingSettlements = sumBy(
      payouts.filter((payout) => payout.status === 'pending'),
      (payout) => Number(payout.amount ?? 0)
    );
    const paidSettlements = sumBy(
      payouts.filter((payout) => payout.status !== 'pending'),
      (payout) => Number(payout.amount ?? 0)
    );
    const monthlySeries = buildMonthlySeries(transactions);
    const merchantIds = Array.from(
      new Set(transactions.map((row) => String(row.merchant_id ?? '')).filter(Boolean))
    );
    const merchantNames: Record<string, string> = {};
    if (merchantIds.length > 0) {
      const { data: merchantRows, error: merchantRowsError } = await admin
        .from('merchants')
        .select('id,business_name')
        .in('id', merchantIds);
      if (merchantRowsError) throw merchantRowsError;
      (merchantRows ?? []).forEach((merchant) => {
        merchantNames[merchant.id] = merchant.business_name;
      });
    }
    const merchantSeries = buildMerchantSeries(transactions, merchantNames);
    const avgDiscountPct = transactions.length
      ? sumBy(transactions, (row) => Number(row.total_discount_pct ?? 0)) / transactions.length
      : 0;

    return NextResponse.json({
      role,
      merchantId,
      metrics: {
        totalVolume: toCurrency(totalVolume),
        totalSavings: toCurrency(totalSavings),
        totalMargin: toCurrency(totalMargin),
        pendingSettlements: toCurrency(pendingSettlements),
        paidSettlements: toCurrency(paidSettlements),
        transactionCount: transactions.length,
        averageDiscountPct: Number(avgDiscountPct.toFixed(2)),
        roiPct: totalVolume > 0 ? Number(((totalSavings / totalVolume) * 100).toFixed(2)) : 0,
      },
      monthlySeries,
      merchantSeries,
      recentTransactions: transactions.slice(0, 8).map((row) => ({
        created_at: row.created_at,
        merchant_name: merchantNames[String(row.merchant_id ?? '')] ?? 'Unknown Merchant',
        amount: Number(row.amount ?? 0),
        savings: Number(row.consumer_benefit_amount ?? 0),
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load analytics overview.' },
      { status: 500 }
    );
  }
}
