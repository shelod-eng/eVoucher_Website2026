import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getBranchHierarchy,
  assignBranchAdmin,
  getBranchDashboardMetrics,
  revokeBranchAdmin,
} from '@/server/services/branch-hierarchy';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    const admin = createAdminClient();

    const merchant = await resolveMerchantForUser<any>(
      admin,
      user,
      'id,merchant_type,is_branch,parent_merchant_id'
    );

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (merchant.merchant_type !== 'chain' || merchant.is_branch) {
      return NextResponse.json(
        { error: 'Only chain parent merchants can access hierarchy' },
        { status: 403 }
      );
    }

    const hierarchy = await getBranchHierarchy(merchant.id);
    return NextResponse.json(hierarchy);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load hierarchy' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<any>(admin, user, 'id,merchant_type,is_branch');

    if (!merchant || merchant.merchant_type !== 'chain' || merchant.is_branch) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = (await request.json()) as {
      action: 'assign_admin' | 'revoke_admin' | 'get_metrics';
      branchId: string;
      adminEmail?: string;
      role?: 'branch_admin' | 'branch_manager';
      userId?: string;
    };

    if (body.action === 'assign_admin') {
      if (!body.adminEmail || !body.role) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const result = await assignBranchAdmin(body.branchId, body.adminEmail, body.role, [
        'manage_products',
        'view_dashboard',
      ]);
      return NextResponse.json(result);
    }

    if (body.action === 'revoke_admin') {
      if (!body.userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
      }
      const result = await revokeBranchAdmin(body.branchId, body.userId);
      return NextResponse.json(result);
    }

    if (body.action === 'get_metrics') {
      const metrics = await getBranchDashboardMetrics(body.branchId);
      return NextResponse.json(metrics);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Operation failed' }, { status: 500 });
  }
}
