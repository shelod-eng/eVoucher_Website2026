import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MobileContainer from '@/components/ui/MobileContainer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Gift, Store, ChevronRight, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import BottomNav from '@/components/navigation/BottomNav';

export default function MembershipCard() {
  const [brightness, setBrightness] = useState(1);

  const { data: profiles = [] } = useQuery({
    queryKey: ['consumerProfile'],
    queryFn: () => base44.entities.ConsumerProfile.list(),
  });

  const profile = profiles[0] || {
    fullName: 'eVoucher Member',
    email: 'member@evoucher.co.za',
    rewardsTier: 'bronze',
    membershipNumber: '0000000000000',
  };

  // Generate unique 13-digit membership number from user ID or email
  const membershipNumber = profile.membershipNumber || 
    profile.id?.replace(/[^0-9]/g, '').slice(0, 13).padEnd(13, '0') ||
    Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0');

  // Increase screen brightness for better scanning
  useEffect(() => {
    const originalBrightness = document.body.style.filter;
    document.body.style.filter = 'brightness(1.5)';
    
    return () => {
      document.body.style.filter = originalBrightness;
    };
  }, []);

  const tierColors = {
    bronze: 'from-orange-400 to-orange-600',
    silver: 'from-gray-300 to-gray-500',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-400 to-purple-600',
  };

  const tierBenefits = {
    bronze: '4% instant savings',
    silver: '5% instant savings + priority support',
    gold: '6% instant savings + exclusive deals',
    platinum: '7% instant savings + VIP perks',
  };

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-24">
        {/* Header */}
        <div className="pt-6 px-4 pb-4">
          <Link to={createPageUrl('ConsumerHome')}>
            <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Membership Card</h1>
          <p className="text-white/60 text-sm">Scan at any partner till for instant savings</p>
        </div>

        {/* Digital Card */}
        <div className="px-4 mt-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={`relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br ${tierColors[profile.rewardsTier] || tierColors.bronze}`}>
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl" />
              </div>

              <div className="relative z-10 p-6">
                {/* Card Header */}
                <div className="flex flex-col items-center mb-8">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/fefbcdb19_evoucher_logo.png"
                    alt="eVoucher"
                    className="w-48 h-48 object-contain mb-4"
                  />
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-0 capitalize">
                    <Gift className="w-3 h-3 mr-1" />
                    {profile.rewardsTier}
                  </Badge>
                </div>

                {/* Member Info */}
                <div className="mb-6">
                  <p className="text-white/90 text-sm font-medium mb-1">Member Name</p>
                  <p className="text-white font-bold text-xl">{profile.fullName || 'Member'}</p>
                </div>

                <div className="mb-8">
                  <p className="text-white/90 text-sm font-medium mb-1">Member Since</p>
                  <p className="text-white font-bold text-lg">{moment(profile.created_date).format('MMM YYYY')}</p>
                </div>

                {/* Benefits */}
                <div className="bg-white/30 backdrop-blur-md rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-white" />
                    <p className="text-white text-base font-bold">Member Benefits</p>
                  </div>
                  <p className="text-white font-semibold text-sm">{tierBenefits[profile.rewardsTier]}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Barcode Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-4"
          >
            <Card className="bg-white border-0 shadow-xl overflow-hidden">
              <div className="bg-gray-50 p-4 text-center border-b">
                <p className="text-gray-600 text-sm mb-1 font-medium">Scan at checkout</p>
                <p className="text-gray-900 font-bold text-base">Show this barcode to cashier</p>
              </div>

              <div className="p-6 bg-white">
                {/* Barcode Display */}
                <div className="bg-white rounded-lg mb-4">
                  <img
                    src={`https://barcodeapi.org/api/128/${membershipNumber}`}
                    alt="Membership Barcode"
                    className="w-full h-32 object-contain"
                    onError={(e) => {
                      // Fallback to a simple barcode visualization
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback barcode visualization */}
                  <div className="hidden flex-col items-center justify-center h-32 bg-white">
                    <div className="flex gap-[2px]">
                      {membershipNumber.split('').map((digit, idx) => (
                        <div
                          key={idx}
                          className="bg-black"
                          style={{
                            width: `${4 + parseInt(digit)}px`,
                            height: '80px',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#00A89D]/10 rounded-lg p-4 mb-3">
                  <p className="text-[#00A89D] text-base font-bold mb-2">✓ Valid at all partner stores</p>
                  <p className="text-gray-700 text-sm font-medium">Present this card before payment to receive your discount</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Saved</p>
                    <p className="text-lg font-bold text-[#00A89D]">R{((profile.totalSpent || 0) * 0.04).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600 font-medium mb-1">Points Balance</p>
                    <p className="text-lg font-bold text-purple-600">{profile.rewardsPoints || 0}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Partner Stores */}
          <Card className="bg-white border-0 shadow-md p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#00A89D]" />
                <h3 className="font-semibold text-gray-900">Accepted At</h3>
              </div>
              <Link to={createPageUrl('Shop')}>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Use your membership card at 100+ partner stores including:
            </p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: 'Shoprite', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/290650325_shoprite.png' },
                { name: 'Checkers', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/cf9e94b57_checkers.png' },
                { name: 'USave', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/d9a8cc580_usave.png' },
                { name: 'Boxer', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/f74bf546e_boxer.png' },
                { name: 'Mr Price', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/077e938f6_MrPrice.png' },
                { name: 'Edgars', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/7d87eb85d_Edgars.png' },
                { name: 'Game', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/0d4e37fc3_game.png' },
                { name: 'Engen', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/9cd5308fa_engen.png' },
              ].map(store => (
                <div key={store.name} className="bg-gray-50 rounded-lg p-2 flex items-center justify-center border border-gray-100">
                  <img 
                    src={store.logo} 
                    alt={store.name}
                    className="w-full h-12 object-contain"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Instructions */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 p-4 mt-4">
            <h3 className="font-semibold text-gray-900 mb-3">How to Use</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-bold text-[#00A89D]">1.</span>
                <span>Shop at any partner store</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#00A89D]">2.</span>
                <span>Show this barcode to the cashier before payment</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#00A89D]">3.</span>
                <span>Receive instant {profile.rewardsTier === 'bronze' ? '4%' : profile.rewardsTier === 'silver' ? '5%' : profile.rewardsTier === 'gold' ? '6%' : '7%'} discount automatically</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#00A89D]">4.</span>
                <span>Earn points on every purchase</span>
              </li>
            </ol>
          </Card>

          {/* Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
            <p className="text-yellow-900 text-sm font-semibold mb-2">💡 Pro Tips</p>
            <ul className="space-y-1 text-xs text-yellow-800">
              <li>• Increase screen brightness for easier scanning</li>
              <li>• Keep this card in your favorites for quick access</li>
              <li>• Works offline - no internet needed at checkout</li>
            </ul>
          </div>
        </div>
      </div>
      <BottomNav activePage="MembershipCard" />
    </MobileContainer>
  );
}