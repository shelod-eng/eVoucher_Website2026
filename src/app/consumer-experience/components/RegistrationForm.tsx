'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    pin: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      // Create email from phone number for Supabase Auth requirement
      const email = `${formData.phone}@evoucher.local`;
      const password = formData.pin + formData.phone.slice(-6); // Combine PIN + last 6 digits of phone

      await signUp(email, password, {
        full_name: formData.fullName,
        phone: formData.phone,
        pin: formData.pin,
        role: 'customer',
        acquisition_channel: 'web',
        primary_access_channel: 'ussd',
        consumer_segment: 'community',
        popia_consent: true,
        popia_consent_version: 'May2026',
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
      <section className="py-20 px-4 bg-gradient-to-br from-success/5 to-primary/5">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl shadow-2xl p-12 border-2 border-success text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="CheckCircleIcon" size={48} variant="solid" className="text-success" />
            </div>
            <h2 className="font-headline font-bold text-3xl text-foreground mb-4">
              Welcome to eVoucher!
            </h2>
            <p className="font-body text-lg text-muted-foreground mb-6">
              Your account has been created successfully. You can now start saving with dignity.
            </p>
            <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
              <p className="font-body text-sm text-muted-foreground mb-2">
                Access anytime via USSD
              </p>
              <p className="font-accent text-3xl font-bold text-primary">*120*384#</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="register" className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-headline font-bold text-4xl md:text-5xl text-foreground mb-4">
            Join as a Customer
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-2xl mx-auto">
            Create your account and start saving on essential goods today. Simple signup — name,
            phone, and PIN.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Benefits */}
          <div className="space-y-6">
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
                <p className="font-accent text-4xl font-bold text-primary mb-2">*120*384#</p>
                <p className="font-body text-xs text-muted-foreground">
                  No data required • Works on any network
                </p>
              </div>
            </div>

            {/* Benefits List */}
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-headline font-semibold text-xl text-foreground mb-6">
                What You Get:
              </h3>
              <div className="space-y-4">
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
                      Up to 30% Savings
                    </h4>
                    <p className="font-body text-sm text-muted-foreground">
                      Real discounts on groceries, airtime, transport
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
                      name="DevicePhoneMobileIcon"
                      size={20}
                      variant="solid"
                      className="text-success"
                    />
                  </div>
                  <div>
                    <h4 className="font-headline font-semibold text-foreground">
                      Works on Any Phone
                    </h4>
                    <p className="font-body text-sm text-muted-foreground">
                      Smartphone or basic phone — everyone included
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
              <h3 className="font-headline font-bold text-2xl text-foreground mb-2">
                Create Your Account
              </h3>
              <p className="text-muted-foreground font-body">
                Quick and easy — takes less than 1 minute
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
                  htmlFor="pin"
                  className="block text-sm font-headline font-semibold text-foreground mb-2"
                >
                  Create 4-Digit PIN
                </label>
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  value={formData.pin}
                  onChange={handleChange}
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 font-body text-lg text-center tracking-widest"
                  placeholder="••••"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use this PIN to access your account via USSD
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-action text-action-foreground rounded-xl font-headline font-bold text-lg hover:bg-action/90 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Icon name="ArrowPathIcon" size={20} variant="solid" className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <Icon name="UserPlusIcon" size={20} variant="solid" />
                    <span>Join Now</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                By joining, you agree to our terms and privacy policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
