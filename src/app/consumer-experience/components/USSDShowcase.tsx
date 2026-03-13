import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

const USSDShowcase = () => {
  const ussdSteps = [
    { code: '*134*3827#', label: 'Dial USSD Code' },
    { code: '1', label: 'Select "Browse Vouchers"' },
    { code: '2', label: 'Choose Category' },
    { code: '3', label: 'Confirm Purchase' },
    { code: '4', label: 'Receive Code via SMS' },
  ];

  const features = [
    {
      icon: 'DevicePhoneMobileIcon',
      title: 'Works on Any Phone',
      description: 'No smartphone needed. Access full functionality on basic feature phones.',
    },
    {
      icon: 'SignalIcon',
      title: 'No Internet Required',
      description:
        'USSD works without data connection. Perfect for areas with limited connectivity.',
    },
    {
      icon: 'BanknotesIcon',
      title: 'Instant Confirmation',
      description: 'Receive voucher codes immediately via SMS after purchase.',
    },
    {
      icon: 'ShieldCheckIcon',
      title: 'Secure & Private',
      description: 'Bank-grade security for all transactions. Your data stays protected.',
    },
  ];

  return (
    <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-secondary/10 rounded-full">
              <Icon name="PhoneIcon" size={20} variant="solid" className="text-secondary" />
              <span className="text-sm font-headline font-semibold text-secondary">
                Universal Access
              </span>
            </div>

            <h2 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground">
              No Smartphone?
              <br />
              <span className="text-primary">No Problem!</span>
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Access the full eVoucher platform using USSD technology. Browse vouchers, make
              purchases, and track savings—all from your basic mobile phone.
            </p>

            {/* USSD Steps */}
            <div className="bg-card rounded-xl p-6 shadow-lg border-2 border-primary/20">
              <h3 className="font-headline font-bold text-xl text-foreground mb-4 flex items-center space-x-2">
                <Icon name="CommandLineIcon" size={24} variant="solid" className="text-primary" />
                <span>Quick Start Guide</span>
              </h3>

              <div className="space-y-3">
                {ussdSteps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-headline font-bold text-sm text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-headline font-semibold text-foreground">{step.code}</p>
                      <p className="text-sm text-muted-foreground">{step.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-card rounded-lg shadow-sm"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <Icon
                      name={feature.icon as any}
                      size={20}
                      variant="solid"
                      className="text-accent"
                    />
                  </div>
                  <div>
                    <h4 className="font-headline font-semibold text-sm text-foreground mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <AppImage
                src="https://images.unsplash.com/photo-1630541643139-a554fe61d3fe"
                alt="Elderly South African man in blue shirt using basic mobile phone outdoors with smile"
                className="w-full h-[600px] object-cover"
              />

              {/* Floating USSD Display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl max-w-sm">
                  <div className="bg-foreground text-background rounded-lg p-6 font-mono text-sm space-y-2">
                    <p className="text-center font-bold">eVoucher Menu</p>
                    <p className="border-t border-background/20 pt-2">1. Browse Vouchers</p>
                    <p>2. My Vouchers</p>
                    <p>3. Purchase History</p>
                    <p>4. Account Balance</p>
                    <p>5. Help & Support</p>
                    <p className="border-t border-background/20 pt-2 text-center">
                      Reply with option
                    </p>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-2xl font-headline font-bold text-primary">*134*3827#</p>
                    <p className="text-sm text-muted-foreground">Dial to access eVoucher</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default USSDShowcase;
