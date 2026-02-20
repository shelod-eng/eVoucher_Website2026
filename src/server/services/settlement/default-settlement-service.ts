import { createAdminClient } from '@/lib/supabase/admin';
import {
  SettlementQueueResult,
  SettlementReconcileResult,
  SettlementService,
} from '@/server/services/settlement-service';

export class DefaultSettlementService implements SettlementService {
  async queuePayouts(): Promise<SettlementQueueResult> {
    const admin = createAdminClient();

    const { data: pendingRedemptions, error } = await admin
      .from('redemption_history')
      .select('id, merchant_name, amount')
      .eq('transaction_type', 'redemption');

    if (error) throw error;

    if (!pendingRedemptions || pendingRedemptions.length === 0) {
      return { queuedPayouts: 0 };
    }

    const { data: merchants, error: merchantsError } = await admin
      .from('merchants')
      .select('id, business_name')
      .in(
        'business_name',
        pendingRedemptions.map((row) => row.merchant_name)
      );

    if (merchantsError) throw merchantsError;

    const merchantMap = new Map((merchants ?? []).map((m) => [m.business_name, m.id]));
    const payouts = pendingRedemptions
      .map((row) => ({
        merchant_id: merchantMap.get(row.merchant_name),
        amount: Number((Number(row.amount) * 0.7).toFixed(2)),
        status: 'pending',
      }))
      .filter((row) => Boolean(row.merchant_id));

    if (payouts.length === 0) return { queuedPayouts: 0 };

    const { error: payoutError } = await admin.from('merchant_payouts').insert(payouts);
    if (payoutError) throw payoutError;

    return { queuedPayouts: payouts.length };
  }

  async reconcilePayouts(): Promise<SettlementReconcileResult> {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('merchant_payouts')
      .update({
        status: 'completed',
        payout_date: new Date().toISOString(),
      })
      .eq('status', 'pending')
      .select('id');

    if (error) throw error;
    return { reconciledPayouts: data?.length ?? 0 };
  }
}
