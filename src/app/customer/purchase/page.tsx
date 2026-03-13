'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';

export default function CustomerPurchase() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to customer dashboard after 3 seconds
    const timer = setTimeout(() => {
      router?.push('/customer/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-xl p-12 text-center border border-border">
            <div className="bg-muted/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon
                name="ExclamationTriangleIcon"
                size={40}
                variant="solid"
                className="text-warning"
              />
            </div>
            <h1 className="font-headline font-bold text-3xl text-foreground mb-4">
              Feature Not Available
            </h1>
            <p className="font-body text-lg text-muted-foreground mb-6">
              The voucher purchase feature is currently unavailable.
            </p>
            <p className="font-body text-sm text-muted-foreground mb-8">
              Redirecting you to your dashboard...
            </p>
            <button
              onClick={() => router?.push('/customer/dashboard')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-headline font-semibold hover:bg-primary/90 transition-all duration-300"
            >
              <Icon name="ArrowLeftIcon" size={20} variant="outline" />
              <span>Go to Dashboard</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
