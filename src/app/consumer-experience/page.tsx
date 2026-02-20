'use client';

import { useState } from 'react';
import Header from '@/components/common/Header';
import HeroSection from './components/HeroSection';
import ImpactStats from './components/ImpactStats';
import HowItWorks from './components/HowItWorks';
import RegistrationForm from './components/RegistrationForm';
import USSDShowcase from './components/USSDShowcase';
import DiscountBreakdown from './components/DiscountBreakdown';
import SecurityTrust from './components/SecurityTrust';
import SavingsTracker from './components/SavingsTracker';
import Testimonials from './components/Testimonials';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import CustomerRegistrationModal from '@/app/components/CustomerRegistrationModal';

export default function ConsumerExperiencePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <HeroSection onJoinClick={() => setIsModalOpen(true)} />
        <ImpactStats />
        <HowItWorks />
        <RegistrationForm />
        <USSDShowcase />
        <DiscountBreakdown />
        <SecurityTrust />
        <SavingsTracker />
        <Testimonials />
        <CTASection onJoinClick={() => setIsModalOpen(true)} />
      </main>
      <Footer />
      <CustomerRegistrationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}