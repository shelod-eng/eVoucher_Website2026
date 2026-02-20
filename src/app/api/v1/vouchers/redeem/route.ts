import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';
import { RedeemVoucherRequest } from '@/types/domain';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { DefaultVoucherService } from '@/server/services/voucher/default-voucher-service';
import { writeAuditEvent, writeFraudAlert } from '@/server/utils/audit';

function validate(body: RedeemVoucherRequest): string | null {
  if (!body.voucherCode?.trim()) return 'Voucher code is required.';
  if (!body.merchantId?.trim()) return 'Merchant is required.';
  if (!body.idempotencyKey?.trim()) return 'Idempotency key is required.';
  if (!Number.isFinite(body.amount) || body.amount <= 0) return 'Amount must be > 0.';
  return null;
}

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as RedeemVoucherRequest;
    const validationError = validate(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const admin = createAdminClient();
    const voucherService = new DefaultVoucherService();

    const { data: merchant, error: merchantError } = await admin
      .from('merchants')
      .select('id,business_name,status')
      .eq('id', body.merchantId)
      .in('status', ['active', 'approved'])
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not available.' }, { status: 404 });
    }

    const redemption = await voucherService.redeemVoucher({
      voucherCode: body.voucherCode.trim(),
      customerId: user.id,
      merchantName: merchant.business_name,
      amount: Number(body.amount),
      idempotencyKey: body.idempotencyKey.trim(),
    });

    const { data: voucherRecord } = await admin
      .from('customer_vouchers')
      .select('total_discount_pct')
      .eq('voucher_code', body.voucherCode.trim())
      .eq('customer_id', user.id)
      .maybeSingle();

    const totalDiscountPct = Number(
      voucherRecord?.total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT
    );
    const payoutMultiplier = Math.max(0, 1 - totalDiscountPct / 100);
    const merchantPayoutAmount = Number((Number(body.amount) * payoutMultiplier).toFixed(2));

    await admin.from('merchant_payouts').insert({
      merchant_id: merchant.id,
      amount: merchantPayoutAmount,
      status: 'pending',
    });

    await writeAuditEvent(admin, {
      actorId: user.id,
      actorRole: 'customer',
      entityType: 'voucher_redemption',
      entityId: redemption.redemptionId,
      action: 'voucher_redeemed',
      metadata: {
        merchantId: merchant.id,
        amount: body.amount,
        idempotencyKey: body.idempotencyKey,
      },
      requestId: body.idempotencyKey,
    });

    if (body.amount >= 5000) {
      await writeFraudAlert(admin, {
        actorId: user.id,
        relatedEntityType: 'voucher_redemption',
        relatedEntityId: redemption.redemptionId,
        riskScore: 75,
        ruleHit: 'high_redemption_amount',
        details: {
          amount: body.amount,
          merchantId: merchant.id,
        },
      });
    }

    return NextResponse.json({
      remainingBalance: redemption.remainingBalance,
      redemptionId: redemption.redemptionId,
      merchantPayoutAmount,
      merchantPayoutQueued: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to redeem voucher.' },
      { status: 500 }
    );
  }
}
