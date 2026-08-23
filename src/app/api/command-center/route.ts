import type { SupabaseClient } from '@supabase/supabase-js';

import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import {
  getPaymentModeFromEnv,
  isPaymentSandboxEnabled,
} from '@/server/services/payment/payment-provider-factory';
import {
  getBankservAdaptorOverview,
  isBankservAdaptorCompatibilityError,
} from '@/server/services/bankserv/adaptor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type EvidenceStatus =
  | 'LIVE'
  | 'SANDBOX'
  | 'CONTROLLED MOCK'
  | 'EVIDENCE PENDING'
  | 'GAP / NOT READY';

type CountMetric = {
  value: number | null;
  sourceAvailability: EvidenceStatus;
  businessCapability: EvidenceStatus;
  source: string;
  note?: string;
};

type StatusMetric = {
  sourceAvailability: EvidenceStatus;
  businessCapability: EvidenceStatus;
  source: string;
  note?: string;
};

type DistributionMetric = {
  values: Record<string, number | null>;
  sourceAvailability: EvidenceStatus;
  businessCapability: EvidenceStatus;
  source: string;
  note?: string;
};

type ReconciliationFreshnessMetric = {
  latestRunTimestamp: string | null;
  latestRunStatus: string | null;
  exceptionCount: number | null;
  sourceAvailability: EvidenceStatus;
  businessCapability: EvidenceStatus;
  source: string;
  note?: string;
};

type HealthState = 'healthy' | 'attention' | 'gap';

type CommandCentreResponse = {
  status: 'ok';
  timestamp: string;
  dimensions: {
    customer: Record<string, CountMetric | StatusMetric>;
    commerce: Record<string, CountMetric | StatusMetric | DistributionMetric>;
    financial: Record<
      string,
      CountMetric | StatusMetric | DistributionMetric | ReconciliationFreshnessMetric
    >;
    governance: Record<string, CountMetric | StatusMetric | DistributionMetric>;
  };
  systemHealth: {
    state: HealthState;
    sources: Record<string, StatusMetric | DistributionMetric | ReconciliationFreshnessMetric>;
  };
  exceptions: Array<{
    severity: 'info' | 'warning';
    area: string;
    message: string;
    source: string;
  }>;
  evidence: {
    principle: string;
    statuses: EvidenceStatus[];
    sourcesUsed: string[];
    sourcesExcluded: string[];
  };
};

type CountResult = {
  count: number | null;
  error: { message?: string; code?: string } | null;
};

function asStatus(value: EvidenceStatus, source: string, note?: string): StatusMetric {
  return {
    sourceAvailability: value,
    businessCapability: value,
    source,
    ...(note ? { note } : {}),
  };
}

function asCapabilityStatus(
  sourceAvailability: EvidenceStatus,
  businessCapability: EvidenceStatus,
  source: string,
  note?: string
): StatusMetric {
  return {
    sourceAvailability,
    businessCapability,
    source,
    ...(note ? { note } : {}),
  };
}

function asCount(
  count: number | null,
  source: string,
  businessCapability: EvidenceStatus = 'EVIDENCE PENDING',
  note?: string
): CountMetric {
  return {
    value: count,
    sourceAvailability: count === null ? 'EVIDENCE PENDING' : 'LIVE',
    businessCapability: count === null ? 'EVIDENCE PENDING' : businessCapability,
    source,
    ...(note ? { note } : {}),
  };
}

function asGap(source: string, note: string): CountMetric {
  return {
    value: null,
    sourceAvailability: 'GAP / NOT READY',
    businessCapability: 'GAP / NOT READY',
    source,
    note,
  };
}

function asDistribution(
  values: Record<string, number | null>,
  source: string,
  businessCapability: EvidenceStatus = 'EVIDENCE PENDING',
  note?: string
): DistributionMetric {
  return {
    values,
    sourceAvailability: 'LIVE',
    businessCapability,
    source,
    ...(note ? { note } : {}),
  };
}

function asGapDistribution(statuses: string[], source: string, note: string): DistributionMetric {
  return {
    values: Object.fromEntries(statuses.map((status) => [status, null])),
    sourceAvailability: 'GAP / NOT READY',
    businessCapability: 'GAP / NOT READY',
    source,
    note,
  };
}

