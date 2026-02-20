'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

export default function MerchantsPage() {
  const businessTypes = ['Spaza Shop', 'Supermarket', 'Pharmacy', 'Restaurant', 'Transport', 'Other'];

  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: '',
    registrationNumber: '',
    taxNumber: '',
    physicalAddress: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    accountHolderName: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const resolvedRole = String(role ?? user.user_metadata?.role ?? '').toLowerCase();
    if (resolvedRole && resolvedRole !== 'merchant') {
      router.replace('/shop');
      return;
    }

    if (resolvedRole === 'merchant') {
      router.replace('/merchant/dashboard');
    }
  }, [authLoading, user, role, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return null;
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      const passwordError = validatePassword(formData.password);
      if (passwordError) throw new Error(passwordError);

      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
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

      if (signUpError) {
        if (
          signUpError.message?.toLowerCase().includes('already') ||
          signUpError.status === 422 ||
          signUpError.message?.includes('User already registered')
        ) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        throw signUpError;
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
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          businessType: formData.businessType,
          registrationNumber: formData.registrationNumber,
          taxNumber: formData.taxNumber,
          physicalAddress: formData.physicalAddress,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          branchCode: formData.branchCode,
          accountHolderName: formData.accountHolderName,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit merchant onboarding.');

      setStatusMessage(
        `Onboarding submitted. Merchant status: ${result.status}. You can track payout status in your dashboard.`
      );

      setTimeout(() => {
        router.push('/merchant/dashboard');
      }, 2000);
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to submit merchant application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(32,178,170,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(255,122,0,0.18),_transparent_50%),#f8fafc]">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto grid xl:grid-cols-[1fr,1.2fr] gap-6 lg:gap-8">
          <section className="bg-card/85 backdrop-blur-sm border border-border rounded-2xl shadow-lg p-6 lg:p-8 h-fit xl:sticky xl:top-24">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-headline font-semibold text-primary uppercase tracking-[0.18em]">
              <Icon name="SparklesIcon" size={16} variant="solid" />
              Merchant Program
            </span>
            <h1 className="mt-5 font-headline font-bold text-3xl lg:text-4xl text-foreground leading-tight">
              Onboard your business in one secure flow
            </h1>
            <p className="mt-4 text-base lg:text-lg text-muted-foreground font-body leading-relaxed">
              Capture business, compliance, and payout details once. We create your merchant profile and route
              you to the dashboard after submission.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 xl:grid-cols-1 gap-3">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-headline text-sm font-semibold text-foreground">Fast setup</p>
                <p className="mt-1 text-xs text-muted-foreground font-body">Most merchants finish in under 7 minutes.</p>
              </div>
              <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4">
                <p className="font-headline text-sm font-semibold text-foreground">Payout ready</p>
                <p className="mt-1 text-xs text-muted-foreground font-body">
                  Banking details are submitted in the same session.
                </p>
              </div>
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                <p className="font-headline text-sm font-semibold text-foreground">Status tracking</p>
                <p className="mt-1 text-xs text-muted-foreground font-body">
                  Review and payout status are visible in your dashboard.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="font-headline font-semibold text-sm uppercase tracking-[0.14em] text-muted-foreground">
                What you need before you start
              </h2>
              <ul className="mt-4 space-y-3">
                {[
                  'Registered business name and tax number',
                  'Primary contact details for account ownership',
                  'Settlement bank account details',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground font-body">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15">
                      <Icon name="CheckIcon" size={14} variant="solid" className="text-success" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="border-b border-border bg-gradient-to-r from-primary/10 via-background to-secondary/10 px-6 py-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-headline font-bold text-2xl lg:text-3xl text-foreground">Merchant onboarding form</h2>
                  <p className="mt-1 text-sm text-muted-foreground font-body">
                    Fields marked with <span className="text-error">*</span> are required.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 border border-border">
                  <Icon name="ShieldCheckIcon" size={18} variant="solid" className="text-primary" />
                  <span className="text-xs font-headline font-semibold uppercase tracking-[0.14em] text-foreground">
                    Secure Session
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 lg:px-8 lg:py-8">
              {error && (
                <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start space-x-3">
                  <Icon
                    name="ExclamationCircleIcon"
                    size={20}
                    variant="solid"
                    className="text-error flex-shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-error font-body">{error}</p>
                </div>
              )}

              {statusMessage && (
                <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg flex items-start gap-3">
                  <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-success font-body">{statusMessage}</p>
                </div>
              )}

              <form onSubmit={handleFinalSubmit} className="space-y-8">
                <div>
                  <h3 className="font-headline text-lg font-semibold text-foreground">1. Business profile</h3>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="businessName" className="text-sm font-headline font-semibold text-foreground">
                        Business Name <span className="text-error">*</span>
                      </label>
                      <input
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Sipho's Spaza Shop"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="contactName" className="text-sm font-headline font-semibold text-foreground">
                        Contact Person <span className="text-error">*</span>
                      </label>
                      <input
                        id="contactName"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Sipho Ndlovu"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-headline font-semibold text-foreground">
                        Email Address <span className="text-error">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="merchant@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-headline font-semibold text-foreground">
                        Phone <span className="text-error">*</span>
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="0821234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="businessType" className="text-sm font-headline font-semibold text-foreground">
                        Business Type
                      </label>
                      <select
                        id="businessType"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      >
                        <option value="">Select your business type</option>
                        {businessTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="registrationNumber" className="text-sm font-headline font-semibold text-foreground">
                        Registration Number
                      </label>
                      <input
                        id="registrationNumber"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-headline font-semibold text-foreground">
                        Password <span className="text-error">*</span>
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Use 8+ chars with upper/lowercase + number"
                      />
                      <p className="text-xs text-muted-foreground font-body">
                        Must include at least 8 characters, one uppercase letter, one lowercase letter, and one number.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div>
                  <h3 className="font-headline text-lg font-semibold text-foreground">2. Compliance details</h3>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="taxNumber" className="text-sm font-headline font-semibold text-foreground">
                        Tax Number <span className="text-error">*</span>
                      </label>
                      <input
                        id="taxNumber"
                        name="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="e.g. 9999/123/45/6"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="physicalAddress" className="text-sm font-headline font-semibold text-foreground">
                        Physical Address <span className="text-error">*</span>
                      </label>
                      <textarea
                        id="physicalAddress"
                        name="physicalAddress"
                        value={formData.physicalAddress}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Street address, suburb, city"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div>
                  <h3 className="font-headline text-lg font-semibold text-foreground">3. Settlement account</h3>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="bankName" className="text-sm font-headline font-semibold text-foreground">
                        Bank Name <span className="text-error">*</span>
                      </label>
                      <input
                        id="bankName"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Bank name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="accountHolderName" className="text-sm font-headline font-semibold text-foreground">
                        Account Holder Name <span className="text-error">*</span>
                      </label>
                      <input
                        id="accountHolderName"
                        name="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Account holder"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="accountNumber" className="text-sm font-headline font-semibold text-foreground">
                        Account Number <span className="text-error">*</span>
                      </label>
                      <input
                        id="accountNumber"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Account number"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="branchCode" className="text-sm font-headline font-semibold text-foreground">
                        Branch Code <span className="text-error">*</span>
                      </label>
                      <input
                        id="branchCode"
                        name="branchCode"
                        value={formData.branchCode}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Branch code"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground font-body">
                  By submitting, you confirm these details are accurate and that you are authorized to onboard this
                  business.
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

              <p className="mt-6 text-sm text-center text-muted-foreground font-body">
                Already onboarded?
                <Link href="/merchant/login" className="ml-1 font-semibold text-primary hover:text-primary/80 transition-colors">
                  Sign in to your merchant account
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
