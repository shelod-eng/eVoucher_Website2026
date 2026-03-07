'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MerchantPayouts() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/merchant/dashboard?tab=payouts');
  }, [router]);

  return (
    <div className="min-h-screen bg-background pt-24 px-4">
      <div className="max-w-2xl mx-auto rounded-xl border border-border bg-card p-6 text-center text-muted-foreground font-body">
        Loading payouts...
      </div>
    </div>
  );
}
