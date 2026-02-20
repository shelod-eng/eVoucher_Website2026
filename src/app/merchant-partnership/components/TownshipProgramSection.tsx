import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface ProgramBenefit {
  icon: string;
  title: string;
  description: string;
}

const TownshipProgramSection = () => {
  const benefits: ProgramBenefit[] = [
    {
      icon: 'BuildingStorefrontIcon',
      title: 'Priority Placement',
      description: 'Township merchants receive priority visibility in the eVoucher app, ensuring your business is discovered first by local customers.'
    },
    {
      icon: 'AcademicCapIcon',
      title: 'Free Business Training',
      description: 'Access comprehensive training programs covering digital marketing, inventory management, customer service, and financial planning.'
    },
    {
      icon: 'UserGroupIcon',
      title: 'Community Network',
      description: 'Join a supportive network of township entrepreneurs sharing best practices, resources, and collaborative opportunities.'
    },
    {
      icon: 'CurrencyDollarIcon',
      title: 'Reduced Transaction Fees',
      description: 'Township merchants benefit from reduced platform fees, maximizing your profit margins and supporting business growth.'
    },
    {
      icon: 'TruckIcon',
      title: 'Supply Chain Support',
      description: 'Connect with verified suppliers offering competitive pricing and reliable delivery to township locations.'
    },
    {
      icon: 'MegaphoneIcon',
      title: 'Marketing Assistance',
      description: 'Receive professional marketing support including social media content, promotional materials, and local advertising campaigns.'
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-secondary/5 to-primary/5">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-6">
            <Icon name="SparklesIcon" size={20} variant="solid" />
            <span className="text-sm font-headline font-semibold">Township Economic Development</span>
          </div>
          
          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Empowering Township Businesses
          </h2>
          <p className="text-lg text-muted-foreground">
            Our dedicated township program provides additional support and resources to help local businesses thrive and strengthen community economies.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-border group hover:border-secondary"
            >
              <div className="w-14 h-14 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors duration-300">
                <Icon name={benefit.icon as any} size={28} variant="outline" className="text-secondary" />
              </div>
              <h3 className="font-headline font-bold text-lg text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="bg-card rounded-2xl shadow-xl p-8 lg:p-12 border border-border">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="font-headline font-bold text-2xl lg:text-3xl text-foreground mb-6">
                Community Impact Statistics
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body text-muted-foreground">Township Merchants Active</span>
                    <span className="text-lg font-headline font-bold text-primary">1,847</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse" style={{ width: '74%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body text-muted-foreground">Jobs Created</span>
                    <span className="text-lg font-headline font-bold text-success">3,294</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success animate-pulse" style={{ width: '82%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body text-muted-foreground">Community Revenue Generated</span>
                    <span className="text-lg font-headline font-bold text-secondary">R47.2M</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-secondary animate-pulse" style={{ width: '91%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body text-muted-foreground">Training Sessions Completed</span>
                    <span className="text-lg font-headline font-bold text-accent">2,156</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent animate-pulse" style={{ width: '68%' }} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <Icon name="LightBulbIcon" size={32} variant="solid" className="text-secondary flex-shrink-0" />
                  <div>
                    <h4 className="font-headline font-bold text-lg text-foreground mb-2">Success Story</h4>
                    <p className="text-sm text-muted-foreground font-body leading-relaxed">
                      "The township program transformed my small spaza shop into a thriving business. With the training and support, I expanded my product range, hired 3 employees, and now serve over 200 customers weekly. eVoucher didn't just help my business—it helped my entire community."
                    </p>
                    <p className="text-sm font-headline font-semibold text-foreground mt-3">
                      — Zanele Khumalo, Khayelitsha
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-xl p-6">
                <h4 className="font-headline font-bold text-lg text-foreground mb-4">Program Eligibility</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-body text-muted-foreground">Business located in designated township area</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-body text-muted-foreground">Registered business with valid tax clearance</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-body text-muted-foreground">Commitment to community development goals</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-body text-muted-foreground">Willingness to participate in training programs</span>
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

export default TownshipProgramSection;