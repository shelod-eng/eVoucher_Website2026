import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import { resolveReconciliationException } from '@/server/services/billing/reconciliation-engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Portal-Passcode, X-Portal-User, X-Portal-Role',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const passcode = request.headers.get('X-Portal-Passcode') ?? '';
  const envPasscode = process.env.PORTAL_ADMIN_PASSCODE ?? '';
  const passcodeValid = envPasscode && passcode === envPasscode;
  if (!passcodeValid) {
    const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
    if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403, headers: CORS });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'open';
    const limit = Math.min(100, Number(searchParams.get('limit') ?? 50));

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('reconciliation_exceptions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return jsonNoStore({ success: true, data: data ?? [] }, { headers: CORS });
  } catch (error: any) {
    return jsonNoStore(
      { error: error.message || 'Failed to list exceptions.' },
      { status: 500, headers: CORS }
    );
  }
}

export async function POST(request: Request) {
  const passcode = request.headers.get('X-Portal-Passcode') ?? '';
  const envPasscode = process.env.PORTAL_ADMIN_PASSCODE ?? '';
  const passcodeValid = envPasscode && passcode === envPasscode;

  let auditorId: string | null = null;
  if (!passcodeValid) {
    const { allowed, user } = await requirePortalUser(request, ['admin', 'finance_approver']);
    if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403, headers: CORS });
    auditorId = user?.id ?? null;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const exceptionId = String(body?.exceptionId ?? '').trim();
    const notes = String(body?.notes ?? '').trim();

    if (!exceptionId || !notes) {
      return jsonNoStore(
        { error: 'exceptionId and notes are required.' },
        { status: 400, headers: CORS }
      );
    }

    const updated = await resolveReconciliationException(exceptionId, auditorId, notes);
    return jsonNoStore({ success: true, data: updated }, { headers: CORS });
  } catch (error: any) {
    return jsonNoStore(
      { error: error.message || 'Failed to resolve exception.' },
      { status: 500, headers: CORS }
    );
  }
}
