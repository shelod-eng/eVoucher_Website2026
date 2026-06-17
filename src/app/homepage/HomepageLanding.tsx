'use client';

import { useState } from 'react';
import Header from '@/components/common/Header';
import CustomerRegistrationModal from '@/app/components/CustomerRegistrationModal';
import MerchantOnboardingModal from '@/app/components/MerchantOnboardingModal';
import HeroSection from './components/HeroSection';
import ValueProposition from './components/ValueProposition';
import ImpactMetricsSection from './components/ImpactMetricsSection';
import HowItWorks from './components/HowItWorks';
import StakeholderJourneys from './components/StakeholderJourneys';
import PartnerLogos from './components/PartnerLogos';
import SocialProofCarousel from './components/SocialProofCarousel';
import TrustBadges from './components/TrustBadges';
import AppDownloadSection from './components/AppDownloadSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';

export default function HomepageLanding() {
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showMerchantModal, setShowMerchantModal] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header forcePublic />
      <main className="pt-16">
        <HeroSection
          onOpenCustomerModal={() => setShowCustomerModal(true)}
          onOpenMerchantModal={() => setShowMerchantModal(true)}
        />
        <TrustBadges />
        <AppDownloadSection />
        <ImpactMetricsSection />
        <ValueProposition />
        <HowItWorks />
        <StakeholderJourneys />
        <PartnerLogos />
        <SocialProofCarousel />
        <CTASection
          onOpenCustomerModal={() => setShowCustomerModal(true)}
          onOpenMerchantModal={() => setShowMerchantModal(true)}
        />
      </main>
      <Footer />

      <CustomerRegistrationModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
      />
      <MerchantOnboardingModal
        isOpen={showMerchantModal}
        onClose={() => setShowMerchantModal(false)}
      />
    </div>
  );
}
