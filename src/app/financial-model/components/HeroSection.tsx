import React from 'react';
import Icon from '@/components/ui/AppIcon';

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-4 py-2 rounded-full mb-6">
            <Icon name="ChartBarIcon" size={20} variant="solid" />
            <span className="text-sm font-headline font-semibold">Transparent Financial Model</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-foreground mb-6 leading-tight">
            Sustainable Economics for <span className="text-primary">Shared Prosperity</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            Complete transparency in how value is created and distributed across consumers, merchants, and government stakeholders. A financial model designed for social impact without compromising commercial sustainability.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-8 py-4 bg-action text-action-foreground rounded-lg font-headline font-semibold hover:bg-action/90 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2">
              <Icon name="DocumentArrowDownIcon" size={20} variant="outline" />
              <span>Download Financial Projections</span>
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-card text-foreground border-2 border-border rounded-lg font-headline font-semibold hover:bg-muted transition-all duration-300 flex items-center justify-center space-x-2">
              <Icon name="CalculatorIcon" size={20} variant="outline" />
              <span>Interactive Calculator</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
    </section>
  );
};

export default HeroSection;