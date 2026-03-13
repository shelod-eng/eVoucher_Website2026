'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface CustomerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerRegistrationModal({
  isOpen,
  onClose,
}: CustomerRegistrationModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    pin: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [userAlreadyExists, setUserAlreadyExists] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const hashPassword = async (password: string): Promise<string> => {
    // Simple hash for demo - in production use bcrypt or similar
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate PIN
    if (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    // Validate phone
    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            pin: formData.pin,
            role: 'customer',
          },
        },
      });

      if (authError) {
        console.error('Auth signup error:', authError);

        // Handle specific "User already registered" error
        if (
          authError.message?.includes('User already registered') ||
          authError.message?.includes('already been registered')
        ) {
          setError(
            'This email is already registered. Please sign in to your account or use a different email address.'
          );
          setLoading(false);
          setUserAlreadyExists(true);
          return;
        }

        throw authError;
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user returned');
      }

      console.log('Customer auth user created:', authData.user.id);
      console.log('Trigger automatically created user_profiles entry');

      // Generate referral code for display
      const referralCode = generateReferralCode();

      // Store user details for success display
      setUserDetails({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        loyaltyTier: 'Bronze',
        referralCode: referralCode,
        walletBalance: 0,
      });

      setSuccess(true);

      // Auto sign in after registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error('Auto sign-in error:', signInError);
      }

      setTimeout(() => {
        router.push('/customer/dashboard');
      }, 3000);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      pin: '',
    });
    setError('');
    setSuccess(false);
    setUserDetails(null);
    setUserAlreadyExists(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-border">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b-2 border-border px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="UserPlusIcon" size={24} variant="solid" className="text-primary" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-2xl text-foreground">Join as Customer</h2>
              <p className="text-sm text-muted-foreground">Start saving with dignity today</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Icon name="XMarkIcon" size={24} variant="solid" className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {success && userDetails ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="CheckCircleIcon" size={48} variant="solid" className="text-success" />
              </div>
              <h3 className="font-headline font-bold text-3xl text-foreground mb-4">
                Welcome to eVoucher!
              </h3>
              <p className="font-body text-lg text-muted-foreground mb-6">
                Your account has been created successfully. Redirecting to your dashboard...
              </p>

              {/* User Details Card */}
              <div className="bg-success/10 rounded-xl p-6 border border-success/20 mb-6">
                <p className="font-body text-sm text-muted-foreground mb-3">Account Details</p>
                <div className="space-y-2">
                  <p className="font-body text-base text-foreground">
                    <span className="font-semibold">Name:</span> {userDetails.fullName}
                  </p>
                  <p className="font-body text-base text-foreground">
                    <span className="font-semibold">Email:</span> {userDetails.email}
                  </p>
                  <p className="font-body text-base text-foreground">
                    <span className="font-semibold">Phone:</span> {userDetails.phone}
                  </p>
                  <p className="font-body text-base text-foreground">
                    <span className="font-semibold">Loyalty Tier:</span> {userDetails.loyaltyTier}
                  </p>
                  <p className="font-body text-base text-foreground">
                    <span className="font-semibold">Wallet Balance:</span> R{' '}
                    {userDetails.walletBalance}
                  </p>
                  <p className="font-body text-base text-foreground">
                    <span className="font-semibold">Referral Code:</span> {userDetails.referralCode}
                  </p>
                </div>
              </div>

              <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
                <p className="font-body text-sm text-muted-foreground mb-2">
                  Access anytime via USSD
                </p>
                <p className="font-accent text-3xl font-bold text-primary">*134*2468#</p>
              </div>
            </div>
          ) : (
            <>
              {/* Benefits */}
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 mb-6">
                <h3 className="font-headline font-semibold text-lg text-foreground mb-4">
                  What You Get:
                </h3>
                <div className="grid gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon
                        name="CurrencyDollarIcon"
                        size={16}
                        variant="solid"
                        className="text-success"
                      />
                    </div>
                    <p className="font-body text-sm text-foreground">
                      Up to 30% savings on essentials
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon
                        name="DevicePhoneMobileIcon"
                        size={16}
                        variant="solid"
                        className="text-success"
                      />
                    </div>
                    <p className="font-body text-sm text-foreground">
                      Works on any phone (smartphone or basic)
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon
                        name="ShieldCheckIcon"
                        size={16}
                        variant="solid"
                        className="text-success"
                      />
                    </div>
                    <p className="font-body text-sm text-foreground">
                      Safe, secure, and government-aligned
                    </p>
                  </div>
                </div>
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
                  {userAlreadyExists && (
                    <button
                      onClick={() => {
                        setUserAlreadyExists(false);
                        setError('');
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Sign In Instead
                    </button>
                  )}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-headline font-semibold text-foreground mb-2"
                  >
                    Full Name *
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
                    htmlFor="email"
                    className="block text-sm font-headline font-semibold text-foreground mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 font-body text-lg"
                    placeholder="thandi@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-headline font-semibold text-foreground mb-2"
                  >
                    Phone Number *
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
                    htmlFor="password"
                    className="block text-sm font-headline font-semibold text-foreground mb-2"
                  >
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 font-body text-lg"
                    placeholder="Min 8 characters, 1 uppercase, 1 number"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pin"
                    className="block text-sm font-headline font-semibold text-foreground mb-2"
                  >
                    4-Digit PIN *
                  </label>
                  <input
                    id="pin"
                    name="pin"
                    type="password"
                    value={formData.pin}
                    onChange={handleChange}
                    required
                    maxLength={4}
                    className="w-full px-4 py-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 font-body text-lg"
                    placeholder="1234"
                  />
                  <p className="text-xs text-muted-foreground mt-1">For USSD transactions</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-action text-action-foreground rounded-lg font-headline font-bold text-lg hover:bg-action/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-action-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
