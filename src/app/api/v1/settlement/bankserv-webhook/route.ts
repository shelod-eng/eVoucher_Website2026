/**
 * BankServ Webhook Handler
 * Receives ACK/NCK responses from BankServ Africa
 * Route: POST /api/v1/settlement/bankserv-webhook
 *
 * Uses canonical ACK/NCK tracking path:
 * bankserv_ack_nck_tracking → processAckNckRecord
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processAckNckRecord, enqueueAckNckTracking } from '@/server/services/bankserv/ack-nck-retry';
import { writeAuditEvent } from '@/server/utils/audit';

const BANKSERV_WEBHOOK_SECRET = process.env.BANKSERV_WEBHOOK_SECRET || 'dev-secret-key';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature
    const signature = request.headers.get('x-bankserv-signature');
    if (!signature || signature !== BANKSERV_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // 2. Parse webhook payload
    const payload = await request.json();

    // 3. Validate required fields
    const reference = String(payload.reference ?? '').trim();
    const status = String(payload.status ?? '').trim().toUpperCase();

    if (!reference || !status || !['ACK', 'NCK'].includes(status)) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 4. Look up batch by bankserv_file_ref or pch_ack_ref (canonical path)
    const { data: batch } = await admin
      .from('billing_settlement_batches')
      .select('id,batch_number,status')
      .or(`bankserv_file_ref.eq.${reference},pch_ack_ref.eq.${reference}`)
      .maybeSingle();

    if (batch) {
      // Update batch with ACK/NCK status
      const updateData: Record<string, unknown> = {
        pch_ack_ref: reference,
        last_state_change_at: new Date().toISOString(),
      };

      if (status === 'ACK') {
        updateData.status = 'submitted_to_bank';
      } else {
        updateData.status = 'failed';
        updateData.notes = `NCK received: ${String(payload.message ?? 'No reason provided').slice(0, 500)}`;
      }

      await admin.from('billing_settlement_batches').update(updateData).eq('id', batch.id);

      // Enqueue or update ACK/NCK tracking
      const { data: existingTracking } = await admin
        .from('bankserv_ack_nck_tracking')
        .select('*')
        .eq('entity_type', 'batch')
        .eq('entity_id', batch.id)
        .maybeSingle();

      if (existingTracking) {
        // Process the existing tracking record
        const record = {
          id: existingTracking.id,
          entityType: existingTracking.entity_type as 'batch' | 'transaction' | 'file',
          entityId: existingTracking.entity_id,
          status: existingTracking.status as any,
          attemptCount: Number(existingTracking.attempt_count ?? 0),
          lastAttemptAt: existingTracking.last_attempt_at,
          nextRetryAt: existingTracking.next_retry_at,
          lastError: existingTracking.last_error,
          ackRef: existingTracking.ack_ref,
          metadata: existingTracking.metadata ?? {},
          created_at: existingTracking.created_at,
          updated_at: existingTracking.updated_at,
        };

        await processAckNckRecord(admin, record);
      } else {
        await enqueueAckNckTracking(admin, {
          entityType: 'batch',
          entityId: batch.id,
          ackRef: reference,
          metadata: {
            source: 'bankserv_webhook',
            batchNumber: batch.batch_number,
            webhookStatus: status,
          },
        });
      }

      // Update billing_settlements if status is ACK
      if (status === 'ACK') {
        await admin
          .from('billing_settlements')
          .update({ status: 'submitted_to_bank' })
          .eq('batch_id', batch.id)
          .eq('status', 'pending');
      }

      // Audit log
      try {
        await writeAuditEvent(admin, {
          actorId: 'bankserv_webhook',
          actorRole: 'system',
          entityType: 'billing_settlement_batch',
          entityId: batch.id,
          action: status === 'ACK' ? 'settlement_batch_ack_received' : 'settlement_batch_nck_received',
          metadata: {
            batchNumber: batch.batch_number,
            reference,
            webhookStatus: status,
            message: payload.message ?? null,
          },
          requestId: reference,
        });
      } catch (auditError: any) {
        console.warn('[BankServ Webhook][audit][warn]', auditError?.message || auditError);
      }
    } else {
      // No batch found by reference — try bankserv_ack_nck_tracking directly
      const { data: trackingRecords } = await admin
        .from('bankserv_ack_nck_tracking')
        .select('*')
        .eq('ack_ref', reference)
        .limit(1);

      const trackingRecord = trackingRecords?.[0];
      if (trackingRecord) {
        const record = {
          id: trackingRecord.id,
          entityType: trackingRecord.entity_type as 'batch' | 'transaction' | 'file',
          entityId: trackingRecord.entity_id,
          status: trackingRecord.status as any,
          attemptCount: Number(trackingRecord.attempt_count ?? 0),
          lastAttemptAt: trackingRecord.last_attempt_at,
          nextRetryAt: trackingRecord.next_retry_at,
          lastError: trackingRecord.last_error,
          ackRef: trackingRecord.ack_ref,
          metadata: trackingRecord.metadata ?? {},
          created_at: trackingRecord.created_at,
          updated_at: trackingRecord.updated_at,
        };

        await processAckNckRecord(admin, record);
      } else {
        console.warn('[BankServ Webhook] No matching batch or tracking record found for reference:', reference);
      }
    }

    // Log raw response to bankserv_responses for audit trail
    try {
      await admin.from('bankserv_responses').insert({
        bankserv_reference: reference,
        response_type: status,
        response_code: payload.code ?? null,
        response_message: payload.message ?? null,
        raw_response: payload,
        processed: true,
        processed_at: new Date().toISOString(),
      });
    } catch (logError: any) {
      console.warn('[BankServ Webhook] Failed to log response:', logError.message);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed via canonical path' });
  } catch (error: any) {
    console.error('[BankServ Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'BankServ Webhook Handler (canonical path)',
    timestamp: new Date().toISOString(),
  });
}