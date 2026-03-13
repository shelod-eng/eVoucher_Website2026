import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Search, MessageCircle, Phone, Mail, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const faqs = [
  { q: 'How do I buy a voucher?', a: 'Go to Shop, select a merchant, choose your voucher value, and complete payment using card, EFT, or wallet balance.' },
  { q: 'How do I redeem my voucher?', a: 'Open your Wallet, tap on the voucher you want to use, enter the amount, and show the confirmation to the cashier at the store.' },
  { q: 'What is the discount I receive?', a: 'You save 4% on every voucher purchase. For example, a R1,000 voucher costs only R960.' },
  { q: 'How do rewards tiers work?', a: 'The more you spend, the higher your tier. Bronze (R0-R1,999), Silver (R2,000-R4,999), Gold (R5,000-R9,999), Platinum (R10,000+). Higher tiers unlock bigger discounts.' },
  { q: 'Can I use partial voucher amounts?', a: 'Yes! You can redeem any amount from your voucher. The remaining balance stays in your wallet for future use.' },
  { q: 'How do I send a voucher to someone without a smartphone?', a: 'Use the "Send Gift" feature. Enter their phone number and they will receive the voucher code via SMS. They can redeem it at the store.' },
  { q: 'What is USSD access?', a: 'Dial *120*384# to access your eVoucher account without internet. You can check balance, view vouchers, and more.' }
];

export default function HelpSupportPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [message, setMessage] = useState('');

  return (
    <MobileContainer>
      <div className="pb-24">
        {/* Header */}
        <div className="bg-[#00A89D] pt-6 pb-6 px-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Profile')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">Help & Support</h1>
          </div>
        </div>

        <div className="px-4 pt-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder="Search for help..." className="pl-12 bg-gray-100 border-0 text-gray-900 h-12 rounded-xl" />
          </div>

          {/* Contact Options */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="bg-white border-gray-200 p-4 text-center cursor-pointer hover:border-[#00A89D] transition-colors rounded-xl">
              <MessageCircle className="w-6 h-6 text-[#00A89D] mx-auto mb-2" />
              <p className="text-gray-900 text-sm font-medium">Live Chat</p>
            </Card>
            <Card className="bg-white border-gray-200 p-4 text-center cursor-pointer hover:border-[#00A89D] transition-colors rounded-xl">
              <Phone className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-gray-900 text-sm font-medium">Call Us</p>
            </Card>
            <Card className="bg-white border-gray-200 p-4 text-center cursor-pointer hover:border-[#00A89D] transition-colors rounded-xl">
              <Mail className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-gray-900 text-sm font-medium">Email</p>
            </Card>
          </div>

          {/* USSD Help */}
          <Card className="bg-blue-50 border-blue-100 p-4 mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-blue-900 font-medium">Need help without internet?</p>
                <p className="text-blue-700 text-sm">Dial *120*384# and select "Help"</p>
              </div>
            </div>
          </Card>

          {/* FAQs */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#00A89D]" /> FAQs
            </h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <Card key={i} className="bg-white border-gray-200 overflow-hidden rounded-xl">
                  <button 
                    className="w-full p-4 flex items-center justify-between text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-gray-900 font-medium pr-4 text-sm">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-[#00A89D]" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-gray-600 text-sm border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Send Message */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Send us a message</h2>
            <Textarea 
              placeholder="Describe your issue..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-gray-50 border-gray-200 text-gray-900 mb-3 min-h-[100px] rounded-xl" 
            />
            <GoldButton className="w-full">Send Message</GoldButton>
          </div>
        </div>
      </div>
      <BottomNav activePage="Profile" />
    </MobileContainer>
  );
}