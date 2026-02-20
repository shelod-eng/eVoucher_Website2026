import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface AnalyticsFeature {
  icon: string;
  title: string;
  description: string;
  metrics: string[];
}

const AnalyticsPreviewSection = () => {
  const features: AnalyticsFeature[] = [
    {
      icon: 'ChartBarIcon',
      title: 'Sales Performance Tracking',
      description: 'Monitor your revenue trends, peak sales hours, and product performance in real-time.',
      metrics: ['Daily/Weekly/Monthly Revenue', 'Top-Selling Products', 'Average Transaction Value', 'Sales Growth Rate']
    },
    {
      icon: 'UserGroupIcon',
      title: 'Customer Insights',
      description: 'Understand your customer base with detailed demographic and behavioral analytics.',
      metrics: ['Customer Demographics', 'Purchase Frequency', 'Repeat Customer Rate', 'Customer Lifetime Value']
    },
    {
      icon: 'MapPinIcon',
      title: 'Foot Traffic Analysis',
      description: 'Track customer visits, peak hours, and location-based trends to optimize operations.',
      metrics: ['Daily Visitor Count', 'Peak Traffic Hours', 'Customer Dwell Time', 'Conversion Rate']
    },
    {
      icon: 'HeartIcon',
      title: 'Loyalty Program Metrics',
      description: 'Measure customer retention, engagement levels, and loyalty program effectiveness.',
      metrics: ['Retention Rate', 'Repeat Purchase Rate', 'Customer Engagement Score', 'Loyalty Rewards Redeemed']
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Icon name="ChartBarIcon" size={20} variant="solid" />
            <span className="text-sm font-headline font-semibold">Free Analytics Dashboard</span>
          </div>
          
          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Business Intelligence at Your Fingertips
          </h2>
          <p className="text-lg text-muted-foreground">
            Access sophisticated analytics tools that help you make data-driven decisions and grow your business strategically.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-border"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name={feature.icon as any} size={24} variant="outline" className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-headline font-bold text-xl text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    {feature.metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <Icon name="CheckCircleIcon" size={16} variant="solid" className="text-success" />
                        <span className="text-sm font-body text-muted-foreground">{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-headline font-bold text-2xl lg:text-3xl text-foreground mb-4">
                Dashboard Preview
              </h3>
              <p className="text-muted-foreground font-body leading-relaxed mb-6">
                Your merchant dashboard provides a comprehensive view of your business performance with intuitive visualizations and actionable insights.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Icon name="DevicePhoneMobileIcon" size={20} variant="outline" className="text-primary" />
                  <span className="text-sm font-body text-foreground">Mobile-optimized for on-the-go access</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Icon name="ArrowPathIcon" size={20} variant="outline" className="text-primary" />
                  <span className="text-sm font-body text-foreground">Real-time data updates every 5 minutes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Icon name="DocumentArrowDownIcon" size={20} variant="outline" className="text-primary" />
                  <span className="text-sm font-body text-foreground">Export reports in PDF and Excel formats</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Icon name="BellAlertIcon" size={20} variant="outline" className="text-primary" />
                  <span className="text-sm font-body text-foreground">Custom alerts for important metrics</span>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl shadow-2xl p-6 border border-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <h4 className="font-headline font-bold text-lg text-foreground">Today's Overview</h4>
                  <span className="text-xs font-body text-muted-foreground">04 Jan 2026</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-success/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-body mb-1">Revenue</p>
                    <p className="text-2xl font-headline font-bold text-success">R2,847</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Icon name="ArrowTrendingUpIcon" size={14} variant="solid" className="text-success" />
                      <span className="text-xs font-body text-success">+12%</span>
                    </div>
                  </div>
                  
                  <div className="bg-primary/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-body mb-1">Customers</p>
                    <p className="text-2xl font-headline font-bold text-primary">47</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Icon name="ArrowTrendingUpIcon" size={14} variant="solid" className="text-primary" />
                      <span className="text-xs font-body text-primary">+8%</span>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-body mb-1">Vouchers</p>
                    <p className="text-2xl font-headline font-bold text-secondary">34</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Icon name="ArrowTrendingUpIcon" size={14} variant="solid" className="text-secondary" />
                      <span className="text-xs font-body text-secondary">+15%</span>
                    </div>
                  </div>
                  
                  <div className="bg-accent/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-body mb-1">Avg. Value</p>
                    <p className="text-2xl font-headline font-bold text-accent">R83.74</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Icon name="ArrowTrendingUpIcon" size={14} variant="solid" className="text-accent" />
                      <span className="text-xs font-body text-accent">+5%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 mt-4">
                  <p className="text-xs text-muted-foreground font-body mb-2">Peak Hours Today</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-body text-foreground">10:00 AM - 12:00 PM</span>
                    <span className="text-sm font-headline font-bold text-primary">18 transactions</span>
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

export default AnalyticsPreviewSection;