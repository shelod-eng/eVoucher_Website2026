import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface MetricCardData {
  id: number;
  icon: string;
  value: string;
  label: string;
  trend: string;
  trendDirection: 'up' | 'down';
  color: string;
}

const KeyMetricsGrid = () => {
  const metrics: MetricCardData[] = [
    {
      id: 1,
      icon: 'CurrencyDollarIcon',
      value: 'R 2.4B',
      label: 'Total Market Opportunity',
      trend: '+18% YoY',
      trendDirection: 'up',
      color: 'text-primary',
    },
    {
      id: 2,
      icon: 'UserGroupIcon',
      value: '8.5M',
      label: 'Potential Beneficiaries',
      trend: '+12% Growth',
      trendDirection: 'up',
      color: 'text-secondary',
    },
    {
      id: 3,
      icon: 'BuildingStorefrontIcon',
      value: '45,000',
      label: 'Township Merchants',
      trend: '+25% Target',
      trendDirection: 'up',
      color: 'text-success',
    },
    {
      id: 4,
      icon: 'ChartBarSquareIcon',
      value: '32%',
      label: 'Projected ROI Year 3',
      trend: 'Conservative',
      trendDirection: 'up',
      color: 'text-accent',
    },
  ];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-4">
            Market Opportunity at a Glance
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Data-driven projections showing the scale and sustainability of the eVoucher ecosystem
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-border"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-lg bg-gradient-to-br from-${metric.color.split('-')[1]}/10 to-${metric.color.split('-')[1]}/5`}
                >
                  <Icon
                    name={metric.icon as any}
                    size={24}
                    variant="solid"
                    className={metric.color}
                  />
                </div>
                <div
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full ${metric.trendDirection === 'up' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
                >
                  <Icon
                    name={
                      metric.trendDirection === 'up'
                        ? 'ArrowTrendingUpIcon'
                        : 'ArrowTrendingDownIcon'
                    }
                    size={14}
                    variant="solid"
                  />
                  <span className="text-xs font-semibold">{metric.trend}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className={`text-3xl font-headline font-bold ${metric.color}`}>
                  {metric.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{metric.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyMetricsGrid;
