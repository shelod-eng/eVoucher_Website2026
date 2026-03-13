import Icon from '@/components/ui/AppIcon';

interface SecurityHeroProps {
  className?: string;
}

const SecurityHero = ({ className = '' }: SecurityHeroProps) => {
  return (
    <section
      className={`bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 lg:py-24 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
            <Icon name="ShieldCheckIcon" size={40} variant="solid" className="text-primary" />
          </div>

          <h1 className="font-headline font-bold text-4xl lg:text-5xl text-foreground mb-6">
            Security & Compliance Foundation
          </h1>

          <p className="font-body text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed">
            Enterprise-grade security architecture protecting government funds, merchant payments,
            and consumer data with comprehensive South African regulatory compliance
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center space-x-2 px-4 py-2 bg-card rounded-lg shadow-sm">
              <Icon name="CheckBadgeIcon" size={20} variant="solid" className="text-success" />
              <span className="font-body text-sm font-medium text-foreground">POPIA Compliant</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-card rounded-lg shadow-sm">
              <Icon name="CheckBadgeIcon" size={20} variant="solid" className="text-success" />
              <span className="font-body text-sm font-medium text-foreground">PASA Certified</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-card rounded-lg shadow-sm">
              <Icon name="CheckBadgeIcon" size={20} variant="solid" className="text-success" />
              <span className="font-body text-sm font-medium text-foreground">SARB Aligned</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-card rounded-lg shadow-sm">
              <Icon name="CheckBadgeIcon" size={20} variant="solid" className="text-success" />
              <span className="font-body text-sm font-medium text-foreground">FIC Registered</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityHero;
