'use client';

import { useState } from 'react';
import Header from '@/components/common/Header';
import HeroSection from './components/HeroSection';
import ValueProposition from './components/ValueProposition';
import StakeholderJourneys from './components/StakeholderJourneys';
import HowItWorks from './components/HowItWorks';
import SocialProofCarousel from './components/SocialProofCarousel';
import TrustBadges from './components/TrustBadges';
import PartnerLogos from './components/PartnerLogos';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import MerchantOnboardingModal from '@/app/components/MerchantOnboardingModal';
import CustomerRegistrationModal from '@/app/components/CustomerRegistrationModal';

export default function Homepage() {
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <HeroSection
          onOpenMerchantModal={() => setIsMerchantModalOpen(true)}
          onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
        />
        <TrustBadges />
        <ValueProposition />
        <StakeholderJourneys />
        <HowItWorks />
        <SocialProofCarousel />
        <PartnerLogos />
        <CTASection
          onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
          onOpenMerchantModal={() => setIsMerchantModalOpen(true)}
        />
      </main>

      <Footer />

      <MerchantOnboardingModal
        isOpen={isMerchantModalOpen}
        onClose={() => setIsMerchantModalOpen(false)}
      />
      <CustomerRegistrationModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
      />
    </div>
  );
}
