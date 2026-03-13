import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Building2, CreditCard, Palette, CheckCircle2, 
  Loader2, ArrowRight, Upload, Store, Sparkles
} from 'lucide-react';

export default function MerchantOnboarding() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [merchantId, setMerchantId] = useState(null);
  
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    branchCode: '',
    accountType: 'cheque',
  });
  
  const [branding, setBranding] = useState({
    logo: '',
    primaryColor: '#00A89D',
    description: '',
  });

  // Get email from URL
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');

  // Fetch merchant by email
  const { data: merchants = [] } = useQuery({
    queryKey: ['merchant-by-email', email],
    queryFn: () => base44.entities.Merchant.filter({ email }),
    enabled: !!email,
  });

  const merchant = merchants[0];

  useEffect(() => {
    if (merchant) {
      setMerchantId(merchant.id);
      if (merchant.bankName) {
        setBankDetails({
          bankName: merchant.bankName,
          accountNumber: merchant.accountNumber || '',
          branchCode: merchant.branchCode || '',
          accountType: 'cheque',
        });
      }
      if (merchant.logo) {
        setBranding(prev => ({ ...prev, logo: merchant.logo }));
      }
    }
  }, [merchant]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Merchant.update(merchantId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['merchant-by-email']);
    },
  });

  const handleBankSubmit = () => {
    updateMutation.mutate(bankDetails, {
      onSuccess: () => setStep(2),
    });
  };

  const handleBrandingSubmit = () => {
    updateMutation.mutate({
      logo: branding.logo,
      description: branding.description,
      status: 'active',
    }, {
      onSuccess: () => setStep(3),
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBranding(prev => ({ ...prev, logo: file_url }));
    }
  };

  const isBankValid = bankDetails.bankName && bankDetails.accountNumber && bankDetails.branchCode;

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 pt-6 pb-12 px-4 rounded-b-[32px]">
          <div className="flex items-center gap-3 mb-6">
            <Link to={createPageUrl('Landing')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Complete Your Setup</h1>
              <p className="text-white/80 text-sm">{merchant?.name || 'Merchant Onboarding'}</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2">
            {[
              { num: 1, label: 'Bank' },
              { num: 2, label: 'Brand' },
              { num: 3, label: 'Done' },
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto
                    ${step >= s.num ? 'bg-white text-purple-600' : 'bg-white/30 text-white'}`}>
                    {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                  </div>
                  <p className="text-xs text-white/80 mt-1">{s.label}</p>
                </div>
                {idx < 2 && <div className={`w-10 h-1 rounded ${step > s.num ? 'bg-white' : 'bg-white/30'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="px-4 -mt-6">
          {/* Step 1: Bank Details */}
          {step === 1 && (
            <Card className="bg-white rounded-2xl p-6 shadow-lg border-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Bank Details</h2>
                  <p className="text-sm text-gray-500">For receiving payouts</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Bank Name *</label>
                  <Input
                    placeholder="e.g., Standard Bank"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Account Number *</label>
                  <Input
                    placeholder="Your bank account number"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Branch Code *</label>
                  <Input
                    placeholder="e.g., 051001"
                    value={bankDetails.branchCode}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, branchCode: e.target.value }))}
                    className="h-12"
                  />
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Secure:</strong> Your bank details are encrypted and stored securely. 
                    Payouts are processed within 24 hours of voucher redemption.
                  </p>
                </div>

                <GoldButton 
                  className="w-full h-12 mt-4" 
                  onClick={handleBankSubmit}
                  disabled={!isBankValid || updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </GoldButton>
              </div>
            </Card>
          )}

          {/* Step 2: Branding */}
          {step === 2 && (
            <Card className="bg-white rounded-2xl p-6 shadow-lg border-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Your Brand</h2>
                  <p className="text-sm text-gray-500">Make your store stand out</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Logo Upload */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Business Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                      {branding.logo ? (
                        <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Store className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        <div className="flex items-center gap-2 text-[#00A89D] font-medium">
                          <Upload className="w-4 h-4" />
                          Upload Logo
                        </div>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Business Description</label>
                  <textarea
                    placeholder="Tell customers about your business..."
                    value={branding.description}
                    onChange={(e) => setBranding(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full h-24 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#00A89D]"
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <GoldButton variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                    Back
                  </GoldButton>
                  <GoldButton 
                    className="flex-1 h-12" 
                    onClick={handleBrandingSubmit}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Complete <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </GoldButton>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <Card className="bg-white rounded-2xl p-6 shadow-lg border-0 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">You're All Set!</h2>
              <p className="text-gray-500 mb-6">
                Your merchant account is now active. Start accepting eVouchers today!
              </p>
              
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-purple-800 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">What's Next?</span>
                </div>
                <ul className="text-sm text-purple-700 text-left space-y-1">
                  <li>• Access your POS terminal to scan vouchers</li>
                  <li>• Create voucher products for your store</li>
                  <li>• Track sales and payouts in real-time</li>
                </ul>
              </div>

              <Link to={createPageUrl('MerchantPortal') + `?id=${merchantId}`}>
                <GoldButton className="w-full h-12">
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </GoldButton>
              </Link>
              
              <Link to={createPageUrl('MerchantPOS') + `?merchant=${merchantId}`} className="block mt-3">
                <GoldButton variant="outline" className="w-full h-12">
                  Open POS Terminal
                </GoldButton>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </MobileContainer>
  );
}