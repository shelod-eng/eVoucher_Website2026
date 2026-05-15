import { createAdminClient } from '@/lib/supabase/admin';

type MerchantRow = {
  id: string;
  business_name: string | null;
  status: string | null;
};

type UserProfileRow = {
  id: string;
  role: string | null;
  acquisition_channel?: string | null;
  primary_access_channel?: string | null;
  consumer_segment?: string | null;
  popia_consent_at?: string | null;
};

type TransactionRow = {
  id: string;
  customer_id: string | null;
  merchant_id: string | null;
  amount: number | null;
  payment_status: string | null;
  payment_method?: string | null;
  access_channel?: string | null;
  card_brand?: string | null;
  total_discount_pct?: number | null;
  consumer_benefit_amount?: number | null;
  evoucher_benefit_amount?: number | null;
  created_at: string;
};

type ProductRow = {
  id: string;
  merchant_id: string | null;
  face_value: number | null;
  total_discount_pct: number | null;
  is_active: boolean | null;
};

type VoucherRow = {
  id: string;
  customer_id: string | null;
  face_value: number | null;
  current_balance?: number | null;
  created_at?: string | null;
  issued_at?: string | null;
};

type WalletTransactionRow = {
  id: string;
  customer_id: string | null;
  amount: number | null;
  savings: number | null;
  type: string | null;
};

type InvoiceRow = {
  id: string;
  merchant_id: string | null;
  status: string | null;
  net_payable_to_merchant: number | null;
  platform_revenue_amount?: number | null;
  bank_fee_amount?: number | null;
  settlement_batch_id?: string | null;
};

