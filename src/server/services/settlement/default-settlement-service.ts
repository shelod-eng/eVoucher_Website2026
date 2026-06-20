import { createAdminClient } from '@/lib/supabase/admin';
import { calculateRevenue } from '@/lib/billing/revenue-calculator';
import {
  SettlementQueueResult,
  SettlementReconcileResult,
  SettlementService,
} from '@/server/services/settlement-service';

// Settlement target is configured via env — 'sponsor_bank' (default) or 'evoucher_bank'
const SETTLEMENT_TARGET = String(
  process.env.SETTLEMENT_TARGET ?? 'sponsor_bank'
).trim().toLowerCase();

export class DefaultSettlementService implements SettlementService {
  async queuePayouts(): Promise<SettlementQueueResult> {
    const admin = createAdminClient();

    const { data: pendingRedemptions, error } = await admin
      .from('redemption_history')
      .select('id, voucher_id, merchant_name, amount')
      .eq('transaction_type', 'redemption');

    if (error) throw error;
    if (!pendingRedemptions || pendingRedemptions.length === 0) return { queuedPayouts: 0 };

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

    const voucherFaceValueMap = new Map<string, number>();
    if (voucherIds.length > 0) {
      const { data: vouchers, error: vouchersError } = await admin
        .from('customer_vouchers')
        .select('id,face_value,total_discount_pct')
        .in('id', voucherIds);
      if (vouchersError) throw vouchersError;
      (vouchers ?? []).forEach((voucher) => {
        voucherFaceValueMap.set(voucher.id, Number(voucher.face_value ?? voucher.total_discount_pct ?? 0));
      });
    }

    const now = new Date().toISOString();
    const payouts = pendingRedemptions
      .map((row) => {
        const merchantId = merchantMap.get(row.merchant_name);
        if (!merchantId) return null;
        // Use face value for TRD v2 split; fall back to redemption amount
        const faceValue = row.voucher_id
          ? (voucherFaceValueMap.get(row.voucher_id) ?? Number(row.amount))
          : Number(row.amount);
        const trd = calculateRevenue(Math.max(0.01, faceValue));
        return {
          merchant_id: merchantId,
          amount: trd.merchantNetPayout,
          gross_amount: trd.merchantGrossPayout,
          bank_fee_amount: trd.bankFee,
          consumer_benefit_amount: trd.consumerBenefit,
          platform_revenue_amount: trd.platformRevenue,
          settlement_target: SETTLEMENT_TARGET,
          status: 'pending',
          created_at: now,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (payouts.length === 0) return { queuedPayouts: 0 };

    // Write to merchant_payouts (merchant-facing) and mirror to billing_settlements (billing engine)
    const { error: payoutError } = await admin.from('merchant_payouts').insert(
      payouts.map((p) => ({
        merchant_id: p.merchant_id,
        amount: p.amount,
        status: p.status,
      }))
    );
    if (payoutError) throw payoutError;

    // Mirror to billing_settlements for Billing Engine visibility — soft-fail if table missing
    try {
      await admin.from('billing_settlements').insert(
        payouts.map((p) => ({
          merchant_id: p.merchant_id,
          amount: p.amount,
          gross_amount: p.gross_amount,
          bank_fee_amount: p.bank_fee_amount,
          consumer_benefit_amount: p.consumer_benefit_amount,
          platform_revenue_amount: p.platform_revenue_amount,
          settlement_target: p.settlement_target,
          status: 'pending',
          created_at: now,
        }))
      );
    } catch {
      // billing_settlements table may not exist in all environments — non-fatal
    }

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
