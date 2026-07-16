'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface HeroSectionProps {
  className?: string;
  onOpenMerchantModal?: () => void;
  onOpenCustomerModal?: () => void;
  onOpenForgotModal?: () => void;
}

const PRIMARY_ACTIONS = [
  { label: 'Shop Products', href: '/shop', icon: 'ShoppingBagIcon', color: 'bg-primary text-primary-foreground hover:bg-primary/90' },
  { label: 'My Wallet', href: '/wallet', icon: 'WalletIcon', color: 'bg-secondary text-secondary-foreground hover:bg-secondary/90' },
  { label: 'Find Merchants', href: '/merchants', icon: 'BuildingStorefrontIcon', color: 'bg-card text-foreground border border-border hover:bg-muted' },
  { label: 'Redeem Voucher', href: '/redeem', icon: 'QrCodeIcon', color: 'bg-card text-foreground border border-border hover:bg-muted' },
];

const FEATURED_CATEGORIES = [
  { label: 'Groceries', icon: 'ShoppingCartIcon' },
  { label: 'Pharmacy', icon: 'BeakerIcon' },
  { label: 'Fashion', icon: 'ShoppingBagIcon' },
  { label: 'Education', icon: 'AcademicCapIcon' },
  { label: 'Airtime & Data', icon: 'DevicePhoneMobileIcon' },
  { label: 'Home & Living', icon: 'HomeIcon' },
];

const HeroSection = ({
  className = '',
  onOpenCustomerModal,
  onOpenMerchantModal,
}: HeroSectionProps) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/shop');
    }
  };

  return (
    <section className={`bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-16 lg:py-24 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center">
        {/* Heading */}
        <h1 className="font-headline font-bold text-4xl lg:text-5xl text-foreground leading-tight mb-3">
          Welcome to <span className="text-primary">eVoucher</span>
        </h1>
        <p className="font-body text-lg text-muted-foreground mb-8">
          What would you like to shop for today?
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-10">
          <Icon
            name="MagnifyingGlassIcon"
            size={20}
            variant="outline"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, merchants, or categories..."
            className="w-full pl-12 pr-32 py-4 rounded-xl border border-border bg-card text-foreground font-body text-base shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            aria-label="Search products"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-primary text-primary-foreground rounded-lg font-headline font-semibold hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Primary Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-12">
          {PRIMARY_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-headline font-semibold text-sm transition-all duration-200 shadow-sm ${action.color}`}
              aria-label={action.label}
            >
              <Icon name={action.icon as any} size={24} variant="outline" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Featured Categories */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-headline font-semibold mb-4">
            Browse Categories
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {FEATURED_CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => router.push(`/shop?q=${encodeURIComponent(cat.label)}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-foreground text-sm font-body hover:bg-primary/10 hover:border-primary hover:text-primary transition-colors"
                aria-label={`Browse ${cat.label}`}
              >
                <Icon name={cat.icon as any} size={16} variant="outline" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Register CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-muted-foreground">
          <span>New here?</span>
          <button
            onClick={onOpenCustomerModal}
            className="font-headline font-semibold text-primary hover:underline"
          >
            Register as Consumer
          </button>
          <span className="hidden sm:inline">·</span>
          <button
            onClick={onOpenMerchantModal}
            className="font-headline font-semibold text-secondary hover:underline"
          >
            Onboard as Merchant
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
