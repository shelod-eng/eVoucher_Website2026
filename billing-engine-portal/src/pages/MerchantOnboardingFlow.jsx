import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, Building2, CreditCard, 
  FileText, HelpCircle, Upload, Info, AlertCircle, Sparkles, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 1, title: 'Business Info', icon: Building2, description: 'Tell us about your business' },
  { id: 2, title: 'Banking Details', icon: CreditCard, description: 'Where we send your payments' },
  { id: 3, title: 'Documents', icon: FileText, description: 'Verify your business' },
  { id: 4, title: 'Discount Offers', icon: Sparkles, description: 'Set up your voucher offers' },
  { id: 5, title: 'Redemption Setup', icon: Store, description: 'Configure redemption process' },
  { id: 6, title: 'Review', icon: CheckCircle2, description: 'Confirm and submit' }
];

const BUSINESS_CATEGORIES = [
  { value: 'retail', label: 'Retail Store', description: 'Physical or online retail' },
  { value: 'grocery', label: 'Grocery/Supermarket', description: 'Food and household items' },
  { value: 'pharmacy', label: 'Pharmacy', description: 'Medical supplies and prescriptions' },
  { value: 'fashion', label: 'Fashion & Apparel', description: 'Clothing and accessories' },
  { value: 'electronics', label: 'Electronics', description: 'Tech and gadgets' }
];

const BANKS = ['FNB', 'ABSA', 'Standard Bank', 'Nedbank', 'Capitec'];

