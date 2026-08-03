import React from 'react';
import Icon from '@/components/ui/AppIcon';

const PartnerLogosSection = () => {
  const partners = [
    { name: 'Shoprite', category: 'Retail', logo: '/assets/images/merchants/shoprite.png' },
    { name: 'Pick n Pay', category: 'Retail', logo: '/assets/images/merchants/picknpay.png' },
    { name: 'Checkers', category: 'Retail', logo: '/assets/images/merchants/checkers.png' },
    { name: 'Woolworths', category: 'Retail', logo: '/assets/images/merchants/woolworths.png' },
    { name: 'Clicks', category: 'Pharmacy', logo: '/assets/images/merchants/clicks.png' },
    { name: 'Dis-Chem', category: 'Pharmacy', logo: '/assets/images/merchants/dischem.png' },
    {
      name: 'Makro',
      category: 'Wholesale',
      logo: '/assets/images/merchants/placeholder-merchant.svg',
    },
    { name: 'Game', category: 'Electronics', logo: '/assets/images/merchants/game.png' },
    { name: 'Mr Price', category: 'Fashion', logo: '/assets/images/merchants/mr-price.png' },
    { name: 'Edgars', category: 'Fashion', logo: '/assets/images/merchants/edgars.png' },
    { name: 'Spar', category: 'Retail', logo: '/assets/images/merchants/placeholder-merchant.svg' },
    { name: 'Boxer', category: 'Retail', logo: '/assets/images/merchants/boxer.png' },
  ];

  return (
    <section className="bg-gradient-to-b from-slate-50 via-white to-slate-50 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="mb-6 inline-flex items-center space-x-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <Icon name="BuildingStorefrontIcon" size={20} variant="solid" />
            <span className="text-sm font-headline font-semibold">Trusted Partners</span>
          </div>

          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Join South Africa's Leading Merchants
          </h2>
          <p className="text-lg text-muted-foreground">
            Over 2,500 merchants across all categories trust eVoucher to grow their businesses and
            serve their communities.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {partners?.map((partner, index) => (
            <div
              key={index}
              className="group flex flex-col items-center justify-center rounded-3xl border border-border bg-white/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 p-3 shadow-sm">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/images/merchants/placeholder-merchant.svg';
                  }}
                />
              </div>
              <h3 className="font-headline text-lg font-bold text-foreground mb-1">
                {partner.name}
              </h3>
              <span className="text-xs font-body text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {partner.category}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex flex-col items-center space-y-4 rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/10 to-secondary/10 px-8 py-6 shadow-sm">
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