type SettlementRow = {
  id: string;
  merchant_id: string | null;
  batch_id: string | null;
  amount: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SettlementBatchRow = {
  id: string;
  status: string | null;
  total_amount: number | null;
  merchant_count: number | null;
  created_at: string | null;
  confirmed_at: string | null;
};

type LedgerEntryRow = {
  id: string;
  entry_group_id?: string | null;
  source_type: string | null;
  source_id?: string | null;
  merchant_id?: string | null;
  customer_id?: string | null;
  debit_account?: string | null;
  credit_account?: string | null;
  amount: number | null;
  created_at: string | null;
};

type DistributionScheduleRow = {
  id: string;
  merchant_id: string | null;
  total_amount: number | null;
  status: string | null;
  scheduled_date: string | null;
  processed_at: string | null;
};

type AuditEventRow = {
  id: string;
  action: string | null;
  created_at: string | null;
};

type FraudAlertRow = {
  id: string;
  status: string | null;
  created_at: string | null;
};

type KycDocumentRow = {
  id: string;
  merchant_id: string | null;
  document_type: string | null;
  verification_status: string | null;
};

type PaymentMethodBreakdown = {
  method: string;
  count: number;
  amount: number;
  percentage: number;
};

type NamedValueBreakdown = {
  label: string;
  value: number;
  percentage?: number;
};

type TimeSeriesRow = {
  label: string;
  value: number;
};

type MerchantPerformanceRow = {
  merchantId: string;
  merchantName: string;
  transactionCount: number;
  grossRevenue: number;
  consumerSavings: number;
  platformRevenue: number;
  avgDiscountPct: number;
  netMerchantPayable: number;
};

type MonthlySavingsRow = {
  month: string;
  savings: number;
};

type CoverageFlags = {
  paymentTransactions: boolean;
  paymentMethodSplit: boolean;
  billingLedger: boolean;
  billingInvoices: boolean;
  settlementBatches: boolean;
  complianceDocuments: boolean;
  auditEvents: boolean;
  fraudAlerts: boolean;
  walletTransactions: boolean;
  consumerChannels: boolean;
  distributionSchedule: boolean;
};

export type ReportingOverview = {
  generatedAt: string;
  dataStage: 'live' | 'prelaunch';
  coverage: CoverageFlags;
  executiveSummary: {
    merchantCount: number;
    approvedMerchantCount: number;
    consumerCount: number;
    activeProductCount: number;
    transactionCount: number;
    totalVolume: number;
    totalSavings: number;
    platformRevenue: number;
    pendingPayouts: number;
    settledToMerchants: number;
  };
  reports: {
    dailyTransactionSummary: {
      title: string;
      refreshCadence: string;
      transactionCount: number;
      completedCount: number;
      failedCount: number;
      failedRatePct: number;
      totalVolume: number;
      averageTransactionValue: number;
      paymentMethodSplit: PaymentMethodBreakdown[];
      dailyVolumeSeries: TimeSeriesRow[];
    };
    merchantPerformance: {
      title: string;
      refreshCadence: string;
      merchantCount: number;
      approvedMerchantCount: number;
      activeProductCount: number;
      averageDiscountPct: number;
      topMerchants: MerchantPerformanceRow[];
      merchantStatusSplit: NamedValueBreakdown[];
      faceValueDistribution: NamedValueBreakdown[];
    };
    consumerImpact: {
      title: string;
      refreshCadence: string;
      consumerCount: number;
      uniquePurchasingConsumers: number;
      totalSavings: number;
      averageSavingsPerConsumer: number;
      walletSavingsBalance: number;
      monthlySavings: MonthlySavingsRow[];
      channelSplitAvailable: boolean;
      channelSplit: NamedValueBreakdown[];
      segmentSplit: NamedValueBreakdown[];
    };
    settlementLedger: {
      title: string;
      refreshCadence: string;
      pendingAmount: number;
      settledAmount: number;
      failedBatchCount: number;
      batchCount: number;
      averageBatchProcessingDays: number | null;
      reconciliationRatePct: number | null;
      distributionScheduledAmount: number;
      pendingDistributionCount: number;
      settlementStatusSplit: NamedValueBreakdown[];
    };
    complianceAudit: {
      title: string;
      refreshCadence: string;
      popiaConsentRatePct: number | null;
      fraudFlagRatePct: number | null;
      fraudTargetThresholdPct: number;
      fraudTargetBreached: boolean;
      auditEventCount: number;
      auditLogCompletenessPct: number | null;
      openFraudAlertCount: number;
      verifiedPopiaMerchantCount: number;
      auditActionSplit: NamedValueBreakdown[];
    };
    executiveSponsorSummary: {
      title: string;
      refreshCadence: string;
      sponsorAudience: string[];
      sourceTables: string[];
      summaryLine: string;
    };
  };
};

type ReportingOverviewInput = {
  merchants: MerchantRow[];
  users: UserProfileRow[];
  transactions: TransactionRow[];
  products: ProductRow[];
  vouchers: VoucherRow[];
  walletTransactions: WalletTransactionRow[];
  invoices: InvoiceRow[];
  settlements: SettlementRow[];
  settlementBatches: SettlementBatchRow[];
  ledgerEntries: LedgerEntryRow[];
  distributionSchedule: DistributionScheduleRow[];
  auditEvents: AuditEventRow[];
  fraudAlerts: FraudAlertRow[];
  kycDocuments: KycDocumentRow[];
  coverage: CoverageFlags;
};

function round2(value: number) {
  return Number(Number(value || 0).toFixed(2));
}

function percentage(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return round2((numerator / denominator) * 100);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return round2(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function titleCase(value: string) {
  return String(value ?? '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function buildBreakdown(rows: Map<string, number>, totalForPct?: number): NamedValueBreakdown[] {
  return Array.from(rows.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: totalForPct ? percentage(value, totalForPct) : undefined,
    }))
    .sort((a, b) => b.value - a.value);
}

function safeDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function monthKey(value: string | null | undefined) {
  const date = safeDate(value);
  return date ? date.toISOString().slice(0, 7) : 'unknown';
}

function normalizePaymentMethod(row: TransactionRow) {
  const explicitMethod = String(row.payment_method ?? '')
    .trim()
    .toLowerCase();
  if (explicitMethod) return explicitMethod;

  const brand = String(row.card_brand ?? '')
    .trim()
    .toLowerCase();
  if (brand) return 'card';
  return 'unknown';
}

function normalizeAccessChannel(row: TransactionRow, user?: UserProfileRow | null) {
  const explicit = String(row.access_channel ?? '')
    .trim()
    .toLowerCase();
  if (explicit) return explicit;

  const fallback = String(user?.primary_access_channel ?? user?.acquisition_channel ?? '')
    .trim()
    .toLowerCase();
  if (fallback) return fallback;

  return 'web';
}

function differenceInDays(fromValue: string | null, toValue: string | null) {
  const from = safeDate(fromValue);
  const to = safeDate(toValue);
  if (!from || !to) return null;
  return round2((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const relation = relationName.toLowerCase();
  return (
    message.includes(`relation "${relation}" does not exist`) ||
    message.includes(`relation "${relation.split('.').at(-1) ?? relation}" does not exist`) ||
    message.includes('schema cache') ||
    message.includes('could not find the table')
  );
}

function isMissingColumn(error: any, columnName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const normalized = columnName.toLowerCase();
  return (
    message.includes(`column "${normalized}" does not exist`) ||
    message.includes(`column ${normalized} does not exist`) ||
    message.includes(`.${normalized} does not exist`) ||
    message.includes(`could not find the '${normalized}' column`) ||
    message.includes('schema cache')
  );
}

async function fetchTransactionRows(
  admin: ReturnType<typeof createAdminClient>,
  setCoverage: (next: {
    transactionsCoverage?: boolean;
    paymentMethodCoverage?: boolean;
    consumerChannelsCoverage?: boolean;
  }) => void
) {
  const variants = [
    {
      select:
        'id,customer_id,merchant_id,amount,payment_status,payment_method,access_channel,card_brand,total_discount_pct,consumer_benefit_amount,evoucher_benefit_amount,created_at',
      hasPaymentMethod: true,
      hasAccessChannel: true,
    },
    {
      select:
        'id,customer_id,merchant_id,amount,payment_status,payment_method,card_brand,total_discount_pct,consumer_benefit_amount,evoucher_benefit_amount,created_at',
      hasPaymentMethod: true,
      hasAccessChannel: false,
    },
    {
      select:
        'id,customer_id,merchant_id,amount,payment_status,access_channel,card_brand,total_discount_pct,consumer_benefit_amount,evoucher_benefit_amount,created_at',
      hasPaymentMethod: false,
      hasAccessChannel: true,
    },
    {
      select:
        'id,customer_id,merchant_id,amount,payment_status,card_brand,total_discount_pct,consumer_benefit_amount,evoucher_benefit_amount,created_at',
      hasPaymentMethod: false,
      hasAccessChannel: false,
    },
  ];

  for (const variant of variants) {
    const { data, error } = await admin.from('payment_transactions').select(variant.select);

    if (!error) {
      setCoverage({
        paymentMethodCoverage: variant.hasPaymentMethod,
        consumerChannelsCoverage: variant.hasAccessChannel,
      });
      return (data ?? []) as unknown as TransactionRow[];
    }

    if (isMissingRelation(error, 'public.payment_transactions')) {
      setCoverage({
        transactionsCoverage: false,
        paymentMethodCoverage: false,
        consumerChannelsCoverage: false,
      });
      return [] as TransactionRow[];
    }

    if (isMissingColumn(error, 'payment_method') || isMissingColumn(error, 'access_channel')) {
      continue;
    }

    throw error;
  }

  setCoverage({
    paymentMethodCoverage: false,
    consumerChannelsCoverage: false,
  });
  return [] as TransactionRow[];
}

async function fetchVoucherRows(
  admin: ReturnType<typeof createAdminClient>,
  setCoverage: (next: { vouchersCoverage?: boolean }) => void
) {
  const variants = [
    'id,customer_id,face_value,current_balance,created_at,issued_at',
    'id,customer_id,face_value,current_balance,issued_at',
    'id,customer_id,face_value,current_balance,created_at',
    'id,customer_id,face_value,current_balance',
  ];

  for (const select of variants) {
    const { data, error } = await admin.from('customer_vouchers').select(select);

    if (!error) {
      return (data ?? []) as unknown as VoucherRow[];
    }

    if (isMissingRelation(error, 'public.customer_vouchers')) {
      setCoverage({ vouchersCoverage: false });
      return [] as VoucherRow[];
    }

    if (isMissingColumn(error, 'created_at') || isMissingColumn(error, 'issued_at')) {
      continue;
    }

    throw error;
  }

  return [] as VoucherRow[];
}

async function fetchFraudAlertRows(
  admin: ReturnType<typeof createAdminClient>,
  setCoverage: (next: { fraudCoverage?: boolean }) => void
) {
  const variants = ['id,status,created_at', 'status,created_at', 'id,status', 'status'];

  for (const select of variants) {
    const { data, error } = await admin.from('fraud_alerts').select(select);

    if (!error) {
      return (data ?? []) as unknown as FraudAlertRow[];
    }

    if (isMissingRelation(error, 'public.fraud_alerts')) {
      setCoverage({ fraudCoverage: false });
      return [] as FraudAlertRow[];
    }

    if (
      isMissingColumn(error, 'id') ||
      isMissingColumn(error, 'status') ||
      isMissingColumn(error, 'created_at')
    ) {
      continue;
    }

    throw error;
  }

  return [] as FraudAlertRow[];
}

export function buildReportingOverview(input: ReportingOverviewInput): ReportingOverview {
  const merchantNameById = new Map(
    input.merchants.map((merchant) => [merchant.id, merchant.business_name || 'Unknown Merchant'])
  );
  const userById = new Map(input.users.map((user) => [user.id, user]));

  const completedTransactions = input.transactions.filter(
    (row) => String(row.payment_status ?? '').toLowerCase() === 'completed'
  );
  const failedTransactions = input.transactions.filter(
    (row) => String(row.payment_status ?? '').toLowerCase() === 'failed'
  );
  const totalVolume = round2(
    completedTransactions.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  );
  const totalSavings = round2(
    completedTransactions.reduce((sum, row) => sum + Number(row.consumer_benefit_amount ?? 0), 0)
  );
  const platformRevenue = round2(
    completedTransactions.reduce((sum, row) => sum + Number(row.evoucher_benefit_amount ?? 0), 0)
  );

  const paymentMethodMap = new Map<string, { count: number; amount: number }>();
  completedTransactions.forEach((row) => {
    const key = normalizePaymentMethod(row);
    const current = paymentMethodMap.get(key) ?? { count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(row.amount ?? 0);
    paymentMethodMap.set(key, current);
  });

  const paymentMethodSplit = Array.from(paymentMethodMap.entries())
    .map(([method, current]) => ({
      method: titleCase(method),
      count: current.count,
      amount: round2(current.amount),
      percentage: percentage(current.count, completedTransactions.length),
    }))
    .sort((a, b) => b.amount - a.amount);

  const dailyVolumeMap = new Map<string, number>();
  completedTransactions.forEach((row) => {
    const date = safeDate(row.created_at);
    const label = date ? date.toLocaleDateString('en-ZA', { weekday: 'short' }) : 'Unknown';
    dailyVolumeMap.set(label, Number(dailyVolumeMap.get(label) ?? 0) + Number(row.amount ?? 0));
  });
  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyVolumeSeries = weekdayOrder.map((label) => ({
    label,
    value: round2(Number(dailyVolumeMap.get(label) ?? 0)),
  }));

  const merchantPerformanceMap = new Map<
    string,
    {
      merchantId: string;
      merchantName: string;
      transactionCount: number;
      grossRevenue: number;
      consumerSavings: number;
      platformRevenue: number;
      discountValues: number[];
      netMerchantPayable: number;
    }
  >();

  completedTransactions.forEach((row) => {
    const merchantId = String(row.merchant_id ?? 'unassigned');
    const current = merchantPerformanceMap.get(merchantId) ?? {
      merchantId,
      merchantName: merchantNameById.get(merchantId) ?? 'Unknown Merchant',
      transactionCount: 0,
      grossRevenue: 0,
      consumerSavings: 0,
      platformRevenue: 0,
      discountValues: [],
      netMerchantPayable: 0,
    };
    current.transactionCount += 1;
    current.grossRevenue += Number(row.amount ?? 0);
    current.consumerSavings += Number(row.consumer_benefit_amount ?? 0);
    current.platformRevenue += Number(row.evoucher_benefit_amount ?? 0);
    current.discountValues.push(Number(row.total_discount_pct ?? 0));
    merchantPerformanceMap.set(merchantId, current);
  });

  input.invoices.forEach((invoice) => {
    const merchantId = String(invoice.merchant_id ?? 'unassigned');
    const current = merchantPerformanceMap.get(merchantId) ?? {
      merchantId,
      merchantName: merchantNameById.get(merchantId) ?? 'Unknown Merchant',
      transactionCount: 0,
      grossRevenue: 0,
      consumerSavings: 0,
      platformRevenue: 0,
      discountValues: [],
      netMerchantPayable: 0,
    };
    current.netMerchantPayable += Number(invoice.net_payable_to_merchant ?? 0);
    merchantPerformanceMap.set(merchantId, current);
  });

  const topMerchants: MerchantPerformanceRow[] = Array.from(merchantPerformanceMap.values())
    .map((row) => ({
      merchantId: row.merchantId,
      merchantName: row.merchantName,
      transactionCount: row.transactionCount,
      grossRevenue: round2(row.grossRevenue),
      consumerSavings: round2(row.consumerSavings),
      platformRevenue: round2(row.platformRevenue),
      avgDiscountPct: average(row.discountValues),
      netMerchantPayable: round2(row.netMerchantPayable),
    }))
    .sort((a, b) => b.grossRevenue - a.grossRevenue)
    .slice(0, 10);

  const merchantStatusMap = new Map<string, number>();
  input.merchants.forEach((merchant) => {
    const key = titleCase(String(merchant.status ?? 'unknown'));
    merchantStatusMap.set(key, Number(merchantStatusMap.get(key) ?? 0) + 1);
  });
  const merchantStatusSplit = buildBreakdown(merchantStatusMap, input.merchants.length);

  const faceValueBands = new Map<string, number>();
  input.products.forEach((product) => {
    const faceValue = Number(product.face_value ?? 0);
    const label =
      faceValue <= 100
        ? 'R0-R100'
        : faceValue <= 250
          ? 'R101-R250'
          : faceValue <= 500
            ? 'R251-R500'
            : 'R501+';
    faceValueBands.set(label, Number(faceValueBands.get(label) ?? 0) + 1);
  });
  const faceValueDistribution = buildBreakdown(faceValueBands, input.products.length);

  const monthlySavingsMap = new Map<string, number>();
  completedTransactions.forEach((row) => {
    const key = monthKey(row.created_at);
    monthlySavingsMap.set(
      key,
      Number(monthlySavingsMap.get(key) ?? 0) + Number(row.consumer_benefit_amount ?? 0)
    );
  });
  const monthlySavings = Array.from(monthlySavingsMap.entries())
    .map(([month, savings]) => ({ month, savings: round2(savings) }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  const channelMap = new Map<string, number>();
  completedTransactions.forEach((row) => {
    const profile = row.customer_id ? (userById.get(row.customer_id) ?? null) : null;
    const channel = titleCase(normalizeAccessChannel(row, profile));
    channelMap.set(channel, Number(channelMap.get(channel) ?? 0) + 1);
  });
  const channelSplit = buildBreakdown(channelMap, completedTransactions.length);

  const uniqueConsumers = new Set(
    input.users
      .filter((row) => String(row.role ?? '').toLowerCase() === 'customer')
      .map((row) => row.id)
  );
  const consumerPopiaConsents = input.users.filter(
    (row) =>
      String(row.role ?? '').toLowerCase() === 'customer' &&
      Boolean(String(row.popia_consent_at ?? '').trim())
  ).length;
  const uniquePurchasingConsumers = new Set(
    completedTransactions.map((row) => String(row.customer_id ?? '')).filter(Boolean)
  );

  const segmentMap = new Map<string, number>();
  input.users
    .filter((row) => String(row.role ?? '').toLowerCase() === 'customer')
    .forEach((row) => {
      const segment = titleCase(String(row.consumer_segment ?? 'Unknown'));
      segmentMap.set(segment, Number(segmentMap.get(segment) ?? 0) + 1);
    });
  const segmentSplit = buildBreakdown(segmentMap, uniqueConsumers.size || input.users.length);

  const walletSavingsBalance = round2(
    input.walletTransactions.reduce((sum, row) => sum + Number(row.savings ?? 0), 0)
  );

  const pendingPayouts = round2(
    input.invoices
      .filter(
        (row) => String(row.status ?? '').toLowerCase() === 'approved' && !row.settlement_batch_id
      )
      .reduce((sum, row) => sum + Number(row.net_payable_to_merchant ?? 0), 0)
  );
  const settledToMerchants = round2(
    input.settlements
      .filter((row) => String(row.status ?? '').toLowerCase() === 'confirmed')
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  );
  const failedBatchCount = input.settlementBatches.filter(
    (row) => String(row.status ?? '').toLowerCase() === 'failed'
  ).length;
  const scheduledDistributionRows = input.distributionSchedule.filter((row) => {
    const status = String(row.status ?? '').toLowerCase();
    return status === 'scheduled' || status === 'pending' || status === 'approved';
  });
  const distributionScheduledAmount = round2(
    scheduledDistributionRows.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0)
  );

  const settlementStatusMap = new Map<string, number>();
  input.settlementBatches.forEach((row) => {
    const label = titleCase(String(row.status ?? 'unknown'));
    settlementStatusMap.set(label, Number(settlementStatusMap.get(label) ?? 0) + 1);
  });
  const settlementStatusSplit = buildBreakdown(settlementStatusMap, input.settlementBatches.length);

  const batchProcessingDays = input.settlementBatches
    .map((row) => differenceInDays(row.created_at, row.confirmed_at))
    .filter((value): value is number => value !== null);
  const ledgerTransactionRows = input.ledgerEntries.filter(
    (row) => String(row.source_type ?? '').toLowerCase() === 'transaction'
  );
  const reconciledTransactionSourceIds = new Set(
    ledgerTransactionRows.map((row) => String(row.source_id ?? '')).filter(Boolean)
  );
  const auditLogCompletenessPct =
    completedTransactions.length > 0 && input.coverage.billingLedger
      ? percentage(reconciledTransactionSourceIds.size, completedTransactions.length)
      : null;
  const ledgerTransactionAmount = round2(
    ledgerTransactionRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  );
  const reconciliationRatePct =
    totalVolume > 0 && input.coverage.billingLedger
      ? round2(
          Math.max(0, 100 - (Math.abs(totalVolume - ledgerTransactionAmount) / totalVolume) * 100)
        )
      : null;

  const verifiedPopiaMerchantIds = new Set(
    input.kycDocuments
      .filter(
        (row) =>
          String(row.document_type ?? '').toUpperCase() === 'POPIA_CONSENT' &&
          String(row.verification_status ?? '').toLowerCase() === 'approved'
      )
      .map((row) => String(row.merchant_id ?? ''))
      .filter(Boolean)
  );

  const openFraudAlertCount = input.fraudAlerts.filter((row) => {
    const status = String(row.status ?? '').toLowerCase();
    return status === 'open' || status === 'investigating';
  }).length;

  const auditActionMap = new Map<string, number>();
  input.auditEvents.forEach((row) => {
    const label = titleCase(String(row.action ?? 'unknown'));
    auditActionMap.set(label, Number(auditActionMap.get(label) ?? 0) + 1);
  });
  const auditActionSplit = buildBreakdown(auditActionMap, input.auditEvents.length);

  const approvedMerchants = input.merchants.filter((row) => {
    const status = String(row.status ?? '').toLowerCase();
    return status === 'approved' || status === 'active';
  });

  const activeProductCount = input.products.filter((row) => row.is_active === true).length;
  const averageDiscountPct = average(
    input.products
      .map((row) => Number(row.total_discount_pct ?? 0))
      .filter((value) => Number.isFinite(value) && value > 0)
  );

  const summaryLine = `R${totalSavings.toFixed(2)} savings, ${completedTransactions.length} completed transactions, ${input.merchants.length} merchants in reporting scope.`;

  return {
    generatedAt: new Date().toISOString(),
    dataStage: completedTransactions.length > 0 ? 'live' : 'prelaunch',
    coverage: input.coverage,
    executiveSummary: {
      merchantCount: input.merchants.length,
      approvedMerchantCount: approvedMerchants.length,
      consumerCount: uniqueConsumers.size,
      activeProductCount,
      transactionCount: completedTransactions.length,
      totalVolume,
      totalSavings,
      platformRevenue,
      pendingPayouts,
      settledToMerchants,
    },
    reports: {
      dailyTransactionSummary: {
        title: 'R-01 Daily Transaction Summary',
        refreshCadence: 'Daily',
        transactionCount: input.transactions.length,
        completedCount: completedTransactions.length,
        failedCount: failedTransactions.length,
        failedRatePct: percentage(failedTransactions.length, input.transactions.length),
        totalVolume,
        averageTransactionValue:
          completedTransactions.length > 0 ? round2(totalVolume / completedTransactions.length) : 0,
        paymentMethodSplit,
        dailyVolumeSeries,
      },
      merchantPerformance: {
        title: 'R-02 Merchant Performance Dashboard',
        refreshCadence: 'Weekly',
        merchantCount: input.merchants.length,
        approvedMerchantCount: approvedMerchants.length,
        activeProductCount,
        averageDiscountPct,
        topMerchants,
        merchantStatusSplit,
        faceValueDistribution,
      },
      consumerImpact: {
        title: 'R-03 Consumer Impact & Savings',
        refreshCadence: 'Weekly',
        consumerCount: uniqueConsumers.size,
        uniquePurchasingConsumers: uniquePurchasingConsumers.size,
        totalSavings,
        averageSavingsPerConsumer:
          uniquePurchasingConsumers.size > 0
            ? round2(totalSavings / uniquePurchasingConsumers.size)
            : 0,
        walletSavingsBalance,
        monthlySavings,
        channelSplitAvailable: input.coverage.consumerChannels,
        channelSplit,
        segmentSplit,
      },
      settlementLedger: {
        title: 'R-04 Settlement & Payout Ledger',
        refreshCadence: 'Weekly',
        pendingAmount: pendingPayouts,
        settledAmount: settledToMerchants,
        failedBatchCount,
        batchCount: input.settlementBatches.length,
        averageBatchProcessingDays:
          batchProcessingDays.length > 0 ? average(batchProcessingDays) : null,
        reconciliationRatePct,
        distributionScheduledAmount,
        pendingDistributionCount: scheduledDistributionRows.length,
        settlementStatusSplit,
      },
      complianceAudit: {
        title: 'R-05 Compliance & Audit Dashboard',
        refreshCadence: 'Monthly',
        popiaConsentRatePct:
          uniqueConsumers.size > 0
            ? percentage(consumerPopiaConsents, uniqueConsumers.size)
            : input.coverage.complianceDocuments && input.merchants.length > 0
              ? percentage(verifiedPopiaMerchantIds.size, input.merchants.length)
              : null,
        fraudFlagRatePct:
          input.coverage.fraudAlerts && input.transactions.length > 0
            ? percentage(input.fraudAlerts.length, input.transactions.length)
            : null,
        fraudTargetThresholdPct: 0.1,
        fraudTargetBreached:
          input.coverage.fraudAlerts && input.transactions.length > 0
            ? percentage(input.fraudAlerts.length, input.transactions.length) > 0.1
            : false,
        auditEventCount: input.auditEvents.length,
        auditLogCompletenessPct,
        openFraudAlertCount,
        verifiedPopiaMerchantCount: verifiedPopiaMerchantIds.size,
        auditActionSplit,
      },
      executiveSponsorSummary: {
        title: 'R-06 Executive Sponsor Summary',
        refreshCadence: 'Monthly',
        sponsorAudience: ['Management', 'FNB', 'DTI', 'Board'],
        sourceTables: [
          'user_profiles',
          'merchants',
          'merchant_products',
          'customer_vouchers',
          'payment_transactions',
          'wallet_transactions',
          'billing_ledger_entries',
          'billing_invoices',
          'billing_settlement_batches',
          'billing_settlements',
          'fnb_distribution_schedule',
          'audit_events',
          'fraud_alerts',
          'merchant_kyc_documents',
        ],
        summaryLine,
      },
    },
  };
}

export async function getReportingOverview(): Promise<ReportingOverview> {
  const admin = createAdminClient();

  const merchantsQuery = admin.from('merchants').select('id,business_name,status');
  const productsQuery = admin
    .from('merchant_products')
    .select('id,merchant_id,face_value,total_discount_pct,is_active');
  const walletQuery = admin
    .from('wallet_transactions')
    .select('id,customer_id,amount,savings,type');
  const invoiceQuery = admin
    .from('billing_invoices')
    .select(
      'id,merchant_id,status,net_payable_to_merchant,platform_revenue_amount,bank_fee_amount,settlement_batch_id'
    );
  const ledgerQuery = admin
    .from('billing_ledger_entries')
    .select(
      'id,entry_group_id,source_type,source_id,merchant_id,customer_id,debit_account,credit_account,amount,created_at'
    );
  const settlementsQuery = admin
    .from('billing_settlements')
    .select('id,merchant_id,batch_id,amount,status,created_at,updated_at');
  const settlementBatchesQuery = admin
    .from('billing_settlement_batches')
    .select('id,status,total_amount,merchant_count,created_at,confirmed_at');
  const distributionScheduleQuery = admin
    .from('fnb_distribution_schedule')
    .select('id,merchant_id,total_amount,status,scheduled_date,processed_at');
  const auditEventsQuery = admin.from('audit_events').select('id,action,created_at');
  const kycQuery = admin
    .from('merchant_kyc_documents')
    .select('id,merchant_id,document_type,verification_status');

  let transactionsCoverage = true;
  let paymentMethodCoverage = true;
  let productsCoverage = true;
  let vouchersCoverage = true;
  let walletCoverage = true;
  let invoiceCoverage = true;
  let ledgerCoverage = true;
  let settlementCoverage = true;
  let batchCoverage = true;
  let auditCoverage = true;
  let fraudCoverage = true;
  let kycCoverage = true;
  let consumerChannelsCoverage = true;
  let distributionCoverage = true;

  const usersPromise = admin
    .from('user_profiles')
    .select('id,role,acquisition_channel,primary_access_channel,consumer_segment,popia_consent_at')
    .then(({ data, error }) => {
      if (!error) return (data ?? []) as UserProfileRow[];
      if (
        isMissingColumn(error, 'acquisition_channel') ||
        isMissingColumn(error, 'primary_access_channel') ||
        isMissingColumn(error, 'consumer_segment') ||
        isMissingColumn(error, 'popia_consent_at')
      ) {
        consumerChannelsCoverage = false;
        return admin
          .from('user_profiles')
          .select('id,role')
          .then(({ data: fallbackData, error: fallbackError }) => {
            if (fallbackError) throw fallbackError;
            return (fallbackData ?? []) as UserProfileRow[];
          });
      }
      throw error;
    });

  const transactionsPromise = fetchTransactionRows(admin, (next) => {
    if (typeof next.transactionsCoverage === 'boolean') {
      transactionsCoverage = next.transactionsCoverage;
    }
    if (typeof next.paymentMethodCoverage === 'boolean') {
      paymentMethodCoverage = next.paymentMethodCoverage;
    }
    if (typeof next.consumerChannelsCoverage === 'boolean') {
      consumerChannelsCoverage = next.consumerChannelsCoverage;
    }
  });

  const [
    merchantsRes,
    usersRes,
    transactions,
    productsRes,
    vouchers,
    walletRes,
    invoiceRes,
    ledgerRes,
    settlementsRes,
    settlementBatchesRes,
    distributionRes,
    auditRes,
    fraudAlerts,
    kycRes,
  ] = await Promise.all([
    merchantsQuery,
    usersPromise,
    transactionsPromise,
    productsQuery,
    fetchVoucherRows(admin, (next) => {
      if (typeof next.vouchersCoverage === 'boolean') {
        vouchersCoverage = next.vouchersCoverage;
      }
    }),
    walletQuery,
    invoiceQuery,
    ledgerQuery,
    settlementsQuery,
    settlementBatchesQuery,
    distributionScheduleQuery,
    auditEventsQuery,
    fetchFraudAlertRows(admin, (next) => {
      if (typeof next.fraudCoverage === 'boolean') {
        fraudCoverage = next.fraudCoverage;
      }
    }),
    kycQuery,
  ]);

  if (merchantsRes.error) throw merchantsRes.error;

  const products =
    productsRes.error && isMissingRelation(productsRes.error, 'public.merchant_products')
      ? ((productsCoverage = false), [])
      : productsRes.error
        ? (() => {
            throw productsRes.error;
          })()
        : ((productsRes.data ?? []) as ProductRow[]);

  const walletTransactions =
    walletRes.error && isMissingRelation(walletRes.error, 'public.wallet_transactions')
      ? ((walletCoverage = false), [])
      : walletRes.error
        ? (() => {
            throw walletRes.error;
          })()
        : ((walletRes.data ?? []) as WalletTransactionRow[]);

  const invoices =
    invoiceRes.error && isMissingRelation(invoiceRes.error, 'public.billing_invoices')
      ? ((invoiceCoverage = false), [])
      : invoiceRes.error
        ? (() => {
            throw invoiceRes.error;
          })()
        : ((invoiceRes.data ?? []) as InvoiceRow[]);

  const ledgerEntries =
    ledgerRes.error && isMissingRelation(ledgerRes.error, 'public.billing_ledger_entries')
      ? ((ledgerCoverage = false), [])
      : ledgerRes.error
        ? (() => {
            throw ledgerRes.error;
          })()
        : ((ledgerRes.data ?? []) as LedgerEntryRow[]);

  const settlements =
    settlementsRes.error && isMissingRelation(settlementsRes.error, 'public.billing_settlements')
      ? ((settlementCoverage = false), [])
      : settlementsRes.error
        ? (() => {
            throw settlementsRes.error;
          })()
        : ((settlementsRes.data ?? []) as SettlementRow[]);

  const settlementBatches =
    settlementBatchesRes.error &&
    isMissingRelation(settlementBatchesRes.error, 'public.billing_settlement_batches')
      ? ((batchCoverage = false), [])
      : settlementBatchesRes.error
        ? (() => {
            throw settlementBatchesRes.error;
          })()
        : ((settlementBatchesRes.data ?? []) as SettlementBatchRow[]);

  const distributionSchedule =
    distributionRes.error &&
    isMissingRelation(distributionRes.error, 'public.fnb_distribution_schedule')
      ? ((distributionCoverage = false), [])
      : distributionRes.error
        ? (() => {
            throw distributionRes.error;
          })()
        : ((distributionRes.data ?? []) as DistributionScheduleRow[]);

  const auditEvents =
    auditRes.error && isMissingRelation(auditRes.error, 'public.audit_events')
      ? ((auditCoverage = false), [])
      : auditRes.error
        ? (() => {
            throw auditRes.error;
          })()
        : ((auditRes.data ?? []) as AuditEventRow[]);

  const kycDocuments =
    kycRes.error && isMissingRelation(kycRes.error, 'public.merchant_kyc_documents')
      ? ((kycCoverage = false), [])
      : kycRes.error
        ? (() => {
            throw kycRes.error;
          })()
        : ((kycRes.data ?? []) as KycDocumentRow[]);

  return buildReportingOverview({
    merchants: (merchantsRes.data ?? []) as MerchantRow[],
    users: usersRes as UserProfileRow[],
    transactions,
    products,
    vouchers,
    walletTransactions,
    invoices,
    ledgerEntries,
    settlements,
    settlementBatches,
    distributionSchedule,
    auditEvents,
    fraudAlerts,
    kycDocuments,
    coverage: {
      paymentTransactions: transactionsCoverage,
      paymentMethodSplit: paymentMethodCoverage,
      billingLedger: ledgerCoverage,
      billingInvoices: invoiceCoverage,
      settlementBatches: settlementCoverage && batchCoverage,
      complianceDocuments: kycCoverage,
      auditEvents: auditCoverage,
      fraudAlerts: fraudCoverage,
      walletTransactions: walletCoverage,
      consumerChannels: consumerChannelsCoverage,
      distributionSchedule: distributionCoverage,
    },
  });
}
