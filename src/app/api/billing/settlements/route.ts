import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '');
  return message.includes(`relation "${relationName}" does not exist`);
}

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const status = String(searchParams.get('status') ?? '').trim();
    const reconciliationStatus = String(searchParams.get('reconciliationStatus') ?? '').trim();

    const admin = createAdminClient();
    let query = admin
      .from('billing_settlements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (status) query = query.eq('status', status);
    if (reconciliationStatus) query = query.eq('reconciliation_status', reconciliationStatus);

    const { data, error } = await query;
    if (error) {
      if (isMissingRelation(error, 'public.billing_settlements')) {
        return jsonNoStore(
          { error: 'Missing billing_settlements table.', code: 'billing_schema_missing' },
          { status: 500 }
        );
      }
      throw error;
    }

    return jsonNoStore({ success: true, data: data ?? [] });
  } catch (error: any) {
    return jsonNoStore({ error: error?.message || 'Failed to list settlements.' }, { status: 500 });
  }
}