function isMissingRelation(error: { message?: string; code?: string } | null) {
  const message = String(error?.message ?? '').toLowerCase();
  return (
    error?.code === '42P01' ||
    message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  );
}

async function countRows(
  admin: SupabaseClient,
  table: string,
  source: string,
  businessCapability: EvidenceStatus = 'EVIDENCE PENDING',
  note?: string
): Promise<CountMetric> {
  const { count, error } = (await admin
    .from(table)
    .select('*', { count: 'exact', head: true })) as CountResult;

  if (error) {
    return isMissingRelation(error)
      ? asGap(source, `Source table '${table}' is not available in this environment.`)
      : {
          value: null,
          sourceAvailability: 'EVIDENCE PENDING',
          businessCapability: 'EVIDENCE PENDING',
          source,
          note: `Unable to verify safely: ${error.message ?? 'Unknown query error.'}`,
        };
  }

  return asCount(count ?? 0, source, businessCapability, note);
}

async function countRowsByStatus(
  admin: SupabaseClient,
  table: string,
  column: string,
  status: string,
  source: string,
  businessCapability: EvidenceStatus = 'EVIDENCE PENDING',
  note?: string
): Promise<CountMetric> {
  const { count, error } = (await admin
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, status)) as CountResult;

  if (error) {
    return isMissingRelation(error)
      ? asGap(source, `Source table '${table}' is not available in this environment.`)
      : {
          value: null,
          sourceAvailability: 'EVIDENCE PENDING',
          businessCapability: 'EVIDENCE PENDING',
          source,
          note: `Unable to verify safely: ${error.message ?? 'Unknown query error.'}`,
        };
  }

  return asCount(count ?? 0, source, businessCapability, note);
}

async function countRowsWhereIn(
  admin: SupabaseClient,
  table: string,
  column: string,
  values: string[],
  source: string,
  businessCapability: EvidenceStatus = 'EVIDENCE PENDING',
  note?: string
): Promise<CountMetric> {
  const { count, error } = (await admin
    .from(table)
    .select('*', { count: 'exact', head: true })
    .in(column, values)) as CountResult;

  if (error) {
    return isMissingRelation(error)
      ? asGap(source, `Source table '${table}' is not available in this environment.`)
      : {
          value: null,
          sourceAvailability: 'EVIDENCE PENDING',
          businessCapability: 'EVIDENCE PENDING',
          source,
          note: `Unable to verify '${column}' safely: ${error.message ?? 'Unknown query error.'}`,
        };
  }

  return asCount(count ?? 0, source, businessCapability, note);
}

async function statusDistribution(
  admin: SupabaseClient,
  table: string,
  column: string,
  statuses: string[],
  source: string,
  businessCapability: EvidenceStatus = 'EVIDENCE PENDING',
  note?: string
): Promise<DistributionMetric> {
  const entries = await Promise.all(
    statuses.map(async (status) => {
      const metric = await countRowsByStatus(admin, table, column, status, source);
      return [status, metric.value] as const;
    })
  );

  const hasGap = entries.some(([, value]) => value === null);
  if (hasGap) {
    return asGapDistribution(
      statuses,
      source,
      `Unable to verify one or more '${table}.${column}' counts safely.`
    );
  }

  return asDistribution(Object.fromEntries(entries), source, businessCapability, note);
}

