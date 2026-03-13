import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface Journey {
  stakeholder: string;
  icon: string;
  color: string;
  description: string;
  benefits: string[];
  cta: string;
  ctaLink: string;
}

const StakeholderJourneys = () => {
  const journeys: Journey[] = [
    {
      stakeholder: 'Consumers',
      icon: 'UserIcon',
      color: 'primary',
      description:
        'Access meaningful savings on essential goods with dignity and transparency through simple USSD technology.',
      benefits: [
        'Up to 30% savings on groceries and essentials',
        'No smartphone required - works via USSD',
        'Track all savings in real-time',
        'Secure and private transactions',
      ],
      cta: 'Start Saving Today',
      ctaLink: '/consumer-experience',
    },
    {
      stakeholder: 'Merchants',
      icon: 'BuildingStorefrontIcon',
      color: 'secondary',
      description:
        'Grow your township business with increased foot traffic, free loyalty tools, and reliable payment systems.',
      benefits: [
        'Increase revenue by 25-40%',
        'Free customer loyalty infrastructure',
        'Fast, reliable settlements',
        'Community connection and growth',
      ],
      cta: 'Join Merchant Network',
      ctaLink: '/merchant-partnership',
    },
    {
      stakeholder: 'Government',
      icon: 'BuildingLibraryIcon',
      color: 'trust-builder',
      description:
        'Deliver social programs with transparency, accountability, and measurable community impact through auditable systems.',
      benefits: [
        'Full regulatory compliance',
        'Real-time impact measurement',
        'Fraud prevention and transparency',
        'Efficient program delivery',
      ],
      cta: 'Explore Partnership',
      ctaLink: '/government-alignment',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string; hover: string }> = {
      primary: {
        bg: 'bg-primary',
        text: 'text-primary',
        border: 'border-primary',
        hover: 'hover:bg-primary/90',
      },
      secondary: {
        bg: 'bg-secondary',
        text: 'text-secondary',
        border: 'border-secondary',
        hover: 'hover:bg-secondary/90',
      },
      'trust-builder': {
        bg: 'bg-trust-builder',
        text: 'text-trust-builder',
        border: 'border-trust-builder',
        hover: 'hover:bg-trust-builder/90',
      },
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <section className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-headline font-bold text-3xl lg:text-5xl text-foreground mb-4">
            Empowering Every Stakeholder
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
            A unified platform serving consumers, merchants, and government with tailored solutions
            for shared prosperity.
          </p>
        </div>

        {/* Journeys Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {journeys.map((journey, index) => {
            const colors = getColorClasses(journey.color);
            return (
              <div
                key={index}
                className="bg-card rounded-xl shadow-lg border-2 border-border hover:border-primary transition-all duration-300 overflow-hidden"
              >
                {/* Header */}
                <div className={`${colors.bg} p-8 text-white`}>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Icon name={journey.icon as any} size={32} variant="solid" />
                    </div>
                    <h3 className="font-headline font-bold text-2xl">{journey.stakeholder}</h3>
                  </div>
                  <p className="font-body text-base opacity-90">{journey.description}</p>
                </div>

                {/* Benefits */}
                <div className="p-8">
                  <ul className="space-y-4 mb-8">
                    {journey.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start space-x-3">
                        <Icon
                          name="CheckCircleIcon"
                          size={20}
                          variant="solid"
                          className={colors.text}
                        />
                        <span className="font-body text-sm text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={journey.ctaLink}
                    className={`block text-center px-6 py-3 ${colors.bg} text-white rounded-lg font-headline font-semibold ${colors.hover} transition-all duration-300 transform hover:scale-105`}
                  >
                    {journey.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StakeholderJourneys;
