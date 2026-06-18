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
import ForgotPasswordModal from '@/app/components/ForgotPasswordModal';
import AppDownloadSection from './components/AppDownloadSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';

export default function HomepageLanding() {
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUserType, setForgotUserType] = useState<'consumer' | 'merchant'>('consumer');

  const openForgotModal = (type: 'consumer' | 'merchant') => {
    setForgotUserType(type);
    setShowForgotModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header forcePublic />
      <main className="pt-16">
        <HeroSection
          onOpenCustomerModal={() => setShowCustomerModal(true)}
          onOpenMerchantModal={() => setShowMerchantModal(true)}
          // When consumers click "Forgot Password" in the login area, trigger this:
          onOpenForgotModal={() => openForgotModal('consumer')}
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
          onOpenForgotModal={() => openForgotModal('consumer')}
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
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        userType={forgotUserType}
      />
    </div>
  );
}