async function reconciliationFreshness(
  admin: SupabaseClient
): Promise<ReconciliationFreshnessMetric> {
  const [latestRunRes, exceptions] = await Promise.all([
    admin
      .from('reconciliation_runs')
      .select('status,completed_at,created_at,run_date')
      .order('created_at', { ascending: false })
      .limit(1),
    countRows(admin, 'reconciliation_exceptions', 'public.reconciliation_exceptions'),
  ]);

  if (latestRunRes.error) {
    const source = 'public.reconciliation_runs';
    if (isMissingRelation(latestRunRes.error)) {
      return {
        latestRunTimestamp: null,
        latestRunStatus: null,
        exceptionCount: exceptions.value,
        sourceAvailability: 'GAP / NOT READY',
        businessCapability: 'GAP / NOT READY',
        source,
        note: "Source table 'reconciliation_runs' is not available in this environment.",
      };
    }

    return {
      latestRunTimestamp: null,
      latestRunStatus: null,
      exceptionCount: exceptions.value,
      sourceAvailability: 'EVIDENCE PENDING',
      businessCapability: 'EVIDENCE PENDING',
      source,
      note: `Unable to verify reconciliation freshness safely: ${
        latestRunRes.error.message ?? 'Unknown query error.'
      }`,
    };
  }

  const latestRun = latestRunRes.data?.[0] as
    | { status?: string | null; completed_at?: string | null; created_at?: string | null }
    | undefined;

  return {
    latestRunTimestamp: latestRun?.completed_at ?? latestRun?.created_at ?? null,
    latestRunStatus: latestRun?.status ?? null,
    exceptionCount: exceptions.value,
    sourceAvailability: 'LIVE',
    businessCapability: 'EVIDENCE PENDING',
    source: 'public.reconciliation_runs',
    note:
      latestRun === undefined
        ? 'No reconciliation run has been recorded; health cannot be inferred.'
        : 'Latest run is reported as freshness evidence only; health requires status and exception review.',
  };
}

function paymentProviderStatus(): StatusMetric {
  const mode = getPaymentModeFromEnv();
  const sandboxEnabled = isPaymentSandboxEnabled();

  if (mode === 'sandbox') {
    return asCapabilityStatus(
      sandboxEnabled ? 'SANDBOX' : 'GAP / NOT READY',
      sandboxEnabled ? 'SANDBOX' : 'GAP / NOT READY',
      'src/server/services/payment/payment-provider-factory.ts',
      sandboxEnabled
        ? 'Payment provider resolves to sandbox mode.'
        : 'PAYMENT_MODE is sandbox but PAYMENT_SANDBOX_ENABLED is not enabled.'
    );
  }

  return asCapabilityStatus(
    'EVIDENCE PENDING',
    'EVIDENCE PENDING',
    'src/server/services/payment/payment-provider-factory.ts',
    'Production provider class is configured by mode, but live processor approval/connectivity is not proven by this endpoint.'
  );
}

async function bankservStatus(admin: SupabaseClient): Promise<StatusMetric> {
  const mode = String(process.env.BILLING_BANKSERV_MODE ?? 'mock')
    .trim()
    .toLowerCase();

  try {
    const overview = await getBankservAdaptorOverview(admin);
    const recentBatchCount = overview.recentBatches.length;

    if (mode !== 'real') {
      return asCapabilityStatus(
        'LIVE',
        'CONTROLLED MOCK',
        'src/server/services/bankserv/adaptor.ts',
        `Canonical adaptor available with ${recentBatchCount} recent batch records; BILLING_BANKSERV_MODE is '${mode || 'mock'}'.`
      );
    }

    return asCapabilityStatus(
      'LIVE',
      'EVIDENCE PENDING',
      'src/server/services/bankserv/adaptor.ts',
      `Canonical adaptor available with ${recentBatchCount} recent batch records; external BankServ approval/connectivity is not proven here.`
    );
  } catch (error: any) {
    if (isBankservAdaptorCompatibilityError(error)) {
      return asCapabilityStatus(
        'GAP / NOT READY',
        'GAP / NOT READY',
        'src/server/services/bankserv/adaptor.ts',
        'Canonical BankServ adaptor tables/fields are not compatible with the current database schema.'
      );
    }

    return asCapabilityStatus(
      'EVIDENCE PENDING',
      'EVIDENCE PENDING',
      'src/server/services/bankserv/adaptor.ts',
      `Unable to verify canonical BankServ adaptor safely: ${error?.message ?? 'Unknown error.'}`
    );
  }
}

