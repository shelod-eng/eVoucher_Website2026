import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface StakeholderBenefit {
  id: number;
  stakeholder: string;
  icon: string;
  color: string;
  percentage: number;
  benefits: string[];
  annualValue: string;
}

const BenefitDistributionSection = () => {
  const stakeholderBenefits: StakeholderBenefit[] = [
    {
      id: 1,
      stakeholder: 'Consumers',
      icon: 'UserGroupIcon',
      color: 'bg-primary',
      percentage: 70,
      benefits: [
        'Average 30% savings on essential goods',
        'R 450 monthly savings per household',
        'Free digital payment infrastructure',
        'Financial inclusion pathways'
      ],
      annualValue: 'R 5,400 per household'
    },
    {
      id: 2,
      stakeholder: 'Merchants',
      icon: 'BuildingStorefrontIcon',
      color: 'bg-secondary',
      percentage: 20,
      benefits: [
        '25% increase in foot traffic',
        'Free customer loyalty system',
        'Guaranteed payment settlement',
        'Marketing and analytics tools'
      ],
      annualValue: 'R 180,000 revenue increase'
    },
    {
      id: 3,
      stakeholder: 'Platform Operations',
      icon: 'CogIcon',
      color: 'bg-success',
      percentage: 10,
      benefits: [
        'Technology infrastructure',
        'Security and compliance',
        'Customer support systems',
        'Continuous innovation'
      ],
      annualValue: 'R 40M operational budget'
    }
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-4 py-2 rounded-full mb-4">
            <Icon name="ScaleIcon" size={18} variant="solid" />
            <span className="text-sm font-headline font-semibold">70/30 Benefit Split</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-4">
            Value Distribution Model
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our commitment to social impact means 70% of all value created flows directly to consumers, with the remaining 30% supporting merchants and platform sustainability
          </p>
        </div>

        <div className="mb-12">
          <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-8">
              <div className="flex-1 w-full">
                <h3 className="text-xl font-headline font-bold text-foreground mb-6 text-center lg:text-left">
                  Benefit Distribution Breakdown
                </h3>
                <div className="space-y-4">
                  {stakeholderBenefits.map((stakeholder) => (
                    <div key={stakeholder.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`${stakeholder.color} p-2 rounded-lg`}>
                            <Icon name={stakeholder.icon as any} size={20} variant="solid" className="text-white" />
                          </div>
                          <span className="font-headline font-semibold text-foreground">
                            {stakeholder.stakeholder}
                          </span>
                        </div>
                        <span className="text-2xl font-headline font-bold text-primary">
                          {stakeholder.percentage}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${stakeholder.color} rounded-full transition-all duration-700`}
                          style={{ width: `${stakeholder.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 w-full">
                <div className="relative w-64 h-64 mx-auto">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="#20B2AA" 
                      strokeWidth="10"
                      strokeDasharray="175.93 251.33"
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="#FF7A00" 
                      strokeWidth="10"
                      strokeDasharray="50.27 251.33"
                      strokeDashoffset="-175.93"
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="#1BBE7A" 
                      strokeWidth="10"
                      strokeDasharray="25.13 251.33"
                      strokeDashoffset="-226.20"
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-headline font-bold text-primary">70%</div>
                      <div className="text-sm text-muted-foreground">to Consumers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stakeholderBenefits.map((stakeholder) => (
            <div key={stakeholder.id} className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`${stakeholder.color} p-3 rounded-lg`}>
                  <Icon name={stakeholder.icon as any} size={24} variant="solid" className="text-white" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-foreground">{stakeholder.stakeholder}</h4>
                  <p className="text-sm text-success font-semibold">{stakeholder.annualValue}</p>
                </div>
              </div>
              
              <ul className="space-y-2">
                {stakeholder.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitDistributionSection;