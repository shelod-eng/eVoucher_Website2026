'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface FraudPreventionMeasure {
  id: number;
  category: string;
  title: string;
  description: string;
  icon: string;
  techniques: string[];
  effectiveness: string;
}

const FraudPrevention = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const fraudPreventionMeasures: FraudPreventionMeasure[] = [
    {
      id: 1,
      category: 'transaction',
      title: 'Transaction Monitoring',
      description:
        'Real-time analysis of transaction patterns to detect and prevent fraudulent activities',
      icon: 'MagnifyingGlassCircleIcon',
      techniques: [
        'Velocity checks for unusual transaction frequency',
        'Amount threshold monitoring',
        'Geographic location verification',
        'Device fingerprinting',
        'Behavioral biometrics analysis',
        'Machine learning anomaly detection',
      ],
      effectiveness: '99.7% fraud detection rate',
    },
    {
      id: 2,
      category: 'identity',
      title: 'Identity Verification',
      description: 'Multi-layered identity authentication to ensure legitimate user access',
      icon: 'IdentificationIcon',
      techniques: [
        'Government ID verification',
        'Biometric authentication (fingerprint, facial recognition)',
        'Liveness detection',
        'Document authenticity checks',
        'Address verification',
        'Phone number validation',
      ],
      effectiveness: '99.5% identity verification accuracy',
    },
    {
      id: 3,
      category: 'voucher',
      title: 'Voucher Protection',
      description:
        'Secure voucher generation and redemption to prevent duplication and unauthorized use',
      icon: 'TicketIcon',
      techniques: [
        'Cryptographic voucher codes',
        'One-time use enforcement',
        'Time-bound validity periods',
        'Merchant-specific redemption locks',
        'QR code encryption',
        'Blockchain-based audit trail',
      ],
      effectiveness: 'Zero voucher duplication incidents',
    },
    {
      id: 4,
      category: 'merchant',
      title: 'Merchant Verification',
      description:
        'Comprehensive merchant onboarding and ongoing monitoring to prevent fraudulent merchants',
      icon: 'BuildingStorefrontIcon',
      techniques: [
        'Business registration verification',
        'Physical location validation',
        'Bank account verification',
        'Reference checks',
        'Ongoing transaction pattern analysis',
        'Complaint and dispute monitoring',
      ],
      effectiveness: '100% merchant verification before activation',
    },
    {
      id: 5,
      category: 'government',
      title: 'Government Fund Protection',
      description: 'Specialized controls to protect government social program funds from misuse',
      icon: 'ShieldExclamationIcon',
      techniques: [
        'Beneficiary eligibility verification',
        'Duplicate beneficiary detection',
        'Fund allocation tracking',
        'Reconciliation and audit trails',
        'Real-time reporting to government',
        'Automated compliance checks',
      ],
      effectiveness: '100% fund accountability and traceability',
    },
    {
      id: 6,
      category: 'data',
      title: 'Data Breach Prevention',
      description: 'Advanced security measures to protect sensitive consumer and merchant data',
      icon: 'LockClosedIcon',
      techniques: [
        'Encryption at rest and in transit',
        'Data access logging and monitoring',
        'Privileged access management',
        'Regular security audits',
        'Vulnerability scanning',
        'Incident response procedures',
      ],
      effectiveness: 'Zero data breach incidents',
    },
  ];

  const categories = [
    { id: 'all', label: 'All Measures', icon: 'Squares2X2Icon' },
    { id: 'transaction', label: 'Transaction', icon: 'ArrowsRightLeftIcon' },
    { id: 'identity', label: 'Identity', icon: 'UserIcon' },
    { id: 'voucher', label: 'Voucher', icon: 'TicketIcon' },
    { id: 'merchant', label: 'Merchant', icon: 'BuildingStorefrontIcon' },
    { id: 'government', label: 'Government', icon: 'BuildingLibraryIcon' },
    { id: 'data', label: 'Data', icon: 'ServerIcon' },
  ];

  const filteredMeasures =
    activeCategory === 'all'
      ? fraudPreventionMeasures
      : fraudPreventionMeasures.filter((measure) => measure.category === activeCategory);

  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-4">
            Comprehensive Fraud Prevention System
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
            Multi-layered fraud detection and prevention protecting government funds, merchant
            payments, and consumer data
          </p>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-body text-sm font-medium transition-all duration-200 ${
                  activeCategory === category.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card text-foreground hover:bg-muted border border-border'
                }`}
              >
                <Icon name={category.icon as any} size={16} variant="outline" />
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMeasures.map((measure) => (
            <div
              key={measure.id}
              className="bg-card rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Icon
                    name={measure.icon as any}
                    size={24}
                    variant="solid"
                    className="text-secondary"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-headline font-semibold text-xl text-foreground mb-2">
                    {measure.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mb-3">
                    {measure.description}
                  </p>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-success/10 rounded-full">
                    <Icon
                      name="CheckBadgeIcon"
                      size={14}
                      variant="solid"
                      className="text-success"
                    />
                    <span className="font-body text-xs font-medium text-success">
                      {measure.effectiveness}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-body font-semibold text-sm text-foreground mb-3">
                  Prevention Techniques:
                </h4>
                <ul className="space-y-2">
                  {measure.techniques.map((technique, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Icon
                        name="ShieldCheckIcon"
                        size={14}
                        variant="solid"
                        className="text-primary mt-0.5 flex-shrink-0"
                      />
                      <span className="font-body text-xs text-foreground">{technique}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FraudPrevention;
