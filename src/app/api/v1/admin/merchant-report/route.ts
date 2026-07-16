import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { resolveRequestIp } from '@/server/utils/request-ip';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * BankServ Adaptor - Merchant Product Report
 * Provides a consolidated view of Onboarding Status, Catalog, and Payout Readiness.
 */
export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const admin = createAdminClient();

    // 1. Fetch all merchants (Pending, Approved, Active)
    const { data: merchants, error: merchantError } = await admin
      .from('merchants')
      .select('id, business_name, email, status, created_at')
      .order('created_at', { ascending: false });

    if (merchantError) throw merchantError;

    const merchantIds = (merchants || []).map((m) => m.id);

    // 2. Fetch all products for these merchants
    const { data: products, error: productError } = await admin
      .from('merchant_products')
      .select('id, merchant_id, product_name, face_value, is_active')
      .in('merchant_id', merchantIds);

    if (productError) throw productError;

    // 3. Fetch latest settlement status (BankServ Adaptor Telemetry)
    // Note: We use a left join logic here to show 'No Payouts Yet' for new merchants
    const { data: settlements, error: settlementError } = await admin
      .from('merchant_payouts')
      .select('id, merchant_id, status, payout_date, created_at')
      .in('merchant_id', merchantIds)
      .order('created_at', { ascending: false });

    if (settlementError) throw settlementError;

    // 4. Consolidate the report
    const report = (merchants || []).map((m) => {
      const merchantProducts = (products || []).filter((p) => p.merchant_id === m.id);
      const latestSettlement = (settlements || []).find((s) => s.merchant_id === m.id);

      return {
        merchantName: m.business_name,
        email: m.email,
        onboardingStatus: m.status, // Pending, Approved, Active
        productCount: merchantProducts.length,
        productCatalogue: merchantProducts.map((p) => ({
          name: p.product_name,
          value: p.face_value,
          active: p.is_active,
        })),
        payoutTelemetry: {
          status: latestSettlement?.status || 'NOT_READY', // CREATED, VALIDATED, SUBMITTED, SETTLED
          lastSettlement: latestSettlement?.payout_date || latestSettlement?.created_at || null,
          batchRef: latestSettlement?.id
            ? `PAY-${String(latestSettlement.id).slice(0, 8).toUpperCase()}`
            : 'N/A',
        },
        isSponsorReady: m.status === 'active' && merchantProducts.length > 0,
      };
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      refreshIntervalSeconds: 60,
      kycAudit: {
        requesterIpAddress: resolveRequestIp(request.headers),
      },
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate merchant product report.' },
      { status: 500 }
    );
  }
}
