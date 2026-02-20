'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import PolicyAlignmentCard from './PolicyAlignmentCard';
import ImpactMetricsCard from './ImpactMetricsCard';
import ComplianceBadge from './ComplianceBadge';
import AuditCapabilityCard from './AuditCapabilityCard';
import FraudPreventionFeature from './FraudPreventionFeature';
import TransparencyToolCard from './TransparencyToolCard';
import WhitePaperCard from './WhitePaperCard';

interface PolicyAlignment {
  title: string;
  description: string;
  icon: string;
  alignmentScore: number;
  programs: string[];
}

interface ImpactMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  description: string;
}

interface ComplianceBadgeData {
  name: string;
  acronym: string;
  status: 'certified' | 'pending' | 'compliant';
  certificationDate: string;
  expiryDate: string;
  icon: string;
}

interface AuditCapability {
  title: string;
  description: string;
  icon: string;
  features: string[];
  accessLevel: string;
}

interface FraudPrevention {
  title: string;
  description: string;
  icon: string;
  effectiveness: number;
  technologies: string[];
}

interface TransparencyTool {
  title: string;
  description: string;
  icon: string;
  dataPoints: Array<{
    label: string;
    value: string;
  }>;
  updateFrequency: string;
}

interface WhitePaper {
  title: string;
  description: string;
  author: string;
  publishDate: string;
  pages: number;
  downloadUrl: string;
  thumbnail: string;
  thumbnailAlt: string;
  category: string;
}

