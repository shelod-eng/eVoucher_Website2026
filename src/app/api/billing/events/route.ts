import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, X-Portal-Passcode, X-Portal-User, X-Portal-Role, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });

  try {
    const { searchParams } = new URL(request.url);
    const merchantId = String(searchParams.get('merchantId') ?? '').trim();
    const limit = Math.min(1000, Math.max(1, Number(searchParams.get('limit') ?? 100)));

    const admin = createAdminClient();
    let query = admin
      .from('billing_events')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (merchantId) query = query.eq('merchant_id', merchantId);

    const { data, error } = await query;
    if (error) throw error;

    return jsonNoStore({ success: true, data: data ?? [] }, { headers: CORS_HEADERS });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to list billing events.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
