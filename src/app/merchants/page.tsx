'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

type MerchantType = 'chain' | 'private';

type OnboardingStatus = {
  merchantId: string;
  businessName: string;
  email: string;
  merchantType: MerchantType;
  status: string;
  vettingStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  credentialsIssued: boolean;
  mustResetPassword?: boolean;
};

const businessTypes = ['Spaza Shop', 'Supermarket', 'Pharmacy', 'Restaurant', 'Transport', 'Other'];

export const dynamic = 'force-dynamic';

export default function MerchantsPage() {
  const [merchantType, setMerchantType] = useState<MerchantType>('private');
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: 'Pharmacy',
    registrationNumber: '',
    taxNumber: '',
    physicalAddress: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    accountHolderName: '',
    pharmacyLicenseNumber: '',
    responsiblePharmacistName: '',
    ownerIdNumber: '',
    proofOfPremises: '',
    discountPercentage: '5',
  });
  const [emailToken, setEmailToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [statusData, setStatusData] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [debugData, setDebugData] = useState<Record<string, string> | null>(null);

  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const resolvedRole = String(role ?? user.user_metadata?.role ?? '').toLowerCase();
    if (resolvedRole === 'merchant' && !Boolean(user.user_metadata?.must_change_password)) {
      router.replace('/merchant/dashboard');
    }
  }, [authLoading, user, role, router]);

  const modeLabel = useMemo(
    () => (merchantType === 'private' ? 'Private Merchant (Kalapeng-style)' : 'Chain Merchant'),
    [merchantType]
  );

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const loadStatus = async (targetMerchantId?: string) => {
    const id = String(targetMerchantId ?? merchantId).trim();
    if (!id) return;
    const response = await fetch(`/api/v1/merchant/onboarding/status?merchantId=${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to fetch onboarding status.');
    setStatusData(result);
    return result as OnboardingStatus;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const merchantIdFromQuery = String(new URLSearchParams(window.location.search).get('merchantId') ?? '').trim();
    if (!merchantIdFromQuery) return;
    setMerchantId(merchantIdFromQuery);
    void loadStatus(merchantIdFromQuery).catch(() => undefined);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStatusMessage('');
    setDebugData(null);
    setStatusData(null);
    setMerchantId('');

    const discount = Number(formData.discountPercentage);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      setError('Discount percentage must be between 0 and 100.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/merchant/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          merchantType,
          discountPercentage: discount,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit merchant onboarding.');
      }

      setMerchantId(result.merchantId);
      setStatusMessage(
        'Onboarding submitted. Check your email for a verification link and your phone for the SMS OTP.'
      );
      if (result.debug) {
        setDebugData(result.debug);
      }
      await loadStatus(result.merchantId);
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to submit merchant onboarding.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailToken = async () => {
    if (!merchantId || !emailToken.trim()) {
      setError('Enter both merchant ID flow and email token to verify.');
      return;
    }
    setVerifyingEmail(true);
    setError('');
    setStatusMessage('');
    try {
      const response = await fetch('/api/v1/merchant/onboarding/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          token: emailToken.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to verify email token.');
      setStatusMessage(result.message || 'Email verified.');
      if (result.debug) setDebugData((prev) => ({ ...(prev ?? {}), ...result.debug }));
      await loadStatus();
    } catch (verifyError: any) {
      setError(verifyError?.message || 'Failed to verify email token.');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!merchantId || !otpCode.trim()) {
      setError('Enter the SMS OTP to continue.');
      return;
    }
    setVerifyingOtp(true);
    setError('');
    setStatusMessage('');
    try {
      const response = await fetch('/api/v1/merchant/onboarding/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          otpCode: otpCode.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to verify SMS OTP.');
      setStatusMessage(result.message || 'OTP verified.');
      if (result.debug) setDebugData((prev) => ({ ...(prev ?? {}), ...result.debug }));
      await loadStatus();
    } catch (verifyError: any) {
      setError(verifyError?.message || 'Failed to verify SMS OTP.');
    } finally {
      setVerifyingOtp(false);
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
              Onboard your business with verification and auto-vetting
            </h1>
            <p className="mt-4 text-base lg:text-lg text-muted-foreground font-body leading-relaxed">
              Supports both major chains and private merchants like Kalapeng. Approval issues temporary credentials
              and forces a secure password change on first login.
            </p>

            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-headline font-semibold text-foreground">Selected flow: {modeLabel}</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground font-body">
                <li>1. Submit registration + compliance details.</li>
                <li>2. Confirm email token and SMS OTP.</li>
                <li>3. Auto-vetting applies merchant-type rules.</li>
                <li>4. Approved merchants receive email + temporary password.</li>
              </ul>
            </div>

            <div className="mt-6 text-sm font-body text-muted-foreground">
              Already approved?
              <Link href="/merchant/login" className="ml-1 font-semibold text-primary hover:text-primary/80 transition-colors">
                Sign in to merchant portal
              </Link>
            </div>
          </section>

          <section className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="border-b border-border bg-gradient-to-r from-primary/10 via-background to-secondary/10 px-6 py-6 lg:px-8">
              <h2 className="font-headline font-bold text-2xl lg:text-3xl text-foreground">Merchant onboarding form</h2>
              <p className="mt-1 text-sm text-muted-foreground font-body">
                Required fields change by merchant type to support both chain and private merchants.
              </p>
            </div>

            <div className="px-6 py-6 lg:px-8 lg:py-8">
              {error && (
                <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start space-x-3">
                  <Icon name="ExclamationCircleIcon" size={20} variant="solid" className="text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error font-body">{error}</p>
                </div>
              )}

              {statusMessage && (
                <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg flex items-start gap-3">
                  <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-success font-body">{statusMessage}</p>
                </div>
              )}

              <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-border p-2 bg-muted/40">
                <button
                  type="button"
                  onClick={() => setMerchantType('private')}
                  className={`rounded-lg px-4 py-2 text-sm font-headline font-semibold transition-colors ${
                    merchantType === 'private'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Private Merchant
                </button>
                <button
                  type="button"
                  onClick={() => setMerchantType('chain')}
                  className={`rounded-lg px-4 py-2 text-sm font-headline font-semibold transition-colors ${
                    merchantType === 'chain'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Chain Merchant
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <h3 className="font-headline text-lg font-semibold text-foreground">1. Business profile</h3>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <input
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Business Name *"
                    />
                    <input
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Contact Person *"
                    />
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Email *"
                    />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Phone *"
                    />
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                    >
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      name="discountPercentage"
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={formData.discountPercentage}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Discount Offered (%) *"
                    />
                  </div>
                </div>

                <div className="h-px bg-border" />

                {merchantType === 'private' ? (
                  <div>
                    <h3 className="font-headline text-lg font-semibold text-foreground">2. Private merchant compliance</h3>
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <input
                        name="pharmacyLicenseNumber"
                        value={formData.pharmacyLicenseNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Pharmacy License Number *"
                      />
                      <input
                        name="responsiblePharmacistName"
                        value={formData.responsiblePharmacistName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Responsible Pharmacist *"
                      />
                      <input
                        name="ownerIdNumber"
                        value={formData.ownerIdNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Owner/Representative ID Number *"
                      />
                      <input
                        name="proofOfPremises"
                        value={formData.proofOfPremises}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Proof of Premises (optional URL/ref)"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-headline text-lg font-semibold text-foreground">2. Chain merchant compliance</h3>
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <input
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="Company Registration Number *"
                      />
                      <input
                        name="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                        placeholder="VAT / Tax Number *"
                      />
                    </div>
                  </div>
                )}

                <div className="h-px bg-border" />

                <div>
                  <h3 className="font-headline text-lg font-semibold text-foreground">3. Settlement account</h3>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <input
                      name="physicalAddress"
                      value={formData.physicalAddress}
                      onChange={handleChange}
                      required
                      className="md:col-span-2 w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Physical Address *"
                    />
                    <input
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Bank Name *"
                    />
                    <input
                      name="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Account Holder Name *"
                    />
                    <input
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                      placeholder="Account Number *"
                    />
                    <input
                      name="branchCode"
                      value={formData.branchCode}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-border rounded-lg font-body bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
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

              {merchantId && (
                <div className="mt-8 border-t border-border pt-6">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="font-headline text-lg font-semibold text-foreground">4. Verification</h3>
                    <button
                      type="button"
                      onClick={() => void loadStatus()}
                      className="text-sm font-headline font-semibold text-primary hover:text-primary/80"
                    >
                      Refresh Status
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-body">Merchant ID: {merchantId}</p>

                  <div className="mt-4 grid gap-4">
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-sm font-headline font-semibold text-foreground">Email Confirmation</p>
                      <p className="mt-1 text-xs text-muted-foreground font-body">
                        Use the link in your email or paste the token below.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <input
                          value={emailToken}
                          onChange={(event) => setEmailToken(event.target.value)}
                          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-body bg-background"
                          placeholder="Paste email token (optional)"
                        />
                        <button
                          type="button"
                          onClick={() => void handleVerifyEmailToken()}
                          disabled={verifyingEmail}
                          className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-headline font-semibold disabled:opacity-50"
                        >
                          {verifyingEmail ? 'Verifying...' : 'Verify Email'}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-sm font-headline font-semibold text-foreground">SMS OTP</p>
                      <p className="mt-1 text-xs text-muted-foreground font-body">
                        Enter the 6-digit OTP sent to your registered phone.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <input
                          value={otpCode}
                          onChange={(event) => setOtpCode(event.target.value)}
                          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-body bg-background"
                          placeholder="Enter OTP code"
                        />
                        <button
                          type="button"
                          onClick={() => void handleVerifyOtp()}
                          disabled={verifyingOtp}
                          className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-headline font-semibold disabled:opacity-50"
                        >
                          {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>
                    </div>

                    {statusData && (
                      <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-sm font-headline font-semibold text-foreground">Onboarding Status</p>
                        <div className="mt-2 grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground font-body">
                          <p>Email Verified: {statusData.emailVerified ? 'Yes' : 'No'}</p>
                          <p>Phone Verified: {statusData.phoneVerified ? 'Yes' : 'No'}</p>
                          <p>Workflow Status: {statusData.status}</p>
                          <p>Vetting Status: {statusData.vettingStatus}</p>
                        </div>
                        {statusData.status === 'approved' && (
                          <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20">
                            <p className="text-sm text-success font-headline font-semibold">
                              Approved. Login credentials were sent to your email.
                            </p>
                            <Link
                              href="/merchant/login"
                              className="inline-block mt-2 text-sm font-headline font-semibold text-success hover:underline"
                            >
                              Continue to Merchant Login
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    {debugData && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                        <p className="text-xs font-headline font-semibold text-amber-900 uppercase tracking-wide">
                          Dev Debug (remove in production)
                        </p>
                        <pre className="mt-2 text-xs text-amber-900 whitespace-pre-wrap break-all">
                          {JSON.stringify(debugData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
