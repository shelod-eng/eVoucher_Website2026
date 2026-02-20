import Icon from '@/components/ui/AppIcon';

interface StatCardData {
  icon: string;
  value: string;
  label: string;
  color: string;
}

const ImpactStats = () => {
  const stats: StatCardData[] = [
    {
      icon: 'CurrencyDollarIcon',
      value: 'R2.1M',
      label: 'Total Savings Delivered',
      color: 'success'
    },
    {
      icon: 'BuildingStorefrontIcon',
      value: '1,200+',
      label: 'Partner Merchants',
      color: 'primary'
    },
    {
      icon: 'ShoppingBagIcon',
      value: '45K+',
      label: 'Vouchers Redeemed',
      color: 'secondary'
    },
    {
      icon: 'ChartBarIcon',
      value: '30%',
      label: 'Average Discount',
      color: 'accent'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
      success: { bg: 'bg-success/10', text: 'text-success', icon: 'text-success' },
      primary: { bg: 'bg-primary/10', text: 'text-primary', icon: 'text-primary' },
      secondary: { bg: 'bg-secondary/10', text: 'text-secondary', icon: 'text-secondary' },
      accent: { bg: 'bg-accent/10', text: 'text-accent', icon: 'text-accent' }
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <section className="bg-muted py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-headline font-bold text-3xl sm:text-4xl text-foreground mb-4">
            Real Impact, Real Numbers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every voucher purchased creates measurable impact across South African communities
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const colors = getColorClasses(stat.color);
            return (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <div className={`w-14 h-14 ${colors.bg} rounded-full flex items-center justify-center mb-4`}>
                  <Icon name={stat.icon as any} size={28} variant="solid" className={colors.icon} />
                </div>
                <p className={`text-4xl font-headline font-bold ${colors.text} mb-2`}>
                  {stat.value}
                </p>
                <p className="text-sm font-body text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ImpactStats;