import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Number(searchParams.get('limit') ?? 50));
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('reconciliation_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    // Table may not exist yet — return empty gracefully
    if (error.message?.includes('does not exist')) {
      return jsonNoStore({ success: true, data: [] }, { headers: CORS });
    }
    return jsonNoStore({ error: error.message }, { status: 500, headers: CORS });
  }
  return jsonNoStore({ success: true, data: data ?? [] }, { headers: CORS });
}
