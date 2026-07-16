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
  {
    label: 'Shop Products',
    href: '/shop',
    icon: 'ShoppingBagIcon',
    color: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md',
  },
  {
    label: 'My Wallet',
    href: '/wallet',
    icon: 'WalletIcon',
    color: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md',
  },
  {
    label: 'Find Merchants',
    href: '/merchants',
    icon: 'BuildingStorefrontIcon',
    color: 'bg-white text-foreground border border-border hover:bg-muted shadow-sm',
  },
  {
    label: 'Redeem Voucher',
    href: '/redeem',
    icon: 'QrCodeIcon',
    color: 'bg-white text-foreground border border-border hover:bg-muted shadow-sm',
  },
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
    router.push(searchQuery.trim() ? `/shop?q=${encodeURIComponent(searchQuery.trim())}` : '/shop');
  };

  return (
    <section
      className={`bg-gradient-to-br from-[#0d9488]/12 via-white to-[#f0fdf9] py-16 lg:py-24 ${className}`}
    >
      <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center">
        {/* SA Identity Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-headline font-semibold mb-6 border border-primary/20">
          <span>🇿🇦</span>
          <span>Supporting South African Consumers &amp; Merchants</span>
        </div>

        {/* Main Headline */}
        <h1 className="font-headline font-bold text-4xl lg:text-6xl text-foreground leading-tight mb-4">
          Save Money Every Time <span className="text-primary">You Shop.</span>
        </h1>
        <p className="font-body text-lg lg:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Shop products from trusted South African merchants and enjoy instant savings — powered by
          eVoucher.
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
            className="w-full pl-12 pr-32 py-4 rounded-xl border border-border bg-white text-foreground font-body text-base shadow-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-10">
          {PRIMARY_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-headline font-semibold text-sm transition-all duration-200 hover:scale-105 ${action.color}`}
              aria-label={action.label}
            >
              <Icon name={action.icon as any} size={24} variant="outline" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {FEATURED_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => router.push(`/shop?q=${encodeURIComponent(cat.label)}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-white text-foreground text-sm font-body hover:bg-primary/10 hover:border-primary hover:text-primary transition-colors shadow-sm"
              aria-label={`Browse ${cat.label}`}
            >
              <Icon name={cat.icon as any} size={15} variant="outline" />
              {cat.label}
            </button>
          ))}
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
          <span className="hidden sm:inline text-border">·</span>
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
