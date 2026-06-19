import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '');
  return message.includes(`relation "${relationName}" does not exist`);
}

export async function GET(request: Request, context: { params: { id: string } }) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const id = String(context.params?.id ?? '').trim();
    if (!id) return jsonNoStore({ error: 'Settlement id is required.' }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('billing_settlements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (isMissingRelation(error, 'public.billing_settlements')) {
        return jsonNoStore(
          { error: 'Missing billing_settlements table.', code: 'billing_schema_missing' },
          { status: 500 }
        );
      }
      return jsonNoStore({ error: 'Settlement not found.' }, { status: 404 });
    }

    return jsonNoStore({ success: true, data });
  } catch (error: any) {
    return jsonNoStore({ error: error?.message || 'Failed to fetch settlement.' }, { status: 500 });
  }
}
