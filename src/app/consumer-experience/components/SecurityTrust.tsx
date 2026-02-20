import Icon from '@/components/ui/AppIcon';

interface SecurityFeature {
  icon: string;
  title: string;
  description: string;
}

interface ComplianceBadge {
  name: string;
  description: string;
}

const SecurityTrust = () => {
  const securityFeatures: SecurityFeature[] = [
    {
      icon: 'LockClosedIcon',
      title: 'Bank-Grade Encryption',
      description: 'All transactions protected with 256-bit SSL encryption, the same security used by major financial institutions.'
    },
    {
      icon: 'ShieldCheckIcon',
      title: 'Fraud Prevention',
      description: 'Advanced AI-powered fraud detection monitors every transaction to protect your account and savings.'
    },
    {
      icon: 'FingerPrintIcon',
      title: 'Secure Authentication',
      description: 'Multi-factor authentication and biometric options ensure only you can access your vouchers.'
    },
    {
      icon: 'DocumentCheckIcon',
      title: 'Transaction Verification',
      description: 'Every purchase and redemption is verified and recorded with instant SMS confirmation.'
    },
    {
      icon: 'EyeSlashIcon',
      title: 'Privacy Protection',
      description: 'Your personal data is never shared with third parties. Full POPIA compliance guaranteed.'
    },
    {
      icon: 'ClockIcon',
      title: '24/7 Monitoring',
      description: 'Round-the-clock security monitoring and instant alerts for any suspicious activity.'
    }
  ];

  const complianceBadges: ComplianceBadge[] = [
    { name: 'POPIA', description: 'Protection of Personal Information Act' },
    { name: 'PASA', description: 'Payments Association of South Africa' },
    { name: 'SARB', description: 'South African Reserve Bank' },
    { name: 'FIC', description: 'Financial Intelligence Centre' }
  ];

  return (
    <section className="bg-gradient-to-br from-trust-builder/5 via-background to-primary/5 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-trust-builder/10 rounded-full mb-6">
            <Icon name="ShieldCheckIcon" size={20} variant="solid" className="text-trust-builder" />
            <span className="text-sm font-headline font-semibold text-trust-builder">Your Security Matters</span>
          </div>
          
          <h2 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
            Protected Every Step<br />
            <span className="text-primary">of the Way</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Your trust is our foundation. We implement enterprise-grade security measures to protect your savings, data, and transactions.
          </p>
        </div>
        
        {/* Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-border"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Icon name={feature.icon as any} size={28} variant="solid" className="text-primary" />
              </div>
              <h3 className="font-headline font-bold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* Compliance Badges */}
        <div className="bg-card rounded-2xl shadow-xl p-8 lg:p-12">
          <div className="text-center mb-8">
            <h3 className="font-headline font-bold text-2xl text-foreground mb-2">
              Fully Compliant & Regulated
            </h3>
            <p className="text-muted-foreground">
              Certified by South Africa's leading regulatory bodies
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceBadges.map((badge, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center p-6 bg-muted rounded-xl hover:bg-primary/5 transition-colors duration-300"
              >
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-3">
                  <Icon name="CheckBadgeIcon" size={32} variant="solid" className="text-success" />
                </div>
                <p className="font-headline font-bold text-xl text-foreground mb-1">
                  {badge.name}
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-accent/10 rounded-xl border border-accent/20">
            <div className="flex items-start space-x-4">
              <Icon name="InformationCircleIcon" size={24} variant="solid" className="text-accent flex-shrink-0 mt-1" />
              <div>
                <p className="font-headline font-semibold text-foreground mb-2">
                  Your Data, Your Control
                </p>
                <p className="text-sm text-muted-foreground">
                  We never sell your personal information. You can request data deletion at any time. All transactions are encrypted end-to-end, and we undergo regular third-party security audits to ensure your protection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityTrust;