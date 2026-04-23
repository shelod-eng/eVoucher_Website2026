import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';
import { DefaultVoucherService } from '@/server/services/voucher/default-voucher-service';

function validate(body: any): string | null {
  const voucherCode = String(body?.voucherCode ?? '').trim();
  if (!voucherCode) return 'Voucher code is required.';

  const amount = Number(body?.amount ?? 100);
  if (!Number.isFinite(amount) || amount <= 0) return 'Voucher amount must be greater than zero.';
  if (amount > 100000) return 'Voucher amount exceeds the allowed limit.';

  return null;
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be signed in to add a voucher.', code: 'unauthenticated' },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return NextResponse.json(
        {
          error: 'Only signed-in consumers can add vouchers to wallet.',
          code: 'consumer_only_wallet_add_voucher',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationError = validate(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: 'invalid_wallet_add_voucher' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const voucherCode = String(body.voucherCode).trim().toUpperCase();
    const faceValue = Number(body.amount ?? 100);

    const existing = await admin
      .from('customer_vouchers')
      .select('id,voucher_code,face_value')
      .eq('customer_id', user.id)
      .eq('voucher_code', voucherCode)
      .maybeSingle();
    if (existing.error) throw existing.error;

    if (existing.data?.id) {
      return NextResponse.json({
        status: 'active',
        voucherCode: existing.data.voucher_code ?? voucherCode,
        faceValue: Number(existing.data.face_value ?? faceValue),
        duplicate: true,
      });
    }

    let merchantId = String(body?.merchantId ?? '').trim();
    let merchantName = 'Participating Merchant';
    let parentBrand = 'Participating Merchant';
    let totalDiscountPct = DEFAULT_TOTAL_DISCOUNT_PCT;

    if (merchantId) {
      const merchantLookup = await admin
        .from('merchants')
        .select('id,business_name,parent_brand,default_total_discount_pct')
        .eq('id', merchantId)
        .maybeSingle();
      if (merchantLookup.error) throw merchantLookup.error;
      if (merchantLookup.data) {
        merchantId = String(merchantLookup.data.id);
        merchantName = String(merchantLookup.data.business_name ?? merchantName);
        parentBrand = String(
          merchantLookup.data.parent_brand ?? merchantLookup.data.business_name ?? parentBrand
        );
        totalDiscountPct = Number(
          merchantLookup.data.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT
        );
      }
    }

    if (!merchantId) {
      const merchantLookup = await admin
        .from('merchants')
        .select('id,business_name,parent_brand,default_total_discount_pct,status')
        .in('status', ['approved', 'active'])
        .order('business_name', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (merchantLookup.error) throw merchantLookup.error;
      if (!merchantLookup.data?.id) {
        throw new Error('No active merchant is available for voucher issuance.');
      }
      merchantId = String(merchantLookup.data.id);
      merchantName = String(merchantLookup.data.business_name ?? merchantName);
      parentBrand = String(
        merchantLookup.data.parent_brand ?? merchantLookup.data.business_name ?? parentBrand
      );
      totalDiscountPct = Number(
        merchantLookup.data.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT
      );
    }

    const pricing = calculateDiscountPricing(faceValue, totalDiscountPct);
    const service = new DefaultVoucherService();
    await service.issueVoucher({
      customerId: user.id,
      merchantId,
      merchantName,
      parentBrand,
      faceValue,
      discountPercent: pricing.consumerBenefitPct,
      pricing,
      voucherCode,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.json({
      status: 'active',
      voucherCode,
      faceValue,
      duplicate: false,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to add voucher to wallet.',
        code: 'wallet_add_voucher_failed',
      },
      { status: 500 }
    );
  }
}
