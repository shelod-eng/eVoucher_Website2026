import { SupabaseClient } from '@supabase/supabase-js';
import { AuditEvent, FraudAlert } from '@/types/domain';

export async function writeAuditEvent(client: SupabaseClient, event: AuditEvent): Promise<void> {
  const { error } = await client.from('audit_events').insert({
    actor_id: event.actorId ?? null,
    actor_role: event.actorRole ?? null,
    entity_type: event.entityType,
    entity_id: event.entityId ?? null,
    action: event.action,
    metadata: event.metadata ?? {},
    request_id: event.requestId ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function writeFraudAlert(client: SupabaseClient, alert: FraudAlert): Promise<void> {
  const { error } = await client.from('fraud_alerts').insert({
    actor_id: alert.actorId ?? null,
    related_entity_type: alert.relatedEntityType,
    related_entity_id: alert.relatedEntityId ?? null,
    risk_score: alert.riskScore,
    rule_hit: alert.ruleHit,
    status: alert.status ?? 'open',
    details: alert.details ?? {},
  });

  if (error) {
    throw error;
  }
}
