import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/v1/admin/merchant-details/[merchantId]
 * Returns extended business details for a single merchant (address, registration, tax clearance).
 * Role-protected — admin only.
 */
export async function GET(
  _request: Request,
  { params }: { params: { merchantId: string } }
) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const { merchantId } = params;
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: merchant, error } = await admin
      .from('merchants')
      .select(
        'id, business_name, address, registration_number, tax_clearance_pin, status, workflow_status'
      )
      .eq('id', merchantId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Merchant not found', details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(merchant);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch merchant details' },
      { status: 500 }
    );
  }
}
