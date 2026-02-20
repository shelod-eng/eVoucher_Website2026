import Icon from '@/components/ui/AppIcon';

interface StepData {
  number: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const HowItWorks = () => {
  const steps: StepData[] = [
    {
      number: '01',
      icon: 'MagnifyingGlassIcon',
      title: 'Browse',
      description: 'Explore available vouchers from trusted merchants in your area. Filter by category, discount amount, or merchant location.',
      color: 'primary'
    },
    {
      number: '02',
      icon: 'ShoppingCartIcon',
      title: 'Buy',
      description: 'Purchase vouchers using cash, mobile money, or government social grants. Instant confirmation via SMS.',
      color: 'secondary'
    },
    {
      number: '03',
      icon: 'QrCodeIcon',
      title: 'Redeem',
      description: 'Show your unique voucher code at the merchant. Works with smartphones, USSD, or printed codes.',
      color: 'accent'
    },
    {
      number: '04',
      icon: 'BanknotesIcon',
      title: 'Save',
      description: 'Enjoy instant discounts of up to 30% on your purchase. The savings go directly to you.',
      color: 'success'
    },
    {
      number: '05',
      icon: 'ChartBarSquareIcon',
      title: 'Track',
      description: 'Monitor your total savings, transaction history, and available vouchers through SMS or app.',
      color: 'primary'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      primary: { bg: 'bg-primary/10', border: 'border-primary', text: 'text-primary' },
      secondary: { bg: 'bg-secondary/10', border: 'border-secondary', text: 'text-secondary' },
      accent: { bg: 'bg-accent/10', border: 'border-accent', text: 'text-accent' },
      success: { bg: 'bg-success/10', border: 'border-success', text: 'text-success' }
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Icon name="LightBulbIcon" size={20} variant="solid" className="text-primary" />
            <span className="text-sm font-headline font-semibold text-primary">Simple Process</span>
          </div>
          
          <h2 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
            How eVoucher Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Five simple steps to start saving on essential goods. No complicated processes, no hidden fees—just straightforward savings.
          </p>
        </div>
        
        <div className="relative">
          {/* Connection Line - Desktop Only */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-20"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => {
              const colors = getColorClasses(step.color);
              return (
                <div key={index} className="relative">
                  <div className="bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-primary/20">
                    {/* Step Number */}
                    <div className={`absolute -top-4 -left-4 w-12 h-12 ${colors.bg} ${colors.border} border-4 rounded-full flex items-center justify-center shadow-lg`}>
                      <span className={`font-headline font-bold text-lg ${colors.text}`}>
                        {step.number}
                      </span>
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-16 h-16 ${colors.bg} rounded-xl flex items-center justify-center mb-4 mt-4`}>
                      <Icon name={step.icon as any} size={32} variant="solid" className={colors.text} />
                    </div>
                    
                    {/* Content */}
                    <h3 className="font-headline font-bold text-xl text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Arrow - Desktop Only */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <Icon name="ChevronRightIcon" size={24} variant="solid" className="text-primary/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;