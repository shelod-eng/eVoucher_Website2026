'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface MerchantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MerchantOnboardingModal({ isOpen, onClose }: MerchantOnboardingModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full border border-border p-6 md:p-8"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Icon
                name="BuildingStorefrontIcon"
                size={24}
                variant="solid"
                className="text-secondary"
              />
            </div>
            <div>
              <h2 className="font-headline font-bold text-2xl text-foreground">
                Merchant Onboarding
              </h2>
              <p className="text-sm text-muted-foreground">
                Chain and private merchants complete one secure onboarding journey.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            aria-label="Close onboarding modal"
          >
            <Icon name="XMarkIcon" size={22} variant="solid" className="text-muted-foreground" />
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
          <h3 className="font-headline font-semibold text-foreground">What happens next</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground font-body">
            <li>1. Submit business and compliance details.</li>
            <li>2. Confirm email token and SMS OTP.</li>
            <li>3. Auto-vetting runs by merchant type (chain or private).</li>
            <li>4. On approval, login credentials are sent to your email.</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/merchants"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground px-5 py-3 text-sm font-headline font-semibold hover:bg-secondary/90 transition-colors"
          >
            Start Onboarding
          </Link>
          <Link
            href="/merchant/login"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-headline font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Merchant Login
          </Link>
        </div>
      </div>
    </div>
  );
}
