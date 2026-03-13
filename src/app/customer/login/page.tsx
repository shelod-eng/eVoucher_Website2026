'use client';

import Header from '@/components/common/Header';
import ConsumerLoginCard from '@/components/common/ConsumerLoginCard';

export default function CustomerLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header />
      <div className="pt-24 pb-16 px-4 flex justify-center">
        <ConsumerLoginCard redirectTo="/customer/dashboard" />
      </div>
    </div>
  );
}
