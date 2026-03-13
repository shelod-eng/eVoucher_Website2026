import Icon from '@/components/ui/AppIcon';

interface AuditReport {
  id: number;
  title: string;
  date: string;
  auditor: string;
  scope: string;
  findings: string;
  status: string;
  documentUrl: string;
}

interface TransparencyMeasure {
  id: number;
  title: string;
  description: string;
  icon: string;
  frequency: string;
}

const AuditTransparency = () => {
  const auditReports: AuditReport[] = [
    {
      id: 1,
      title: 'Annual Security Audit 2025',
      date: '15/12/2025',
      auditor: 'PwC South Africa',
      scope: 'Comprehensive security architecture, data protection, and compliance review',
      findings: 'No critical issues identified. 3 minor recommendations implemented.',
      status: 'Completed',
      documentUrl: '#annual-audit-2025',
    },
    {
      id: 2,
      title: 'POPIA Compliance Audit',
      date: '22/09/2025',
      auditor: 'Deloitte Cyber Risk Services',
      scope: 'Data protection practices, consent management, and POPIA compliance',
      findings: 'Full compliance confirmed. Best practices recognized.',
      status: 'Completed',
      documentUrl: '#popia-audit-2025',
    },
    {
      id: 3,
      title: 'Payment System Security Review',
      date: '10/06/2025',
      auditor: 'KPMG Financial Services',
      scope: 'Payment processing security, PASA compliance, and transaction integrity',
      findings: 'All security controls operating effectively. Zero vulnerabilities.',
      status: 'Completed',
      documentUrl: '#payment-audit-2025',
    },
    {
      id: 4,
      title: 'Penetration Testing Report',
      date: '05/03/2025',
      auditor: 'SecureData Penetration Testing',
      scope: 'External and internal penetration testing of all systems',
      findings: 'No exploitable vulnerabilities found. Security posture excellent.',
      status: 'Completed',
      documentUrl: '#pentest-2025',
    },
  ];

  const transparencyMeasures: TransparencyMeasure[] = [
    {
      id: 1,
      title: 'Public Security Reports',
      description: 'Quarterly security posture reports available to all stakeholders',
      icon: 'DocumentTextIcon',
      frequency: 'Quarterly',
    },
    {
      id: 2,
      title: 'Incident Disclosure',
      description: 'Transparent communication of any security incidents within 72 hours',
      icon: 'MegaphoneIcon',
      frequency: 'As needed',
    },
    {
      id: 3,
      title: 'Compliance Certifications',
      description: 'All regulatory compliance certificates publicly accessible',
      icon: 'ShieldCheckIcon',
      frequency: 'Continuous',
    },
    {
      id: 4,
      title: 'Third-Party Audits',
      description: 'Independent security audits by recognized firms',
      icon: 'UserGroupIcon',
      frequency: 'Annual',
    },
    {
      id: 5,
      title: 'Open Security Documentation',
      description: 'Security architecture and practices documented for review',
      icon: 'BookOpenIcon',
      frequency: 'Continuous',
    },
    {
      id: 6,
      title: 'Stakeholder Briefings',
      description: 'Regular security updates for government and merchant partners',
      icon: 'PresentationChartLineIcon',
      frequency: 'Monthly',
    },
  ];

  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Audit & Transparency Framework
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
            Regular independent audits and transparent reporting to maintain stakeholder trust and
            accountability
          </p>
        </div>

        <div className="mb-16">
          <h3 className="font-headline font-semibold text-2xl text-foreground mb-6 text-center">
            Transparency Measures
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transparencyMeasures.map((measure) => (
              <div
                key={measure.id}
                className="bg-card rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Icon
                      name={measure.icon as any}
                      size={24}
                      variant="outline"
                      className="text-accent"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-body font-semibold text-base text-foreground mb-2">
                      {measure.title}
                    </h4>
                    <p className="font-body text-sm text-muted-foreground mb-3">
                      {measure.description}
                    </p>
                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full">
                      <Icon name="ClockIcon" size={12} variant="outline" className="text-primary" />
                      <span className="font-body text-xs font-medium text-primary">
                        {measure.frequency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-headline font-semibold text-2xl text-foreground mb-6 text-center">
            Recent Audit Reports
          </h3>
          <div className="space-y-6">
            {auditReports.map((report) => (
              <div
                key={report.id}
                className="bg-card rounded-lg shadow-md border border-border overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-headline font-bold text-xl text-foreground">
                          {report.title}
                        </h4>
                        <span className="px-3 py-1 bg-success/10 text-success text-xs font-semibold rounded-full">
                          {report.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center space-x-2">
                          <Icon name="CalendarIcon" size={14} variant="outline" />
                          <span>{report.date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Icon name="BuildingOfficeIcon" size={14} variant="outline" />
                          <span>{report.auditor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <h5 className="font-body font-semibold text-sm text-foreground mb-1">
                        Audit Scope:
                      </h5>
                      <p className="font-body text-sm text-muted-foreground">{report.scope}</p>
                    </div>
                    <div>
                      <h5 className="font-body font-semibold text-sm text-foreground mb-1">
                        Key Findings:
                      </h5>
                      <p className="font-body text-sm text-muted-foreground">{report.findings}</p>
                    </div>
                  </div>

                  <a
                    href={report.documentUrl}
                    className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors duration-200"
                  >
                    <Icon name="DocumentArrowDownIcon" size={16} variant="outline" />
                    <span className="font-body text-sm font-medium">Download Full Report</span>
                    <Icon name="ArrowRightIcon" size={14} variant="outline" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuditTransparency;
