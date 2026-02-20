import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface YearProjection {
  year: string;
  users: string;
  merchants: string;
  revenue: string;
  impact: string;
}

interface Milestone {
  id: number;
  phase: string;
  timeline: string;
  target: string;
  icon: string;
  color: string;
}

const GrowthProjectionsSection = () => {
  const projections: YearProjection[] = [
    {
      year: 'Year 1 (2026)',
      users: '500,000',
      merchants: '5,000',
      revenue: 'R 80M',
      impact: 'R 135M in consumer savings'
    },
    {
      year: 'Year 2 (2027)',
      users: '1.5M',
      merchants: '15,000',
      revenue: 'R 200M',
      impact: 'R 405M in consumer savings'
    },
    {
      year: 'Year 3 (2028)',
      users: '3.5M',
      merchants: '30,000',
      revenue: 'R 400M',
      impact: 'R 945M in consumer savings'
    },
    {
      year: 'Year 5 (2030)',
      users: '8.5M',
      merchants: '45,000',
      revenue: 'R 850M',
      impact: 'R 2.3B in consumer savings'
    }
  ];

  const milestones: Milestone[] = [
    {
      id: 1,
      phase: 'Pilot Launch',
      timeline: 'Q1 2026',
      target: '3 Townships, 50K Users',
      icon: 'RocketLaunchIcon',
      color: 'bg-primary'
    },
    {
      id: 2,
      phase: 'Provincial Expansion',
      timeline: 'Q3 2026',
      target: 'Gauteng Province Coverage',
      icon: 'MapIcon',
      color: 'bg-secondary'
    },
    {
      id: 3,
      phase: 'National Rollout',
      timeline: 'Q2 2027',
      target: 'All 9 Provinces Active',
      icon: 'GlobeAltIcon',
      color: 'bg-success'
    },
    {
      id: 4,
      phase: 'Market Leadership',
      timeline: 'Q4 2028',
      target: '40% Market Penetration',
      icon: 'TrophyIcon',
      color: 'bg-accent'
    }
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-4">
            <Icon name="ChartBarSquareIcon" size={18} variant="solid" />
            <span className="text-sm font-headline font-semibold">Growth Trajectory</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-4">
            5-Year Growth Projections
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Conservative, data-driven projections based on South African social program participation rates and township merchant density analysis
          </p>
        </div>

        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-headline font-bold text-foreground">Timeline</th>
                  <th className="px-6 py-4 text-left text-sm font-headline font-bold text-foreground">Active Users</th>
                  <th className="px-6 py-4 text-left text-sm font-headline font-bold text-foreground">Merchants</th>
                  <th className="px-6 py-4 text-left text-sm font-headline font-bold text-foreground">Platform Revenue</th>
                  <th className="px-6 py-4 text-left text-sm font-headline font-bold text-foreground">Consumer Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projections.map((projection, index) => (
                  <tr key={index} className="hover:bg-muted/50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <span className="font-headline font-semibold text-foreground">{projection.year}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Icon name="UserGroupIcon" size={18} variant="outline" className="text-primary" />
                        <span className="text-foreground font-semibold">{projection.users}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Icon name="BuildingStorefrontIcon" size={18} variant="outline" className="text-secondary" />
                        <span className="text-foreground font-semibold">{projection.merchants}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-success font-bold">{projection.revenue}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-accent font-bold">{projection.impact}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-2xl font-headline font-bold text-foreground mb-6 text-center">
            Phased Rollout Milestones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-border">
                <div className={`${milestone.color} w-14 h-14 rounded-full flex items-center justify-center mb-4`}>
                  <Icon name={milestone.icon as any} size={24} variant="solid" className="text-white" />
                </div>
                <h4 className="text-lg font-headline font-bold text-foreground mb-2">
                  {milestone.phase}
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Icon name="CalendarIcon" size={16} variant="outline" className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{milestone.timeline}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="FlagIcon" size={16} variant="outline" className="text-success" />
                    <span className="text-sm font-semibold text-foreground">{milestone.target}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-8 border border-primary/20">
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
              <Icon name="LightBulbIcon" size={24} variant="solid" className="text-primary" />
            </div>
            <div>
              <h4 className="text-lg font-headline font-bold text-foreground mb-2">
                Conservative Growth Assumptions
              </h4>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our projections are based on conservative market penetration rates (10-15% of eligible beneficiaries in Year 3) and proven township merchant adoption patterns. We account for seasonal variations, economic cycles, and gradual trust-building timelines. Actual growth may exceed projections as network effects strengthen and government partnerships expand.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success" />
                  <span className="text-sm text-foreground">Market-validated assumptions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success" />
                  <span className="text-sm text-foreground">Quarterly review cycles</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success" />
                  <span className="text-sm text-foreground">Risk-adjusted targets</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GrowthProjectionsSection;