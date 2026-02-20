'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface MerchantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MerchantOnboardingModal({ isOpen, onClose }: MerchantOnboardingModalProps) {
  const businessTypes = ['Spaza Shop', 'Supermarket', 'Pharmacy', 'Restaurant', 'Transport', 'Other'];

  const [formData, setFormData] = useState({
    businessName: '',
    registrationNumber: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: '',
    password: '',
    taxNumber: '',
    physicalAddress: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    accountHolderName: '',
    discountPercentage: '5',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [vettingStatus, setVettingStatus] = useState<'idle' | 'submitted' | 'reviewing' | 'approved'>('idle');
  const [merchantDetails, setMerchantDetails] = useState<{
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    bankName: string;
    accountNumber: string;
    branchCode: string;
    commissionRate: number;
    status: string;
  } | null>(null);
  const router = useRouter();
  const isSubmitting = loading || vettingStatus !== 'idle';

  const resetForm = useCallback(() => {
    setFormData({
      businessName: '',
      registrationNumber: '',
      contactName: '',
      email: '',
      phone: '',
      businessType: '',
      password: '',
      taxNumber: '',
      physicalAddress: '',
      bankName: '',
      accountNumber: '',
      branchCode: '',
      accountHolderName: '',
      discountPercentage: '5',
    });
    setError('');
    setMerchantDetails(null);
  }, []);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  }, [isSubmitting, onClose, resetForm]);

  useEffect(() => {
    if (vettingStatus === 'submitted') {
      const timer1 = setTimeout(() => setVettingStatus('reviewing'), 2000);
      return () => clearTimeout(timer1);
    }
    if (vettingStatus === 'reviewing') {
      const timer2 = setTimeout(() => setVettingStatus('approved'), 2500);
      return () => clearTimeout(timer2);
    }
    if (vettingStatus === 'approved') {
      const timer3 = setTimeout(() => router.push('/merchant/dashboard'), 2500);
      return () => clearTimeout(timer3);
    }
  }, [vettingStatus, router]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        resetForm();
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, isSubmitting, onClose, resetForm]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    const discount = parseFloat(formData.discountPercentage);
    if (Number.isNaN(discount) || discount < 0 || discount > 100) {
      setError('Discount percentage must be between 0 and 100');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.contactName.trim(),
            phone: formData.phone.trim(),
            role: 'merchant',
          },
        },
      });

      if (authError) {
        if (
          authError.message?.toLowerCase().includes('already') ||
          authError.status === 422 ||
          authError.message?.includes('User already registered')
        ) {
          throw new Error(
            'This email is already registered. Please sign in to your merchant account or use a different email.'
          );
        }
        throw new Error(authError.message || 'Failed to create merchant auth account.');
      }

      if (!authData.user) {
        throw new Error('Merchant auth account could not be created.');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      if (signInError) throw signInError;

      const response = await fetch('/api/v1/merchant/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          businessName: formData.businessName,
          registrationNumber: formData.registrationNumber,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          businessType: formData.businessType,
          taxNumber: formData.taxNumber,
          physicalAddress: formData.physicalAddress,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          branchCode: formData.branchCode,
          accountHolderName: formData.accountHolderName,
          discountPercentage: discount,
        }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to submit merchant onboarding.');
      }

      setMerchantDetails({
        businessName: formData.businessName,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        branchCode: formData.branchCode,
        commissionRate: discount,
        status: responseData.status || 'pending',
      });

      setVettingStatus('submitted');
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to submit merchant onboarding.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm"
      onMouseDown={handleClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto border border-border"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-5 md:px-8 md:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Icon name="BuildingStorefrontIcon" size={24} variant="solid" className="text-secondary" />
              </div>
              <div>
                <h2 className="font-headline font-bold text-2xl text-foreground">Merchant onboarding</h2>
                <p className="text-sm text-muted-foreground">
                  Submit profile, compliance, and payout details in one flow.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="XMarkIcon" size={22} variant="solid" className="text-muted-foreground" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {['Submit', 'Review', 'Done'].map((step, index) => {
              const activeIndex =
                vettingStatus === 'idle'
                  ? -1
                  : vettingStatus === 'submitted'
                    ? 0
                    : vettingStatus === 'reviewing'
                      ? 1
                      : 2;
              const isActive = activeIndex >= index;

              return (
                <div
                  key={step}
                  className={`rounded-full px-3 py-2 text-center text-xs font-headline font-semibold uppercase tracking-[0.12em] border ${
                    isActive
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-muted/50 border-border text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-6 md:px-8 md:py-7">
          {vettingStatus !== 'idle' ? (
            <div className="max-w-3xl mx-auto py-4">
              {vettingStatus === 'submitted' && (
                <>
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Icon name="DocumentCheckIcon" size={48} variant="solid" className="text-primary" />
                  </div>
                  <h3 className="font-headline font-bold text-3xl text-foreground mb-4 text-center">
                    Application submitted
                  </h3>
                  <p className="font-body text-lg text-muted-foreground mb-8 text-center">
                    Your merchant profile has been captured and queued for review.
                  </p>
                </>
              )}

              {vettingStatus === 'reviewing' && (
                <>
                  <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Icon name="MagnifyingGlassIcon" size={48} variant="solid" className="text-secondary" />
                  </div>
                  <h3 className="font-headline font-bold text-3xl text-foreground mb-4 text-center">
                    Validation in progress
                  </h3>
                  <p className="font-body text-lg text-muted-foreground mb-8 text-center">
                    We are reviewing your compliance and settlement details.
                  </p>
                </>
              )}

              {vettingStatus === 'approved' && merchantDetails && (
                <>
                  <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon name="CheckCircleIcon" size={48} variant="solid" className="text-success" />
                  </div>
                  <h3 className="font-headline font-bold text-3xl text-foreground mb-4 text-center">
                    Onboarding captured
                  </h3>
                  <p className="font-body text-lg text-muted-foreground mb-8 text-center">
                    Your details are saved. Dashboard will show onboarding and payout status.
                  </p>
                </>
              )}

              <div className="bg-muted/40 rounded-xl p-6 border border-border text-left">
                <h4 className="font-headline font-semibold text-lg text-foreground mb-3">Submission summary</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm font-body">
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Business:</span> {merchantDetails?.businessName}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Contact:</span> {merchantDetails?.contactName}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Email:</span> {merchantDetails?.email}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Phone:</span> {merchantDetails?.phone}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Bank:</span> {merchantDetails?.bankName}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Status:</span> {merchantDetails?.status}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start space-x-3">
                  <Icon name="ExclamationCircleIcon" size={20} variant="solid" className="text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error font-body">{error}</p>
                </div>
              )}

              <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground font-body">
                  Required fields are marked with <span className="text-error">*</span>. This session uses secure
                  onboarding capture and details are stored server-side.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-border pb-6">
                  <h3 className="font-headline font-bold text-lg text-foreground mb-4">1. Business information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Business Name *"
                    />
                    <input
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Contact Person *"
                    />
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Email *"
                    />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Phone *"
                    />
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                    >
                      <option value="">Business Type</option>
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      name="discountPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={formData.discountPercentage}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Discount Offered (%) *"
                    />
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="md:col-span-2 w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Password *"
                    />
                  </div>
                </div>

                <div className="border-b border-border pb-6">
                  <h3 className="font-headline font-bold text-lg text-foreground mb-4">2. Tax & address</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Registration Number"
                    />
                    <input
                      name="taxNumber"
                      value={formData.taxNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Tax Number *"
                    />
                    <textarea
                      name="physicalAddress"
                      value={formData.physicalAddress}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="md:col-span-2 w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Physical Address *"
                    />
                  </div>
                </div>

                <div className="pb-6">
                  <h3 className="font-headline font-bold text-lg text-foreground mb-4">3. Bank details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Bank Name *"
                    />
                    <input
                      name="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Account Holder *"
                    />
                    <input
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Account Number *"
                    />
                    <input
                      name="branchCode"
                      value={formData.branchCode}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body text-base bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Branch Code *"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-secondary text-secondary-foreground rounded-lg font-headline font-bold text-lg hover:bg-secondary/90 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Icon name="PaperAirplaneIcon" size={20} variant="solid" />
                  {loading ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
