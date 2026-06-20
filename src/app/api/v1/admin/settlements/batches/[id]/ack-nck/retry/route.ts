import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import {
  enqueueAckNckTracking,
  processAckNckRecord,
} from '@/server/services/bankserv/ack-nck-retry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request, context: { params: { id: string } }) {
  const { allowed, user } = await requirePortalUser(request, ['admin']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const batchId = String(context.params?.id ?? '').trim();
    if (!batchId) return jsonNoStore({ error: 'Batch id is required.' }, { status: 400 });

    const admin = createAdminClient();
    const { data: existing, error: existingError } = await admin
      .from('bankserv_ack_nck_tracking')
      .select('*')
      .eq('entity_type', 'batch')
      .eq('entity_id', batchId)
      .in('status', ['pending', 'retrying', 'nacked', 'failed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;

    const record =
      existing ??
      (await enqueueAckNckTracking(admin, {
        entityType: 'batch',
        entityId: batchId,
        metadata: {
          requestedBy: user?.id ?? null,
          requestSource: 'manual_ack_nck_retry',
        },
      }));

    const normalizedRecord = existing
      ? {
          id: existing.id,
          entityType: existing.entity_type,
          entityId: existing.entity_id,
          status: existing.status,
          attemptCount: Number(existing.attempt_count ?? 0),
          lastAttemptAt: existing.last_attempt_at,
          nextRetryAt: existing.next_retry_at,
          lastError: existing.last_error,
          ackRef: existing.ack_ref,
          metadata: existing.metadata ?? {},
          created_at: existing.created_at,
          updated_at: existing.updated_at,
        }
      : record;

    const result = await processAckNckRecord(admin, normalizedRecord);

    return jsonNoStore({
      success: true,
      data: {
        recordId: normalizedRecord.id,
        batchId,
        ...result,
      },
    });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to retry ACK/NCK processing.' },
      { status: 500 }
    );
  }
}
