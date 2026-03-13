import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';
import { RedeemVoucherRequest } from '@/types/domain';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { writeAuditEvent, writeFraudAlert } from '@/server/utils/audit';
import { sha256 } from '@/server/utils/security';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';

type VoucherRow = {
  id: string;
  customer_id: string;
  merchant_id: string | null;
  merchant_name: string;
  parent_brand: string | null;
  product_id: string | null;
  voucher_code: string;
  face_value: number;
  current_balance: number;
  is_active: boolean;
  expires_at: string | null;
  redemption_scope: 'all_branches' | 'specific_branch' | 'province_wide' | 'national' | null;
  valid_provinces: string[] | null;
  valid_branch_ids: string[] | null;
};

type MerchantRow = {
  id: string;
  business_name: string;
  parent_brand: string | null;
  branch_name: string | null;
  province: string | null;
  status: string;
  default_total_discount_pct: number | null;
};

type VoucherStatus = 'active' | 'partial' | 'used' | 'expired';

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const relation = relationName.toLowerCase();
  const bareRelation = relation.includes('.') ? (relation.split('.').at(-1) ?? relation) : relation;
  return (
    message.includes(`relation "${relation}" does not exist`) ||
    message.includes(`relation "${bareRelation}" does not exist`) ||
    message.includes(`could not find the table '${relation}' in the schema cache`) ||
    message.includes(`could not find the table '${bareRelation}' in the schema cache`)
  );
}

function isMissingColumn(error: any, columnName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const column = columnName.toLowerCase();
  return (
    message.includes(`column "${column}" does not exist`) ||
    message.includes(`column ${column} does not exist`) ||
    message.includes(`could not find the '${column}' column`) ||
    message.includes(`could not find the "${column}" column`)
  );
}

function toUpperCode(value: string) {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

function parseAmount(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return NaN;
  return Number(numberValue.toFixed(2));
}

function normalizeScope(
  value: unknown
): 'all_branches' | 'specific_branch' | 'province_wide' | 'national' {
  const scope = String(value ?? '')
    .trim()
    .toLowerCase();
  if (
    scope === 'all_branches' ||
    scope === 'specific_branch' ||
    scope === 'province_wide' ||
    scope === 'national'
  ) {
    return scope;
  }
  return 'all_branches';
}

function deriveVoucherStatus(voucher: VoucherRow): VoucherStatus {
  const balance = Number(voucher.current_balance ?? voucher.face_value ?? 0);
  const faceValue = Number(voucher.face_value ?? 0);
  const isExpired =
    Boolean(voucher.expires_at) && new Date(String(voucher.expires_at)).getTime() < Date.now();

  if (isExpired && balance > 0) return 'expired';
  if (!voucher.is_active || balance <= 0) return 'used';
  if (balance < faceValue) return 'partial';
  return 'active';
}

function getVoucherBalance(voucher: VoucherRow) {
  const balance = Number(voucher.current_balance ?? voucher.face_value ?? 0);
  return Number(balance.toFixed(2));
}

async function fetchVoucherByCode(
  admin: any,
  customerId: string,
  voucherCode: string
): Promise<VoucherRow | null> {
  const fieldSets = [
    'id,customer_id,merchant_id,merchant_name,parent_brand,product_id,voucher_code,face_value,current_balance,is_active,expires_at,redemption_scope,valid_provinces,valid_branch_ids',
    'id,customer_id,merchant_id,merchant_name,product_id,voucher_code,face_value,current_balance,is_active,expires_at',
  ];

  for (const fields of fieldSets) {
    const response = await admin
      .from('customer_vouchers')
      .select(fields)
      .eq('customer_id', customerId)
      .eq('voucher_code', voucherCode)
      .maybeSingle();
    if (!response.error) {
      return (response.data as VoucherRow | null) ?? null;
    }
  }

  return null;
}

async function fetchVoucherByCodeGlobal(
  admin: any,
  voucherCode: string
): Promise<VoucherRow | null> {
  const fieldSets = [
    'id,customer_id,merchant_id,merchant_name,parent_brand,product_id,voucher_code,face_value,current_balance,is_active,expires_at,redemption_scope,valid_provinces,valid_branch_ids',
    'id,customer_id,merchant_id,merchant_name,product_id,voucher_code,face_value,current_balance,is_active,expires_at',
  ];

  for (const fields of fieldSets) {
    const response = await admin
      .from('customer_vouchers')
      .select(fields)
      .eq('voucher_code', voucherCode)
      .maybeSingle();
    if (!response.error) {
      return (response.data as VoucherRow | null) ?? null;
    }
  }

  return null;
}

async function fetchProductName(admin: any, productId: string | null) {
  if (!productId) return null;
  const result = await admin
    .from('merchant_products')
    .select('product_name')
    .eq('id', productId)
    .maybeSingle();
  if (result.error || !result.data) return null;
  return String(result.data.product_name ?? '').trim() || null;
}

async function fetchActiveMerchantById(admin: any, merchantId: string | null) {
  if (!merchantId) return null;
  const fieldSets = [
    'id,business_name,parent_brand,branch_name,province,status,default_total_discount_pct',
    'id,business_name,branch_name,province,status,default_total_discount_pct',
    'id,business_name,status,default_total_discount_pct',
  ];

  for (const fields of fieldSets) {
    const response = await admin
      .from('merchants')
      .select(fields)
      .eq('id', merchantId)
      .in('status', ['active', 'approved'])
      .maybeSingle();
    if (!response.error && response.data) {
      return response.data as MerchantRow;
    }
  }

  return null;
}

async function fetchActiveMerchantByBrand(admin: any, brandName: string | null) {
  const target = String(brandName ?? '').trim();
  if (!target) return null;

  const fieldSets = [
    'id,business_name,parent_brand,branch_name,province,status,default_total_discount_pct',
    'id,business_name,branch_name,province,status,default_total_discount_pct',
    'id,business_name,status,default_total_discount_pct',
  ];

  for (const fields of fieldSets) {
    const byParent = await admin
      .from('merchants')
      .select(fields)
      .eq('parent_brand', target)
      .in('status', ['active', 'approved'])
      .order('approved_at', { ascending: false })
      .limit(1);
    if (!byParent.error && Array.isArray(byParent.data) && byParent.data.length > 0) {
      return byParent.data[0] as MerchantRow;
    }

    const byBusinessName = await admin
      .from('merchants')
      .select(fields)
      .eq('business_name', target)
      .in('status', ['active', 'approved'])
      .order('approved_at', { ascending: false })
      .limit(1);
    if (
      !byBusinessName.error &&
      Array.isArray(byBusinessName.data) &&
      byBusinessName.data.length > 0
    ) {
      return byBusinessName.data[0] as MerchantRow;
    }
  }

  return null;
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function normalizeTextArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => normalizeText(entry)).filter((entry) => entry.length > 0);
}

function normalizeUuidArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry)).filter((entry) => entry.length > 0);
}

function validateScope(voucher: VoucherRow, merchant: MerchantRow | null) {
  const scope = normalizeScope(voucher.redemption_scope);
  if (!merchant) {
    if (scope === 'specific_branch') {
      return { valid: false, message: 'Voucher requires a specific branch for redemption.' };
    }
    return { valid: true };
  }

  const voucherBrand = normalizeText(voucher.parent_brand || voucher.merchant_name);
  const merchantBrand = normalizeText(merchant.parent_brand || merchant.business_name);
  if (voucherBrand && merchantBrand && voucherBrand !== merchantBrand) {
    return { valid: false, message: 'Voucher is not valid for this brand.' };
  }

  if (scope === 'all_branches' || scope === 'national') {
    return { valid: true };
  }

  if (scope === 'specific_branch') {
    const validBranchIds = normalizeUuidArray(voucher.valid_branch_ids);
    if (validBranchIds.length > 0 && !validBranchIds.includes(merchant.id)) {
      return { valid: false, message: 'Voucher is not valid for this branch.' };
    }
    return { valid: true };
  }

  if (scope === 'province_wide') {
    const validProvinces = normalizeTextArray(voucher.valid_provinces);
    const merchantProvince = normalizeText(merchant.province);
    if (
      validProvinces.length > 0 &&
      (!merchantProvince || !validProvinces.includes(merchantProvince))
    ) {
      return { valid: false, message: 'Voucher is not valid in this province.' };
    }
    return { valid: true };
  }

  return { valid: true };
}

function buildVoucherPayload(voucher: VoucherRow, userEmail: string, productName: string | null) {
  const status = deriveVoucherStatus(voucher);
  return {
    id: voucher.id,
    code: voucher.voucher_code,
    user_email: userEmail,
    face_value: Number(voucher.face_value ?? 0),
    balance: getVoucherBalance(voucher),
    status,
    redemption_scope: normalizeScope(voucher.redemption_scope),
    merchant_name: voucher.merchant_name,
    parent_brand: voucher.parent_brand ?? voucher.merchant_name,
    product_name: productName ?? 'Voucher',
    expiry_date: voucher.expires_at,
    merchant_id: voucher.merchant_id,
  };
}

function validatePostBody(body: Partial<RedeemVoucherRequest> & { voucherCode?: string }) {
  if (!toUpperCode(body.voucherCode ?? '')) return 'Voucher code is required.';
  if (!Number.isFinite(Number(body.amount)) || Number(body.amount) <= 0)
    return 'Amount must be greater than zero.';
  return null;
}

