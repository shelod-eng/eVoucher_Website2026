import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import PwaInstallButton from '@/components/common/PwaInstallButton';

interface HeroSectionProps {
  className?: string;
  onOpenMerchantModal?: () => void;
  onOpenCustomerModal?: () => void;
  onOpenForgotModal?: () => void;
}

const HeroSection = ({
  className = '',
  onOpenMerchantModal,
  onOpenCustomerModal,
  onOpenForgotModal,
}: HeroSectionProps) => {
  return (
    <section
      className={`relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 lg:py-32 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Trust Badge */}
            <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-4 py-2 rounded-full">
              <Icon name="ShieldCheckIcon" size={20} variant="solid" />
              <span className="text-sm font-body font-medium">
                Sponsor-ready, PWA-enabled, POPIA-aligned
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="font-headline font-bold text-4xl lg:text-6xl text-foreground leading-tight">
              South Africa's Digital Voucher Infrastructure -{' '}
              <span className="text-primary">Dignified Impact</span>.
            </h1>

            {/* Subheading */}
            <p className="font-body text-lg lg:text-xl text-muted-foreground leading-relaxed">
              Bridging government, CSI sponsors, merchants, and communities through installable
              mobile-first onboarding, private compliance evidence, transparent settlement flows,
              and measurable consumer savings.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {['FNB', 'DTI', 'CSI Partners'].map((partner) => (
                <div
                  key={partner}
                  className="rounded-lg border border-border bg-card px-4 py-3 text-center shadow-sm"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Sponsor signal
                  </p>
                  <p className="mt-1 font-headline text-lg font-bold text-foreground">{partner}</p>
                </div>
              ))}
            </div>

            {/* USSD Code Highlight */}
            <div className="bg-card border-2 border-primary rounded-lg p-6 shadow-md">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Icon
                    name="DevicePhoneMobileIcon"
                    size={32}
                    variant="solid"
                    className="text-primary"
                  />
                </div>
                <div>
                  <p className="font-body text-sm text-muted-foreground">
                    Access without app store friction
                  </p>
                  <p className="font-accent text-2xl font-bold text-foreground">
                    PWA + *134*2468#
                  </p>
                </div>
              </div>
            </div>

            {/* Stakeholder CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onOpenCustomerModal}
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-action text-action-foreground rounded-lg font-headline font-semibold text-base hover:bg-action/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Icon name="UserIcon" size={20} variant="solid" />
                <span>Join as Consumer</span>
              </button>
              <button
                onClick={onOpenMerchantModal}
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-lg font-headline font-semibold text-base hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Icon name="BuildingStorefrontIcon" size={20} variant="solid" />
                <span>Onboard as Merchant</span>
              </button>
              <PwaInstallButton className="px-8 py-4 text-base" />
            </div>

            {/* Government CTA */}
            <Link
              href="/government-alignment"
              className="inline-flex items-center space-x-2 text-trust-builder hover:text-primary transition-colors duration-300"
            >
              <Icon name="BuildingLibraryIcon" size={20} variant="outline" />
              <span className="font-body font-medium">Partner with Government</span>
              <Icon name="ArrowRightIcon" size={16} variant="outline" />
            </Link>
          </div>

          {/* Right Content - Impact Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-success/10 p-2 rounded-lg">
                  <Icon
                    name="CurrencyDollarIcon"
                    size={24}
                    variant="solid"
                    className="text-success"
                  />
                </div>
                <p className="font-body text-sm text-muted-foreground">Total Savings</p>
              </div>
              <p className="font-headline text-3xl font-bold text-foreground">R 2.4M</p>
              <p className="font-body text-xs text-success mt-2">+18% this month</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Icon name="UserGroupIcon" size={24} variant="solid" className="text-primary" />
                </div>
                <p className="font-body text-sm text-muted-foreground">Active Users</p>
              </div>
              <p className="font-headline text-3xl font-bold text-foreground">12,847</p>
              <p className="font-body text-xs text-success mt-2">+24% this month</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-secondary/10 p-2 rounded-lg">
                  <Icon
                    name="BuildingStorefrontIcon"
                    size={24}
                    variant="solid"
                    className="text-secondary"
                  />
                </div>
                <p className="font-body text-sm text-muted-foreground">Partner Merchants</p>
              </div>
              <p className="font-headline text-3xl font-bold text-foreground">487</p>
              <p className="font-body text-xs text-success mt-2">+31% this month</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-accent/10 p-2 rounded-lg">
                  <Icon name="ChartBarIcon" size={24} variant="solid" className="text-accent" />
                </div>
                <p className="font-body text-sm text-muted-foreground">Transactions</p>
              </div>
              <p className="font-headline text-3xl font-bold text-foreground">34.2K</p>
              <p className="font-body text-xs text-success mt-2">+42% this month</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
