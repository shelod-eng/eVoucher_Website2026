import { createAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';
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
      .select('id, voucher_id, merchant_name, amount')
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
    const voucherIds = pendingRedemptions
      .map((row) => row.voucher_id as string | null)
      .filter((id): id is string => Boolean(id));

    const voucherDiscountMap = new Map<string, number>();
    if (voucherIds.length > 0) {
      const { data: vouchers, error: vouchersError } = await admin
        .from('customer_vouchers')
        .select('id,total_discount_pct')
        .in('id', voucherIds);

      if (vouchersError) throw vouchersError;
      (vouchers ?? []).forEach((voucher) => {
        voucherDiscountMap.set(
          voucher.id,
          Number(voucher.total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT)
        );
      });
    }

    const payouts = pendingRedemptions
      .map((row) => {
        const totalDiscountPct = row.voucher_id
          ? (voucherDiscountMap.get(row.voucher_id) ?? DEFAULT_TOTAL_DISCOUNT_PCT)
          : DEFAULT_TOTAL_DISCOUNT_PCT;
        const payoutMultiplier = Math.max(0, 1 - totalDiscountPct / 100);
        return {
          merchant_id: merchantMap.get(row.merchant_name),
          amount: Number((Number(row.amount) * payoutMultiplier).toFixed(2)),
          status: 'pending',
        };
      })
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
