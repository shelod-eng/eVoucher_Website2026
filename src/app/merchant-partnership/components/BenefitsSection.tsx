import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface Benefit {
  icon: string;
  title: string;
  description: string;
  highlight: string;
}

const BenefitsSection = () => {
  const benefits: Benefit[] = [
    {
      icon: 'CurrencyDollarIcon',
      title: 'Increased Revenue',
      description:
        'Merchants see an average 47% increase in revenue within the first 6 months. Our platform drives consistent foot traffic and repeat purchases through targeted voucher campaigns.',
      highlight: '+47% Revenue Growth',
    },
    {
      icon: 'UserGroupIcon',
      title: 'New Customer Acquisition',
      description:
        'Gain access to thousands of voucher users actively seeking quality products and services. Average merchants acquire 320+ new customers monthly through our platform.',
      highlight: '320+ New Customers/Month',
    },
    {
      icon: 'ChartBarIcon',
      title: 'Free Analytics Dashboard',
      description:
        'Receive sophisticated business intelligence tools at no cost. Track customer behavior, sales trends, peak hours, and product performance with real-time insights.',
      highlight: 'R0 Monthly Cost',
    },
    {
      icon: 'HeartIcon',
      title: 'Customer Loyalty Tools',
      description:
        'Build lasting relationships with automated loyalty programs, personalized offers, and customer engagement tools—all included free with your merchant account.',
      highlight: '89% Retention Rate',
    },
    {
      icon: 'BanknotesIcon',
      title: 'Same-Day Settlement',
      description:
        'Receive your funds within 24 hours of transaction completion. No waiting periods, no hidden fees, no complicated processes. Reliable cash flow for your business.',
      highlight: '24-Hour Payment',
    },
    {
      icon: 'ShieldCheckIcon',
      title: 'Fraud Protection',
      description:
        'Advanced security measures protect your business from fraudulent transactions. Our verification system ensures every voucher redemption is legitimate and traceable.',
      highlight: '99.8% Security Rate',
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Why Merchants Choose eVoucher
          </h2>
          <p className="text-lg text-muted-foreground">
            Join over 2,500 merchants across South Africa who are growing their businesses while
            supporting their communities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-border group hover:border-primary"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                <Icon
                  name={benefit.icon as any}
                  size={28}
                  variant="outline"
                  className="text-primary"
                />
              </div>

              <h3 className="font-headline font-bold text-xl text-foreground mb-3">
                {benefit.title}
              </h3>

              <p className="text-muted-foreground font-body leading-relaxed mb-4">
                {benefit.description}
              </p>

              <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-4 py-2 rounded-full">
                <Icon name="SparklesIcon" size={16} variant="solid" />
                <span className="text-sm font-headline font-semibold">{benefit.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
