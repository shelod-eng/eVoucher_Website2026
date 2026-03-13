import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Phone, User, Gift, MessageSquare, Check, Send } from 'lucide-react';

export default function SendVoucher() {
  const [step, setStep] = useState(1);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.filter({ status: 'active' }),
  });

  const quickAmounts = [50, 100, 200, 500];

  const handleSend = async () => {
    setSending(true);
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSending(false);
    setSent(true);
  };

  if (sent) {
    return (
      <MobileContainer>
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Voucher Sent!</h1>
          <p className="text-gray-500 text-center mb-2">
            R{amount} voucher sent to {recipientName || recipientPhone}
          </p>
          <p className="text-gray-400 text-sm text-center mb-8">
            They will receive an SMS with the voucher code
          </p>
          <Link to={createPageUrl('ConsumerHome')} className="w-full">
            <GoldButton className="w-full h-12">Back to Home</GoldButton>
          </Link>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="pb-24">
        {/* Header */}
        <div className="bg-[#00A89D] pt-6 pb-6 px-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('ConsumerHome')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">Send Gift Voucher</h1>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-4 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-[#00A89D] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-[#00A89D]' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 px-2">
            <span>Recipient</span>
            <span>Amount</span>
            <span>Confirm</span>
          </div>
        </div>

        <div className="px-4 py-6">
          {/* Step 1: Recipient */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Who are you sending to?</h2>
              
              <div>
                <label className="text-sm text-gray-500 mb-2 block">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    placeholder="082 000 0000" 
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="pl-12 h-14 bg-gray-50 border-gray-200 text-gray-900" 
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">They'll receive the voucher via SMS</p>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block">Recipient Name (Optional)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    placeholder="Their name" 
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="pl-12 h-14 bg-gray-50 border-gray-200 text-gray-900" 
                  />
                </div>
              </div>

              <GoldButton 
                className="w-full h-12 mt-6" 
                onClick={() => setStep(2)}
                disabled={!recipientPhone}
              >
                Continue
              </GoldButton>
            </div>
          )}

          {/* Step 2: Amount & Merchant */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Choose voucher details</h2>
              
              <div>
                <label className="text-sm text-gray-500 mb-2 block">Select Store</label>
                <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
                  <SelectTrigger className="h-14 bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Choose a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block">Amount</label>
                <Input 
                  type="number" 
                  placeholder="Enter amount" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 text-xl text-center bg-gray-50 border-gray-200 text-gray-900" 
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-[#00A89D]/10 hover:text-[#00A89D]"
                  >
                    R{amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block">Personal Message (Optional)</label>
                <div className="relative">
                  <Textarea 
                    placeholder="Add a message..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-gray-50 border-gray-200 text-gray-900 min-h-[80px]" 
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <GoldButton variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                  Back
                </GoldButton>
                <GoldButton 
                  className="flex-1 h-12" 
                  onClick={() => setStep(3)}
                  disabled={!selectedMerchant || !amount}
                >
                  Continue
                </GoldButton>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Confirm & Send</h2>
              
              <Card className="bg-gray-50 rounded-xl p-4 border-0">
                <h3 className="font-medium text-gray-900 mb-3">Gift Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recipient</span>
                    <span className="text-gray-900">{recipientName || recipientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="text-gray-900">{recipientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Store</span>
                    <span className="text-gray-900">{merchants.find(m => m.id === selectedMerchant)?.name}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-900 font-medium">Voucher Amount</span>
                    <span className="text-gray-900 font-bold">R{amount}</span>
                  </div>
                </div>
              </Card>

              {message && (
                <Card className="bg-blue-50 rounded-xl p-4 border-0">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900 font-medium">Your Message</p>
                      <p className="text-sm text-blue-700">{message}</p>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="bg-orange-50 rounded-xl p-4 border-0">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> The recipient will receive an SMS with a voucher code they can use at {merchants.find(m => m.id === selectedMerchant)?.name}. No smartphone required!
                </p>
              </Card>

              <div className="flex gap-3 mt-6">
                <GoldButton variant="outline" className="flex-1 h-12" onClick={() => setStep(2)}>
                  Back
                </GoldButton>
                <GoldButton 
                  className="flex-1 h-12" 
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Send Gift
                    </>
                  )}
                </GoldButton>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav activePage="ConsumerWallet" />
    </MobileContainer>
  );
}