export default function MerchantOnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Business Info
    businessName: '',
    tradingName: '',
    registrationNumber: '',
    category: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    
    // Step 2: Banking
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    branchCode: '',
    accountType: '',
    
    // Step 3: Documents
    businessRegistration: null,
    taxClearance: null,
    bankStatement: null,
    idDocument: null,
    
    // Step 4: Discount Offers
    discountPercentage: '8',
    minVoucherAmount: '100',
    maxVoucherAmount: '5000',
    voucherValidity: '90',
    
    // Step 5: Redemption Setup
    redemptionMethod: 'qr_code',
    offlineRedemption: true,
    multipleLocations: false,
    locationCount: '1',
    posIntegration: false
  });
  
  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      return await base44.integrations.Core.UploadFile({ file });
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Create merchant
      const merchant = await base44.entities.Merchant.create({
        name: formData.businessName,
        email: formData.email,
        category: formData.category,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        branchCode: formData.branchCode,
        status: 'pending',
        totalRevenue: 0,
        totalRedemptions: 0
      });

      // Create initial voucher product
      await base44.entities.VoucherProduct.create({
        merchantId: merchant.id,
        merchantName: formData.businessName,
        description: `${formData.businessName} Voucher - Save ${formData.discountPercentage}%`,
        faceValue: 1000,
        consumerPrice: 1000 * (1 - parseFloat(formData.discountPercentage) / 100),
        merchantPayout: 1000 * 0.92,
        platformMargin: 1000 * (parseFloat(formData.discountPercentage) / 100 - 0.04),
        status: 'pending'
      });

      // Send comprehensive welcome email
      await base44.integrations.Core.SendEmail({
        to: formData.email,
        subject: '🎉 Welcome to eVoucher - Next Steps',
        body: `Dear ${formData.businessName},

Thank you for joining eVoucher! We're excited to have you as a partner merchant.

📋 APPLICATION STATUS: Under Review
We'll review your application within 24-48 hours. Here's what happens next:

STEP 1: Verification (24-48 hours)
→ Our team reviews your documents
→ We verify your banking details
→ Compliance check is completed

STEP 2: Account Activation
→ You'll receive approval notification via email
→ Login credentials will be sent
→ Access to your merchant dashboard

STEP 3: Going Live
→ Set up your voucher products
→ Configure your POS/redemption system
→ Start accepting eVoucher payments

YOUR SETUP SUMMARY:
• Discount Offered: ${formData.discountPercentage}%
• Voucher Range: R${formData.minVoucherAmount} - R${formData.maxVoucherAmount}
• Redemption Method: ${formData.redemptionMethod === 'qr_code' ? 'QR Code Scanning' : 'Manual Code Entry'}
• Offline Support: ${formData.offlineRedemption ? 'Yes' : 'No'}

NEED HELP?
Visit our Merchant Portal for guides and support, or contact us at merchant-support@evoucher.co.za

We're here to help you succeed!

Best regards,
The eVoucher Team

P.S. Once approved, you'll be able to reach millions of South African consumers looking to save money at trusted merchants like you.`
      });

      // Send step-by-step guide email
      await base44.integrations.Core.SendEmail({
        to: formData.email,
        subject: '📚 Your eVoucher Merchant Guide',
        body: `Hi ${formData.businessName} Team,

While we review your application, here's everything you need to know about being an eVoucher merchant:

🎯 HOW IT WORKS:
1. Customers buy discounted vouchers through eVoucher app
2. They present voucher code or QR at your store
3. You scan/enter the code to validate and redeem
4. Customer pays the balance (if any)
5. You receive weekly payouts to your bank account

💰 YOUR EARNINGS:
• Customer buys R1000 voucher for R${1000 * (1 - parseFloat(formData.discountPercentage) / 100)}
• You receive R920 payout (92% of face value)
• Customer saves R${1000 * parseFloat(formData.discountPercentage) / 100}
• eVoucher facilitates the transaction

📱 REDEMPTION PROCESS:
${formData.redemptionMethod === 'qr_code' ? 
  `QR CODE METHOD:
• Customer shows QR code on their phone
• Scan with eVoucher merchant app or any QR scanner
• System validates voucher instantly
• Complete transaction` :
  `MANUAL CODE METHOD:
• Customer provides voucher code
• Enter code in merchant portal
• System validates and confirms
• Complete transaction`}

${formData.offlineRedemption ? 
  `✅ OFFLINE MODE ENABLED:
Your setup supports offline redemptions! Transactions sync automatically when connection is restored.` : ''}

🔐 SECURITY:
• All vouchers are cryptographically secured
• Real-time fraud detection
• Encrypted transactions
• POPIA compliant

📊 MERCHANT DASHBOARD:
Once approved, you'll have access to:
• Real-time sales analytics
• Customer demographics
• Redemption reports
• Payout tracking
• Performance insights

Stay tuned for your approval notification!

eVoucher Merchant Success Team`
      });
    }
  });

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    
    try {
      const result = await uploadMutation.mutateAsync(file);
      setUploadedFiles(prev => ({ ...prev, [field]: result.file_url }));
      setFormData(prev => ({ ...prev, [field]: result.file_url }));
      setErrors(prev => ({ ...prev, [field]: '' }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [field]: 'Upload failed. Please try again.' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.businessName) newErrors.businessName = 'Business name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.category) newErrors.category = 'Category is required';
      if (!formData.registrationNumber) newErrors.registrationNumber = 'Registration number is required';
    }
    
    if (step === 2) {
      if (!formData.bankName) newErrors.bankName = 'Bank name is required';
      if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!formData.branchCode) newErrors.branchCode = 'Branch code is required';
      if (!formData.accountHolderName) newErrors.accountHolderName = 'Account holder name is required';
      if (!formData.accountType) newErrors.accountType = 'Account type is required';
    }
    
    if (step === 3) {
      if (!formData.businessRegistration) newErrors.businessRegistration = 'Business registration required';
      if (!formData.taxClearance) newErrors.taxClearance = 'Tax clearance required';
      if (!formData.bankStatement) newErrors.bankStatement = 'Bank statement required';
      if (!formData.idDocument) newErrors.idDocument = 'ID document required';
    }
    
    if (step === 4) {
      if (!formData.discountPercentage) newErrors.discountPercentage = 'Discount percentage required';
      if (parseFloat(formData.discountPercentage) < 5 || parseFloat(formData.discountPercentage) > 20) {
        newErrors.discountPercentage = 'Discount must be between 5% and 20%';
      }
      if (!formData.minVoucherAmount) newErrors.minVoucherAmount = 'Minimum amount required';
      if (!formData.maxVoucherAmount) newErrors.maxVoucherAmount = 'Maximum amount required';
    }
    
    if (step === 5) {
      if (!formData.redemptionMethod) newErrors.redemptionMethod = 'Redemption method required';
      if (formData.multipleLocations && !formData.locationCount) {
        newErrors.locationCount = 'Number of locations required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (validateStep(5)) {
      await submitMutation.mutateAsync();
      setCurrentStep(7); // Success step
    }
  };

  const progress = (currentStep / 6) * 100;

  if (currentStep === 7) {
    return (
      <MobileContainer>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
            <p className="text-gray-600 mb-6">We'll review your application within 24-48 hours and send you an email.</p>
            <Link to={createPageUrl('Landing')}>
              <GoldButton className="w-full max-w-xs">
                Return to Home
              </GoldButton>
            </Link>
          </motion.div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00A89D] to-teal-600 pt-6 pb-16 px-4 rounded-b-[32px]">
          <div className="flex items-center justify-between mb-6">
            <Link to={createPageUrl('Landing')}>
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Store className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Merchant Onboarding</span>
            </div>
          </div>

          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white mb-1">
              {STEPS[currentStep - 1].title}
            </h1>
            <p className="text-white/80 text-sm">{STEPS[currentStep - 1].description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/80">
              <span>Step {currentStep} of 6</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-white text-[#00A89D]' :
                    isCurrent ? 'bg-white text-[#00A89D]' :
                    'bg-white/20 text-white/60'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-1 ${isCurrent ? 'text-white font-medium' : 'text-white/60'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-4 -mt-6">
          <Card className="bg-white rounded-3xl shadow-xl p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Business Information */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <TooltipProvider>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Your registered business name</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder="e.g., ABC Retail (Pty) Ltd"
                        className={errors.businessName ? 'border-red-500' : ''}
                      />
                      {errors.businessName && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.businessName}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="tradingName">Trading Name (Optional)</Label>
                      <Input
                        id="tradingName"
                        value={formData.tradingName}
                        onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                        placeholder="If different from business name"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="registrationNumber">Registration Number *</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">CIPC registration number</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        placeholder="2023/123456/07"
                        className={errors.registrationNumber ? 'border-red-500' : ''}
                      />
                      {errors.registrationNumber && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.registrationNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category">Business Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <div>
                                <p className="font-medium">{cat.label}</p>
                                <p className="text-xs text-gray-500">{cat.description}</p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.category}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="contact@business.com"
                          className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.email}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="0123456789"
                          className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Physical Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street address, city, postal code"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Business Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Tell us about your business..."
                        rows={3}
                      />
                    </div>
                  </TooltipProvider>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <div className="flex gap-2">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">Why we need this</p>
                        <p className="text-xs text-blue-700">
                          We use your business information to verify your identity and comply with financial regulations.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Banking Details */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <TooltipProvider>
                    <div>
                      <Label htmlFor="bankName">Bank Name *</Label>
                      <Select value={formData.bankName} onValueChange={(value) => setFormData({ ...formData, bankName: value })}>
                        <SelectTrigger className={errors.bankName ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {BANKS.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.bankName && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.bankName}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Must match registered business name</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                        placeholder="Account holder name"
                        className={errors.accountHolderName ? 'border-red-500' : ''}
                      />
                      {errors.accountHolderName && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.accountHolderName}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="accountType">Account Type *</Label>
                      <Select value={formData.accountType} onValueChange={(value) => setFormData({ ...formData, accountType: value })}>
                        <SelectTrigger className={errors.accountType ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business_cheque">Business Cheque</SelectItem>
                          <SelectItem value="business_savings">Business Savings</SelectItem>
                          <SelectItem value="current">Current Account</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.accountType && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.accountType}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="accountNumber">Account Number *</Label>
                        <Input
                          id="accountNumber"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          placeholder="1234567890"
                          className={errors.accountNumber ? 'border-red-500' : ''}
                        />
                        {errors.accountNumber && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.accountNumber}
                          </p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Label htmlFor="branchCode">Branch Code *</Label>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-4 h-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">6-digit branch code</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="branchCode"
                          value={formData.branchCode}
                          onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                          placeholder="123456"
                          maxLength={6}
                          className={errors.branchCode ? 'border-red-500' : ''}
                        />
                        {errors.branchCode && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.branchCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </TooltipProvider>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                    <div className="flex gap-2">
                      <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-900">
                        <p className="font-medium mb-1">Fast payouts</p>
                        <p className="text-xs text-green-700">
                          You'll receive your merchant payouts weekly via EFT to this account.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Documents */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <TooltipProvider>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label>Business Registration Certificate *</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">CIPC registration certificate (PDF)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                        uploadedFiles.businessRegistration ? 'border-green-500 bg-green-50' : 
                        errors.businessRegistration ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}>
                        <input
                          type="file"
                          id="businessRegistration"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileUpload('businessRegistration', e.target.files[0])}
                        />
                        <label htmlFor="businessRegistration" className="cursor-pointer">
                          {uploadedFiles.businessRegistration ? (
                            <div className="flex items-center justify-center gap-2 text-green-700">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="text-sm font-medium">Uploaded</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Click to upload</p>
                              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 10MB)</p>
                            </>
                          )}
                        </label>
                      </div>
                      {errors.businessRegistration && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.businessRegistration}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label>Tax Clearance Certificate *</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Valid SARS tax clearance</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                        uploadedFiles.taxClearance ? 'border-green-500 bg-green-50' : 
                        errors.taxClearance ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}>
                        <input
                          type="file"
                          id="taxClearance"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileUpload('taxClearance', e.target.files[0])}
                        />
                        <label htmlFor="taxClearance" className="cursor-pointer">
                          {uploadedFiles.taxClearance ? (
                            <div className="flex items-center justify-center gap-2 text-green-700">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="text-sm font-medium">Uploaded</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Click to upload</p>
                              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 10MB)</p>
                            </>
                          )}
                        </label>
                      </div>
                      {errors.taxClearance && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.taxClearance}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label>Bank Statement (Last 3 months) *</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Recent bank statement</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                        uploadedFiles.bankStatement ? 'border-green-500 bg-green-50' : 
                        errors.bankStatement ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}>
                        <input
                          type="file"
                          id="bankStatement"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload('bankStatement', e.target.files[0])}
                        />
                        <label htmlFor="bankStatement" className="cursor-pointer">
                          {uploadedFiles.bankStatement ? (
                            <div className="flex items-center justify-center gap-2 text-green-700">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="text-sm font-medium">Uploaded</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Click to upload</p>
                              <p className="text-xs text-gray-400 mt-1">PDF (max 10MB)</p>
                            </>
                          )}
                        </label>
                      </div>
                      {errors.bankStatement && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.bankStatement}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label>ID Document (Director/Owner) *</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">South African ID or passport</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                        uploadedFiles.idDocument ? 'border-green-500 bg-green-50' : 
                        errors.idDocument ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}>
                        <input
                          type="file"
                          id="idDocument"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileUpload('idDocument', e.target.files[0])}
                        />
                        <label htmlFor="idDocument" className="cursor-pointer">
                          {uploadedFiles.idDocument ? (
                            <div className="flex items-center justify-center gap-2 text-green-700">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="text-sm font-medium">Uploaded</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Click to upload</p>
                              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 10MB)</p>
                            </>
                          )}
                        </label>
                      </div>
                      {errors.idDocument && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.idDocument}
                        </p>
                      )}
                    </div>
                  </TooltipProvider>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
                    <div className="flex gap-2">
                      <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-purple-900">
                        <p className="font-medium mb-1">Secure document handling</p>
                        <p className="text-xs text-purple-700">
                          All documents are encrypted and stored securely. We comply with POPIA regulations.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Discount Offers */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <TooltipProvider>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="discountPercentage">Discount Percentage *</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Standard: 8% (5.6% to customer, 2.4% to platform)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <Input
                          id="discountPercentage"
                          type="number"
                          min="5"
                          max="20"
                          value={formData.discountPercentage}
                          onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                          className={errors.discountPercentage ? 'border-red-500' : ''}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                      {errors.discountPercentage && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.discountPercentage}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Customer saves {Math.round(parseFloat(formData.discountPercentage || 0) * 0.7 * 10) / 10}%, Platform gets {Math.round(parseFloat(formData.discountPercentage || 0) * 0.3 * 10) / 10}%
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="minVoucherAmount">Min Voucher Amount *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                          <Input
                            id="minVoucherAmount"
                            type="number"
                            min="50"
                            value={formData.minVoucherAmount}
                            onChange={(e) => setFormData({ ...formData, minVoucherAmount: e.target.value })}
                            className={`pl-8 ${errors.minVoucherAmount ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {errors.minVoucherAmount && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.minVoucherAmount}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="maxVoucherAmount">Max Voucher Amount *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                          <Input
                            id="maxVoucherAmount"
                            type="number"
                            min="100"
                            value={formData.maxVoucherAmount}
                            onChange={(e) => setFormData({ ...formData, maxVoucherAmount: e.target.value })}
                            className={`pl-8 ${errors.maxVoucherAmount ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {errors.maxVoucherAmount && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.maxVoucherAmount}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="voucherValidity">Voucher Validity Period</Label>
                      <Select value={formData.voucherValidity} onValueChange={(value) => setFormData({ ...formData, voucherValidity: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="60">60 Days</SelectItem>
                          <SelectItem value="90">90 Days (Recommended)</SelectItem>
                          <SelectItem value="180">180 Days</SelectItem>
                          <SelectItem value="365">1 Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Card className="bg-teal-50 border-teal-200 p-4">
                      <h4 className="font-semibold text-teal-900 mb-2">Example Calculation</h4>
                      <div className="space-y-1 text-sm text-teal-800">
                        <div className="flex justify-between">
                          <span>Voucher Face Value:</span>
                          <span className="font-medium">R1,000.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Customer Pays:</span>
                          <span className="font-medium text-green-600">R{(1000 * (1 - parseFloat(formData.discountPercentage || 8) / 100)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Merchant Receives:</span>
                          <span className="font-medium text-blue-600">R920.00 (92%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Customer Saves:</span>
                          <span className="font-medium text-orange-600">R{(1000 * parseFloat(formData.discountPercentage || 8) / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </Card>
                  </TooltipProvider>
                </motion.div>
              )}

              {/* Step 5: Redemption Setup */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label>Redemption Method *</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, redemptionMethod: 'qr_code' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.redemptionMethod === 'qr_code'
                            ? 'border-[#00A89D] bg-[#00A89D]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Sparkles className={`w-6 h-6 mx-auto mb-2 ${formData.redemptionMethod === 'qr_code' ? 'text-[#00A89D]' : 'text-gray-400'}`} />
                        <p className="font-medium text-sm">QR Code</p>
                        <p className="text-xs text-gray-500 mt-1">Scan & go</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, redemptionMethod: 'manual_code' })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.redemptionMethod === 'manual_code'
                            ? 'border-[#00A89D] bg-[#00A89D]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <FileText className={`w-6 h-6 mx-auto mb-2 ${formData.redemptionMethod === 'manual_code' ? 'text-[#00A89D]' : 'text-gray-400'}`} />
                        <p className="font-medium text-sm">Manual Code</p>
                        <p className="text-xs text-gray-500 mt-1">Type code</p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.offlineRedemption}
                        onChange={(e) => setFormData({ ...formData, offlineRedemption: e.target.checked })}
                        className="w-5 h-5 text-[#00A89D] rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Enable Offline Redemption</p>
                        <p className="text-xs text-gray-500">Accept vouchers without internet connection</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.multipleLocations}
                        onChange={(e) => setFormData({ ...formData, multipleLocations: e.target.checked })}
                        className="w-5 h-5 text-[#00A89D] rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Multiple Store Locations</p>
                        <p className="text-xs text-gray-500">Manage vouchers across different branches</p>
                      </div>
                    </label>

                    {formData.multipleLocations && (
                      <div>
                        <Label htmlFor="locationCount">Number of Locations</Label>
                        <Input
                          id="locationCount"
                          type="number"
                          min="1"
                          value={formData.locationCount}
                          onChange={(e) => setFormData({ ...formData, locationCount: e.target.value })}
                          placeholder="e.g., 5"
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.posIntegration}
                        onChange={(e) => setFormData({ ...formData, posIntegration: e.target.checked })}
                        className="w-5 h-5 text-[#00A89D] rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">POS System Integration</p>
                        <p className="text-xs text-gray-500">Connect with your existing point-of-sale</p>
                      </div>
                    </label>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex gap-2">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">Training & Support</p>
                        <p className="text-xs text-blue-700">
                          Once approved, we'll provide comprehensive training for your staff on the redemption process and merchant portal.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Review */}
              {currentStep === 6 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00A89D] to-teal-600 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Review Your Application</h2>
                    <p className="text-sm text-gray-600">Please confirm all details are correct</p>
                  </div>

                  <Card className="bg-gray-50 border-0 p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#00A89D]" />
                      Business Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Business Name:</span>
                        <span className="font-medium text-gray-900">{formData.businessName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registration #:</span>
                        <span className="font-medium text-gray-900">{formData.registrationNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium text-gray-900 capitalize">{formData.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{formData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium text-gray-900">{formData.phone}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-gray-50 border-0 p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#00A89D]" />
                      Banking Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bank:</span>
                        <span className="font-medium text-gray-900">{formData.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Holder:</span>
                        <span className="font-medium text-gray-900">{formData.accountHolderName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Number:</span>
                        <span className="font-medium text-gray-900">{formData.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Branch Code:</span>
                        <span className="font-medium text-gray-900">{formData.branchCode}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-gray-50 border-0 p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#00A89D]" />
                      Documents
                    </h3>
                    <div className="space-y-2 text-sm">
                      {Object.keys(uploadedFiles).map(key => (
                        <div key={key} className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="bg-gray-50 border-0 p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#00A89D]" />
                      Discount Offers
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-gray-900">{formData.discountPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Voucher Range:</span>
                        <span className="font-medium text-gray-900">R{formData.minVoucherAmount} - R{formData.maxVoucherAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Validity:</span>
                        <span className="font-medium text-gray-900">{formData.voucherValidity} days</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-gray-50 border-0 p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Store className="w-5 h-5 text-[#00A89D]" />
                      Redemption Setup
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium text-gray-900 capitalize">{formData.redemptionMethod.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Offline Support:</span>
                        <span className="font-medium text-gray-900">{formData.offlineRedemption ? 'Yes' : 'No'}</span>
                      </div>
                      {formData.multipleLocations && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Locations:</span>
                          <span className="font-medium text-gray-900">{formData.locationCount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">POS Integration:</span>
                        <span className="font-medium text-gray-900">{formData.posIntegration ? 'Requested' : 'Not Required'}</span>
                      </div>
                    </div>
                  </Card>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-900">
                        <p className="font-medium mb-1">Before you submit</p>
                        <p className="text-xs text-yellow-700">
                          Please ensure all information is accurate. Your application will be reviewed within 24-48 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
              {currentStep > 1 && (
                <GoldButton
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1"
                  disabled={submitMutation.isPending}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </GoldButton>
              )}
              
              {currentStep < 6 ? (
                <GoldButton
                  onClick={nextStep}
                  className="flex-1"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </GoldButton>
              ) : (
                <GoldButton
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </GoldButton>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MobileContainer>
  );
}