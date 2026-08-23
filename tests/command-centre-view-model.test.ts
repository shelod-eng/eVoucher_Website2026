import { describe, expect, it } from 'vitest';

import {
  EMPTY_STATUS_METRIC,
  formatMetricValue,
  hasSensitiveTerms,
  healthMetric,
  statusTone,
  worstEvidenceStatus,
  type CommandCentrePayload,
  type Metric,
} from '@/app/command-centre/view-model';

describe('Command Centre UI view model', () => {
  it('keeps evidence-pending and gap states visible', () => {
    const metrics: Metric[] = [
      {
        sourceAvailability: 'LIVE',
        businessCapability: 'EVIDENCE PENDING',
        source: 'public.payment_transactions',
      },
      {
        sourceAvailability: 'GAP / NOT READY',
        businessCapability: 'GAP / NOT READY',
        source: 'runtime signal',
      },
    ];

    expect(worstEvidenceStatus(metrics)).toBe('GAP / NOT READY');
    expect(statusTone('EVIDENCE PENDING')).toContain('slate');
    expect(statusTone('GAP / NOT READY')).toContain('rose');
  });

  it('handles empty and aggregate datasets without fabricating values', () => {
    expect(formatMetricValue(undefined)).toBe('EVIDENCE PENDING');
    expect(formatMetricValue(EMPTY_STATUS_METRIC)).toBe('EVIDENCE PENDING');
    expect(
      formatMetricValue({
        values: { pending: null, failed: 2, dead_letter: 1 },
        sourceAvailability: 'LIVE',
        businessCapability: 'EVIDENCE PENDING',
        source: 'public.platform_event_outbox.status',
      })
    ).toBe('3');
  });

  it('falls back to evidence pending when a health signal is not exposed by the API', () => {
    const payload = {
      systemHealth: {
        state: 'attention',
        sources: {},
      },
    } as unknown as CommandCentrePayload;

    const metric = healthMetric(payload, 'website', 'UI route /command-centre');

    expect(metric.sourceAvailability).toBe('EVIDENCE PENDING');
    expect(metric.businessCapability).toBe('EVIDENCE PENDING');
    expect(metric.source).toBe('UI route /command-centre');
  });

  it('flags obvious sensitive terms in serialized API/UI payloads', () => {
    expect(hasSensitiveTerms({ safe: 'aggregate-only' })).toBe(false);
    expect(hasSensitiveTerms({ leaked: 'SUPABASE_SERVICE_ROLE_KEY' })).toBe(true);
    expect(hasSensitiveTerms({ leaked: 'account_number' })).toBe(true);
  });
});
