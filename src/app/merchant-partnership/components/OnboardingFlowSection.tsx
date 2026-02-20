import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface OnboardingStep {
  number: string;
  title: string;
  description: string;
  icon: string;
  duration: string;
}

const OnboardingFlowSection = () => {
  const steps: OnboardingStep[] = [
    {
      number: '01',
      title: 'Register Your Business',
      description: 'Complete our simple online registration form with your business details, banking information, and product categories. Takes only 10 minutes.',
      icon: 'DocumentTextIcon',
      duration: '10 min'
    },
    {
      number: '02',
      title: 'Verification & Approval',
      description: 'Our team verifies your business credentials and banking details. Most merchants are approved within 24 hours with all compliance checks completed.',
      icon: 'ShieldCheckIcon',
      duration: '24 hours'
    },
    {
      number: '03',
      title: 'Setup Your Profile',
      description: 'Add your product catalog, set discount levels, upload business photos, and customize your merchant profile to attract voucher users.',
      icon: 'Cog6ToothIcon',
      duration: '30 min'
    },
    {
      number: '04',
      title: 'Training & Integration',
      description: 'Receive comprehensive training on the merchant dashboard, voucher redemption process, and analytics tools. Our support team guides you through everything.',
      icon: 'AcademicCapIcon',
      duration: '1 hour'
    },
    {
      number: '05',
      title: 'Go Live & Grow',
      description: 'Start accepting vouchers immediately. Your business appears in the eVoucher app, and customers can begin discovering your products and services.',
      icon: 'RocketLaunchIcon',
      duration: 'Instant'
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Simple Onboarding Process
          </h2>
          <p className="text-lg text-muted-foreground">
            From registration to your first voucher redemption in less than 48 hours.
          </p>
        </div>
        
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-success" style={{ width: '80%', marginLeft: '10%' }} />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-border group hover:border-primary h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                        <Icon name={step.icon as any} size={28} variant="outline" className="text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                        <span className="text-xs font-headline font-bold text-white">{step.number}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-headline font-bold text-lg text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-body leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    
                    <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-3 py-1 rounded-full">
                      <Icon name="ClockIcon" size={14} variant="outline" />
                      <span className="text-xs font-headline font-semibold">{step.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 bg-card border border-border rounded-lg px-6 py-4">
            <Icon name="InformationCircleIcon" size={24} variant="solid" className="text-primary" />
            <p className="text-sm font-body text-muted-foreground">
              <span className="font-semibold text-foreground">Need help?</span> Our merchant support team is available 7 days a week to assist with onboarding.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OnboardingFlowSection;