async function createWalletTransaction(
  admin: any,
  input: {
    customerId: string;
    customerEmail: string;
    voucherId: string;
    voucherCode: string;
    merchantName: string;
    amount: number;
  }
) {
  const walletTxResponse = await admin.from('wallet_transactions').insert({
    customer_id: input.customerId,
    voucher_id: input.voucherId,
    user_email: input.customerEmail,
    type: 'redemption',
    amount: input.amount,
    description: `Voucher redeemed at ${input.merchantName}`,
    merchant_name: input.merchantName,
    voucher_code: input.voucherCode,
    savings: 0,
  });

  if (!walletTxResponse.error) {
    return;
  }

  if (!isMissingRelation(walletTxResponse.error, 'public.wallet_transactions')) {
    throw walletTxResponse.error;
  }

  const redemptionHistoryResponse = await admin.from('redemption_history').insert({
    customer_id: input.customerId,
    voucher_id: input.voucherId,
    merchant_name: input.merchantName,
    amount: input.amount,
    transaction_type: 'redemption',
  });
  if (redemptionHistoryResponse.error) {
    throw redemptionHistoryResponse.error;
  }
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = toUpperCode(searchParams.get('code') ?? '');
    if (!code) {
      return NextResponse.json({ error: 'Voucher code is required.' }, { status: 400 });
    }

    const { role } = await resolveUserRole(supabase, user);
    const admin = createAdminClient();

    let merchantContext: MerchantRow | null = null;
    if (role === 'merchant') {
      merchantContext = await resolveMerchantForUser<MerchantRow>(
        admin,
        user,
        'id,business_name,parent_brand,branch_name,province,status,default_total_discount_pct'
      );
    }

    const voucher =
      role === 'merchant'
        ? await fetchVoucherByCodeGlobal(admin, code)
        : await fetchVoucherByCode(admin, user.id, code);
    if (!voucher) {
      return NextResponse.json({ error: 'No voucher found with this code.' }, { status: 404 });
    }

    const productName = await fetchProductName(admin, voucher.product_id);

    return NextResponse.json({
      voucher: buildVoucherPayload(
        voucher,
        role === 'merchant' ? 'Hidden' : (user.email ?? ''),
        productName
      ),
      actorRole: role,
      merchantContext: merchantContext
        ? {
            id: merchantContext.id,
            businessName: merchantContext.business_name,
            parentBrand: merchantContext.parent_brand,
            branchName: merchantContext.branch_name,
            province: merchantContext.province,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to search voucher.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    if (role !== 'merchant') {
      return NextResponse.json(
        { error: 'Only merchant accounts can redeem vouchers.', code: 'merchant_only_redemption' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Partial<RedeemVoucherRequest> & {
      voucherCode?: string;
      code?: string;
      merchantId?: string;
    };
    const voucherCode = toUpperCode(body.voucherCode ?? body.code ?? '');
    const amount = parseAmount(body.amount);
    const validationError = validatePostBody({ ...body, voucherCode, amount });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const admin = createAdminClient();

    const merchantContext = await resolveMerchantForUser<MerchantRow>(
      admin,
      user,
      'id,business_name,parent_brand,branch_name,province,status,default_total_discount_pct'
    );
    if (!merchantContext?.id) {
      return NextResponse.json(
        {
          error: 'Merchant account is not linked to a merchant profile.',
          code: 'merchant_profile_missing',
        },
        { status: 403 }
      );
    }

    const voucher = await fetchVoucherByCodeGlobal(admin, voucherCode);
    if (!voucher) {
      return NextResponse.json({ error: 'No voucher found with this code.' }, { status: 404 });
    }

    const currentBalance = getVoucherBalance(voucher);
    const currentStatus = deriveVoucherStatus(voucher);

    if (currentStatus === 'used') {
      return NextResponse.json(
        { error: 'Voucher has already been redeemed.', code: 'already_redeemed' },
        { status: 400 }
      );
    }
    if (currentStatus === 'expired') {
      return NextResponse.json({ error: 'Voucher has expired.', code: 'expired' }, { status: 400 });
    }
    if (amount > currentBalance) {
      return NextResponse.json(
        { error: 'Redemption amount exceeds voucher balance.', code: 'exceeds_balance' },
        { status: 400 }
      );
    }

    const merchant =
      (await fetchActiveMerchantById(admin, String(merchantContext.id).trim())) ??
      (await fetchActiveMerchantByBrand(
        admin,
        merchantContext.parent_brand ?? merchantContext.business_name
      ));

    const scopeValidation = validateScope(voucher, merchant);
    if (!scopeValidation.valid) {
      return NextResponse.json(
        {
          error: scopeValidation.message ?? 'Voucher is not valid for this merchant.',
          code: 'scope_invalid',
        },
        { status: 400 }
      );
    }

    const idempotencyKey = String(body.idempotencyKey ?? randomUUID()).trim();
    const requestHash = sha256(
      JSON.stringify({
        voucherCode,
        amount,
        merchantId: merchant?.id ?? null,
      })
    );

    const idempotencyRes = await admin
      .from('voucher_redemption_idempotency')
      .select('response_payload,request_hash')
      .eq('customer_id', voucher.customer_id)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (!idempotencyRes.error && idempotencyRes.data?.response_payload) {
      return NextResponse.json(idempotencyRes.data.response_payload);
    }
    if (
      idempotencyRes.error &&
      !isMissingRelation(idempotencyRes.error, 'public.voucher_redemption_idempotency')
    ) {
      throw idempotencyRes.error;
    }

    const newBalance = Number((currentBalance - amount).toFixed(2));
    const newStatus: VoucherStatus = newBalance <= 0 ? 'used' : 'partial';
    const redeemedAt = new Date().toISOString();

    const updatePayload = {
      current_balance: newBalance,
      is_active: newBalance > 0,
      redeemed_at_merchant_id: merchant?.id ?? null,
      redeemed_at_branch:
        merchant?.branch_name ??
        merchant?.business_name ??
        voucher.parent_brand ??
        voucher.merchant_name,
      redeemed_at: redeemedAt,
    };

    let updateRes = await admin
      .from('customer_vouchers')
      .update({ ...updatePayload, status: newStatus })
      .eq('id', voucher.id)
      .eq('customer_id', voucher.customer_id);

    if (updateRes.error && isMissingColumn(updateRes.error, 'status')) {
      updateRes = await admin
        .from('customer_vouchers')
        .update(updatePayload)
        .eq('id', voucher.id)
        .eq('customer_id', voucher.customer_id);
    }
    if (updateRes.error) {
      throw updateRes.error;
    }

    await createWalletTransaction(admin, {
      customerId: voucher.customer_id,
      customerEmail: 'Hidden',
      voucherId: voucher.id,
      voucherCode,
      merchantName:
        merchant?.parent_brand ??
        merchant?.business_name ??
        voucher.parent_brand ??
        voucher.merchant_name,
      amount,
    });

    let merchantPayoutAmount = 0;
    let merchantPayoutQueued = false;
    if (merchant?.id) {
      const totalDiscountPct = Number(
        merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT
      );
      const payoutMultiplier = Math.max(0, 1 - totalDiscountPct / 100);
      merchantPayoutAmount = Number((amount * payoutMultiplier).toFixed(2));
      const payoutRes = await admin.from('merchant_payouts').insert({
        merchant_id: merchant.id,
        amount: merchantPayoutAmount,
        status: 'pending',
      });
      if (!payoutRes.error) {
        merchantPayoutQueued = true;
      }
    }

    const responsePayload = {
      success: true,
      message:
        newStatus === 'used'
          ? 'Voucher redeemed successfully. Balance is now zero.'
          : `Voucher redeemed successfully. Remaining balance: R${newBalance.toFixed(2)}.`,
      newBalance,
      status: newStatus,
      remainingBalance: newBalance,
      redemptionId: idempotencyKey,
      merchantPayoutAmount,
      merchantPayoutQueued,
    };

    const idempotencyInsert = await admin.from('voucher_redemption_idempotency').insert({
      customer_id: voucher.customer_id,
      voucher_id: voucher.id,
      idempotency_key: idempotencyKey,
      request_hash: requestHash,
      response_payload: responsePayload,
    });
    if (
      idempotencyInsert.error &&
      !isMissingRelation(idempotencyInsert.error, 'public.voucher_redemption_idempotency')
    ) {
      // Ignore duplicate idempotency insert conflicts but raise non-duplicate failures.
      const message = String(idempotencyInsert.error.message ?? '').toLowerCase();
      if (!message.includes('duplicate key value')) {
        throw idempotencyInsert.error;
      }
    }

    await writeAuditEvent(admin, {
      actorId: user.id,
      actorRole: 'merchant',
      entityType: 'voucher_redemption',
      entityId: idempotencyKey,
      action: 'voucher_redeemed',
      metadata: {
        voucherCode,
        merchantId: merchant?.id ?? null,
        merchantBrand:
          merchant?.parent_brand ??
          merchant?.business_name ??
          voucher.parent_brand ??
          voucher.merchant_name,
        amount,
        status: newStatus,
        newBalance,
      },
      requestId: idempotencyKey,
    });

    if (amount >= 5000) {
      await writeFraudAlert(admin, {
        actorId: user.id,
        relatedEntityType: 'voucher_redemption',
        relatedEntityId: idempotencyKey,
        riskScore: 75,
        ruleHit: 'high_redemption_amount',
        details: {
          amount,
          merchantId: merchant?.id ?? null,
          voucherCode,
        },
      });
    }

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to redeem voucher.' },
      { status: 500 }
    );
  }
}
