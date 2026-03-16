import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { requirePortalRole } from '@/server/utils/portal-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allowed } = await requirePortalRole(user, ['admin', 'finance_approver', 'auditor']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);

    const admin = createAdminClient();
    let query = admin
      .from('audit_events')
      .select('id,actor_id,actor_role,entity_type,entity_id,action,metadata,request_id,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: data ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load audit events.' },
      { status: 500 }
    );
  }
}
