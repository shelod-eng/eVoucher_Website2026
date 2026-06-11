import { createHash } from 'crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

export type BankservPaymentRail =
  | 'CARD'
  | 'EFT'
  | 'PAYFAST'
  | 'WALLET'
  | 'RTC'
  | 'NAEDO'
  | 'SAMOS'
  | 'UNKNOWN';

export type BankservAdaptorStatus =
  | 'queued'
  | 'batched'
  | 'submitted'
  | 'clearing'
  | 'settled'
  | 'rejected'
  | 'ignored';

export type QueueBankservSettlementInput = {
  transactionReference: string;
  paymentTransactionId?: string | null;
  merchantId: string;
  customerId?: string | null;
  voucherCode?: string | null;
  paymentMethod?: string | null;
  accessChannel?: string | null;
  settlementAmount: number;
  grossAmount: number;
  sourceEventKey?: string | null;
  completionSource: 'checkout' | 'webhook' | 'simulator' | 'unknown';
  metadata?: Record<string, unknown>;
};

function round2(value: number) {
  return Number(value.toFixed(2));
}

function safeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalize(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const relation = relationName.toLowerCase();
  return (
    message.includes(`relation "${relation}" does not exist`) ||
    message.includes(`could not find the table '${relation}' in the schema cache`)
  );
}

function isMissingSchemaField(error: any, fieldName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const field = fieldName.toLowerCase();
  return (
    message.includes(`column "${field}" does not exist`) ||
    message.includes(`could not find the '${field}' column`) ||
    message.includes('schema cache')
  );
}

export function isBankservAdaptorCompatibilityError(error: any) {
  return (
    isMissingRelation(error, 'public.bankserv_adaptor_transactions') ||
    [
      'payment_rail',
      'settlement_amount',
      'source_channel',
      'completion_source',
      'payload',
      'merchant_bank_linkage_id',
      'bankserv_file_ref',
      'pch_ack_ref',
      'control_sum_amount',
      'last_state_change_at',
    ].some((field) => isMissingSchemaField(error, field))
  );
}

type BankservLifecycleStatus = 'ACKED' | 'NACKED' | 'PENDING';

type AdaptorTransactionRow = {
  id: string;
  transaction_reference: string;
  payment_method: string;
  payment_rail: BankservPaymentRail;
  settlement_amount: number;
  gross_amount: number;
  status: BankservAdaptorStatus;
  batch_id?: string | null;
  created_at: string;
};

type SettlementBatchRow = {
  id: string;
  batch_number: string;
  status: string;
  total_amount: number;
  merchant_count: number;
  transaction_count: number;
  settlement_rail?: string | null;
  submitted_at?: string | null;
  confirmed_at?: string | null;
  created_at: string;
  bankserv_file_ref?: string | null;
  pch_ack_ref?: string | null;
  control_sum_amount?: number | null;
  last_state_change_at?: string | null;
};

function pad(value: number, size = 2) {
  return String(value).padStart(size, '0');
}

function toDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function buildDateToken(date = new Date()) {
  return `${String(date.getFullYear()).slice(-2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function buildLocalTimestamp(date = new Date(), hour = 0, minute = 0) {
  const out = new Date(date);
  out.setHours(hour, minute, 0, 0);
  return out.toISOString();
}

function buildHash(seed: string) {
  return createHash('sha256').update(seed).digest('hex').slice(0, 12).toUpperCase();
}

function batchFilePrefixForRail(rail: string) {
  return String(rail).toUpperCase() === 'CARD' ? 'ESGC' : 'ESGB';
}

function batchLabelForRail(rail: string) {
  return String(rail).toUpperCase() === 'CARD' ? 'Card Batch' : 'EFT Batch';
}

function buildLifecycleStatus(statuses: string[]): BankservLifecycleStatus {
  const normalized = statuses.map((status) => String(status ?? '').toLowerCase());
  if (normalized.some((status) => status === 'rejected' || status === 'failed')) return 'NACKED';
  if (
    normalized.some((status) =>
      ['submitted', 'clearing', 'settled', 'confirmed', 'exported', 'approved'].includes(status)
    )
  ) {
    return 'ACKED';
  }
  return 'PENDING';
}

function buildAckRef(prefix: string, dateToken: string, status: BankservLifecycleStatus, suffix: string) {
  if (status === 'PENDING') return 'Pending';
  return `${prefix}${status === 'NACKED' ? 'NCK' : 'ACK'}_${dateToken}_${suffix}`;
}

function railCutOff(rail: string) {
  return String(rail).toUpperCase() === 'CARD' ? '23:59 SAST' : '14:00 SAST';
}

export function mapPaymentMethodToBankservRail(paymentMethod: string | null | undefined): BankservPaymentRail {
  const method = normalize(paymentMethod);
  if (method === 'visa_secure' || method === 'debit_credit' || method === 'card') return 'CARD';
  if (method === 'eft') return 'EFT';
  if (method === 'payfast') return 'PAYFAST';
  if (method === 'wallet') return 'WALLET';
  if (method === 'rtc') return 'RTC';
  if (method === 'naedo') return 'NAEDO';
  if (method === 'samos' || method === 'rtgs' || method === 'samos_rtgs') return 'SAMOS';
  return 'UNKNOWN';
}

export function deriveSettlementAmount(input: {
  merchantReceivableAfterTotalDiscount?: unknown;
  merchantReceivableAfterEvoucherBenefit?: unknown;
  faceValue?: unknown;
  totalDiscountAmount?: unknown;
  amount?: unknown;
}) {
  const afterTotalDiscount = safeNumber(input.merchantReceivableAfterTotalDiscount);
  if (afterTotalDiscount > 0) return round2(afterTotalDiscount);

  const afterEvoucherBenefit = safeNumber(input.merchantReceivableAfterEvoucherBenefit);
  if (afterEvoucherBenefit > 0) return round2(afterEvoucherBenefit);

  const faceValue = safeNumber(input.faceValue);
  const totalDiscountAmount = safeNumber(input.totalDiscountAmount);
  if (faceValue > 0 && totalDiscountAmount >= 0 && faceValue >= totalDiscountAmount) {
    return round2(faceValue - totalDiscountAmount);
  }

  return round2(safeNumber(input.amount));
}

async function resolveActiveBankLinkage(admin: SupabaseClient, merchantId: string) {
  const { data, error } = await admin
    .from('billing_bank_linkages')
    .select('id,merchant_bank_name,branch_code,account_holder_name,verification_status,is_active')
    .eq('merchant_id', merchantId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function queueBankservSettlementTransaction(
  admin: SupabaseClient,
  input: QueueBankservSettlementInput
) {
  const transactionReference = String(input.transactionReference ?? '').trim();
  if (!transactionReference) throw new Error('transactionReference is required.');

  const merchantId = String(input.merchantId ?? '').trim();
  if (!merchantId) throw new Error('merchantId is required.');

  const settlementAmount = round2(safeNumber(input.settlementAmount));
  if (settlementAmount <= 0) {
    return {
      queued: false,
      reason: 'Settlement amount is zero or negative.',
      record: null,
    };
  }

  const { data: existing, error: existingError } = await admin
    .from('bankserv_adaptor_transactions')
    .select('*')
    .eq('transaction_reference', transactionReference)
    .maybeSingle();
  if (existingError && !isBankservAdaptorCompatibilityError(existingError)) {
    throw existingError;
  }
  if (existing) {
    return { queued: true, reason: 'Existing adaptor transaction reused.', record: existing };
  }

  const linkage = await resolveActiveBankLinkage(admin, merchantId);
  const paymentRail = mapPaymentMethodToBankservRail(input.paymentMethod);
  const paymentMethod = String(input.paymentMethod ?? 'unknown').trim() || 'unknown';
  const sourceChannel = String(input.accessChannel ?? 'web').trim().toLowerCase() || 'web';
  const grossAmount = round2(safeNumber(input.grossAmount));

  const payload = {
    ...(input.metadata ?? {}),
    bankservTrigger: true,
    linkageStatus: linkage?.verification_status ?? 'missing',
    linkageVerified: Boolean(linkage?.id),
  };

  const insertPayload = {
    transaction_reference: transactionReference,
    payment_transaction_id: input.paymentTransactionId ?? null,
    merchant_id: merchantId,
    customer_id: input.customerId ?? null,
    voucher_code: input.voucherCode ?? null,
    payment_method: paymentMethod,
    payment_rail: paymentRail,
    settlement_amount: settlementAmount,
    gross_amount: grossAmount,
    currency: 'ZAR',
    status: linkage?.id ? 'queued' : ('ignored' as BankservAdaptorStatus),
    status_reason: linkage?.id ? null : 'No active verified merchant bank linkage found.',
    merchant_bank_linkage_id: linkage?.id ?? null,
    source_event_key: input.sourceEventKey ?? transactionReference,
    source_channel: sourceChannel,
    completion_source: input.completionSource,
    payload,
  };

  const { data, error } = await admin
    .from('bankserv_adaptor_transactions')
    .insert(insertPayload)
    .select('*')
    .single();
  if (error) throw error;

  return {
    queued: String(data.status) === 'queued',
    reason: data.status_reason ?? null,
    record: data,
  };
}

export async function getBankservAdaptorOverview(admin: SupabaseClient) {
  const { data: transactions, error: transactionError } = await admin
    .from('bankserv_adaptor_transactions')
    .select(
      'id,transaction_reference,merchant_id,payment_method,payment_rail,settlement_amount,gross_amount,status,status_reason,batch_id,created_at,merchant_bank_linkage_id'
    )
    .order('created_at', { ascending: false })
    .limit(500);
  if (transactionError) throw transactionError;

  const { data: batches, error: batchError } = await admin
    .from('billing_settlement_batches')
    .select(
      'id,batch_number,status,total_amount,merchant_count,transaction_count,settlement_rail,submitted_at,confirmed_at,created_at'
    )
    .order('created_at', { ascending: false })
    .limit(50);
  if (batchError) throw batchError;

  const items = transactions ?? [];
  const summary = {
    queuedCount: items.filter((row: any) => row.status === 'queued').length,
    batchedCount: items.filter((row: any) => row.status === 'batched').length,
    submittedCount: items.filter((row: any) => row.status === 'submitted').length,
    clearingCount: items.filter((row: any) => row.status === 'clearing').length,
    settledCount: items.filter((row: any) => row.status === 'settled').length,
    rejectedCount: items.filter((row: any) => row.status === 'rejected').length,
    ignoredCount: items.filter((row: any) => row.status === 'ignored').length,
    queuedAmount: round2(
      items
        .filter((row: any) => row.status === 'queued')
        .reduce((sum: number, row: any) => sum + safeNumber(row.settlement_amount), 0)
    ),
    settledAmount: round2(
      items
        .filter((row: any) => row.status === 'settled')
        .reduce((sum: number, row: any) => sum + safeNumber(row.settlement_amount), 0)
    ),
  };

  const railMap = new Map<
    string,
    { transactionCount: number; totalAmount: number; queuedCount: number; queuedAmount: number }
  >();
  items.forEach((row: any) => {
    const rail = String(row.payment_rail ?? 'UNKNOWN');
    const current = railMap.get(rail) ?? {
      transactionCount: 0,
      totalAmount: 0,
      queuedCount: 0,
      queuedAmount: 0,
    };
    const amount = safeNumber(row.settlement_amount);
    current.transactionCount += 1;
    current.totalAmount += amount;
    if (row.status === 'queued') {
      current.queuedCount += 1;
      current.queuedAmount += amount;
    }
    railMap.set(rail, current);
  });

  const rails = Array.from(railMap.entries()).map(([rail, current]) => ({
    rail,
    transactionCount: current.transactionCount,
    totalAmount: round2(current.totalAmount),
    queuedCount: current.queuedCount,
    queuedAmount: round2(current.queuedAmount),
  }));

  return {
    summary,
    rails,
    pendingTransactions: items.slice(0, 20),
    recentBatches: batches ?? [],
  };
}

export async function getBankservEftProcessingView(admin: SupabaseClient) {
  const { data: transactions, error: transactionError } = await admin
    .from('bankserv_adaptor_transactions')
    .select(
      'id,transaction_reference,payment_method,payment_rail,settlement_amount,gross_amount,status,batch_id,created_at'
    )
    .order('created_at', { ascending: false })
    .limit(1000);
  if (transactionError) throw transactionError;

  const { data: batches, error: batchError } = await admin
    .from('billing_settlement_batches')
    .select(
      'id,batch_number,status,total_amount,merchant_count,transaction_count,settlement_rail,submitted_at,confirmed_at,created_at,bankserv_file_ref,pch_ack_ref,control_sum_amount,last_state_change_at'
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (batchError) throw batchError;

  const items = (transactions ?? []) as AdaptorTransactionRow[];
  const settlementBatches = (batches ?? []) as SettlementBatchRow[];
  const today = new Date();
  const dateToken = buildDateToken(today);

  const byRail = new Map<string, AdaptorTransactionRow[]>();
  items.forEach((row) => {
    const rail = String(row.payment_rail ?? 'UNKNOWN').toUpperCase();
    const current = byRail.get(rail) ?? [];
    current.push(row);
    byRail.set(rail, current);
  });

  const feedRails = ['EFT', 'CARD', 'WALLET'].map((rail) => {
    const railTransactions = (byRail.get(rail) ?? []).sort((a, b) => {
      const left = toDate(a.created_at)?.getTime() ?? 0;
      const right = toDate(b.created_at)?.getTime() ?? 0;
      return right - left;
    });

    return {
      rail,
      label: rail === 'CARD' ? 'Card Payments' : rail === 'WALLET' ? 'Wallet Payments' : 'EFT Payments',
      transactionCount: railTransactions.length,
      totalValue: round2(
        railTransactions.reduce((sum, row) => sum + safeNumber(row.settlement_amount), 0)
      ),
      recentEntries: railTransactions.slice(0, 5).map((row) => ({
        id: row.id,
        transactionReference: row.transaction_reference,
        amount: round2(safeNumber(row.settlement_amount)),
        status: row.status,
        createdAt: row.created_at,
      })),
    };
  });

  const batchRows: Array<{
    fileType: string;
    fileCode: string;
    fileName: string;
    status: BankservLifecycleStatus;
    cutOffTime: string;
    transactionCount: number;
    totalValue: number;
    ackReference: string;
    timestamp: string;
    opsLabel: string;
    controlSum: number;
    fileHash: string;
    rail: string;
  }> = [];

  const hasActivity = items.length > 0 || settlementBatches.length > 0;
  const sodStatus: BankservLifecycleStatus = hasActivity ? 'ACKED' : 'PENDING';
  batchRows.push({
    fileType: 'SOD',
    fileCode: 'ESGBZ1C',
    fileName: `ESGBZ1C_${dateToken}.txt`,
    status: sodStatus,
    cutOffTime: '08:00 SAST',
    transactionCount: 0,
    totalValue: 0,
    ackReference: buildAckRef('ESGBZ1C_', dateToken, sodStatus, '001'),
    timestamp: buildLocalTimestamp(today, 8, 0),
    opsLabel: hasActivity ? 'Auto-generated and submitted to BankServ' : 'Awaiting system-start trigger',
    controlSum: 0,
    fileHash: buildHash(`SOD:${dateToken}:${sodStatus}`),
    rail: 'SYSTEM',
  });

  const buildRailBatchRows = (rail: 'EFT' | 'CARD') => {
    const railTransactions = (byRail.get(rail) ?? []).sort((a, b) => {
      const left = toDate(a.created_at)?.getTime() ?? 0;
      const right = toDate(b.created_at)?.getTime() ?? 0;
      return left - right;
    });
    const persisted = settlementBatches
      .filter((row) => String(row.settlement_rail ?? '').toUpperCase() === rail)
      .sort((a, b) => {
        const left = toDate(a.created_at)?.getTime() ?? 0;
        const right = toDate(b.created_at)?.getTime() ?? 0;
        return left - right;
      });

    const chunkSize = 5000;
    const chunkCount = Math.max(Math.ceil(railTransactions.length / chunkSize), persisted.length, railTransactions.length ? 1 : 0);

    for (let index = 0; index < chunkCount; index += 1) {
      const chunk = railTransactions.slice(index * chunkSize, (index + 1) * chunkSize);
      const persistedBatch = persisted[index] ?? null;
      const fileNumber = pad(index + 1, 3);
      const fileCode = `${batchFilePrefixForRail(rail)}${fileNumber}D`;
      const totalValue = round2(
        persistedBatch
          ? safeNumber(persistedBatch.total_amount)
          : chunk.reduce((sum, row) => sum + safeNumber(row.settlement_amount), 0)
      );
      const transactionCount = persistedBatch ? safeNumber(persistedBatch.transaction_count) : chunk.length;
      const status = buildLifecycleStatus(
        persistedBatch ? [persistedBatch.status] : chunk.map((row) => row.status)
      );
      const timestamp =
        persistedBatch?.last_state_change_at ??
        persistedBatch?.confirmed_at ??
        persistedBatch?.submitted_at ??
        persistedBatch?.created_at ??
        chunk[chunk.length - 1]?.created_at ??
        buildLocalTimestamp(today, rail === 'CARD' ? 16 : 11, rail === 'CARD' ? 45 : 30);

      batchRows.push({
        fileType: batchLabelForRail(rail),
        fileCode,
        fileName:
          persistedBatch?.bankserv_file_ref ??
          `${fileCode}_${dateToken}_${pad(index + 1, 4)}.txt`,
        status,
        cutOffTime: railCutOff(rail),
        transactionCount,
        totalValue,
        ackReference:
          persistedBatch?.pch_ack_ref ??
          buildAckRef(`${fileCode}_`, dateToken, status, pad(index + 1, 3)),
        timestamp,
        opsLabel:
          status === 'ACKED'
            ? 'Submitted to BankServ and awaiting downstream clearing'
            : status === 'NACKED'
              ? 'Requires analyst review via reject queue'
              : rail === 'CARD'
                ? 'Receiving live card-funded settlement entries'
                : 'Aggregating live EFT queue until cut-off',
        controlSum: round2(
          persistedBatch?.control_sum_amount ??
            totalValue
        ),
        fileHash: buildHash(
          `${fileCode}:${dateToken}:${transactionCount}:${totalValue}:${status}:${timestamp}`
        ),
        rail,
      });
    }
  };

  buildRailBatchRows('EFT');
  buildRailBatchRows('CARD');

  const anyNack = batchRows.some((row) => row.status === 'NACKED');
  const anyAck = batchRows.some((row) => row.status === 'ACKED' && row.fileType !== 'SOD');
  const eodStatus: BankservLifecycleStatus = anyNack ? 'NACKED' : anyAck ? 'ACKED' : 'PENDING';
  batchRows.push({
    fileType: 'EOD',
    fileCode: 'ESGBZ9C',
    fileName: `ESGBZ9C_${dateToken}.txt`,
    status: eodStatus,
    cutOffTime: '18:00 SAST',
    transactionCount: 0,
    totalValue: 0,
    ackReference: buildAckRef('ESGBZ9C_', dateToken, eodStatus, '001'),
    timestamp: buildLocalTimestamp(today, 18, 0),
    opsLabel:
      eodStatus === 'ACKED'
        ? 'End-of-day control file generated after cut-off processing'
        : eodStatus === 'NACKED'
          ? 'End-of-day file failed validation or received NCK'
          : 'Will auto-generate after EFT cut-off and card capture window',
    controlSum: 0,
    fileHash: buildHash(`EOD:${dateToken}:${eodStatus}`),
    rail: 'SYSTEM',
  });

  const auditLog = batchRows
    .slice()
    .reverse()
    .slice(0, 10)
    .map((row, index) => ({
      id: `${row.fileCode}-${index}`,
      timestamp: row.timestamp,
      fileCode: row.fileCode,
      fileName: row.fileName,
      ackReference: row.ackReference,
      status: row.status,
      fileHash: row.fileHash,
      detail: row.opsLabel,
    }));

  return {
    summary: {
      sodStatus,
      eodStatus,
      liveQueueCount: items.filter((row) => row.status === 'queued' || row.status === 'batched').length,
      inFlightFiles: batchRows.filter((row) => row.status === 'PENDING').length,
      ackedFiles: batchRows.filter((row) => row.status === 'ACKED').length,
      nackFiles: batchRows.filter((row) => row.status === 'NACKED').length,
    },
    rows: batchRows.sort((a, b) => {
      const left = toDate(a.timestamp)?.getTime() ?? 0;
      const right = toDate(b.timestamp)?.getTime() ?? 0;
      return left - right;
    }),
    liveFeed: feedRails,
    auditLog,
  };
}
