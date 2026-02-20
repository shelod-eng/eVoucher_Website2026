import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import SecurityHero from './components/SecurityHero';
import SecurityArchitecture from './components/SecurityArchitecture';
import RegulatoryCompliance from './components/RegulatoryCompliance';
import FraudPrevention from './components/FraudPrevention';
import SecurityMonitoring from './components/SecurityMonitoring';
import OperationalCompliancePanel from './components/OperationalCompliancePanel';
import AuditTransparency from './components/AuditTransparency';
import DataSovereignty from './components/DataSovereignty';
import SecurityCTA from './components/SecurityCTA';

export const metadata: Metadata = {
  title: 'Security & Compliance - eVoucher Platform',
  description: 'Enterprise-grade security architecture and comprehensive South African regulatory compliance protecting government funds, merchant payments, and consumer data with full transparency and accountability.',
};

export default function SecurityCompliancePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <SecurityHero />
        <SecurityArchitecture />
        <RegulatoryCompliance />
        <FraudPrevention />
        <SecurityMonitoring />
        <OperationalCompliancePanel />
        <AuditTransparency />
        <DataSovereignty />
        <SecurityCTA />
      </main>
    </div>
  );
}