export default function GovernmentAlignmentInteractive() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'policy' | 'impact' | 'fraud' | 'transparency'>('policy');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const policyAlignments: PolicyAlignment[] = [
  {
    title: "Social Relief of Distress (SRD) Grant",
    description: "Direct alignment with R350 grant distribution and beneficiary verification",
    icon: "UserGroupIcon",
    alignmentScore: 98,
    programs: ["SRD Grant", "SASSA Integration", "Beneficiary Verification"]
  },
  {
    title: "National Development Plan 2030",
    description: "Supporting poverty alleviation and economic inclusion objectives",
    icon: "ChartBarIcon",
    alignmentScore: 95,
    programs: ["Poverty Reduction", "Economic Growth", "Social Cohesion"]
  },
  {
    title: "Township Economic Development",
    description: "Empowering local merchants and stimulating township economies",
    icon: "BuildingStorefrontIcon",
    alignmentScore: 92,
    programs: ["SMME Support", "Local Procurement", "Job Creation"]
  },
  {
    title: "Financial Inclusion Strategy",
    description: "Advancing digital payment adoption and financial literacy",
    icon: "BanknotesIcon",
    alignmentScore: 96,
    programs: ["Digital Payments", "Financial Literacy", "Banking Access"]
  }];


  const impactMetrics: ImpactMetric[] = [
  {
    title: "Total Beneficiaries Served",
    value: "2.4M",
    change: "+18% MoM",
    trend: "up",
    icon: "UsersIcon",
    description: "Active users receiving social benefits through platform"
  },
  {
    title: "Government Savings Generated",
    value: "R 847M",
    change: "+24% QoQ",
    trend: "up",
    icon: "CurrencyDollarIcon",
    description: "Cost savings through reduced fraud and efficient distribution"
  },
  {
    title: "Fraud Prevention Rate",
    value: "99.2%",
    change: "+0.8% YoY",
    trend: "up",
    icon: "ShieldCheckIcon",
    description: "Successfully prevented fraudulent transactions"
  },
  {
    title: "Township Merchants Onboarded",
    value: "18,500",
    change: "+32% MoM",
    trend: "up",
    icon: "BuildingStorefrontIcon",
    description: "Local businesses participating in the ecosystem"
  },
  {
    title: "Average Household Savings",
    value: "R 342",
    change: "+12% MoM",
    trend: "up",
    icon: "BanknotesIcon",
    description: "Monthly savings per beneficiary household"
  },
  {
    title: "Transaction Success Rate",
    value: "99.7%",
    change: "Stable",
    trend: "stable",
    icon: "CheckCircleIcon",
    description: "Successful voucher redemptions without technical issues"
  }];


  const complianceBadges: ComplianceBadgeData[] = [
  {
    name: "Protection of Personal Information Act",
    acronym: "POPIA",
    status: "certified",
    certificationDate: "15/03/2025",
    expiryDate: "15/03/2027",
    icon: "ShieldCheckIcon"
  },
  {
    name: "Payment Association of South Africa",
    acronym: "PASA",
    status: "compliant",
    certificationDate: "22/01/2025",
    expiryDate: "22/01/2027",
    icon: "BuildingLibraryIcon"
  },
  {
    name: "South African Reserve Bank",
    acronym: "SARB",
    status: "certified",
    certificationDate: "08/02/2025",
    expiryDate: "08/02/2027",
    icon: "BanknotesIcon"
  },
  {
    name: "Financial Intelligence Centre Act",
    acronym: "FIC",
    status: "compliant",
    certificationDate: "12/04/2025",
    expiryDate: "12/04/2027",
    icon: "DocumentMagnifyingGlassIcon"
  }];


  const auditCapabilities: AuditCapability[] = [
  {
    title: "Real-Time Transaction Monitoring",
    description: "Live dashboard tracking all voucher purchases, redemptions, and settlements",
    icon: "ChartBarIcon",
    features: [
    "Transaction volume by region and merchant",
    "Beneficiary spending patterns analysis",
    "Settlement status and timing tracking",
    "Anomaly detection and flagging"],

    accessLevel: "Government Admin"
  },
  {
    title: "Beneficiary Impact Tracking",
    description: "Comprehensive analytics on household savings and program effectiveness",
    icon: "UserGroupIcon",
    features: [
    "Individual beneficiary savings history",
    "Household economic impact metrics",
    "Program participation rates",
    "Demographic distribution analysis"],

    accessLevel: "Policy Maker"
  },
  {
    title: "Fund Utilization Reports",
    description: "Complete transparency on how government funds are distributed and used",
    icon: "DocumentChartBarIcon",
    features: [
    "Budget allocation vs. actual spending",
    "Category-wise fund distribution",
    "Merchant settlement reconciliation",
    "Administrative cost breakdown"],

    accessLevel: "Financial Auditor"
  },
  {
    title: "Compliance Audit Trail",
    description: "Immutable record of all system activities for regulatory compliance",
    icon: "ClipboardDocumentCheckIcon",
    features: [
    "Complete transaction history logs",
    "User access and activity tracking",
    "System configuration change logs",
    "Regulatory report generation"],

    accessLevel: "Compliance Officer"
  }];


  const fraudPreventionFeatures: FraudPrevention[] = [
  {
    title: "Biometric Verification",
    description: "Multi-factor authentication using fingerprint and facial recognition for beneficiary identity verification",
    icon: "FingerPrintIcon",
    effectiveness: 99.4,
    technologies: ["Fingerprint Scanning", "Facial Recognition", "Liveness Detection"]
  },
  {
    title: "AI-Powered Anomaly Detection",
    description: "Machine learning algorithms identify suspicious transaction patterns in real-time",
    icon: "CpuChipIcon",
    effectiveness: 98.7,
    technologies: ["Neural Networks", "Pattern Recognition", "Behavioral Analysis"]
  },
  {
    title: "Blockchain Transaction Ledger",
    description: "Immutable distributed ledger ensures transaction integrity and prevents tampering",
    icon: "CubeTransparentIcon",
    effectiveness: 99.9,
    technologies: ["Distributed Ledger", "Smart Contracts", "Cryptographic Hashing"]
  },
  {
    title: "Geographic Validation",
    description: "Location-based verification prevents voucher misuse outside designated areas",
    icon: "MapPinIcon",
    effectiveness: 97.2,
    technologies: ["GPS Tracking", "Geofencing", "Location Intelligence"]
  },
  {
    title: "Duplicate Prevention System",
    description: "Advanced algorithms detect and prevent duplicate claims and identity fraud",
    icon: "DocumentDuplicateIcon",
    effectiveness: 99.1,
    technologies: ["Identity Matching", "Database Cross-Reference", "Duplicate Detection"]
  },
  {
    title: "Real-Time Risk Scoring",
    description: "Dynamic risk assessment for every transaction with instant fraud flagging",
    icon: "ExclamationTriangleIcon",
    effectiveness: 98.3,
    technologies: ["Risk Algorithms", "Predictive Analytics", "Threat Intelligence"]
  }];


  const transparencyTools: TransparencyTool[] = [
  {
    title: "Public Impact Dashboard",
    description: "Real-time visualization of program performance and social impact metrics",
    icon: "PresentationChartLineIcon",
    dataPoints: [
    { label: "Total Transactions Today", value: "R 12.4M" },
    { label: "Active Beneficiaries", value: "2,387,456" },
    { label: "Participating Merchants", value: "18,502" },
    { label: "Average Savings per Household", value: "R 342" }],

    updateFrequency: "Every 15 minutes"
  },
  {
    title: "Financial Transparency Portal",
    description: "Complete breakdown of fund allocation, distribution, and utilization",
    icon: "CurrencyDollarIcon",
    dataPoints: [
    { label: "Total Government Investment", value: "R 2.8B" },
    { label: "Beneficiary Savings Generated", value: "R 847M" },
    { label: "Merchant Revenue Increase", value: "R 1.2B" },
    { label: "Administrative Costs", value: "2.3%" }],

    updateFrequency: "Daily at 00:00"
  },
  {
    title: "Audit Report Repository",
    description: "Comprehensive archive of third-party audits and compliance certifications",
    icon: "FolderOpenIcon",
    dataPoints: [
    { label: "Latest Financial Audit", value: "Q4 2025" },
    { label: "Security Assessment", value: "January 2026" },
    { label: "Compliance Review", value: "December 2025" },
    { label: "Impact Evaluation", value: "Q4 2025" }],

    updateFrequency: "Quarterly"
  }];


  const whitePapers: WhitePaper[] = [
  {
    title: "Digital Transformation of Social Welfare: The eVoucher Model",
    description: "Comprehensive analysis of how digital voucher systems can revolutionize social program delivery, reduce fraud, and improve beneficiary outcomes in developing economies.",
    author: "Dr. Thabo Mbeki",
    publishDate: "December 2025",
    pages: 48,
    downloadUrl: "#",
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_133b1e7cf-1768750078214.png",
    thumbnailAlt: "Business professional analyzing financial charts and graphs on laptop in modern office",
    category: "Policy Research"
  },
  {
    title: "Fraud Prevention in Social Programs: A Technology-First Approach",
    description: "Detailed examination of biometric verification, AI-powered anomaly detection, and blockchain technology in preventing social welfare fraud and ensuring program integrity.",
    author: "Prof. Naledi Pandor",
    publishDate: "November 2025",
    pages: 62,
    downloadUrl: "#",
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_1f3dbb3fd-1764669639747.png",
    thumbnailAlt: "Security professional reviewing cybersecurity dashboard with multiple monitors showing data analytics",
    category: "Security"
  },
  {
    title: "Township Economic Development Through Digital Commerce",
    description: "Research study on how digital payment platforms can stimulate local economies, support small merchants, and create sustainable economic growth in underserved communities.",
    author: "Dr. Lindiwe Sisulu",
    publishDate: "October 2025",
    pages: 55,
    downloadUrl: "#",
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_1efc8391b-1767700962291.png",
    thumbnailAlt: "Diverse team of business professionals collaborating around conference table with laptops and documents",
    category: "Economic Development"
  },
  {
    title: "Measuring Social Impact: Metrics for Digital Welfare Programs",
    description: "Framework for evaluating the effectiveness of digital social programs, including beneficiary satisfaction, economic impact, and long-term community development outcomes.",
    author: "Dr. Zweli Mkhize",
    publishDate: "September 2025",
    pages: 41,
    downloadUrl: "#",
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_1ce412c3a-1764643146215.png",
    thumbnailAlt: "Data analyst presenting statistical charts and performance metrics on large screen to executive team",
    category: "Impact Assessment"
  }];


  const tabs = [
  { id: 'policy' as const, label: 'Policy Alignment', icon: 'DocumentCheckIcon' },
  { id: 'impact' as const, label: 'Impact Analytics', icon: 'ChartBarIcon' },
  { id: 'fraud' as const, label: 'Fraud Prevention', icon: 'ShieldCheckIcon' },
  { id: 'transparency' as const, label: 'Transparency Tools', icon: 'EyeIcon' }];


  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) =>
              <div key={i} className="h-64 bg-muted rounded-lg" />
              )}
            </div>
          </div>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Icon name="BuildingLibraryIcon" size={20} variant="solid" className="text-primary" />
              <span className="text-sm font-body font-semibold text-primary">Government Partnership Portal</span>
            </div>
            <h1 className="font-headline font-bold text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
              Transparent, Accountable,<br />Measurable Social Impact
            </h1>
            <p className="font-body text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Comprehensive policy alignment, real-time impact analytics, and advanced fraud prevention for South Africa's social welfare programs
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-8 py-3 bg-action text-action-foreground rounded-md font-headline font-semibold hover:bg-action/90 transition-all duration-300 transform hover:scale-105 shadow-md">

                Schedule Partnership Discussion
              </Link>
              <button className="px-8 py-3 bg-card text-foreground border border-border rounded-md font-headline font-semibold hover:bg-muted transition-colors duration-300">
                Download Policy Brief
              </button>
            </div>
          </div>

          {/* Key Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-card rounded-lg shadow-md p-6 text-center border border-border">
              <p className="font-headline text-3xl md:text-4xl font-bold text-primary mb-2">98%</p>
              <p className="font-body text-sm text-muted-foreground">Policy Alignment Score</p>
            </div>
            <div className="bg-card rounded-lg shadow-md p-6 text-center border border-border">
              <p className="font-headline text-3xl md:text-4xl font-bold text-success mb-2">99.2%</p>
              <p className="font-body text-sm text-muted-foreground">Fraud Prevention Rate</p>
            </div>
            <div className="bg-card rounded-lg shadow-md p-6 text-center border border-border">
              <p className="font-headline text-3xl md:text-4xl font-bold text-secondary mb-2">R 847M</p>
              <p className="font-body text-sm text-muted-foreground">Government Savings</p>
            </div>
            <div className="bg-card rounded-lg shadow-md p-6 text-center border border-border">
              <p className="font-headline text-3xl md:text-4xl font-bold text-accent mb-2">2.4M</p>
              <p className="font-body text-sm text-muted-foreground">Beneficiaries Served</p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Badges Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-headline font-bold text-3xl md:text-4xl text-foreground mb-4">
              Regulatory Compliance & Certifications
            </h2>
            <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
              Fully compliant with South African financial regulations and data protection laws
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceBadges.map((badge, index) =>
            <ComplianceBadge key={index} {...badge} />
            )}
          </div>
        </div>
      </section>

      {/* Tabbed Content Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {tabs.map((tab) =>
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-body font-semibold transition-all duration-300 ${
              activeTab === tab.id ?
              'bg-primary text-primary-foreground shadow-md' :
              'bg-card text-foreground border border-border hover:bg-muted'}`
              }>

                <Icon name={tab.icon as any} size={20} variant={activeTab === tab.id ? 'solid' : 'outline'} />
                <span>{tab.label}</span>
              </button>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'policy' &&
          <div className="space-y-12">
              <div className="text-center mb-8">
                <h2 className="font-headline font-bold text-3xl md:text-4xl text-foreground mb-4">
                  Policy Alignment Framework
                </h2>
                <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
                  Direct alignment with South African government social programs and national development objectives
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {policyAlignments.map((policy, index) =>
              <PolicyAlignmentCard key={index} {...policy} />
              )}
              </div>
            </div>
          }

          {activeTab === 'impact' &&
          <div className="space-y-12">
              <div className="text-center mb-8">
                <h2 className="font-headline font-bold text-3xl md:text-4xl text-foreground mb-4">
                  Real-Time Impact Analytics
                </h2>
                <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
                  Comprehensive metrics tracking social impact, economic outcomes, and program effectiveness
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {impactMetrics.map((metric, index) =>
              <ImpactMetricsCard key={index} {...metric} />
              )}
              </div>
            </div>
          }

          {activeTab === 'fraud' &&
          <div className="space-y-12">
              <div className="text-center mb-8">
                <h2 className="font-headline font-bold text-3xl md:text-4xl text-foreground mb-4">
                  Advanced Fraud Prevention
                </h2>
                <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
                  Multi-layered security architecture ensuring program integrity and preventing misuse
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fraudPreventionFeatures.map((feature, index) =>
              <FraudPreventionFeature key={index} {...feature} />
              )}
              </div>
            </div>
          }

          {activeTab === 'transparency' &&
          <div className="space-y-12">
              <div className="text-center mb-8">
                <h2 className="font-headline font-bold text-3xl md:text-4xl text-foreground mb-4">
                  Transparency & Accountability Tools
                </h2>
                <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
                  Complete visibility into program performance, fund utilization, and social impact
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {transparencyTools.map((tool, index) =>
              <TransparencyToolCard key={index} {...tool} />
              )}
              </div>
            </div>
          }
        </div>
      </section>

      {/* Audit Capabilities Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-headline font-bold text-3xl md:text-4xl text-foreground mb-4">
              Comprehensive Audit Capabilities
            </h2>
            <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
              Role-based access to real-time monitoring, impact tracking, and compliance reporting
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {auditCapabilities.map((capability, index) =>
            <AuditCapabilityCard key={index} {...capability} />
            )}
          </div>
        </div>
      </section>

      {/* White Papers Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-headline font-bold text-3xl md:text-4xl text-foreground mb-4">
              Policy Research & White Papers
            </h2>
            <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto">
              In-depth research on social program efficiency, fraud prevention, and economic development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whitePapers.map((paper, index) =>
            <WhitePaperCard key={index} {...paper} />
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12 border border-border">
            <Icon name="HandRaisedIcon" size={48} variant="outline" className="text-primary mx-auto mb-6" />
            <h2 className="font-headline font-bold text-3xl md:text-4xl text-foreground mb-4">
              Partner with eVoucher
            </h2>
            <p className="font-body text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join us in transforming social welfare delivery through transparent, accountable, and measurable digital commerce
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-8 py-3 bg-action text-action-foreground rounded-md font-headline font-semibold hover:bg-action/90 transition-all duration-300 transform hover:scale-105 shadow-md">

                Schedule Partnership Meeting
              </Link>
              <button className="px-8 py-3 bg-secondary text-secondary-foreground rounded-md font-headline font-semibold hover:bg-secondary/90 transition-colors duration-300">
                Request Detailed Proposal
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>);

}