// BankServ Reconciliation Service - Operational settlement tracking
import { createAdminClient } from '@/lib/supabase/admin';

export interface ReconciliationResult {
  batchId: string;
  status: 'matched' | 'partial' | 'failed';
  totalSubmitted: number;
  totalAcknowledged: number;
  totalFailed: number;
  discrepancies: Discrepancy[];
  failures: FailureRecord[];
}

export interface Discrepancy {
  settlementId: string;
  merchantId: string;
  expectedAmount: number;
  receivedAmount: number;
  difference: number;
  reason: string;
}

export interface FailureRecord {
  settlementId: string;
  merchantId: string;
  amount: number;
  failureCode: string;
  failureReason: string;
  retryable: boolean;
  retryCount: number;
}

export async function reconcileBankServBatch(batchId: string): Promise<ReconciliationResult> {
  const admin = createAdminClient();

  const { data: batch, error: batchError } = await admin
    .from('billing_settlement_batches')
    .select('id,batch_number,total_amount,status')
    .eq('id', batchId)
    .single();

  if (batchError) throw new Error('Batch not found');

  const { data: settlements, error: settlementsError } = await admin
    .from('billing_settlements')
    .select('id,merchant_id,amount,status,metadata')
    .eq('batch_id', batchId);

  if (settlementsError) throw settlementsError;

  const { data: ackNckRecords, error: ackError } = await admin
    .from('bankserv_ack_nck_tracking')
    .select('settlement_id,status,failure_code,failure_reason,amount_processed,processed_at')
    .eq('batch_id', batchId);

  if (ackError && !ackError.message.includes('does not exist')) throw ackError;

  const ackMap = new Map();
  (ackNckRecords || []).forEach((record) => {
    ackMap.set(record.settlement_id, record);
  });

  const discrepancies: Discrepancy[] = [];
  const failures: FailureRecord[] = [];
  let totalAcknowledged = 0;
  let totalFailed = 0;

  for (const settlement of settlements || []) {
    const ackRecord = ackMap.get(settlement.id);

    if (!ackRecord) {
      failures.push({
        settlementId: settlement.id,
        merchantId: settlement.merchant_id,
        amount: Number(settlement.amount),
        failureCode: 'NO_ACK',
        failureReason: 'No acknowledgment received from bank',
        retryable: true,
        retryCount: 0,
      });
      totalFailed++;
      continue;
    }

    if (ackRecord.status === 'nck' || ackRecord.status === 'failed') {
      failures.push({
        settlementId: settlement.id,
        merchantId: settlement.merchant_id,
        amount: Number(settlement.amount),
        failureCode: ackRecord.failure_code || 'UNKNOWN',
        failureReason: ackRecord.failure_reason || 'Unknown failure',
        retryable: isRetryableFailure(ackRecord.failure_code),
        retryCount: Number(settlement.metadata?.retry_count || 0),
      });
      totalFailed++;
    } else if (ackRecord.status === 'ack') {
      totalAcknowledged++;
      const amountProcessed = Number(ackRecord.amount_processed || 0);
      const expectedAmount = Number(settlement.amount);

      if (Math.abs(amountProcessed - expectedAmount) > 0.01) {
        discrepancies.push({
          settlementId: settlement.id,
          merchantId: settlement.merchant_id,
          expectedAmount,
          receivedAmount: amountProcessed,
          difference: amountProcessed - expectedAmount,
          reason: 'Amount mismatch',
        });
      }
    }
  }

  const status =
    totalFailed === 0 && discrepancies.length === 0
      ? 'matched'
      : totalAcknowledged > 0
        ? 'partial'
        : 'failed';

  await admin
    .from('billing_settlement_batches')
    .update({
      status: status === 'matched' ? 'confirmed' : status === 'partial' ? 'exported' : 'failed',
      metadata: {
        reconciliation: {
          totalSubmitted: settlements?.length || 0,
          totalAcknowledged,
          totalFailed,
          discrepancyCount: discrepancies.length,
          reconciledAt: new Date().toISOString(),
        },
      },
    })
    .eq('id', batchId);

  return {
    batchId,
    status,
    totalSubmitted: settlements?.length || 0,
    totalAcknowledged,
    totalFailed,
    discrepancies,
    failures,
  };
}

