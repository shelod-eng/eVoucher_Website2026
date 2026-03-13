import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface CostCategory {
  id: number;
  category: string;
  percentage: number;
  amount: string;
  description: string;
  icon: string;
  items: string[];
}

const CostStructureSection = () => {
  const costCategories: CostCategory[] = [
    {
      id: 1,
      category: 'Technology Infrastructure',
      percentage: 35,
      amount: 'R 140M',
      description: 'Platform development, security, and scalability',
      icon: 'ServerIcon',
      items: [
        'Cloud infrastructure',
        'Security systems',
        'Mobile app development',
        'USSD gateway integration',
      ],
    },
    {
      id: 2,
      category: 'Operations & Support',
      percentage: 25,
      amount: 'R 100M',
      description: 'Customer service, merchant support, and daily operations',
      icon: 'UserGroupIcon',
      items: [
        'Customer support team',
        'Merchant onboarding',
        'Training programs',
        'Quality assurance',
      ],
    },
    {
      id: 3,
      category: 'Marketing & Growth',
      percentage: 20,
      amount: 'R 80M',
      description: 'User acquisition, brand building, and market expansion',
      icon: 'MegaphoneIcon',
      items: [
        'Community outreach',
        'Merchant recruitment',
        'Brand campaigns',
        'Partnership development',
      ],
    },
    {
      id: 4,
      category: 'Compliance & Legal',
      percentage: 12,
      amount: 'R 48M',
      description: 'Regulatory compliance, audits, and legal framework',
      icon: 'ShieldCheckIcon',
      items: ['Regulatory compliance', 'Legal counsel', 'Audit services', 'Data protection'],
    },
    {
      id: 5,
      category: 'Research & Innovation',
      percentage: 8,
      amount: 'R 32M',
      description: 'Continuous improvement and new feature development',
      icon: 'LightBulbIcon',
      items: ['Product innovation', 'Impact measurement', 'Market research', 'Technology upgrades'],
    },
  ];

  const totalCosts = 'R 400M';

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-4">
            <Icon name="CalculatorIcon" size={18} variant="solid" />
            <span className="text-sm font-headline font-semibold">Cost Structure</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-4">
            Operational Efficiency Analysis
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Strategic allocation of resources to maximize social impact while maintaining
            operational excellence. Total annual operational costs:{' '}
            <span className="font-bold text-foreground">{totalCosts}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {costCategories.map((category) => (
            <div
              key={category.id}
              className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-3 rounded-lg">
                    <Icon
                      name={category.icon as any}
                      size={24}
                      variant="solid"
                      className="text-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-headline font-bold text-foreground mb-1">
                      {category.category}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-headline font-bold text-primary">
                    {category.percentage}%
                  </div>
                  <div className="text-sm text-success font-semibold">{category.amount}</div>
                </div>
              </div>

              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {category.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Icon
                      name="CheckIcon"
                      size={14}
                      variant="solid"
                      className="text-success flex-shrink-0"
                    />
                    <span className="text-xs text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-success/5 to-primary/5 rounded-xl p-8 border border-success/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="ChartPieIcon" size={28} variant="solid" className="text-success" />
              </div>
              <div className="text-3xl font-headline font-bold text-foreground mb-1">92%</div>
              <div className="text-sm text-muted-foreground">Operational Efficiency</div>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon
                  name="ArrowTrendingDownIcon"
                  size={28}
                  variant="solid"
                  className="text-primary"
                />
              </div>
              <div className="text-3xl font-headline font-bold text-foreground mb-1">15%</div>
              <div className="text-sm text-muted-foreground">Cost Reduction Target</div>
            </div>

            <div className="text-center">
              <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="SparklesIcon" size={28} variant="solid" className="text-secondary" />
              </div>
              <div className="text-3xl font-headline font-bold text-foreground mb-1">R 60M</div>
              <div className="text-sm text-muted-foreground">Reinvested in Impact</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CostStructureSection;
