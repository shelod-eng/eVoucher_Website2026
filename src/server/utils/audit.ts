import { SupabaseClient } from '@supabase/supabase-js';
import { AuditEvent, FraudAlert } from '@/types/domain';

function isMissingAuditSchema(error: any) {
  const message = String(error?.message ?? '').toLowerCase();
  return (
    message.includes('relation "audit_events" does not exist') ||
    message.includes("could not find the table 'audit_events' in the schema cache") ||
    message.includes('column "') ||
    message.includes("could not find the '") ||
    message.includes('schema cache')
  );
}

function isNonBlockingAuditError(error: any) {
  const message = String(error?.message ?? '').toLowerCase();
  return (
    isMissingAuditSchema(error) ||
    message.includes('duplicate key value') ||
    message.includes('unique constraint') ||
    message.includes('invalid input syntax for type uuid') ||
    message.includes('violates foreign key constraint')
  );
}

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
    if (isNonBlockingAuditError(error)) {
      return;
    }
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
