import Icon from '@/components/ui/AppIcon';

interface ValueProp {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const ValueProposition = () => {
  const valueProps: ValueProp[] = [
    {
      icon: 'ShieldCheckIcon',
      title: 'Government Aligned',
      description:
        'Full compliance with POPIA, PASA, SARB, and FIC regulations ensuring transparent, auditable social impact delivery.',
      color: 'primary',
    },
    {
      icon: 'CurrencyDollarIcon',
      title: 'Real Savings',
      description:
        '70% of merchant discounts go directly to consumers, providing immediate financial relief on essential goods.',
      color: 'success',
    },
    {
      icon: 'BuildingStorefrontIcon',
      title: 'Merchant Growth',
      description:
        'Free loyalty infrastructure and increased foot traffic help township businesses thrive and grow revenue.',
      color: 'secondary',
    },
    {
      icon: 'DevicePhoneMobileIcon',
      title: 'Universal Access',
      description:
        'USSD technology ensures everyone can participate, even without smartphones or internet connectivity.',
      color: 'accent',
    },
    {
      icon: 'ChartBarIcon',
      title: 'Impact Tracking',
      description:
        'Real-time dashboards measure community impact, merchant success, and transparent benefit distribution.',
      color: 'trust-builder',
    },
    {
      icon: 'LockClosedIcon',
      title: 'Security First',
      description:
        'Bank-grade encryption, fraud prevention, and comprehensive security architecture protect all stakeholders.',
      color: 'error',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      primary: { bg: 'bg-primary/10', text: 'text-primary' },
      success: { bg: 'bg-success/10', text: 'text-success' },
      secondary: { bg: 'bg-secondary/10', text: 'text-secondary' },
      accent: { bg: 'bg-accent/10', text: 'text-accent' },
      'trust-builder': { bg: 'bg-trust-builder/10', text: 'text-trust-builder' },
      error: { bg: 'bg-error/10', text: 'text-error' },
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-headline font-bold text-3xl lg:text-5xl text-foreground mb-4">
            Technology That Bridges Communities
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
            A comprehensive fintech ecosystem integrating social welfare, financial inclusion, and
            township economic development into a unified digital experience.
          </p>
        </div>

        {/* Value Props Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {valueProps.map((prop, index) => {
            const colors = getColorClasses(prop.color);
            return (
              <div
                key={index}
                className="bg-card rounded-xl p-8 shadow-md border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`${colors.bg} w-16 h-16 rounded-lg flex items-center justify-center mb-6`}
                >
                  <Icon name={prop.icon as any} size={32} variant="solid" className={colors.text} />
                </div>
                <h3 className="font-headline font-bold text-xl text-foreground mb-3">
                  {prop.title}
                </h3>
                <p className="font-body text-base text-muted-foreground leading-relaxed">
                  {prop.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
