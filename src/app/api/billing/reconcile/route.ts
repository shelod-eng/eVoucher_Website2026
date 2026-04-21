import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const admin = createAdminClient();
    // P0: basic sweep - mark exported/submitted/confirmed as matched when amounts are valid.
    const { data: rows, error } = await admin
      .from('billing_settlements')
      .select('id,amount,status,reconciliation_status')
      .in('status', ['exported', 'submitted_to_bank', 'confirmed']);
    if (error) throw error;

    const toMatch = (rows ?? [])
      .filter((row: any) => Number(row.amount ?? 0) >= 0)
      .map((row: any) => row.id);

    if (toMatch.length > 0) {
      const { error: updateError } = await admin
        .from('billing_settlements')
        .update({ reconciliation_status: 'matched' })
        .in('id', toMatch);
      if (updateError) throw updateError;
    }

    return jsonNoStore({
      success: true,
      data: { updated: toMatch.length },
    });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to reconcile settlements.' },
      { status: 500 }
    );
  }
}

