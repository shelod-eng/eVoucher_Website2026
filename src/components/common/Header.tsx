'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface HeaderProps {
  className?: string;
}

const Header = ({ className = '' }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/', icon: 'HomeIcon' },
    { label: 'Consumer', href: '/consumer-experience', icon: 'UserIcon' },
    { label: 'Merchants', href: '/merchants', icon: 'BuildingStorefrontIcon' },
    { label: 'Buy Vouchers', href: '/buy-vouchers', icon: 'ShoppingCartIcon' },
    { label: 'Sign In', href: '/signin', icon: 'ArrowRightOnRectangleIcon' },
    { label: 'Support', href: '/support', icon: 'QuestionMarkCircleIcon' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`bg-card shadow-md fixed top-0 left-0 right-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group" onClick={closeMobileMenu}>
            <div className="relative">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="#20B2AA" className="transition-all duration-300 group-hover:fill-[#1a9d96]"/>
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

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-body font-medium text-foreground hover:bg-muted hover:text-primary transition-all duration-300 ease-smooth"
              >
                <Icon name={item.icon as any} size={18} variant="outline" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-md text-foreground hover:bg-muted transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} variant="outline" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-card animate-slide-in">
            <nav className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-4 py-3 rounded-md text-base font-body font-medium text-foreground hover:bg-muted hover:text-primary transition-colors duration-200"
                >
                  <Icon name={item.icon as any} size={20} variant="outline" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;