export async function retryFailedSettlement(settlementId: string) {
  const admin = createAdminClient();

  const { data: settlement, error: fetchError } = await admin
    .from('billing_settlements')
    .select('id,merchant_id,amount,batch_id,metadata')
    .eq('id', settlementId)
    .single();

  if (fetchError) throw fetchError;

  const retryCount = Number(settlement.metadata?.retry_count || 0) + 1;

  if (retryCount > 3) {
    return {
      success: false,
      error: 'Maximum retry attempts exceeded',
      requiresManualIntervention: true,
    };
  }

  const { error: updateError } = await admin
    .from('billing_settlements')
    .update({
      status: 'pending',
      metadata: {
        ...settlement.metadata,
        retry_count: retryCount,
        last_retry_at: new Date().toISOString(),
      },
    })
    .eq('id', settlementId);

  if (updateError) throw updateError;

  return { success: true, retryCount };
}

export async function createManualReconciliationEntry(params: {
  settlementId: string;
  merchantId: string;
  amount: number;
  reason: string;
  authorizedBy: string;
}) {
  const admin = createAdminClient();

  const entryGroupId = crypto.randomUUID();

  const { error: ledgerError } = await admin.from('billing_ledger_entries').insert({
    entry_group_id: entryGroupId,
    source_type: 'manual',
    source_id: params.settlementId,
    merchant_id: params.merchantId,
    debit_account: 'manual_reconciliation',
    credit_account: 'merchant_settlement',
    amount: params.amount,
    currency: 'ZAR',
    metadata: {
      reason: params.reason,
      authorizedBy: params.authorizedBy,
      reconciledAt: new Date().toISOString(),
    },
  });

  if (ledgerError) throw ledgerError;

  const { error: settlementError } = await admin
    .from('billing_settlements')
    .update({ status: 'confirmed' })
    .eq('id', params.settlementId);

  if (settlementError) throw settlementError;

  return { success: true, entryGroupId };
}

export async function generateReconciliationReport(batchId: string) {
  const result = await reconcileBankServBatch(batchId);

  return {
    reportId: crypto.randomUUID(),
    batchId,
    generatedAt: new Date().toISOString(),
    summary: {
      status: result.status,
      totalSubmitted: result.totalSubmitted,
      totalAcknowledged: result.totalAcknowledged,
      totalFailed: result.totalFailed,
      successRate:
        result.totalSubmitted > 0 ? (result.totalAcknowledged / result.totalSubmitted) * 100 : 0,
    },
    discrepancies: result.discrepancies,
    failures: result.failures,
    recommendations: generateRecommendations(result),
  };
}

function isRetryableFailure(failureCode: string | null): boolean {
  const retryableCodes = ['TIMEOUT', 'NETWORK_ERROR', 'TEMPORARY_ERROR', 'INSUFFICIENT_FUNDS'];
  return retryableCodes.includes(failureCode || '');
}

function generateRecommendations(result: ReconciliationResult): string[] {
  const recommendations: string[] = [];

  if (result.totalFailed > 0) {
    recommendations.push(`Review ${result.totalFailed} failed settlements for retry eligibility`);
  }

  if (result.discrepancies.length > 0) {
    recommendations.push(
      `Investigate ${result.discrepancies.length} amount discrepancies with bank`
    );
  }

  const retryableFailures = result.failures.filter((f) => f.retryable);
  if (retryableFailures.length > 0) {
    recommendations.push(`${retryableFailures.length} settlements can be retried automatically`);
  }

  const manualInterventionNeeded = result.failures.filter((f) => !f.retryable || f.retryCount >= 3);
  if (manualInterventionNeeded.length > 0) {
    recommendations.push(
      `${manualInterventionNeeded.length} settlements require manual intervention`
    );
  }

  return recommendations;
}

export async function getBatchReconciliationStatus(batchId: string) {
  const admin = createAdminClient();

  const { data: batch, error } = await admin
    .from('billing_settlement_batches')
    .select('id,batch_number,status,total_amount,submitted_at,confirmed_at,metadata')
    .eq('id', batchId)
    .single();

  if (error) throw error;

  const reconciliationData = batch.metadata?.reconciliation;

  return {
    batchId: batch.id,
    batchNumber: batch.batch_number,
    status: batch.status,
    totalAmount: batch.total_amount,
    submittedAt: batch.submitted_at,
    confirmedAt: batch.confirmed_at,
    reconciliation: reconciliationData || null,
  };
}
