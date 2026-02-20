import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';

interface CreateMerchantProductRequest {
  productName: string;
  faceValue: number;
  totalDiscountPct?: number;
}

function validateCreate(body: CreateMerchantProductRequest): string | null {
  if (!body.productName?.trim()) return 'Product name is required.';
  if (!Number.isFinite(body.faceValue) || body.faceValue <= 0) return 'Face value must be greater than 0.';
  if (body.faceValue > 100000) return 'Face value exceeds the allowed limit.';
  if (
    body.totalDiscountPct !== undefined &&
    (!Number.isFinite(body.totalDiscountPct) || body.totalDiscountPct < 0 || body.totalDiscountPct > 100)
  ) {
    return 'Total discount percentage must be between 0 and 100.';
  }
  return null;
}

async function resolveMerchantId(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: merchant, error } = await admin
    .from('merchants')
    .select('id,default_total_discount_pct,status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return merchant;
}

export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const merchant = await resolveMerchantId(admin, user.id);
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    }

    const { data: products, error: productsError } = await admin
      .from('merchant_products')
      .select(
        'id,product_name,face_value,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,total_discount_amount,consumer_benefit_amount,evoucher_benefit_amount,consumer_price,merchant_receivable_after_total_discount,merchant_receivable_after_evoucher_benefit,is_active,created_at,updated_at'
      )
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;

    return NextResponse.json({
      merchantId: merchant.id,
      merchantStatus: merchant.status,
      defaultTotalDiscountPct: Number(merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT),
      products: products ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load merchant products.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as CreateMerchantProductRequest;
    const validationError = validateCreate(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const admin = createAdminClient();
    const merchant = await resolveMerchantId(admin, user.id);
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    }

    const totalDiscountPct = Number(
      body.totalDiscountPct ?? merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT
    );
    const pricing = calculateDiscountPricing(body.faceValue, totalDiscountPct);

    const { data: product, error: insertError } = await admin
      .from('merchant_products')
      .insert({
        merchant_id: merchant.id,
        product_name: body.productName.trim(),
        face_value: pricing.faceValue,
        total_discount_pct: pricing.totalDiscountPct,
        consumer_benefit_pct: pricing.consumerBenefitPct,
        evoucher_benefit_pct: pricing.evoucherBenefitPct,
        total_discount_amount: pricing.totalDiscountAmount,
        consumer_benefit_amount: pricing.consumerBenefitAmount,
        evoucher_benefit_amount: pricing.evoucherBenefitAmount,
        consumer_price: pricing.consumerPrice,
        merchant_receivable_after_total_discount: pricing.merchantReceivableAfterTotalDiscount,
        merchant_receivable_after_evoucher_benefit: pricing.merchantReceivableAfterEvoucherBenefit,
        is_active: true,
      })
      .select(
        'id,product_name,face_value,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,total_discount_amount,consumer_benefit_amount,evoucher_benefit_amount,consumer_price,merchant_receivable_after_total_discount,merchant_receivable_after_evoucher_benefit,is_active,created_at'
      )
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(
      {
        message: 'Product created successfully.',
        product,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create merchant product.' },
      { status: 500 }
    );
  }
}
