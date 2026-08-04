import { createAdminClient } from '@/lib/supabase/admin';

export interface PopiaLogInput {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  piiFields: string[];
  request?: Request;
}

/**
 * Logs a access/view event of personally identifiable information (PII) to ensure POPIA compliance.
 */
export async function logPopiaAccess(input: PopiaLogInput) {
  try {
    const admin = createAdminClient();

    let ipAddress = null;
    let userAgent = null;

    if (input.request) {
      ipAddress =
        input.request.headers.get('x-forwarded-for') || input.request.headers.get('x-real-ip');
      userAgent = input.request.headers.get('user-agent');
    }

    const { error } = await admin.from('popia_access_log').insert({
      actor_id: input.actorId ?? null,
      actor_email: input.actorEmail ?? null,
      actor_role: input.actorRole ?? null,
      action: input.action,
      target_entity: input.targetEntity,
      target_id: input.targetId ?? null,
      pii_fields: input.piiFields,
      ip_address: ipAddress ? String(ipAddress).split(',')[0].trim() : null,
      user_agent: userAgent,
    });

    if (error) {
      console.error('[POPIA Audit] Failed to insert access log:', error.message);
    }
  } catch (err: any) {
    console.error('[POPIA Audit] Unexpected logger error:', err?.message || err);
  }
}
