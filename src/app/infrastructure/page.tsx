import { Suspense } from 'react';
import InfrastructureDashboard from './InfrastructureDashboard';

export const metadata = {
  title: 'Infrastructure Dashboard | eVoucher Platform',
  description: 'eVoucher Platform Infrastructure and Operations Dashboard',
};

export default function InfrastructurePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9FC] px-6 py-10 text-sm font-semibold text-[#20324A]">
          Loading eVoucher Enterprise Operations Platform...
        </div>
      }
    >
      <InfrastructureDashboard
        role="team access"
        userEmail="public.infrastructure@evoucher.co.za"
      />
    </Suspense>
  );
}
