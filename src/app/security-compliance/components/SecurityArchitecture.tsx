import Icon from '@/components/ui/AppIcon';

interface ArchitectureLayer {
  id: number;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

const SecurityArchitecture = () => {
  const architectureLayers: ArchitectureLayer[] = [
    {
      id: 1,
      title: "Application Layer Security",
      description: "Frontend and backend application security controls",
      icon: "ComputerDesktopIcon",
      features: [
        "HTTPS/TLS 1.3 encryption for all communications",
        "Content Security Policy (CSP) headers",
        "Cross-Site Scripting (XSS) protection",
        "Cross-Site Request Forgery (CSRF) tokens",
        "Secure session management with JWT",
        "Input validation and sanitization"
      ]
    },
    {
      id: 2,
      title: "Data Protection Layer",
      description: "Encryption and data sovereignty controls",
      icon: "LockClosedIcon",
      features: [
        "AES-256 encryption at rest",
        "End-to-end encryption for sensitive data",
        "Data masking for PII display",
        "South African data residency compliance",
        "Automated data retention policies",
        "Secure data disposal procedures"
      ]
    },
    {
      id: 3,
      title: "Access Control Layer",
      description: "Identity and access management systems",
      icon: "FingerPrintIcon",
      features: [
        "Multi-factor authentication (MFA)",
        "Role-based access control (RBAC)",
        "Principle of least privilege enforcement",
        "Biometric authentication support",
        "Session timeout and re-authentication",
        "Audit logging for all access events"
      ]
    },
    {
      id: 4,
      title: "Network Security Layer",
      description: "Infrastructure and network protection",
      icon: "ServerStackIcon",
      features: [
        "Web Application Firewall (WAF)",
        "DDoS protection and mitigation",
        "Intrusion Detection System (IDS)",
        "Network segmentation and isolation",
        "VPN for administrative access",
        "Regular penetration testing"
      ]
    }
  ];

  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Multi-Layer Security Architecture
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
            Defense-in-depth approach with multiple security layers protecting every aspect of the platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {architectureLayers.map((layer) => (
            <div key={layer.id} className="bg-card rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name={layer.icon as any} size={24} variant="outline" className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-headline font-semibold text-xl text-foreground mb-2">
                    {layer.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground">
                    {layer.description}
                  </p>
                </div>
              </div>
              
              <ul className="space-y-2">
                {layer.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Icon name="CheckCircleIcon" size={16} variant="solid" className="text-success mt-0.5 flex-shrink-0" />
                    <span className="font-body text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecurityArchitecture;