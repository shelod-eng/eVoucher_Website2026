import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface HeroSectionProps {
  onGetStartedClick: () => void;
}

const HeroSection = ({ onGetStartedClick }: HeroSectionProps) => {
  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 pt-24 pb-16 lg:pt-32 lg:pb-24">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-4 py-2 rounded-full">
              <Icon name="SparklesIcon" size={20} variant="solid" />
              <span className="text-sm font-headline font-semibold">
                Free Loyalty Infrastructure
              </span>
            </div>

            <h1 className="font-headline font-bold text-4xl lg:text-5xl xl:text-6xl text-foreground leading-tight">
              Grow Your Business with <span className="text-primary">eVoucher</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
              Join South Africa's leading social impact commerce platform. Increase foot traffic,
              build customer loyalty, and support your community—all while growing your revenue.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={onGetStartedClick}
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-action text-action-foreground rounded-lg font-headline font-semibold text-lg hover:bg-action/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <span>Start Onboarding</span>
                <Icon name="ArrowRightIcon" size={20} variant="outline" />
              </button>

              <button className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-card text-foreground border-2 border-border rounded-lg font-headline font-semibold text-lg hover:bg-muted transition-all duration-300">
                <Icon name="PlayIcon" size={20} variant="solid" />
                <span>Watch Success Stories</span>
              </button>
            </div>

            <div className="flex items-center space-x-8 pt-6">
              <div className="flex items-center space-x-2">
                <Icon name="CheckCircleIcon" size={24} variant="solid" className="text-success" />
                <span className="text-sm font-body text-muted-foreground">No Setup Fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="CheckCircleIcon" size={24} variant="solid" className="text-success" />
                <span className="text-sm font-body text-muted-foreground">Same-Day Settlement</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="CheckCircleIcon" size={24} variant="solid" className="text-success" />
                <span className="text-sm font-body text-muted-foreground">Free Analytics</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-card rounded-2xl shadow-2xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-body">
                    Average Revenue Increase
                  </p>
                  <p className="text-4xl font-headline font-bold text-success">+47%</p>
                </div>
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <Icon
                    name="TrendingUpIcon"
                    size={32}
                    variant="outline"
                    className="text-success"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-body">New Customers Monthly</p>
                  <p className="text-4xl font-headline font-bold text-primary">+320</p>
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="UserGroupIcon" size={32} variant="outline" className="text-primary" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-body">Customer Retention Rate</p>
                  <p className="text-4xl font-headline font-bold text-secondary">89%</p>
                </div>
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Icon name="HeartIcon" size={32} variant="solid" className="text-secondary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
