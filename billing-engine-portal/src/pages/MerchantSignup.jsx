import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, Store, Mail, Building2, Phone, MapPin, 
  CheckCircle2, Loader2, ArrowRight, Shield
} from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/67132f111_evoucher_logo.png";

export default function MerchantSignup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    address: '',
    contactPerson: '',
    registrationNumber: '',
  });
  const [verificationSent, setVerificationSent] = useState(false);

  const signupMutation = useMutation({
    mutationFn: async (data) => {
      // Create merchant with pending status
      const merchant = await base44.entities.Merchant.create({
        ...data,
        status: 'pending',
        totalRevenue: 0,
        totalRedemptions: 0,
        verificationCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
      });
      
      // Send verification email
      await base44.integrations.Core.SendEmail({
        to: data.email,
        subject: 'Welcome to eVoucher - Verify Your Merchant Account',
        body: `
          <h2>Welcome to eVoucher, ${data.name}!</h2>
          <p>Thank you for registering as a merchant partner.</p>
          <p>Your verification code is: <strong>${merchant.verificationCode}</strong></p>
          <p>Please complete your profile setup to start accepting vouchers.</p>
          <br/>
          <p>Best regards,<br/>The eVoucher Team</p>
        `
      });
      
      return merchant;
    },
    onSuccess: () => {
      setVerificationSent(true);
      setStep(3);
    },
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    signupMutation.mutate(formData);
  };

  const isStep1Valid = formData.name && formData.email && formData.phone;
  const isStep2Valid = formData.category && formData.contactPerson;

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-b from-[#00A89D]/10 to-white">
        {/* Header */}
        <div className="bg-[#00A89D] pt-6 pb-12 px-4 rounded-b-[32px]">
          <div className="flex items-center gap-3 mb-6">
            <Link to={createPageUrl('Landing')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Become a Partner</h1>
              <p className="text-white/80 text-sm">Join the eVoucher network</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${step >= s ? 'bg-white text-[#00A89D]' : 'bg-white/30 text-white'}`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-1 rounded ${step > s ? 'bg-white' : 'bg-white/30'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="px-4 -mt-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card className="bg-white rounded-2xl p-6 shadow-lg border-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#00A89D]/10 flex items-center justify-center">
                  <Store className="w-6 h-6 text-[#00A89D]" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Business Details</h2>
                  <p className="text-sm text-gray-500">Tell us about your business</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Business Name *</label>
                  <Input
                    placeholder="e.g., ABC Grocery Store"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Business Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="business@email.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="0XX XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Business Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Street address, city"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>

                <GoldButton 
                  className="w-full h-12 mt-4" 
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid}
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </GoldButton>
              </div>
            </Card>
          )}

          {/* Step 2: Business Category */}
          {step === 2 && (
            <Card className="bg-white rounded-2xl p-6 shadow-lg border-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Business Category</h2>
                  <p className="text-sm text-gray-500">Help customers find you</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Category *</label>
                  <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail Store</SelectItem>
                      <SelectItem value="grocery">Grocery / Supermarket</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="fashion">Fashion & Clothing</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Contact Person *</label>
                  <Input
                    placeholder="Full name of primary contact"
                    value={formData.contactPerson}
                    onChange={(e) => updateField('contactPerson', e.target.value)}
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Registration Number</label>
                  <Input
                    placeholder="Company registration (optional)"
                    value={formData.registrationNumber}
                    onChange={(e) => updateField('registrationNumber', e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <GoldButton variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                    Back
                  </GoldButton>
                  <GoldButton 
                    className="flex-1 h-12" 
                    onClick={handleSubmit}
                    disabled={!isStep2Valid || signupMutation.isPending}
                  >
                    {signupMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Submit <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </GoldButton>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Verification Sent */}
          {step === 3 && (
            <Card className="bg-white rounded-2xl p-6 shadow-lg border-0 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Email Sent!</h2>
              <p className="text-gray-500 mb-6">
                We've sent a verification email to <strong>{formData.email}</strong>. 
                Please check your inbox and follow the instructions.
              </p>
              
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Next Steps</span>
                </div>
                <ol className="text-sm text-blue-700 text-left space-y-1">
                  <li>1. Verify your email address</li>
                  <li>2. Complete bank details setup</li>
                  <li>3. Upload your logo & branding</li>
                  <li>4. Start accepting eVouchers!</li>
                </ol>
              </div>

              <Link to={createPageUrl('MerchantOnboarding') + `?email=${encodeURIComponent(formData.email)}`}>
                <GoldButton className="w-full h-12">
                  Continue Setup <ArrowRight className="w-4 h-4 ml-2" />
                </GoldButton>
              </Link>
              
              <Link to={createPageUrl('Landing')} className="block mt-3">
                <GoldButton variant="outline" className="w-full h-12">
                  Back to Home
                </GoldButton>
              </Link>
            </Card>
          )}

          {/* Benefits */}
          {step < 3 && (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium text-gray-700 text-center">Why join eVoucher?</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border text-center">
                  <p className="text-2xl font-bold text-[#00A89D]">92%</p>
                  <p className="text-xs text-gray-500">Payout on vouchers</p>
                </div>
                <div className="bg-white rounded-xl p-3 border text-center">
                  <p className="text-2xl font-bold text-[#00A89D]">0</p>
                  <p className="text-xs text-gray-500">Setup fees</p>
                </div>
                <div className="bg-white rounded-xl p-3 border text-center">
                  <p className="text-2xl font-bold text-[#00A89D]">24h</p>
                  <p className="text-xs text-gray-500">Settlement time</p>
                </div>
                <div className="bg-white rounded-xl p-3 border text-center">
                  <p className="text-2xl font-bold text-[#00A89D]">Free</p>
                  <p className="text-xs text-gray-500">POS terminal</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileContainer>
  );
}