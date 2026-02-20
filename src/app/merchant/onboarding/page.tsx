'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function MerchantOnboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, role, signUp } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const resolvedRole = String(role ?? user.user_metadata?.role ?? '').toLowerCase();
    if (resolvedRole === 'merchant') {
      router.replace('/merchant/dashboard');
    } else if (resolvedRole) {
      router.replace('/shop');
    }
  }, [user, role, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBusinessDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create auth account
      await signUp(formData.email, formData.password, {
        full_name: formData.contactName,
        phone: formData.phone,
        role: 'merchant',
      });

      // Wait for auth to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the newly created user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Create merchant profile
        const { error: merchantError } = await supabase.from('merchants_2025_11_10_12_00').insert({
          business_name: formData.businessName,
          email: formData.email,
          phone: formData.phone,
          bank_name: formData.bankName,
          account_number: formData.accountNumber,
          branch_code: formData.branchCode,
          charity_donation_amount: 250.00,
        });

        if (merchantError) throw merchantError;
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-primary/5">
      <Header />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold ${
                      step >= s ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {s}
                    </div>
                    {s < 3 && <div className={`w-24 h-1 mx-2 ${
                      step > s ? 'bg-secondary' : 'bg-muted'
                    }`} />}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <h1 className="font-headline font-bold text-3xl text-foreground mb-2">
                  {step === 1 && 'Business Details'}
                  {step === 2 && 'Payment & Charity'}
                  {step === 3 && 'Application Complete'}
                </h1>
                <p className="text-muted-foreground font-body">
                  {step === 1 && 'Tell us about your business'}
                  {step === 2 && 'Complete onboarding fee and charity contribution'}
                  {step === 3 && 'Your application has been submitted'}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start space-x-3">
                <Icon name="ExclamationCircleIcon" size={20} variant="solid" className="text-error flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error font-body">{error}</p>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleBusinessDetails} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                      Business Name
                    </label>
                    <input
                      name="businessName"
                      type="text"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 font-body"
                      placeholder="Sipho's Spaza Shop"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                      Contact Name
                    </label>
                    <input
                      name="contactName"
                      type="text"
                      value={formData.contactName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 font-body"
                      placeholder="Sipho Ndlovu"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 font-body"
                      placeholder="business@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 font-body"
                      placeholder="0827654321"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 font-body"
                    placeholder="••••••••"
                  />
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-headline font-bold text-lg text-foreground mb-4">Bank Details</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                        Bank Name
                      </label>
                      <select
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 font-body"
                      >
                        <option value="">Select Bank</option>
                        <option value="Standard Bank">Standard Bank</option>
                        <option value="FNB">FNB</option>
                        <option value="Nedbank">Nedbank</option>
                        <option value="ABSA">ABSA</option>
                        <option value="Capitec">Capitec</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                        Account Number
                      </label>
                      <input
                        name="accountNumber"
                        type="text"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 font-body"
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-headline font-semibold text-foreground mb-2">
                        Branch Code
                      </label>
                      <input
                        name="branchCode"
                        type="text"
                        value={formData.branchCode}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 font-body"
                        placeholder="051001"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg font-headline font-semibold hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Continue to Payment
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handlePayment} className="space-y-6">
                <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-xl p-6 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-headline font-bold text-xl text-foreground">Onboarding Fee</h3>
                    <div className="text-right">
                      <p className="text-3xl font-headline font-bold text-secondary">R500</p>
                      <p className="text-sm text-muted-foreground font-body">One-time payment</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-sm text-muted-foreground font-body">
                    <Icon name="InformationCircleIcon" size={20} variant="solid" className="text-primary flex-shrink-0 mt-0.5" />
                    <p>This fee covers your merchant account setup, training materials, and first month of platform access.</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-success/10 to-accent/10 rounded-xl p-6 border border-success/20">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                      <Icon name="HeartIcon" size={24} variant="solid" className="text-success" />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg text-foreground">Charity Contribution</h3>
                      <p className="text-sm text-muted-foreground font-body">50% of your onboarding fee supports local communities</p>
                    </div>
                  </div>
                  <div className="bg-card rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-body text-muted-foreground">Your contribution:</span>
                      <span className="text-2xl font-headline font-bold text-success">R250</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-body mt-2">
                      Supports township development programs and community upliftment initiatives
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <Icon name="CreditCardIcon" size={24} variant="outline" className="text-primary" />
                      <h4 className="font-headline font-semibold text-foreground">Mock Payment (Demo Mode)</h4>
                    </div>
                    <p className="text-sm text-muted-foreground font-body">
                      This is a demonstration. No actual payment will be processed. Click "Complete Payment" to simulate successful payment and proceed to your dashboard.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 mb-6">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      className="w-5 h-5 text-secondary border-border rounded focus:ring-2 focus:ring-secondary"
                    />
                    <label htmlFor="terms" className="text-sm text-foreground font-body">
                      I agree to the terms and conditions and merchant partnership agreement
                    </label>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-card border border-border text-foreground rounded-lg font-headline font-semibold hover:bg-muted transition-all duration-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-lg font-headline font-semibold hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  >
                    {loading ? 'Processing...' : 'Complete Payment'}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon name="CheckCircleIcon" size={48} variant="solid" className="text-success" />
                </div>
                <h2 className="font-headline font-bold text-2xl text-foreground mb-4">
                  Application Submitted Successfully!
                </h2>
                <p className="text-muted-foreground font-body mb-8 max-w-md mx-auto">
                  Thank you for joining eVoucher! Your application is being reviewed. You will receive an email within 24-48 hours with your approval status.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => router.push('/merchant/login')}
                    className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg font-headline font-semibold hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Go to Merchant Login
                  </button>
                  <button
                    onClick={() => router.push('/homepage')}
                    className="w-full py-3 bg-card border border-border text-foreground rounded-lg font-headline font-semibold hover:bg-muted transition-all duration-300"
                  >
                    Return to Homepage
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
