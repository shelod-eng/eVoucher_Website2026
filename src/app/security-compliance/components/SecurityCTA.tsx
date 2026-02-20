import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const SecurityCTA = () => {
  return (
    <section className="py-16 lg:py-20 bg-gradient-to-br from-primary via-primary/90 to-accent">
      <div className="max-w-5xl mx-auto px-4 lg:px-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
          <Icon name="ShieldCheckIcon" size={40} variant="solid" className="text-white" />
        </div>
        
        <h2 className="font-headline font-bold text-3xl lg:text-4xl text-white mb-4">
          Trust Built on Transparency
        </h2>
        
        <p className="font-body text-lg text-white/90 mb-8 max-w-3xl mx-auto">
          Our security-first approach ensures that government funds, merchant payments, and consumer data are protected with enterprise-grade security and full regulatory compliance
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/government-alignment"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-primary rounded-lg font-headline font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg"
          >
            <span>Government Partnership</span>
            <Icon name="ArrowRightIcon" size={20} variant="outline" />
          </Link>
          
          <Link
            href="/financial-model"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white/10 text-white border-2 border-white rounded-lg font-headline font-semibold hover:bg-white/20 transition-all duration-300"
          >
            <span>Financial Transparency</span>
            <Icon name="ArrowRightIcon" size={20} variant="outline" />
          </Link>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="font-body text-sm text-white/80 mb-4">
            Questions about our security practices?
          </p>
          <a
            href="mailto:security@evoucher.co.za"
            className="inline-flex items-center space-x-2 text-white hover:text-white/80 transition-colors duration-200"
          >
            <Icon name="EnvelopeIcon" size={18} variant="outline" />
            <span className="font-body text-sm font-medium">security@evoucher.co.za</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default SecurityCTA;