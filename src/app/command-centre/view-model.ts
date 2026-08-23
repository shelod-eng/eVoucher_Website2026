export type EvidenceStatus =
  | 'LIVE'
  | 'SANDBOX'
  | 'CONTROLLED MOCK'
  | 'EVIDENCE PENDING'
  | 'GAP / NOT READY';

export type CountMetric = {
  value: number | null;
  sourceAvailability: EvidenceStatus;
  businessCapability: EvidenceStatus;
  source: string;
  note?: string;
};

export type StatusMetric = {
  sourceAvailability: EvidenceStatus;
  businessCapability: EvidenceStatus;
  source: string;
  note?: string;
};

export type DistributionMetric = {
  values: Record<string, number | null>;
  sourceAvailability: EvidenceStatus;
  businessCapability: EvidenceStatus;
  source: string;
  note?: string;
};

export type ReconciliationFreshnessMetric = {
  latestRunTimestamp: string | null;
  latestRunStatus: string | null;
  exceptionCount: number | null;
  sourceAvailability: EvidenceStatus;
  businessCapability: EvidenceStatus;
  source: string;
  note?: string;
};

export type Metric =
  | CountMetric
  | StatusMetric
  | DistributionMetric
  | ReconciliationFreshnessMetric;

export type CommandCentrePayload = {
  status: 'ok';
  timestamp: string;
  dimensions: {
    customer: Record<string, Metric>;
    commerce: Record<string, Metric>;
    financial: Record<string, Metric>;
    governance: Record<string, Metric>;
  };
  systemHealth: {
    state: 'healthy' | 'attention' | 'gap';
    sources: Record<string, Metric>;
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

export const VALID_EVIDENCE_STATUSES: EvidenceStatus[] = [
  'LIVE',
  'SANDBOX',
  'CONTROLLED MOCK',
  'EVIDENCE PENDING',
  'GAP / NOT READY',
];

export const EMPTY_STATUS_METRIC: StatusMetric = {
  sourceAvailability: 'EVIDENCE PENDING',
  businessCapability: 'EVIDENCE PENDING',
  source: 'GET /api/command-center',
  note: 'No source signal is currently exposed by the Command Centre API.',
};

export function isDistributionMetric(metric: Metric | undefined): metric is DistributionMetric {
  return Boolean(metric && 'values' in metric);
}

export function isCountMetric(metric: Metric | undefined): metric is CountMetric {
  return Boolean(metric && 'value' in metric);
}

export function isFreshnessMetric(
  metric: Metric | undefined
): metric is ReconciliationFreshnessMetric {
  return Boolean(metric && 'latestRunTimestamp' in metric);
}

export function formatMetricValue(metric: Metric | undefined) {
  if (!metric) return 'EVIDENCE PENDING';
  if (isCountMetric(metric)) {
    return metric.value === null ? 'EVIDENCE PENDING' : metric.value.toLocaleString();
  }
  if (isDistributionMetric(metric)) {
    const total = Object.values(metric.values).reduce<number>(
      (sum, value) => sum + Number(value ?? 0),
      0
    );
    return total.toLocaleString();
  }
  if (isFreshnessMetric(metric)) {
    return metric.latestRunStatus ?? 'EVIDENCE PENDING';
  }
  return metric.businessCapability;
}

export function formatTimestamp(value: string | null | undefined) {
  if (!value) return 'EVIDENCE PENDING';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'EVIDENCE PENDING';
  return date.toLocaleString();
}

export function statusTone(status: EvidenceStatus | string | undefined) {
  switch (status) {
    case 'LIVE':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'SANDBOX':
      return 'border-sky-200 bg-sky-50 text-sky-800';
    case 'CONTROLLED MOCK':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'GAP / NOT READY':
      return 'border-rose-200 bg-rose-50 text-rose-800';
    case 'EVIDENCE PENDING':
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

export function worstEvidenceStatus(metrics: Metric[]) {
  if (metrics.some((metric) => metric.businessCapability === 'GAP / NOT READY')) {
    return 'GAP / NOT READY' as EvidenceStatus;
  }
  if (metrics.some((metric) => metric.businessCapability === 'EVIDENCE PENDING')) {
    return 'EVIDENCE PENDING' as EvidenceStatus;
  }
  if (metrics.some((metric) => metric.businessCapability === 'CONTROLLED MOCK')) {
    return 'CONTROLLED MOCK' as EvidenceStatus;
  }
  if (metrics.some((metric) => metric.businessCapability === 'SANDBOX')) {
    return 'SANDBOX' as EvidenceStatus;
  }
  return 'LIVE';
}

export function metricEntries(record: Record<string, Metric> | undefined) {
  return Object.entries(record ?? {});
}

export function healthMetric(
  payload: CommandCentrePayload | null,
  key: string,
  fallbackSource: string
): Metric {
  return (
    payload?.systemHealth.sources[key] ?? {
      ...EMPTY_STATUS_METRIC,
      source: fallbackSource,
    }
  );
}

export function hasSensitiveTerms(payload: unknown) {
  const serialized = JSON.stringify(payload).toLowerCase();
  return [
    'service_role',
    'supabase_service_role_key',
    'account_number',
    'webhook_secret',
    'raw_payload',
  ].some((term) => serialized.includes(term));
}
