import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Portal-Passcode, X-Portal-User, X-Portal-Role',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

import { runDailyReconciliation } from '@/server/services/billing/reconciliation-engine';

export async function POST(request: Request) {
  const passcode = request.headers.get('X-Portal-Passcode') ?? '';
  const envPasscode = process.env.PORTAL_ADMIN_PASSCODE ?? '';
  const passcodeValid = envPasscode && passcode === envPasscode;
  if (!passcodeValid) {
    const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver']);
    if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403, headers: CORS });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') ?? undefined;

    const summary = await runDailyReconciliation(dateParam);
    return jsonNoStore({ success: true, data: summary }, { headers: CORS });
  } catch (error: any) {
    return jsonNoStore({ error: error.message || 'Reconciliation run failed.' }, { status: 500, headers: CORS });
  }
}
