import Icon from '@/components/ui/AppIcon';

interface Step {
  number: string;
  icon: string;
  title: string;
  description: string;
}

const HowItWorks = () => {
  const steps: Step[] = [
    {
      number: '01',
      icon: 'MagnifyingGlassIcon',
      title: 'Browse',
      description:
        'Discover participating merchants and available discounts through USSD, app, or SMS.',
    },
    {
      number: '02',
      icon: 'ShoppingCartIcon',
      title: 'Buy',
      description: 'Purchase eVouchers using government grants, mobile money, or cash at agents.',
    },
    {
      number: '03',
      icon: 'TicketIcon',
      title: 'Redeem',
      description: 'Present voucher code at merchant location to receive discounted goods.',
    },
    {
      number: '04',
      icon: 'BanknotesIcon',
      title: 'Save',
      description: 'Enjoy up to 30% savings on essential items with 70% of discount going to you.',
    },
    {
      number: '05',
      icon: 'ChartBarIcon',
      title: 'Track',
      description: 'Monitor your total savings and transaction history in real-time.',
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-headline font-bold text-3xl lg:text-5xl text-foreground mb-4">
            How eVoucher Works
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
            A simple five-step process that puts savings directly in your hands with dignity and
            transparency.
          </p>
        </div>

        {/* Steps Flow */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div
            className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-success"
            style={{ width: '85%', margin: '0 auto' }}
          />

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                {/* Step Number Badge */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg z-10 relative">
                    <span className="font-headline font-bold text-2xl text-white">
                      {step.number}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-md opacity-50" />
                </div>

                {/* Icon */}
                <div className="bg-card w-16 h-16 rounded-lg flex items-center justify-center mb-4 shadow-md border border-border">
                  <Icon
                    name={step.icon as any}
                    size={28}
                    variant="solid"
                    className="text-primary"
                  />
                </div>

                {/* Content */}
                <h3 className="font-headline font-bold text-xl text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefit Split Visualization */}
        <div className="mt-20 bg-card rounded-xl p-8 shadow-lg border border-border">
          <h3 className="font-headline font-bold text-2xl text-foreground text-center mb-8">
            Transparent Benefit Distribution
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-success/10 rounded-lg p-6 border-2 border-success">
              <div className="flex items-center justify-between mb-4">
                <Icon name="UserIcon" size={32} variant="solid" className="text-success" />
                <span className="font-headline font-bold text-4xl text-success">70%</span>
              </div>
              <h4 className="font-headline font-bold text-lg text-foreground mb-2">
                Consumer Savings
              </h4>
              <p className="font-body text-sm text-muted-foreground">
                The majority of merchant discounts go directly to consumers, providing real
                financial relief.
              </p>
            </div>

            <div className="bg-secondary/10 rounded-lg p-6 border-2 border-secondary">
              <div className="flex items-center justify-between mb-4">
                <Icon
                  name="BuildingStorefrontIcon"
                  size={32}
                  variant="solid"
                  className="text-secondary"
                />
                <span className="font-headline font-bold text-4xl text-secondary">30%</span>
              </div>
              <h4 className="font-headline font-bold text-lg text-foreground mb-2">
                Platform Operations
              </h4>
              <p className="font-body text-sm text-muted-foreground">
                Covers technology, security, merchant support, and sustainable platform growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
