import Icon from '@/components/ui/AppIcon';

interface DataProtectionPrinciple {
  id: number;
  title: string;
  description: string;
  icon: string;
  implementation: string[];
}

const DataSovereignty = () => {
  const dataProtectionPrinciples: DataProtectionPrinciple[] = [
    {
      id: 1,
      title: 'South African Data Residency',
      description:
        'All personal and financial data stored exclusively within South African borders',
      icon: 'GlobeAltIcon',
      implementation: [
        'Primary data centers located in Johannesburg and Cape Town',
        'No cross-border data transfers without explicit consent',
        'Compliance with South African data sovereignty laws',
        'Local backup and disaster recovery infrastructure',
      ],
    },
    {
      id: 2,
      title: 'Data Minimization',
      description: 'Collection and retention of only essential data required for service delivery',
      icon: 'AdjustmentsHorizontalIcon',
      implementation: [
        'Purpose-specific data collection',
        'Automated data retention policies',
        'Regular data purging of unnecessary information',
        'Privacy-by-design architecture',
      ],
    },
    {
      id: 3,
      title: 'User Data Rights',
      description:
        'Comprehensive data subject rights enabling user control over personal information',
      icon: 'HandRaisedIcon',
      implementation: [
        'Right to access personal data',
        'Right to rectification of inaccurate data',
        'Right to erasure (right to be forgotten)',
        'Right to data portability',
        'Right to object to processing',
        'Right to withdraw consent',
      ],
    },
    {
      id: 4,
      title: 'Transparent Data Processing',
      description: 'Clear communication about how data is collected, used, and protected',
      icon: 'EyeIcon',
      implementation: [
        'Plain language privacy policies',
        'Granular consent management',
        'Processing activity records',
        'Regular privacy impact assessments',
      ],
    },
  ];

  return (
    <section className="py-16 lg:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Data Sovereignty & Protection
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
            Ensuring South African data remains within national borders with comprehensive
            protection and user rights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {dataProtectionPrinciples.map((principle) => (
            <div
              key={principle.id}
              className="bg-card rounded-lg shadow-md p-6 border border-border"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon
                    name={principle.icon as any}
                    size={28}
                    variant="outline"
                    className="text-primary"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-headline font-semibold text-xl text-foreground mb-2">
                    {principle.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground">{principle.description}</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-body font-semibold text-sm text-foreground mb-3">
                  Implementation:
                </h4>
                <ul className="space-y-2">
                  {principle.implementation.map((item, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Icon
                        name="CheckCircleIcon"
                        size={14}
                        variant="solid"
                        className="text-success mt-0.5 flex-shrink-0"
                      />
                      <span className="font-body text-xs text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
          <div className="p-6 lg:p-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-16 h-16 bg-accent/10 rounded-lg flex items-center justify-center">
                <Icon name="MapPinIcon" size={32} variant="solid" className="text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-headline font-bold text-2xl text-foreground mb-2">
                  Data Center Infrastructure
                </h3>
                <p className="font-body text-base text-muted-foreground">
                  State-of-the-art facilities ensuring data security, availability, and compliance
                  with South African regulations
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-body font-semibold text-base text-foreground mb-2 flex items-center space-x-2">
                    <Icon
                      name="BuildingOffice2Icon"
                      size={18}
                      variant="outline"
                      className="text-primary"
                    />
                    <span>Primary Data Center - Johannesburg</span>
                  </h4>
                  <ul className="space-y-1 ml-7">
                    <li className="font-body text-sm text-muted-foreground">
                      • Tier III certified facility
                    </li>
                    <li className="font-body text-sm text-muted-foreground">
                      • 99.98% uptime guarantee
                    </li>
                    <li className="font-body text-sm text-muted-foreground">
                      • 24/7 physical security
                    </li>
                    <li className="font-body text-sm text-muted-foreground">
                      • Redundant power and cooling
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-body font-semibold text-base text-foreground mb-2 flex items-center space-x-2">
                    <Icon
                      name="BuildingOffice2Icon"
                      size={18}
                      variant="outline"
                      className="text-primary"
                    />
                    <span>Secondary Data Center - Cape Town</span>
                  </h4>
                  <ul className="space-y-1 ml-7">
                    <li className="font-body text-sm text-muted-foreground">
                      • Disaster recovery site
                    </li>
                    <li className="font-body text-sm text-muted-foreground">
                      • Real-time data replication
                    </li>
                    <li className="font-body text-sm text-muted-foreground">
                      • Geographic redundancy
                    </li>
                    <li className="font-body text-sm text-muted-foreground">
                      • Automated failover capability
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-body font-semibold text-base text-foreground mb-2 flex items-center space-x-2">
                    <Icon
                      name="ShieldCheckIcon"
                      size={18}
                      variant="outline"
                      className="text-success"
                    />
                    <span>Security Measures</span>
                  </h4>
                  <ul className="space-y-1 ml-7">
                    <li className="font-body text-sm text-muted-foreground">
                      • Biometric access controls
                    </li>
                    <li className="font-body text-sm text-muted-foreground">• CCTV surveillance</li>
                    <li className="font-body text-sm text-muted-foreground">
                      • Environmental monitoring
                    </li>
                    <li className="font-body text-sm text-muted-foreground">
                      • Fire suppression systems
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-body font-semibold text-base text-foreground mb-2 flex items-center space-x-2">
                    <Icon
                      name="DocumentCheckIcon"
                      size={18}
                      variant="outline"
                      className="text-accent"
                    />
                    <span>Compliance Certifications</span>
                  </h4>
                  <ul className="space-y-1 ml-7">
                    <li className="font-body text-sm text-muted-foreground">
                      • ISO 27001 certified
                    </li>
                    <li className="font-body text-sm text-muted-foreground">
                      • SOC 2 Type II compliant
                    </li>
                    <li className="font-body text-sm text-muted-foreground">• PCI DSS Level 1</li>
                    <li className="font-body text-sm text-muted-foreground">
                      • POPIA compliant infrastructure
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataSovereignty;