function healthState(metrics: StatusMetric[]): HealthState {
  if (
    metrics.some(
      (metric) =>
        metric.sourceAvailability === 'GAP / NOT READY' ||
        metric.businessCapability === 'GAP / NOT READY'
    )
  ) {
    return 'gap';
  }
  if (
    metrics.some(
      (metric) => metric.sourceAvailability !== 'LIVE' || metric.businessCapability !== 'LIVE'
    )
  ) {
    return 'attention';
  }
  return 'healthy';
}

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const admin = createAdminClient();

    const [
      consumerRegistrations,
      paymentTransactions,
      walletTransactions,
      customerVouchers,
      merchants,
      products,
      issuedVouchers,
      redeemedVouchers,
      billingEvents,
      ledgerEntries,
      settlements,
      reconciliationRuns,
      reconciliationExceptions,
      platformEvents,
      platformOutbox,
      platformEventStatus,
      platformOutboxStatus,
      auditEvents,
      bankservAckNckStatus,
      settlementBatchStatus,
      reconciliationFreshnessStatus,
      fraudAlertStatus,
      merchantKycStatus,
      merchantOnboardingVerifications,
      bankserv,
    ] = await Promise.all([
      countRowsWhereIn(
        admin,
        'user_profiles',
        'role',
        ['customer', 'consumer'],
        'public.user_profiles.role',
        'EVIDENCE PENDING',
        'Counts profiles with a confirmed customer/consumer role; registration quality remains evidence-dependent.'
      ),
      countRows(
        admin,
        'payment_transactions',
        'public.payment_transactions',
        'EVIDENCE PENDING',
        'Renamed from purchases because payment_transactions can include non-purchase payment activity.'
      ),
      countRows(
        admin,
        'wallet_transactions',
        'public.wallet_transactions',
        'EVIDENCE PENDING',
        'Wallet source table is available; wallet capability health requires transaction semantics and reconciliation review.'
      ),
      countRows(
        admin,
        'customer_vouchers',
        'public.customer_vouchers',
        'EVIDENCE PENDING',
        'Voucher lifecycle source table is available; lifecycle health requires status distribution and exception review.'
      ),
      countRows(admin, 'merchants', 'public.merchants'),
      countRows(admin, 'merchant_products', 'public.merchant_products'),
      countRows(
        admin,
        'customer_vouchers',
        'public.customer_vouchers',
        'EVIDENCE PENDING',
        'Represents issued/customer-held voucher records, not a separate issuance engine proof.'
      ),
      countRowsByStatus(
        admin,
        'customer_vouchers',
        'status',
        'redeemed',
        'public.customer_vouchers.status',
        'EVIDENCE PENDING',
        "The codebase uses customer_vouchers.status = 'redeemed'; redemption health still requires failure/exception review."
      ),
      countRows(admin, 'billing_events', 'public.billing_events'),
      countRows(admin, 'billing_ledger_entries', 'public.billing_ledger_entries'),
      countRows(admin, 'billing_settlements', 'public.billing_settlements'),
      countRows(admin, 'reconciliation_runs', 'public.reconciliation_runs'),
      countRows(admin, 'reconciliation_exceptions', 'public.reconciliation_exceptions'),
      countRows(admin, 'platform_events', 'public.platform_events'),
      countRows(admin, 'platform_event_outbox', 'public.platform_event_outbox'),
      statusDistribution(
        admin,
        'platform_events',
        'status',
        ['received', 'processing', 'processed', 'failed'],
        'public.platform_events.status',
        'EVIDENCE PENDING',
        'Status values confirmed by migrations and platform event publisher paths.'
      ),
      statusDistribution(
        admin,
        'platform_event_outbox',
        'status',
        ['pending', 'processing', 'sent', 'failed', 'dead_letter'],
        'public.platform_event_outbox.status',
        'EVIDENCE PENDING',
        'Status values confirmed by outbox migrations and process-outbox route.'
      ),
      countRows(admin, 'audit_events', 'public.audit_events'),
      statusDistribution(
        admin,
        'bankserv_ack_nck_tracking',
        'status',
        ['acked', 'nacked', 'pending', 'retrying', 'failed', 'escalated'],
        'public.bankserv_ack_nck_tracking.status',
        'EVIDENCE PENDING',
        'ACK/NCK status values confirmed in the current retry service and June 2026 migration.'
      ),
      statusDistribution(
        admin,
        'billing_settlement_batches',
        'status',
        [
          'pending_approval',
          'approved',
          'exported',
          'submitted_to_bank',
          'confirmed',
          'failed',
          'cancelled',
        ],
        'public.billing_settlement_batches.status',
        'EVIDENCE PENDING',
        'Settlement batch statuses confirmed in billing phase 2 migration and admin settlement routes.'
      ),
      reconciliationFreshness(admin),
      statusDistribution(
        admin,
        'fraud_alerts',
        'status',
        ['open', 'investigating', 'dismissed', 'resolved'],
        'public.fraud_alerts.status',
        'EVIDENCE PENDING',
        'Fraud alert table is confirmed; exact operational coverage remains evidence-dependent.'
      ),
      statusDistribution(
        admin,
        'merchant_kyc_documents',
        'verification_status',
        ['submitted', 'under_review', 'approved', 'rejected'],
        'public.merchant_kyc_documents.verification_status',
        'EVIDENCE PENDING',
        'KYC document verification statuses are confirmed by security/compliance migrations.'
      ),
      countRows(
        admin,
        'merchant_onboarding_verifications',
        'public.merchant_onboarding_verifications',
        'EVIDENCE PENDING',
        'The table tracks verification metadata, but no confirmed status enum exists; source availability only.'
      ),
      bankservStatus(admin),
    ] as const);

    const paymentProvider = paymentProviderStatus();

    const governanceSources = [
      paymentProvider,
      bankserv,
      asCapabilityStatus(
        platformEvents.sourceAvailability,
        platformEvents.businessCapability,
        platformEvents.source,
        platformEvents.note
      ),
      asCapabilityStatus(
        platformOutbox.sourceAvailability,
        platformOutbox.businessCapability,
        platformOutbox.source,
        platformOutbox.note
      ),
      asCapabilityStatus(
        auditEvents.sourceAvailability,
        auditEvents.businessCapability,
        auditEvents.source,
        auditEvents.note
      ),
    ];

    const response: CommandCentreResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      dimensions: {
        customer: {
          consumerRegistrations,
          paymentTransactions,
          wallet: walletTransactions,
          voucherLifecycle: customerVouchers,
        },
        commerce: {
          merchants,
          products,
          issuedVouchers,
          redeemedVouchers,
        },
        financial: {
          payments: paymentTransactions,
          paymentProvider,
          billingEvents,
          ledger: ledgerEntries,
          settlement: settlements,
          reconciliation: reconciliationRuns,
          reconciliationFreshness: reconciliationFreshnessStatus,
          settlementBatchStatus,
          bankServStatus: bankserv,
          bankServAckNckStatus: bankservAckNckStatus,
        },
        governance: {
          audit: auditEvents,
          exceptions: reconciliationExceptions,
          platformEvents,
          platformOutbox,
          platformEventStatus,
          platformOutboxStatus,
          fraudAlertStatus,
          merchantKycStatus,
          merchantOnboardingVerifications,
          evidenceStatus: asCapabilityStatus(
            'LIVE',
            'EVIDENCE PENDING',
            'src/app/api/command-center/route.ts',
            'Read-only aggregation is implemented; operational proof depends on source systems and environment evidence.'
          ),
          securityControlPosture: asCapabilityStatus(
            'LIVE',
            'LIVE',
            'src/server/services/billing/portal-guard.ts',
            'Endpoint is restricted to admin, finance_approver, and auditor portal roles.'
          ),
        },
      },
      systemHealth: {
        state: healthState(governanceSources),
        sources: {
          accessControl: asStatus(
            'LIVE',
            'src/server/services/billing/portal-guard.ts',
            'Protected by existing portal authorization guard.'
          ),
          paymentProvider,
          bankServ: bankserv,
          platformEvents: asCapabilityStatus(
            platformEvents.sourceAvailability,
            platformEvents.businessCapability,
            platformEvents.source,
            platformEvents.note
          ),
          platformOutbox: asCapabilityStatus(
            platformOutbox.sourceAvailability,
            platformOutbox.businessCapability,
            platformOutbox.source,
            platformOutbox.note
          ),
          platformEventStatus,
          platformOutboxStatus,
          reconciliationFreshness: reconciliationFreshnessStatus,
          settlementBatchStatus,
          bankServAckNckStatus: bankservAckNckStatus,
          fraudAlertStatus,
          merchantKycStatus,
          auditTrail: asCapabilityStatus(
            auditEvents.sourceAvailability,
            auditEvents.businessCapability,
            auditEvents.source,
            auditEvents.note
          ),
        },
      },
      exceptions: [
        ...(reconciliationExceptions.value && reconciliationExceptions.value > 0
          ? [
              {
                severity: 'warning' as const,
                area: 'financial.reconciliation',
                message: `${reconciliationExceptions.value} reconciliation exception record(s) exist.`,
                source: reconciliationExceptions.source,
              },
            ]
          : []),
        ...(platformEventStatus.values.failed && platformEventStatus.values.failed > 0
          ? [
              {
                severity: 'warning' as const,
                area: 'governance.platform_events',
                message: `${platformEventStatus.values.failed} failed platform event record(s) exist.`,
                source: platformEventStatus.source,
              },
            ]
          : []),
        ...(platformOutboxStatus.values.failed && platformOutboxStatus.values.failed > 0
          ? [
              {
                severity: 'warning' as const,
                area: 'governance.platform_outbox',
                message: `${platformOutboxStatus.values.failed} failed outbox record(s) exist.`,
                source: platformOutboxStatus.source,
              },
            ]
          : []),
        ...(platformOutboxStatus.values.dead_letter && platformOutboxStatus.values.dead_letter > 0
          ? [
              {
                severity: 'warning' as const,
                area: 'governance.platform_outbox',
                message: `${platformOutboxStatus.values.dead_letter} dead-letter outbox record(s) exist.`,
                source: platformOutboxStatus.source,
              },
            ]
          : []),
        ...(bankserv.businessCapability !== 'LIVE'
          ? [
              {
                severity: 'info' as const,
                area: 'financial.bankserv',
                message: bankserv.note ?? 'BankServ status requires evidence review.',
                source: bankserv.source,
              },
            ]
          : []),
        ...(paymentProvider.businessCapability !== 'LIVE'
          ? [
              {
                severity: 'info' as const,
                area: 'financial.payments',
                message:
                  paymentProvider.note ?? 'Payment provider status requires evidence review.',
                source: paymentProvider.source,
              },
            ]
          : []),
      ],
      evidence: {
        principle:
          'Read-only Command Centre aggregation. Counts are returned only from verified source tables; unverified or unavailable sources are marked explicitly.',
        statuses: ['LIVE', 'SANDBOX', 'CONTROLLED MOCK', 'EVIDENCE PENDING', 'GAP / NOT READY'],
        sourcesUsed: [
          'src/server/services/billing/portal-guard.ts',
          'src/server/services/payment/payment-provider-factory.ts',
          'src/server/services/bankserv/adaptor.ts',
          'public.user_profiles',
          'public.payment_transactions',
          'public.wallet_transactions',
          'public.customer_vouchers',
          'public.merchants',
          'public.merchant_products',
          'public.billing_events',
          'public.billing_ledger_entries',
          'public.billing_settlements',
          'public.reconciliation_runs',
          'public.reconciliation_exceptions',
          'public.platform_events',
          'public.platform_event_outbox',
          'public.audit_events',
          'public.bankserv_ack_nck_tracking',
          'public.billing_settlement_batches',
          'public.fraud_alerts',
          'public.merchant_kyc_documents',
          'public.merchant_onboarding_verifications',
        ],
        sourcesExcluded: [
          'src/lib/bankserv-adaptor.ts',
          'src/app/api/debug/env/route.ts',
          'src/app/api/debug/auth/route.ts',
        ],
      },
    };

    return jsonNoStore(response);
  } catch (error: any) {
    return jsonNoStore(
      {
        error: 'Command Centre aggregation failed.',
        detail: error?.message ?? 'Unknown error.',
      },
      { status: 500 }
    );
  }
}
