import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface CTASectionProps {
  onOpenCustomerModal?: () => void;
  onOpenMerchantModal?: () => void;
  onOpenForgotModal?: () => void;
}

const CTASection = ({ onOpenCustomerModal, onOpenMerchantModal, onOpenForgotModal }: CTASectionProps) => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-secondary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="font-headline font-bold text-3xl lg:text-5xl text-white mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="font-body text-lg text-white/90 max-w-3xl mx-auto mb-8">
            Join thousands of consumers, merchants, and government partners creating meaningful
            change through dignified digital commerce.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Consumer CTA */}
          <button
            onClick={onOpenCustomerModal}
            className="bg-white rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group text-left w-full"
          >
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
              <Icon name="UserIcon" size={32} variant="solid" className="text-primary" />
            </div>
            <h3 className="font-headline font-bold text-xl text-foreground mb-3">Start Saving</h3>
            <p className="font-body text-sm text-muted-foreground mb-6">
              Access up to 30% savings on essential goods through simple USSD technology.
            </p>
            <div className="flex items-center space-x-2 text-primary font-body font-semibold">
              <span>Join as Consumer</span>
              <Icon name="ArrowRightIcon" size={16} variant="outline" />
            </div>
          </button>

          {/* Merchant CTA */}
          <button
            onClick={onOpenMerchantModal}
            className="bg-white rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group text-left w-full"
          >
            <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors duration-300">
              <Icon
                name="BuildingStorefrontIcon"
                size={32}
                variant="solid"
                className="text-secondary"
              />
            </div>
            <h3 className="font-headline font-bold text-xl text-foreground mb-3">
              Grow Your Business
            </h3>
            <p className="font-body text-sm text-muted-foreground mb-6">
              Increase revenue by 25-40% with free loyalty tools and new customers.
            </p>
            <div className="flex items-center space-x-2 text-secondary font-body font-semibold">
              <span>Become a Merchant</span>
              <Icon name="ArrowRightIcon" size={16} variant="outline" />
            </div>
          </button>

          {/* Government CTA */}
          <Link
            href="/government-alignment"
            className="bg-white rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group"
          >
            <div className="bg-trust-builder/10 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-trust-builder/20 transition-colors duration-300">
              <Icon
                name="BuildingLibraryIcon"
                size={32}
                variant="solid"
                className="text-trust-builder"
              />
            </div>
            <h3 className="font-headline font-bold text-xl text-foreground mb-3">
              Partner with Us
            </h3>
            <p className="font-body text-sm text-muted-foreground mb-6">
              Deliver social programs with transparency, accountability, and measurable impact.
            </p>
            <div className="flex items-center space-x-2 text-trust-builder font-body font-semibold">
              <span>Explore Partnership</span>
              <Icon name="ArrowRightIcon" size={16} variant="outline" />
            </div>
          </Link>
        </div>

        {/* Secondary Links */}
        <div className="flex flex-wrap justify-center gap-6 mt-12">
          <Link
            href="/security-compliance"
            className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors duration-300"
          >
            <Icon name="ShieldCheckIcon" size={20} variant="outline" />
            <span className="font-body font-medium">Security & Compliance</span>
          </Link>
          <Link
            href="/financial-model"
            className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors duration-300"
          >
            <Icon name="ChartBarIcon" size={20} variant="outline" />
            <span className="font-body font-medium">Financial Model</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
