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
    if (!id) return jsonNoStore({ error: 'Invoice id is required.' }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin.from('billing_invoices').select('*').eq('id', id).single();
    if (error) {
      if (isMissingRelation(error, 'public.billing_invoices')) {
        return jsonNoStore(
          { error: 'Missing billing tables.', code: 'billing_schema_missing' },
          { status: 500 }
        );
      }
      return jsonNoStore({ error: 'Invoice not found.' }, { status: 404 });
    }
    return jsonNoStore({ success: true, data });
  } catch (error: any) {
    return jsonNoStore({ error: error?.message || 'Failed to fetch invoice.' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { allowed, user, role } = await requirePortalUser(request, ['admin', 'finance_approver']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const id = String(context.params?.id ?? '').trim();
    if (!id) return jsonNoStore({ error: 'Invoice id is required.' }, { status: 400 });
    const body = await request.json().catch(() => ({}));
    const status = String(body?.status ?? '').trim();
    const paymentReference = body?.paymentReference
      ? String(body.paymentReference).slice(0, 120)
      : null;

    if (!status) {
      return jsonNoStore({ error: 'status is required.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('billing_invoices')
      .update({
        status,
        payment_reference: paymentReference,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
        approved_by: status === 'approved' ? (user?.id ?? null) : null,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        metadata: {
          updatedByRole: role ?? null,
          updatedAt: new Date().toISOString(),
        },
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (isMissingRelation(error, 'public.billing_invoices')) {
        return jsonNoStore(
          { error: 'Missing billing tables.', code: 'billing_schema_missing' },
          { status: 500 }
        );
      }
      throw error;
    }

    return jsonNoStore({ success: true, data });
  } catch (error: any) {
    return jsonNoStore({ error: error?.message || 'Failed to update invoice.' }, { status: 500 });
  }
}
