import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';

function resolveTier(points: number) {
  if (points >= 10000) return 'Platinum';
  if (points >= 5000) return 'Gold';
  if (points >= 1500) return 'Silver';
  return 'Bronze';
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
          'id,amount,consumer_benefit_amount,evoucher_benefit_amount,total_discount_amount,payment_status,created_at'
        )
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500),
      admin
        .from('customer_vouchers')
        .select('id,current_balance,is_active,issued_at')
        .eq('customer_id', user.id)
        .order('issued_at', { ascending: false })
        .limit(500),
    ]);

    if (transactionsRes.error) throw transactionsRes.error;
    if (vouchersRes.error) throw vouchersRes.error;

    const allTransactions = transactionsRes.data ?? [];
    const completedTransactions = allTransactions.filter(
      (transaction) => transaction.payment_status === 'completed'
    );
    const pendingTransactions = allTransactions.filter(
      (transaction) => transaction.payment_status === 'pending'
    );

    const now = Date.now();
    const pointsValidityDays = 365;
    const expiryWindowDays = 30;
    const validCutoff = now - pointsValidityDays * 24 * 60 * 60 * 1000;
    const expiringSoonCutoff = now - (pointsValidityDays - expiryWindowDays) * 24 * 60 * 60 * 1000;

    const activePointsBaseSavings = completedTransactions
      .filter((transaction) => new Date(transaction.created_at).getTime() >= validCutoff)
      .reduce((total, transaction) => total + Number(transaction.consumer_benefit_amount ?? 0), 0);
    const expiringSoonBaseSavings = completedTransactions
      .filter((transaction) => {
        const created = new Date(transaction.created_at).getTime();
        return created >= expiringSoonCutoff && created < validCutoff;
      })
      .reduce((total, transaction) => total + Number(transaction.consumer_benefit_amount ?? 0), 0);

    const totalSavings = completedTransactions.reduce(
      (total, transaction) => total + Number(transaction.consumer_benefit_amount ?? 0),
      0
    );
    const totalPlatformBenefit = completedTransactions.reduce(
      (total, transaction) => total + Number(transaction.evoucher_benefit_amount ?? 0),
      0
    );
    const totalSpent = completedTransactions.reduce(
      (total, transaction) => total + Number(transaction.amount ?? 0),
      0
    );
    const pendingSavings = pendingTransactions.reduce(
      (total, transaction) => total + Number(transaction.consumer_benefit_amount ?? 0),
      0
    );
    const lifetimePoints = Math.max(0, Math.floor(totalSavings * 10));
    const currentPoints = Math.max(0, Math.floor(activePointsBaseSavings * 10));
    const pendingPoints = Math.max(0, Math.floor(pendingSavings * 10));
    const expiredPoints = Math.max(0, lifetimePoints - currentPoints);
    const expiringSoonPoints = Math.max(0, Math.floor(expiringSoonBaseSavings * 10));
    const tier = resolveTier(currentPoints);

    const monthlySeriesMap = new Map<string, { month: string; spent: number; savings: number }>();
    completedTransactions.forEach((transaction) => {
      const month = new Date(transaction.created_at).toISOString().slice(0, 7);
      const existing = monthlySeriesMap.get(month) ?? { month, spent: 0, savings: 0 };
      existing.spent += Number(transaction.amount ?? 0);
      existing.savings += Number(transaction.consumer_benefit_amount ?? 0);
      monthlySeriesMap.set(month, existing);
    });

    const monthlySeries = Array.from(monthlySeriesMap.values())
      .map((entry) => ({
        month: entry.month,
        spent: Number(entry.spent.toFixed(2)),
        savings: Number(entry.savings.toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const activeVouchers = (vouchersRes.data ?? []).filter((voucher) => voucher.is_active).length;

    return NextResponse.json({
      points: currentPoints,
      currentPoints,
      lifetimePoints,
      pendingPoints,
      expiredPoints,
      expiringSoonPoints,
      tier,
      totalSpent: Number(totalSpent.toFixed(2)),
      totalSavings: Number(totalSavings.toFixed(2)),
      totalPlatformBenefit: Number(totalPlatformBenefit.toFixed(2)),
      activeVouchers,
      monthlySeries,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load rewards summary.' },
      { status: 500 }
    );
  }
}
