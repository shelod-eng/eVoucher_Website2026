'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';

export default function ConsumerPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    idNumber: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.idNumber && formData.idNumber.length !== 13) {
      setError('ID number must be 13 digits');
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone,
        id_number: formData.idNumber,
        role: 'customer',
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/customer/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
        <Header />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-2xl shadow-2xl p-12 border-2 border-success text-center">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="CheckCircleIcon" size={48} variant="solid" className="text-success" />
              </div>
              <h1 className="font-headline font-bold text-3xl text-foreground mb-4">
                Welcome to eVoucher!
              </h1>
              <p className="font-body text-lg text-muted-foreground mb-6">
                Your account has been created successfully. You can now start saving with dignity.
              </p>
              <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
                <p className="font-body text-sm text-muted-foreground mb-2">
                  Access anytime via USSD
                </p>
                <p className="font-accent text-3xl font-bold text-primary">*134*2468#</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Welcome & Trust Building */}
            <div className="space-y-8">
              <div>
                <h1 className="font-headline font-bold text-5xl text-foreground mb-4">
                  Register as a Customer
                </h1>
                <p className="font-body text-xl text-muted-foreground leading-relaxed">
                  Join thousands of South Africans saving money with dignity. No barriers, no
                  judgment, just real savings.
                </p>
              </div>

              {/* USSD Accessibility Card */}
              <div className="bg-card rounded-2xl p-8 shadow-lg border-2 border-primary">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="bg-primary/10 p-3 rounded-xl flex-shrink-0">
                    <Icon
                      name="DevicePhoneMobileIcon"
                      size={32}
                      variant="solid"
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-xl text-foreground mb-2">
                      No Smartphone? No Problem
                    </h3>
                    <p className="font-body text-muted-foreground">
                      Access your vouchers from any phone using USSD
                    </p>
                  </div>
                </div>
                <div className="bg-primary/5 rounded-xl p-6 text-center">
                  <p className="font-body text-sm text-muted-foreground mb-2">
                    Dial this code from any phone
                  </p>
                  <p className="font-accent text-4xl font-bold text-primary mb-2">*134*2468#</p>
                  <p className="font-body text-xs text-muted-foreground">
                    No data required • Works on any network
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <h3 className="font-headline font-semibold text-xl text-foreground">
                  What You Get:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-success/10 p-2 rounded-lg flex-shrink-0">
                      <Icon
                        name="CurrencyDollarIcon"
                        size={20}
                        variant="solid"
                        className="text-success"
                      />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-foreground">
                        10-15% Savings
                      </h4>
                      <p className="font-body text-sm text-muted-foreground">
                        Real discounts at trusted merchants
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-success/10 p-2 rounded-lg flex-shrink-0">
                      <Icon
                        name="ShieldCheckIcon"
                        size={20}
                        variant="solid"
                        className="text-success"
                      />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-foreground">Safe & Secure</h4>
                      <p className="font-body text-sm text-muted-foreground">
                        Government-aligned and protected
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-success/10 p-2 rounded-lg flex-shrink-0">
                      <Icon
                        name="UserGroupIcon"
                        size={20}
                        variant="solid"
                        className="text-success"
                      />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-foreground">
                        Community Support
                      </h4>
                      <p className="font-body text-sm text-muted-foreground">
                        Help from real people who care
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="bg-card rounded-2xl shadow-2xl p-8 border-2 border-border">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="UserPlusIcon" size={32} variant="solid" className="text-primary" />
                </div>
                <h2 className="font-headline font-bold text-2xl text-foreground mb-2">
                  Create Your Account
                </h2>
                <p className="text-muted-foreground font-body">
                  Quick and easy - takes less than 2 minutes
                </p>
              </div>

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

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-headline font-semibold text-foreground mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 font-body text-lg"
                    placeholder="Thandi Mkhize"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-headline font-semibold text-foreground mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 font-body text-lg"
                    placeholder="0821234567"
                  />
                </div>

                <div>
                  <label
                    htmlFor="idNumber"
                    className="block text-sm font-headline font-semibold text-foreground mb-2"
                  >
                    ID Number <span className="text-muted-foreground font-normal">(13 digits)</span>
                  </label>
                  <input
                    id="idNumber"
                    name="idNumber"
                    type="text"
                    value={formData.idNumber}
                    onChange={handleChange}
                    required
                    maxLength={13}
                    className="w-full px-4 py-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 font-body text-lg"
                    placeholder="9001015009087"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-headline font-semibold text-foreground mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 font-body text-lg"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-headline font-semibold text-foreground mb-2"
                  >
                    Create Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 font-body text-lg"
                    placeholder="At least 6 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-headline font-bold text-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
                >
                  {loading ? 'Creating your account...' : "Register Now - It's Free"}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted-foreground font-body">
                  Already have an account?{' '}
                  <Link
                    href="/customer/login"
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/support"
                  className="inline-flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Icon name="QuestionMarkCircleIcon" size={18} variant="outline" />
                  <span className="font-body">Need help? Get support</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
