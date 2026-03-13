import Icon from '@/components/ui/AppIcon';

interface ComplianceFramework {
  id: number;
  name: string;
  acronym: string;
  description: string;
  icon: string;
  certificationDate: string;
  nextAudit: string;
  keyRequirements: string[];
  documentUrl: string;
}

const RegulatoryCompliance = () => {
  const complianceFrameworks: ComplianceFramework[] = [
    {
      id: 1,
      name: 'Protection of Personal Information Act',
      acronym: 'POPIA',
      description:
        'Comprehensive data protection and privacy compliance ensuring lawful processing of personal information',
      icon: 'ShieldCheckIcon',
      certificationDate: '15/03/2025',
      nextAudit: '15/03/2026',
      keyRequirements: [
        'Lawful processing of personal information',
        'Data subject consent management',
        'Purpose specification and limitation',
        'Information quality assurance',
        'Openness and transparency',
        'Security safeguards implementation',
        'Data subject participation rights',
        'Accountability measures',
      ],
      documentUrl: '#popia-certificate',
    },
    {
      id: 2,
      name: 'Payments Association of South Africa',
      acronym: 'PASA',
      description:
        'Payment system standards compliance for secure and efficient electronic payment processing',
      icon: 'CreditCardIcon',
      certificationDate: '22/04/2025',
      nextAudit: '22/04/2026',
      keyRequirements: [
        'Payment system security standards',
        'Transaction processing protocols',
        'Settlement procedures compliance',
        'Dispute resolution mechanisms',
        'Fraud prevention measures',
        'Operational risk management',
        'Business continuity planning',
        'Participant obligations adherence',
      ],
      documentUrl: '#pasa-certificate',
    },
    {
      id: 3,
      name: 'South African Reserve Bank',
      acronym: 'SARB',
      description:
        'Central bank regulatory alignment for financial system stability and payment system oversight',
      icon: 'BuildingLibraryIcon',
      certificationDate: '10/05/2025',
      nextAudit: '10/05/2026',
      keyRequirements: [
        'National Payment System Act compliance',
        'Financial surveillance reporting',
        'Exchange control regulations',
        'Prudential standards adherence',
        'Risk management frameworks',
        'Capital adequacy requirements',
        'Governance and oversight',
        'Systemic risk mitigation',
      ],
      documentUrl: '#sarb-alignment',
    },
    {
      id: 4,
      name: 'Financial Intelligence Centre',
      acronym: 'FIC',
      description:
        'Anti-money laundering and counter-terrorism financing compliance for financial crime prevention',
      icon: 'DocumentMagnifyingGlassIcon',
      certificationDate: '28/05/2025',
      nextAudit: '28/05/2026',
      keyRequirements: [
        'Customer Due Diligence (CDD)',
        'Know Your Customer (KYC) procedures',
        'Suspicious transaction reporting',
        'Record keeping requirements',
        'Risk-based approach implementation',
        'Sanctions screening',
        'Politically Exposed Persons (PEP) identification',
        'Ongoing monitoring and reporting',
      ],
      documentUrl: '#fic-registration',
    },
  ];

  return (
    <section className="py-16 lg:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            South African Regulatory Compliance
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
            Full compliance with all relevant South African financial services, data protection, and
            payment system regulations
          </p>
        </div>

        <div className="space-y-6">
          {complianceFrameworks.map((framework) => (
            <div
              key={framework.id}
              className="bg-card rounded-lg shadow-md border border-border overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon
                          name={framework.icon as any}
                          size={28}
                          variant="solid"
                          className="text-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-headline font-bold text-2xl text-foreground">
                            {framework.acronym}
                          </h3>
                          <span className="px-3 py-1 bg-success/10 text-success text-xs font-semibold rounded-full">
                            CERTIFIED
                          </span>
                        </div>
                        <h4 className="font-body font-semibold text-base text-foreground mb-2">
                          {framework.name}
                        </h4>
                        <p className="font-body text-sm text-muted-foreground">
                          {framework.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Icon
                          name="CalendarIcon"
                          size={16}
                          variant="outline"
                          className="text-muted-foreground"
                        />
                        <span className="font-body text-sm text-foreground">
                          <span className="font-medium">Certified:</span>{' '}
                          {framework.certificationDate}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Icon
                          name="ClockIcon"
                          size={16}
                          variant="outline"
                          className="text-muted-foreground"
                        />
                        <span className="font-body text-sm text-foreground">
                          <span className="font-medium">Next Audit:</span> {framework.nextAudit}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-body font-semibold text-sm text-foreground mb-3">
                        Key Compliance Requirements:
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {framework.keyRequirements.map((requirement, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <Icon
                              name="CheckCircleIcon"
                              size={14}
                              variant="solid"
                              className="text-success mt-0.5 flex-shrink-0"
                            />
                            <span className="font-body text-xs text-foreground">{requirement}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <a
                      href={framework.documentUrl}
                      className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors duration-200"
                    >
                      <Icon name="DocumentTextIcon" size={16} variant="outline" />
                      <span className="font-body text-sm font-medium">
                        View Certification Documentation
                      </span>
                      <Icon name="ArrowRightIcon" size={14} variant="outline" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegulatoryCompliance;
