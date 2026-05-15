import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import { getReportingOverview } from '@/server/reporting/reporting-suite';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const overview = await getReportingOverview();
    return jsonNoStore({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to load reporting executive summary.' },
      { status: 500 }
    );
  }
}
