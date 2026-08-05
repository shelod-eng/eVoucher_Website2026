import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Portal-Passcode, X-Portal-User, X-Portal-Role',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const passcode = request.headers.get('X-Portal-Passcode') ?? '';
  const envPasscode = process.env.PORTAL_ADMIN_PASSCODE ?? '';
  const passcodeValid = !!envPasscode && passcode === envPasscode;
  if (!passcodeValid) {
    const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
    if (!allowed) {
      return jsonNoStore({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });
    }
  }

  const { searchParams } = new URL(request.url);
  const merchantIds = (searchParams.get('merchantIds') ?? '').split(',').filter(Boolean);
  const customerIds = (searchParams.get('customerIds') ?? '').split(',').filter(Boolean);

  const admin = createAdminClient();
  const merchants: Record<string, string> = {};
  const customers: Record<string, string> = {};

  if (merchantIds.length) {
    const { data } = await admin
      .from('merchants')
      .select('id, business_name')
      .in('id', merchantIds);
    (data ?? []).forEach((m: any) => {
      merchants[m.id] = m.business_name;
    });
  }

  if (customerIds.length) {
    const { data } = await admin
      .from('user_profiles')
      .select('id, full_name, email')
      .in('id', customerIds);
    (data ?? []).forEach((u: any) => {
      customers[u.id] = u.full_name || u.email || u.id.slice(0, 8);
    });
  }

  return jsonNoStore({ merchants, customers }, { headers: CORS_HEADERS });
}
