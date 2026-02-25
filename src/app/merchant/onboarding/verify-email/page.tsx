'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';

type VerificationState = 'loading' | 'success' | 'error';

export const dynamic = 'force-dynamic';

export default function MerchantEmailVerificationPage() {
  const [merchantId, setMerchantId] = useState('');
  const [token, setToken] = useState('');
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('Verifying your merchant email token...');
  const [approved, setApproved] = useState(false);

  const continueUrl = useMemo(() => {
    if (!merchantId) return '/merchants';
    return `/merchants?merchantId=${encodeURIComponent(merchantId)}`;
  }, [merchantId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setMerchantId(String(params.get('merchantId') ?? '').trim());
    setToken(String(params.get('token') ?? '').trim());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      if (!merchantId || !token) {
        setState('error');
        setMessage('Missing merchant verification parameters.');
        return;
      }

      try {
        const response = await fetch('/api/v1/merchant/onboarding/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId, token }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Email verification failed.');
        if (cancelled) return;
        setApproved(Boolean(result.approved));
        setState('success');
        setMessage(
          result.message ||
            'Email verified successfully. Return to onboarding to complete SMS OTP verification.'
        );
      } catch (error: any) {
        if (cancelled) return;
        setState('error');
        setMessage(error?.message || 'Email verification failed.');
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [merchantId, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-primary/5">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl shadow-lg p-8">
          <div className="flex items-start gap-3 mb-4">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                state === 'success'
                  ? 'bg-success/15 text-success'
                  : state === 'error'
                    ? 'bg-error/15 text-error'
                    : 'bg-primary/15 text-primary'
              }`}
            >
              <Icon
                name={
                  state === 'success'
                    ? 'CheckCircleIcon'
                    : state === 'error'
                      ? 'ExclamationCircleIcon'
                      : 'ArrowPathIcon'
                }
                size={20}
                variant="solid"
                className={state === 'loading' ? 'animate-spin' : ''}
              />
            </span>
            <div>
              <h1 className="font-headline text-2xl font-bold text-foreground">Merchant Email Verification</h1>
              <p className="mt-2 text-sm text-muted-foreground font-body">{message}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={continueUrl}
              className="inline-flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground px-4 py-2.5 text-sm font-headline font-semibold hover:bg-secondary/90 transition-colors"
            >
              Continue Onboarding
            </Link>
            {approved && (
              <Link
                href="/merchant/login"
                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-headline font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Merchant Login
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
