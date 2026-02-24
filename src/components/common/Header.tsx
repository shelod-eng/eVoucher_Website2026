'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/AppIcon';
import { getCartItems } from '@/lib/cart';

interface HeaderProps {
  className?: string;
}

const Header = ({ className = '' }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, signOut } = useAuth();
  const userRole = String(role ?? user?.user_metadata?.role ?? '').toLowerCase();
  const isMerchant =
    userRole === 'merchant' ||
    pathname?.startsWith('/merchant') ||
    pathname?.startsWith('/merchants');
  const isSignedIn = !loading && Boolean(user);
  const [cartCount, setCartCount] = useState(0);
  const displayName = String(
    user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'consumer'
  ).trim();

  const publicNavItems = [
    { label: 'Home', href: '/', icon: 'HomeIcon' },
    { label: 'Consumer', href: '/consumer-experience', icon: 'UserIcon' },
    { label: 'Merchants', href: '/merchants', icon: 'BuildingStorefrontIcon' },
    { label: 'Support', href: '/support', icon: 'QuestionMarkCircleIcon' },
  ];

  const consumerNavItems = [
    { label: 'Home', href: '/customer/dashboard', icon: 'HomeIcon' },
    { label: 'Shop', href: '/shop', icon: 'BuildingStorefrontIcon' },
    { label: 'Wallet', href: '/wallet', icon: 'WalletIcon' },
    { label: 'Redeem', href: '/redeem', icon: 'QrCodeIcon' },
    { label: 'Cart', href: '/cart', icon: 'ShoppingCartIcon' },
    { label: 'Benefits', href: '/benefits', icon: 'SparklesIcon' },
    { label: 'Analytics', href: '/analytics', icon: 'ChartBarIcon' },
    { label: 'Profile', href: '/profile', icon: 'UserCircleIcon' },
  ];

  const merchantNavItems = [
    { label: 'Home', href: '/merchant/dashboard', icon: 'HomeIcon' },
    { label: 'Dashboard', href: '/merchant/dashboard', icon: 'BuildingStorefrontIcon' },
    { label: 'Analytics', href: '/analytics', icon: 'ChartBarIcon' },
    { label: 'Support', href: '/support', icon: 'QuestionMarkCircleIcon' },
  ];

  const navItems = isSignedIn ? (isMerchant ? merchantNavItems : consumerNavItems) : publicNavItems;

  useEffect(() => {
    if (!isSignedIn) return;

    const prefetchTargets = isMerchant
      ? ['/merchant/dashboard', '/analytics', '/support']
      : [
          '/customer/dashboard',
          '/shop',
          '/wallet',
          '/redeem',
          '/cart',
          '/benefits',
          '/analytics',
          '/profile',
          '/buy-vouchers',
        ];

    prefetchTargets.forEach((target) => {
      router.prefetch(target);
    });
  }, [isSignedIn, isMerchant, router]);

  useEffect(() => {
    if (!isSignedIn || isMerchant) return;

    const refreshCartCount = () => {
      const items = getCartItems();
      const total = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    };

    refreshCartCount();
    window.addEventListener('evoucher-cart-updated', refreshCartCount);
    window.addEventListener('storage', refreshCartCount);
    return () => {
      window.removeEventListener('evoucher-cart-updated', refreshCartCount);
      window.removeEventListener('storage', refreshCartCount);
    };
  }, [isSignedIn, isMerchant]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      closeMobileMenu();
      router.push('/signin');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
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
                {!isMerchant && isSignedIn && item.label === 'Cart' && cartCount > 0 && (
                  <span className="inline-flex min-w-5 h-5 px-1 items-center justify-center text-xs rounded-full bg-primary text-primary-foreground font-headline">
                    {cartCount}
                  </span>
                )}
              </Link>
            ))}

            {user ? (
              <>
                {!isMerchant && (
                  <span className="px-3 py-2 text-sm font-body text-muted-foreground">
                    Hello, <span className="font-headline font-semibold text-foreground">{displayName}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-body font-medium text-foreground hover:bg-muted hover:text-primary transition-all duration-300 ease-smooth"
                >
                  <Icon name="ArrowLeftOnRectangleIcon" size={18} variant="outline" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-body font-medium text-foreground hover:bg-muted hover:text-primary transition-all duration-300 ease-smooth"
              >
                <Icon name="ArrowRightOnRectangleIcon" size={18} variant="outline" />
                <span>Sign In</span>
              </Link>
            )}
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

              {user ? (
                <>
                  {!isMerchant && (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Hello, <span className="font-headline font-semibold text-foreground">{displayName}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-md text-base font-body font-medium text-foreground hover:bg-muted hover:text-primary transition-colors duration-200 text-left"
                  >
                    <Icon name="ArrowLeftOnRectangleIcon" size={20} variant="outline" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/signin"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-4 py-3 rounded-md text-base font-body font-medium text-foreground hover:bg-muted hover:text-primary transition-colors duration-200"
                >
                  <Icon name="ArrowRightOnRectangleIcon" size={20} variant="outline" />
                  <span>Sign In</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
