import React from 'react';
import Icon from '@/components/ui/AppIcon';

const PartnerLogosSection = () => {
  const partners = [
    { name: 'Shoprite', category: 'Retail' },
    { name: 'Pick n Pay', category: 'Retail' },
    { name: 'Checkers', category: 'Retail' },
    { name: 'Woolworths', category: 'Retail' },
    { name: 'Clicks', category: 'Pharmacy' },
    { name: 'Dis-Chem', category: 'Pharmacy' },
    { name: 'Makro', category: 'Wholesale' },
    { name: 'Game', category: 'Electronics' },
    { name: 'Mr Price', category: 'Fashion' },
    { name: 'Edgars', category: 'Fashion' },
    { name: 'Spar', category: 'Retail' },
    { name: 'Boxer', category: 'Retail' }
  ];

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Icon name="BuildingStorefrontIcon" size={20} variant="solid" />
            <span className="text-sm font-headline font-semibold">Trusted Partners</span>
          </div>
          
          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Join South Africa's Leading Merchants
          </h2>
          <p className="text-lg text-muted-foreground">
            Over 2,500 merchants across all categories trust eVoucher to grow their businesses and serve their communities.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {partners?.map((partner, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-border group hover:border-primary flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                <Icon name="BuildingStorefrontIcon" size={32} variant="outline" className="text-primary" />
              </div>
              <h3 className="font-headline font-bold text-lg text-foreground mb-1">
                {partner?.name}
              </h3>
              <span className="text-xs font-body text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {partner?.category}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col items-center space-y-4 bg-card border border-border rounded-xl px-8 py-6">
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-3xl font-headline font-bold text-primary">2,500+</p>
                <p className="text-sm text-muted-foreground font-body">Active Merchants</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-headline font-bold text-success">R47.2M</p>
                <p className="text-sm text-muted-foreground font-body">Monthly Revenue</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-headline font-bold text-secondary">89%</p>
                <p className="text-sm text-muted-foreground font-body">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerLogosSection;