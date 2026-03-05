import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isMerchantRole, resolveUserRole } from '@/server/utils/role';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';
import { writeAuditEvent } from '@/server/utils/audit';

type MerchantBranch = {
  id: string;
  business_name: string | null;
  branch_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  status: string | null;
  merchant_type?: string | null;
  parent_merchant_id?: string | null;
  is_branch?: boolean | null;
};

function isMissingColumn(error: any, columnName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const normalizedColumn = columnName.toLowerCase();
  return (
    (message.includes(`column "${normalizedColumn}"`) && message.includes('does not exist')) ||
    (message.includes(`column ${normalizedColumn}`) && message.includes('does not exist')) ||
    message.includes(`could not find the '${normalizedColumn}' column`) ||
    message.includes(`could not find the column '${normalizedColumn}'`)
  );
}

function isMissingBranchHierarchyColumn(error: any) {
  return ['parent_merchant_id', 'is_branch', 'merchant_type'].some((column) =>
    isMissingColumn(error, column)
  );
}

function normalizeMerchantType(value: unknown) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'chain' ? 'chain' : normalized === 'private' ? 'private' : null;
}

function canOperateMerchantBranches(role: string, merchant: any, userId: string) {
  if (isMerchantRole(role)) return true;
  return Boolean(merchant?.user_id) && String(merchant.user_id) === String(userId);
}

function isChainParent(merchant: any) {
  const merchantType = normalizeMerchantType(merchant?.merchant_type);
  const isBranch = Boolean(merchant?.is_branch);
  return merchantType === 'chain' && !isBranch;
}

async function safeAuditBranchEvent(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    actorId: string;
    merchantId: string;
    branchId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await writeAuditEvent(admin as any, {
      actorId: input.actorId,
      actorRole: 'merchant',
      entityType: 'merchant_branch',
      entityId: input.branchId,
      action: input.action,
      metadata: {
        merchantId: input.merchantId,
        ...(input.metadata ?? {}),
      },
      requestId: null,
    });
  } catch (auditError: any) {
    console.warn('[merchant-branches][audit][warn]', auditError?.message || auditError);
  }
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<any>(
      admin,
      user,
      'id,user_id,business_name,parent_brand,merchant_type,parent_merchant_id,is_branch,status'
    );

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    }
    if (!canOperateMerchantBranches(role, merchant, user.id)) {
      return NextResponse.json(
        { error: 'Branch management is merchant-only.', code: 'merchant_only' },
        { status: 403 }
      );
    }

    const merchantType = normalizeMerchantType(merchant.merchant_type);
    const parentBrand = String(merchant.parent_brand ?? merchant.business_name ?? '').trim();

    if (merchantType !== 'chain') {
      return NextResponse.json({
        merchantId: merchant.id,
        merchantType: merchantType ?? 'private',
        isBranch: Boolean(merchant.is_branch),
        branches: [],
      });
    }

    const primaryQuery = await admin
      .from('merchants')
      .select(
        'id,business_name,branch_name,email,phone,city,province,status,merchant_type,parent_merchant_id,is_branch'
      )
      .eq('parent_merchant_id', merchant.id)
      .eq('is_branch', true)
      .order('branch_name', { ascending: true });

    let branches: MerchantBranch[] = [];
    if (!primaryQuery.error) {
      branches = (primaryQuery.data ?? []) as MerchantBranch[];
    } else if (!isMissingBranchHierarchyColumn(primaryQuery.error)) {
      throw primaryQuery.error;
    } else {
      // Fallback for older schemas without parent_merchant_id/is_branch.
      const fallback = await admin
        .from('merchants')
        .select('id,business_name,branch_name,email,phone,city,province,status,merchant_type,parent_brand')
        .eq('parent_brand', parentBrand)
        .neq('id', merchant.id)
        .order('branch_name', { ascending: true });
      if (fallback.error) throw fallback.error;
      branches = (fallback.data ?? []) as MerchantBranch[];
    }

    return NextResponse.json({
      merchantId: merchant.id,
      merchantType,
      isBranch: Boolean(merchant.is_branch),
      branches,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load merchant branches.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    const body = (await request.json().catch(() => ({} as any))) as {
      branchName?: string;
      email?: string;
      phone?: string;
      city?: string;
      province?: string;
    };
    const branchName = String(body.branchName ?? '').trim();
    const branchEmail = String(body.email ?? '').trim().toLowerCase();
    if (!branchName) {
      return NextResponse.json({ error: 'Branch name is required.' }, { status: 400 });
    }
    if (!branchEmail) {
      return NextResponse.json({ error: 'Branch email is required.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<any>(
      admin,
      user,
      'id,user_id,business_name,parent_brand,merchant_type,parent_merchant_id,is_branch,status,default_total_discount_pct,bank_name,branch_code,account_number,account_holder_name,tax_number,registration_number,business_type,physical_address'
    );

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    }
    if (!canOperateMerchantBranches(role, merchant, user.id)) {
      return NextResponse.json(
        { error: 'Branch management is merchant-only.', code: 'merchant_only' },
        { status: 403 }
      );
    }
    if (!isChainParent(merchant)) {
      return NextResponse.json(
        { error: 'Only chain parent merchants can create branches.' },
        { status: 403 }
      );
    }

    const insertPayload: Record<string, unknown> = {
      business_name: `${merchant.business_name} ${branchName}`.trim(),
      parent_brand: merchant.parent_brand ?? merchant.business_name,
      branch_name: branchName,
      email: branchEmail,
      phone: String(body.phone ?? '').trim() || null,
      city: String(body.city ?? '').trim() || null,
      province: String(body.province ?? '').trim() || null,
      status: 'approved',
      merchant_type: 'chain',
      parent_merchant_id: merchant.id,
      is_branch: true,
      default_total_discount_pct: merchant.default_total_discount_pct ?? 5,
      bank_name: merchant.bank_name ?? null,
      branch_code: merchant.branch_code ?? null,
      account_number: merchant.account_number ?? null,
      account_holder_name: merchant.account_holder_name ?? null,
      tax_number: merchant.tax_number ?? null,
      registration_number: merchant.registration_number ?? null,
      business_type: merchant.business_type ?? null,
      physical_address: merchant.physical_address ?? null,
      onboarding_fee_paid: true,
      email_verified: true,
      phone_verified: false,
      vetting_status: 'approved',
      must_reset_password: true,
      approved_at: new Date().toISOString(),
    };

    let insertResult = await admin
      .from('merchants')
      .insert(insertPayload)
      .select('id,business_name,branch_name,email,phone,city,province,status,merchant_type,parent_merchant_id,is_branch')
      .single();

    if (insertResult.error && isMissingBranchHierarchyColumn(insertResult.error)) {
      const fallbackPayload = {
        ...insertPayload,
      } as Record<string, unknown>;
      delete fallbackPayload.parent_merchant_id;
      delete fallbackPayload.is_branch;
      insertResult = await admin
        .from('merchants')
        .insert(fallbackPayload)
        .select('id,business_name,branch_name,email,phone,city,province,status,merchant_type,parent_brand')
        .single();
    }

    if (insertResult.error) throw insertResult.error;

    await safeAuditBranchEvent(admin, {
      actorId: user.id,
      merchantId: merchant.id,
      branchId: String(insertResult.data?.id ?? ''),
      action: 'merchant_branch_created',
      metadata: {
        branchName,
      },
    });

    return NextResponse.json(
      {
        message: 'Branch created successfully.',
        branch: insertResult.data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create branch.' },
      { status: 500 }
    );
  }
}

