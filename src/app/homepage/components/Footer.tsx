'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const Footer = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentYear, setCurrentYear] = useState('2026');

  useEffect(() => {
    setIsHydrated(true);
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  const footerLinks = {
    platform: [
      { label: 'Consumer Experience', href: '/consumer-experience' },
      { label: 'Merchant Partnership', href: '/merchant-partnership' },
      { label: 'Government Alignment', href: '/government-alignment' }
    ],
    company: [
      { label: 'Security & Compliance', href: '/security-compliance' },
      { label: 'Financial Model', href: '/financial-model' },
      { label: 'About Us', href: '/homepage' }
    ],
    support: [
      { label: 'Help Center', href: '/homepage' },
      { label: 'Contact Us', href: '/homepage' },
      { label: 'FAQs', href: '/homepage' }
    ]
  };

  const socialLinks = [
    { icon: 'EnvelopeIcon', href: 'mailto:info@evoucher.co.za', label: 'Email' },
    { icon: 'PhoneIcon', href: 'tel:+27123456789', label: 'Phone' }
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/homepage" className="flex items-center space-x-2 mb-4">
              <div className="relative">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" rx="8" fill="#20B2AA"/>
                  <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="white" opacity="0.9"/>
                  <path d="M20 15L24 18V22L20 25L16 22V18L20 15Z" fill="#FF7A00"/>
                  <circle cx="20" cy="20" r="3" fill="white"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-lg text-foreground leading-tight">eVoucher</span>
                <span className="font-body text-xs text-muted-foreground leading-tight">Dignified Impact</span>
              </div>
            </Link>
            <p className="font-body text-sm text-muted-foreground mb-4 max-w-sm">
              Digital commerce that serves the poorest of the poor with dignity and transparency. Real savings, real impact, real accountability.
            </p>
            <div className="flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-lg inline-flex">
              <Icon name="DevicePhoneMobileIcon" size={20} variant="solid" className="text-primary" />
              <span className="font-accent text-lg font-bold text-foreground">*134*2468#</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-headline font-bold text-sm text-foreground mb-4">Platform</h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-headline font-bold text-sm text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-headline font-bold text-sm text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <p className="font-body text-sm text-muted-foreground">
              {isHydrated ? `© ${currentYear}` : '© 2026'} eVoucher Platform. All rights reserved.
            </p>

            {/* Compliance Badges */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Icon name="ShieldCheckIcon" size={16} variant="solid" className="text-success" />
                <span className="font-body text-xs text-muted-foreground">POPIA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="LockClosedIcon" size={16} variant="solid" className="text-success" />
                <span className="font-body text-xs text-muted-foreground">Bank-Grade Security</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center justify-center"
                  aria-label={social.label}
                >
                  <Icon name={social.icon as any} size={16} variant="outline" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;