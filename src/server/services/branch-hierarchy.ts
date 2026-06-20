// Branch Hierarchy Service - Complete parent/child chain management
import { createAdminClient } from '@/lib/supabase/admin';

export interface BranchHierarchy {
  parentId: string;
  parentName: string;
  parentStatus: string;
  branches: Branch[];
  totalBranches: number;
}

export interface Branch {
  id: string;
  businessName: string;
  branchName: string;
  email: string;
  phone: string | null;
  city: string | null;
  province: string | null;
  status: string;
  hasAdmin: boolean;
  adminUserId: string | null;
  createdAt: string;
}

export interface BranchAdmin {
  id: string;
  branchId: string;
  userId: string;
  email: string;
  role: 'branch_admin' | 'branch_manager';
  permissions: string[];
  createdAt: string;
}

export async function getBranchHierarchy(parentMerchantId: string): Promise<BranchHierarchy> {
  const admin = createAdminClient();

  const { data: parent, error: parentError } = await admin
    .from('merchants')
    .select('id,business_name,status')
    .eq('id', parentMerchantId)
    .single();

  if (parentError) throw new Error('Parent merchant not found');

  const { data: branches, error: branchesError } = await admin
    .from('merchants')
    .select('id,business_name,branch_name,email,phone,city,province,status,user_id,created_at')
    .eq('parent_merchant_id', parentMerchantId)
    .eq('is_branch', true)
    .order('branch_name', { ascending: true });

  if (branchesError) throw branchesError;

  return {
    parentId: parent.id,
    parentName: parent.business_name,
    parentStatus: parent.status,
    branches: (branches || []).map((b) => ({
      id: b.id,
      businessName: b.business_name,
      branchName: b.branch_name || '',
      email: b.email,
      phone: b.phone,
      city: b.city,
      province: b.province,
      status: b.status,
      hasAdmin: !!b.user_id,
      adminUserId: b.user_id,
      createdAt: b.created_at,
    })),
    totalBranches: branches?.length || 0,
  };
}

export async function assignBranchAdmin(
  branchId: string,
  adminEmail: string,
  role: 'branch_admin' | 'branch_manager',
  permissions: string[]
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const admin = createAdminClient();

  const { data: branch } = await admin
    .from('merchants')
    .select('id,user_id')
    .eq('id', branchId)
    .single();

  if (!branch) return { success: false, error: 'Branch not found' };

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: adminEmail,
    email_confirm: true,
    user_metadata: {
      role,
      branchId,
      permissions,
    },
  });

  if (authError) return { success: false, error: authError.message };

  await admin.from('merchants').update({ user_id: authUser.user.id }).eq('id', branchId);

  return { success: true, userId: authUser.user.id };
}

export async function getBranchDashboardMetrics(branchId: string) {
  const admin = createAdminClient();

  const { data: products } = await admin
    .from('merchant_products')
    .select('id,is_active')
    .eq('merchant_id', branchId);

  const { data: redemptions } = await admin
    .from('customer_vouchers')
    .select('id,redemption_value,redeemed_at')
    .eq('merchant_id', branchId)
    .eq('status', 'redeemed');

  const activeProducts = products?.filter((p) => p.is_active).length || 0;
  const totalRedemptions = redemptions?.length || 0;
  const totalRedemptionValue =
    redemptions?.reduce((sum, r) => sum + Number(r.redemption_value || 0), 0) || 0;

  return {
    branchId,
    activeProducts,
    totalRedemptions,
    totalRedemptionValue,
    lastRedemptionAt: redemptions?.[0]?.redeemed_at || null,
  };
}

export async function revokeBranchAdmin(branchId: string, userId: string) {
  const admin = createAdminClient();

  await admin.auth.admin.deleteUser(userId);

  await admin.from('merchants').update({ user_id: null }).eq('id', branchId);

  return { success: true };
}
