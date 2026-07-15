'use client';

import { useState, useEffect } from 'react';
import HeroSection from './HeroSection';
import KeyMetricsGrid from './KeyMetricsGrid';
import RevenueModelSection from './RevenueModelSection';
import BenefitDistributionSection from './BenefitDistributionSection';
import CostStructureSection from './CostStructureSection';
import GrowthProjectionsSection from './GrowthProjectionsSection';
import InvestmentSection from './InvestmentSection';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';

const FinancialModelInteractive = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (isHydrated) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <HeroSection />
        <KeyMetricsGrid />
        <RevenueModelSection />
        <BenefitDistributionSection />
        <CostStructureSection />
        <GrowthProjectionsSection />
        <InvestmentSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <KeyMetricsGrid />
        <RevenueModelSection />
        <BenefitDistributionSection />
        <CostStructureSection />
        <GrowthProjectionsSection />
        <InvestmentSection />

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-6">
              Ready to Discuss Partnership Opportunities?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Connect with our investment team to explore how eVoucher can deliver both financial
              returns and measurable social impact
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-action text-action-foreground rounded-lg font-headline font-semibold hover:bg-action/90 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2">
                <Icon name="EnvelopeIcon" size={20} variant="outline" />
                <span>Contact Investment Team</span>
              </button>
              <Link
                href="/government-alignment"
                className="w-full sm:w-auto px-8 py-4 bg-card text-foreground border-2 border-border rounded-lg font-headline font-semibold hover:bg-muted transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Icon name="DocumentTextIcon" size={20} variant="outline" />
                <span>View Government Alignment</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="40" height="40" rx="8" fill="#20B2AA" />
                    <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="white" opacity="0.9" />
                    <path d="M20 15L24 18V22L20 25L16 22V18L20 15Z" fill="#FF7A00" />
                    <circle cx="20" cy="20" r="3" fill="white" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-bold text-foreground">eVoucher</span>
                  <span className="font-body text-xs text-muted-foreground">Dignified Impact</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering communities through transparent, sustainable social impact commerce
              </p>
            </div>

            <div>
              <h4 className="font-headline font-bold text-foreground mb-3">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/consumer-experience"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Consumer Experience
                  </Link>
                </li>
                <li>
                  <Link
                    href="/merchant-partnership"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Merchant Partnership
                  </Link>
                </li>
                <li>
                  <Link
                    href="/government-alignment"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Government Alignment
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-headline font-bold text-foreground mb-3">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/security-compliance"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Security & Compliance
                  </Link>
                </li>
                <li>
                  <Link
                    href="/financial-model"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Financial Model
                  </Link>
                </li>
                <li>
                  <Link
                    href="/homepage"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-headline font-bold text-foreground mb-3">Connect</h4>
              <ul className="space-y-2">
                <li className="text-sm text-muted-foreground">Email: invest@evoucher.co.za</li>
                <li className="text-sm text-muted-foreground">Phone: +27 11 123 4567</li>
                <li className="text-sm text-muted-foreground">USSD: *120*384#</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © {new Date()?.getFullYear()} eVoucher Platform. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Compliance
              </Link>
            </div>
          </div>
        </div>
      </footer>
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-110 z-40"
          aria-label="Scroll to top"
        >
          <Icon name="ArrowUpIcon" size={24} variant="outline" />
        </button>
      )}
    </div>
  );
};

export default FinancialModelInteractive;
