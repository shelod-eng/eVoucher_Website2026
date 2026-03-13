import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isMerchantRole, resolveUserRole } from '@/server/utils/role';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';
import { writeAuditEvent } from '@/server/utils/audit';

const VALID_BADGES = [
  'Weekend Special',
  'Flash Sale',
  'Monthly Deal',
  'Clearance',
  'Member Exclusive',
] as const;

function isMissingColumn(error: any, columnName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const normalizedColumn = columnName.toLowerCase();
  return (
    (message.includes(`column "${normalizedColumn}"`) && message.includes('does not exist')) ||
    (message.includes(`column ${normalizedColumn}`) && message.includes('does not exist')) ||
    (message.includes(`column "merchant_products.${normalizedColumn}"`) &&
      message.includes('does not exist')) ||
    (message.includes(`column merchant_products.${normalizedColumn}`) &&
      message.includes('does not exist')) ||
    message.includes(`could not find the '${normalizedColumn}' column`) ||
    message.includes(`could not find the column '${normalizedColumn}'`)
  );
}

function isMissingSpecialsColumn(error: any) {
  return ['is_special', 'special_title', 'special_end_at', 'display_priority'].some((column) =>
    isMissingColumn(error, column)
  );
}

function canOperateMerchantProducts(role: string, merchant: any, userId: string) {
  if (isMerchantRole(role)) return true;
  return Boolean(merchant?.user_id) && String(merchant.user_id) === String(userId);
}

async function safeAuditPromotionEvent(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    actorId: string;
    merchantId: string;
    productId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await writeAuditEvent(admin as any, {
      actorId: input.actorId,
      actorRole: 'merchant',
      entityType: 'merchant_product',
      entityId: input.productId,
      action: input.action,
      metadata: {
        merchantId: input.merchantId,
        ...(input.metadata ?? {}),
      },
      requestId: null,
    });
  } catch (auditError: any) {
    console.warn('[merchant-products][promotion-audit][warn]', auditError?.message || auditError);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<any>(
      admin,
      user,
      'id,user_id,business_name,parent_brand,status'
    );
    if (!merchant)
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    if (!canOperateMerchantProducts(role, merchant, user.id)) {
      return NextResponse.json(
        { error: 'Merchant product management is merchant-only.', code: 'merchant_only' },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}) as any)) as {
      promotionalBadge?: string;
      promotionExpiresAt?: string | null;
      displayPriority?: number;
    };
    const promotionalBadge = String(body.promotionalBadge ?? '').trim();
    if (!VALID_BADGES.includes(promotionalBadge as (typeof VALID_BADGES)[number])) {
      return NextResponse.json(
        { error: `Badge must be one of: ${VALID_BADGES.join(', ')}` },
        { status: 400 }
      );
    }
    if (!body.promotionExpiresAt) {
      return NextResponse.json({ error: 'promotionExpiresAt is required.' }, { status: 400 });
    }
    const endAt = new Date(String(body.promotionExpiresAt));
    if (Number.isNaN(endAt.getTime()) || endAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'promotionExpiresAt must be a valid future date/time.' },
        { status: 400 }
      );
    }

    const displayPriority = Number(body.displayPriority ?? 100);
    if (!Number.isFinite(displayPriority) || displayPriority < 0) {
      return NextResponse.json({ error: 'displayPriority must be >= 0.' }, { status: 400 });
    }

    const updateResult = await admin
      .from('merchant_products')
      .update({
        is_special: true,
        special_title: promotionalBadge,
        special_end_at: endAt.toISOString(),
        display_priority: displayPriority,
      })
      .eq('id', params.id)
      .eq('merchant_id', merchant.id)
      .select(
        'id,product_name,is_active,is_special,special_title,special_end_at,display_priority,updated_at'
      )
      .single();

    if (updateResult.error && !isMissingSpecialsColumn(updateResult.error))
      throw updateResult.error;
    if (updateResult.error && isMissingSpecialsColumn(updateResult.error)) {
      return NextResponse.json(
        { error: 'Promotions are not available until specials columns are migrated.' },
        { status: 409 }
      );
    }

    await safeAuditPromotionEvent(admin, {
      actorId: user.id,
      merchantId: merchant.id,
      productId: String(params.id),
      action: 'merchant_product_promoted',
      metadata: {
        promotionalBadge,
        promotionExpiresAt: endAt.toISOString(),
      },
    });

    return NextResponse.json({
      message: 'Promotion applied successfully.',
      product: updateResult.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to apply promotion.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<any>(
      admin,
      user,
      'id,user_id,business_name,parent_brand,status'
    );
    if (!merchant)
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    if (!canOperateMerchantProducts(role, merchant, user.id)) {
      return NextResponse.json(
        { error: 'Merchant product management is merchant-only.', code: 'merchant_only' },
        { status: 403 }
      );
    }

    const clearResult = await admin
      .from('merchant_products')
      .update({
        is_special: false,
        special_title: null,
        special_end_at: null,
        display_priority: 0,
      })
      .eq('id', params.id)
      .eq('merchant_id', merchant.id)
      .select('id,product_name,is_special,special_title,special_end_at,display_priority,updated_at')
      .single();

    if (clearResult.error && !isMissingSpecialsColumn(clearResult.error)) throw clearResult.error;
    if (clearResult.error && isMissingSpecialsColumn(clearResult.error)) {
      return NextResponse.json(
        { error: 'Promotions are not available until specials columns are migrated.' },
        { status: 409 }
      );
    }

    await safeAuditPromotionEvent(admin, {
      actorId: user.id,
      merchantId: merchant.id,
      productId: String(params.id),
      action: 'merchant_product_promotion_cleared',
    });

    return NextResponse.json({
      message: 'Promotion removed successfully.',
      product: clearResult.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to remove promotion.' },
      { status: 500 }
    );
  }
}
