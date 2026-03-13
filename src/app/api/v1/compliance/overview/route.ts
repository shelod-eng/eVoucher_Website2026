import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isMerchantRole, resolveUserRole } from '@/server/utils/role';

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0);
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'unauthenticated' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    const admin = createAdminClient();

    let auditQuery = admin
      .from('audit_events')
      .select('id,actor_id,action,entity_type,request_id,created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    let fraudQuery = admin
      .from('fraud_alerts')
      .select('id,actor_id,related_entity_type,risk_score,rule_hit,status,created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (role === 'customer' || isMerchantRole(role)) {
      auditQuery = auditQuery.eq('actor_id', user.id);
      fraudQuery = fraudQuery.eq('actor_id', user.id);
    }

    const [auditRes, fraudRes] = await Promise.all([auditQuery, fraudQuery]);
    if (auditRes.error) throw auditRes.error;
    if (fraudRes.error) throw fraudRes.error;

    const audits = auditRes.data ?? [];
    const fraudAlerts = fraudRes.data ?? [];

    const openAlerts = fraudAlerts.filter((alert) => alert.status === 'open').length;
    const investigatingAlerts = fraudAlerts.filter(
      (alert) => alert.status === 'investigating'
    ).length;
    const highRiskAlerts = fraudAlerts.filter((alert) => toNumber(alert.risk_score) >= 70).length;

    return NextResponse.json({
      role,
      metrics: {
        auditEventCount: audits.length,
        fraudAlertCount: fraudAlerts.length,
        openAlerts,
        investigatingAlerts,
        highRiskAlerts,
      },
      recentAuditEvents: audits.slice(0, 10),
      recentFraudAlerts: fraudAlerts.slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to load compliance overview.',
        code: 'compliance_overview_failed',
      },
      { status: 500 }
    );
  }
}
