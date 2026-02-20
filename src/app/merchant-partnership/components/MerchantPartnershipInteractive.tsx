'use client';

import { useState, useEffect } from 'react';
import HeroSection from './HeroSection';
import BenefitsSection from './BenefitsSection';
import TestimonialsSection from './TestimonialsSection';
import OnboardingFlowSection from './OnboardingFlowSection';
import SettlementSection from './SettlementSection';
import AnalyticsPreviewSection from './AnalyticsPreviewSection';
import TownshipProgramSection from './TownshipProgramSection';
import ROICalculatorSection from './ROICalculatorSection';
import PartnerLogosSection from './PartnerLogosSection';
import CTASection from './CTASection';

const MerchantPartnershipInteractive = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const scrollToApplication = () => {
    if (isHydrated) {
      const ctaSection = document.getElementById('application-section');
      if (ctaSection) {
        ctaSection?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse space-y-8 pt-24">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="h-96 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection onGetStartedClick={scrollToApplication} />
      <BenefitsSection />
      <TestimonialsSection />
      <OnboardingFlowSection />
      <SettlementSection />
      <AnalyticsPreviewSection />
      <TownshipProgramSection />
      <ROICalculatorSection />
      <PartnerLogosSection />
      <div id="application-section">
        <CTASection />
      </div>
    </div>
  );
};

export default MerchantPartnershipInteractive;