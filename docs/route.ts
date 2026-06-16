import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { getMerchantComplianceSnapshot } from '@/server/utils/compliance';

export const dynamic = 'force-dynamic';

/**
 * Admin-only endpoint to get an overview of merchant compliance status.
 * Directly flags missing documents across the entire merchant base.
 */
export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();
    
    // Get merchants currently in the onboarding process
    const { data: merchants, error } = await admin
      .from('merchants')
      .select('id, business_name, email, status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrichment: Calculate gaps for every merchant
    const enrichedMerchants = await Promise.all(
      (merchants || []).map(async (m) => {
        const snapshot = await getMerchantComplianceSnapshot(admin, m.id, m.status);
        return {
          ...m,
          complianceSummary: snapshot,
        };
      })
    );

    return NextResponse.json({ merchants: enrichedMerchants });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch compliance overview.' },
      { status: 500 }
    );
  }
}