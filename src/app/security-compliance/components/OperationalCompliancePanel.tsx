'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface CompliancePayload {
  metrics: {
    auditEventCount: number;
    fraudAlertCount: number;
    openAlerts: number;
    investigatingAlerts: number;
    highRiskAlerts: number;
  };
}

export default function OperationalCompliancePanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<CompliancePayload | null>(null);

  useEffect(() => {
    const fetchComplianceOverview = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/compliance/overview', {
          method: 'GET',
          credentials: 'include',
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to load compliance metrics.');
        setData(payload);
      } catch (complianceError: any) {
        setError(complianceError?.message || 'Failed to load compliance metrics.');
      } finally {
        setLoading(false);
      }
    };

    void fetchComplianceOverview();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse h-40 rounded-2xl bg-muted" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="ShieldCheckIcon" size={24} variant="solid" className="text-primary" />
            <h2 className="font-headline font-bold text-2xl text-foreground">
              Live Operational Compliance
            </h2>
          </div>

          {error && <p className="text-sm text-error font-body mb-3">{error}</p>}

          {data && (
            <div className="grid md:grid-cols-5 gap-4">
              <div className="rounded-xl border border-border p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground">Audit Events</p>
                <p className="text-2xl font-headline font-bold text-foreground">
                  {data.metrics.auditEventCount}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground">Fraud Alerts</p>
                <p className="text-2xl font-headline font-bold text-foreground">
                  {data.metrics.fraudAlertCount}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground">Open Alerts</p>
                <p className="text-2xl font-headline font-bold text-warning">
                  {data.metrics.openAlerts}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground">Investigating</p>
                <p className="text-2xl font-headline font-bold text-primary">
                  {data.metrics.investigatingAlerts}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground">High Risk (70+)</p>
                <p className="text-2xl font-headline font-bold text-error">
                  {data.metrics.highRiskAlerts}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
