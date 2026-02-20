import Icon from '@/components/ui/AppIcon';

interface Badge {
  icon: string;
  title: string;
  description: string;
}

const TrustBadges = () => {
  const badges: Badge[] = [
    {
      icon: 'ShieldCheckIcon',
      title: 'POPIA Compliant',
      description: 'Full data protection compliance'
    },
    {
      icon: 'BuildingLibraryIcon',
      title: 'SARB Aligned',
      description: 'Reserve Bank regulations met'
    },
    {
      icon: 'DocumentCheckIcon',
      title: 'FIC Registered',
      description: 'Financial Intelligence Centre'
    },
    {
      icon: 'LockClosedIcon',
      title: 'Bank-Grade Security',
      description: 'End-to-end encryption'
    },
    {
      icon: 'ChartBarIcon',
      title: 'Real-Time Auditing',
      description: 'Transparent tracking systems'
    },
    {
      icon: 'UserGroupIcon',
      title: 'Community Verified',
      description: '12,847+ active users'
    }
  ];

  return (
    <section className="py-16 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-12">
          <h3 className="font-headline font-bold text-2xl text-foreground mb-2">
            Trusted & Verified
          </h3>
          <p className="font-body text-sm text-muted-foreground">
            Comprehensive compliance and security standards
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-muted transition-colors duration-300"
            >
              <div className="bg-success/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                <Icon name={badge.icon as any} size={24} variant="solid" className="text-success" />
              </div>
              <p className="font-headline font-semibold text-sm text-foreground mb-1">
                {badge.title}
              </p>
              <p className="font-body text-xs text-muted-foreground">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;