import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface RevenueStream {
  id: number;
  title: string;
  description: string;
  percentage: number;
  amount: string;
  icon: string;
  color: string;
}

const RevenueModelSection = () => {
  const revenueStreams: RevenueStream[] = [
    {
      id: 1,
      title: 'Transaction Fees',
      description:
        'Small percentage on each voucher transaction, split between platform sustainability and merchant benefits',
      percentage: 45,
      amount: 'R 180M annually',
      icon: 'CreditCardIcon',
      color: 'bg-primary',
    },
    {
      id: 2,
      title: 'Merchant Subscriptions',
      description:
        'Premium analytics and marketing tools for merchants seeking advanced customer insights',
      percentage: 25,
      amount: 'R 100M annually',
      icon: 'BuildingStorefrontIcon',
      color: 'bg-secondary',
    },
    {
      id: 3,
      title: 'Government Partnerships',
      description:
        'Service fees for program administration, fraud prevention, and impact measurement',
      percentage: 20,
      amount: 'R 80M annually',
      icon: 'BuildingLibraryIcon',
      color: 'bg-success',
    },
    {
      id: 4,
      title: 'Corporate Sponsorships',
      description:
        'Brand partnerships for social impact campaigns and community development initiatives',
      percentage: 10,
      amount: 'R 40M annually',
      icon: 'SparklesIcon',
      color: 'bg-accent',
    },
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Icon name="BanknotesIcon" size={18} variant="solid" />
            <span className="text-sm font-headline font-semibold">Revenue Model</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-4">
            Diversified Revenue Streams
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Multiple income sources ensure platform sustainability while maximizing stakeholder
            benefits. Projected Year 3 annual revenue:{' '}
            <span className="font-bold text-foreground">R 400M</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {revenueStreams.map((stream) => (
            <div
              key={stream.id}
              className="bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-border"
            >
              <div className="flex items-start space-x-4">
                <div className={`${stream.color} p-4 rounded-lg flex-shrink-0`}>
                  <Icon
                    name={stream.icon as any}
                    size={28}
                    variant="solid"
                    className="text-white"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-headline font-bold text-foreground">
                      {stream.title}
                    </h3>
                    <span className="text-2xl font-headline font-bold text-primary">
                      {stream.percentage}%
                    </span>
                  </div>

                  <p className="text-muted-foreground mb-3 leading-relaxed">{stream.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-success">{stream.amount}</span>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stream.color} rounded-full transition-all duration-500`}
                        style={{ width: `${stream.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-8 border border-primary/20">
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Icon name="ShieldCheckIcon" size={24} variant="solid" className="text-primary" />
            </div>
            <div>
              <h4 className="text-lg font-headline font-bold text-foreground mb-2">
                Sustainable Growth Model
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Our diversified revenue approach ensures no single stakeholder bears
                disproportionate costs. Transaction fees remain minimal (2-3%), merchant
                subscriptions are optional premium services, and government partnerships are
                structured as efficiency-sharing agreements. This model allows us to scale impact
                while maintaining financial sustainability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RevenueModelSection;
