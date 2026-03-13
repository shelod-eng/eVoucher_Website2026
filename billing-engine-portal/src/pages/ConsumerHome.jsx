import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import GoldButton from '@/components/ui/GoldButton';
import VoucherCard from '@/components/ui/VoucherCard';
import { Card } from '@/components/ui/card';
import { Wallet, Gift, Users, ChevronRight, Bell, Phone, Copy, Check, Sparkles, ArrowRight, TrendingUp, Zap, Brain, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Featured merchant logos
const MERCHANT_LOGOS = {
  'Shoprite': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/290650325_shoprite.png',
  'USave': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/d9a8cc580_usave.png',
  'Checkers': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/cf9e94b57_checkers.png',
  'Boxer': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/f74bf546e_boxer.png',
  'Mr Price': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/077e938f6_MrPrice.png',
  'Edgars': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/7d87eb85d_Edgars.png',
  'Game': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/0d4e37fc3_game.png',
  'Engen': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/9cd5308fa_engen.png',
  'Cell C': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/af84a330d_CellC.png',
  'Telkom': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/09d12ab0e_Telkom.jpg',
  'Prasa': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/6807b4701_PrasaBeMoved.png',
  'Rea Vaya': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/048bb7396_reyavaya.png',
  'Areyeng': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/9a9cdae0e_areyeng.png',
};

const FEATURED_MERCHANTS = [
  { name: 'Shoprite', logo: MERCHANT_LOGOS['Shoprite'] },
  { name: 'USave', logo: MERCHANT_LOGOS['USave'] },
  { name: 'Checkers', logo: MERCHANT_LOGOS['Checkers'] },
  { name: 'Boxer', logo: MERCHANT_LOGOS['Boxer'] },
  { name: 'Mr Price', logo: MERCHANT_LOGOS['Mr Price'] },
  { name: 'Edgars', logo: MERCHANT_LOGOS['Edgars'] },
  { name: 'Game', logo: MERCHANT_LOGOS['Game'] },
  { name: 'Engen', logo: MERCHANT_LOGOS['Engen'] },
  { name: 'Cell C', logo: MERCHANT_LOGOS['Cell C'] },
  { name: 'Telkom', logo: MERCHANT_LOGOS['Telkom'] },
];

export default function ConsumerHome() {
  const [copied, setCopied] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.filter({ status: 'active' }),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.VoucherProduct.filter({ status: 'active' }),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['consumerProfile'],
    queryFn: () => base44.entities.ConsumerProfile.list(),
  });

  const profile = profiles[0] || { 
    fullName: 'Welcome', 
    rewardsTier: 'bronze', 
    totalSpent: 0,
    walletBalance: 0,
    referralCode: 'EV' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    referralCount: 0
  };

  const { data: transactions = [] } = useQuery({
    queryKey: ['userTransactions'],
    queryFn: () => base44.entities.Transaction.filter({ userEmail: profile.email }),
    enabled: !!profile.email,
  });

  // AI Personalization: Analyze user spending to recommend relevant products
  const getPersonalizedDeals = () => {
    if (!profile.email || products.length === 0 || transactions.length === 0) return [];
    
    // AI logic: prioritize merchants user has bought from
    const merchantFrequency = transactions.reduce((acc, t) => {
      if (t.merchantName) acc[t.merchantName] = (acc[t.merchantName] || 0) + 1;
      return acc;
    }, {});
    
    const scored = products.map(p => ({
      ...p,
      aiScore: (merchantFrequency[p.merchantName] || 0) * 10 + Math.random() * 5,
      isPersonalized: merchantFrequency[p.merchantName] > 0,
      exclusiveDiscount: merchantFrequency[p.merchantName] > 3 ? 0.01 : 0, // Extra 1% for loyal customers
    }));
    
    return scored.sort((a, b) => b.aiScore - a.aiScore).slice(0, 6);
  };

  const personalizedDeals = getPersonalizedDeals();
  const hotDeals = products.slice(0, 4);

  // Auto-slide for featured merchants
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(FEATURED_MERCHANTS.length / 4));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Get merchant logo from our mapping or from database
  const getMerchantLogo = (merchantName) => {
    return MERCHANT_LOGOS[merchantName] || null;
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(profile.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MobileContainer>
      <div className="pb-24 bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50 min-h-screen">
        {/* Header with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#00A89D] via-[#00C4B8] to-[#00A89D] pt-6 pb-20 px-4 rounded-b-[40px] relative overflow-hidden shadow-xl"
        >
          {/* Animated background blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300/20 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-white/80 text-sm">Good day,</p>
                <h1 className="text-2xl font-bold text-white">{profile.fullName || 'Member'}</h1>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Link to={createPageUrl('Notifications')}>
                  <button className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all shadow-lg">
                    <Bell className="w-5 h-5 text-white" />
                  </button>
                </Link>
              </motion.div>
            </div>

            {/* Tier Badge with animation */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-white/30"
            >
              <Gift className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium capitalize">{profile.rewardsTier} Member</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Balance Card - Glassmorphism */}
        <div className="px-4 -mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/50 relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#00A89D]/5 to-transparent pointer-events-none" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Wallet Balance</p>
                    <motion.h2 
                      className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                    >
                      R{(profile.walletBalance || 0).toLocaleString()}
                    </motion.h2>
                  </div>
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00A89D] to-[#00C4B8] flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Wallet className="w-7 h-7 text-white" />
                  </motion.div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Link to={createPageUrl('Wallet')} className="col-span-1">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <GoldButton className="w-full shadow-lg text-xs">Add Funds</GoldButton>
                    </motion.div>
                  </Link>
                  <Link to={createPageUrl('SendVoucher')} className="col-span-1">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <GoldButton variant="outline" className="w-full text-xs">Send Gift</GoldButton>
                    </motion.div>
                  </Link>
                  <Link to={createPageUrl('MembershipCard')} className="col-span-1">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <GoldButton variant="outline" className="w-full text-xs">My Card</GoldButton>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* AI Insights Card - NEW */}
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to={createPageUrl('AIInsights')}>
              <Card className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 rounded-3xl p-5 border-0 shadow-2xl relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-300/20 rounded-full blur-xl" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Brain className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <p className="text-white font-bold text-lg">AI Insights</p>
                        <p className="text-white/80 text-xs">Smart savings predictions</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex items-center gap-2 text-white/90 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>Save R{Math.round((profile.totalSpent || 0) * 0.04 * 1.2)} more this month</span>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* Challenges Widget - NEW */}
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link to={createPageUrl('Challenges')}>
              <Card className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 rounded-3xl p-5 border-0 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Zap className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <p className="text-white font-bold text-lg">Savings Challenges</p>
                        <p className="text-white/80 text-xs">Level up & earn rewards</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex items-center gap-2 text-white/90 text-sm">
                    <Gift className="w-4 h-4" />
                    <span>3 active challenges • Win bonus rewards!</span>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* Website Promo Banner - NEW */}
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55 }}
          >
            <Link to={createPageUrl('Website')}>
              <Card className="relative bg-gradient-to-br from-black via-gray-900 to-black rounded-3xl p-6 border-2 border-cyan-500/30 shadow-2xl overflow-hidden group hover:border-cyan-500/60 transition-all">
                {/* Animated background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <motion.div 
                  className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/30 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/50"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <Globe className="w-7 h-7 text-white" />
                      </motion.div>
                      <div>
                        <p className="text-white font-black text-xl">Visit Our Website</p>
                        <p className="text-cyan-400 text-sm font-bold">Learn more about eVoucher</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ChevronRight className="w-6 h-6 text-cyan-400" />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-2 text-center border border-white/10">
                      <p className="text-cyan-400 font-black text-lg">4%</p>
                      <p className="text-white/70 text-xs">Instant</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-2 text-center border border-white/10">
                      <p className="text-cyan-400 font-black text-lg">R0</p>
                      <p className="text-white/70 text-xs">Fees</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-2 text-center border border-white/10">
                      <p className="text-cyan-400 font-black text-lg">50M+</p>
                      <p className="text-white/70 text-xs">Goal</p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* Referral Card */}
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-r from-[#00A89D] via-teal-500 to-[#00C4B8] rounded-3xl p-5 border-0 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                    >
                      <Users className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-white/90 text-sm">Your Referral Code</p>
                      <p className="text-white font-bold text-xl tracking-wider">{profile.referralCode}</p>
                    </div>
                  </div>
                  <motion.button 
                    onClick={copyReferralCode}
                    className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                        >
                          <Check className="w-5 h-5 text-white" />
                        </motion.div>
                      ) : (
                        <motion.div key="copy">
                          <Copy className="w-5 h-5 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
                <p className="text-white/90 text-sm mt-3 font-medium">Earn R20 for every friend who joins!</p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Savings Tracker Banner */}
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link to={createPageUrl('SavingsTracker')}>
              <Card className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 rounded-2xl p-4 border border-yellow-200/50 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-md"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Sparkles className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-yellow-900 font-bold">Track Your Savings</p>
                      <p className="text-yellow-700 text-sm font-medium">4% off every voucher</p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5 text-yellow-600" />
                  </motion.div>
                </div>
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* USSD Access Banner */}
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200/50 shadow-md">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Phone className="w-6 h-6 text-white" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-blue-900 font-bold text-sm">No Smartphone? Dial *120*384#</p>
                  <p className="text-blue-600 text-xs font-medium">Access eVoucher via USSD</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Featured Merchants - Auto-sliding carousel */}
        <div className="px-4 mt-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Featured Stores</h2>
              <Link to={createPageUrl('Shop')} className="text-[#00A89D] text-sm font-semibold flex items-center hover:text-[#00C4B8] transition-colors">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          
            {/* Sliding carousel container */}
            <div className="relative overflow-hidden">
              <div 
                ref={sliderRef}
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {/* Create slides of 4 merchants each */}
                {Array.from({ length: Math.ceil(FEATURED_MERCHANTS.length / 4) }).map((_, slideIndex) => (
                  <div key={slideIndex} className="flex gap-4 min-w-full justify-around px-1">
                    {FEATURED_MERCHANTS.slice(slideIndex * 4, slideIndex * 4 + 4).map((merchant, idx) => (
                      <Link key={merchant.name} to={createPageUrl('Shop')}>
                        <motion.div 
                          className="flex flex-col items-center"
                          whileHover={{ y: -5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="w-18 h-18 rounded-3xl bg-white/80 backdrop-blur-sm flex items-center justify-center mb-2 shadow-lg border border-gray-200/50 overflow-hidden p-2 hover:shadow-xl transition-all">
                            <img 
                              src={merchant.logo} 
                              alt={merchant.name} 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-xs text-gray-700 text-center font-semibold truncate w-18">{merchant.name}</span>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
              
              {/* Slide indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: Math.ceil(FEATURED_MERCHANTS.length / 4) }).map((_, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all ${
                      currentSlide === idx ? 'w-8 bg-gradient-to-r from-[#00A89D] to-[#00C4B8]' : 'w-2 bg-gray-300'
                    }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Personalized For You - AI Powered */}
        {personalizedDeals.length > 0 && personalizedDeals.some(d => d.isPersonalized) && (
          <div className="px-4 mt-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Just For You</h2>
                    <p className="text-xs text-purple-600 font-medium">AI-powered recommendations</p>
                  </div>
                </div>
                <Link to={createPageUrl('Shop')} className="text-[#00A89D] text-sm font-semibold flex items-center hover:text-[#00C4B8] transition-colors">
                  See All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {personalizedDeals.slice(0, 4).map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + idx * 0.1 }}
                  >
                    <VoucherCard 
                      product={{
                        ...product,
                        consumerPrice: product.exclusiveDiscount > 0 
                          ? Math.round(product.consumerPrice * (1 - product.exclusiveDiscount))
                          : product.consumerPrice
                      }} 
                      compact 
                      isPersonalized={product.isPersonalized}
                      isExclusive={product.exclusiveDiscount > 0}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Hot Deals */}
        <div className="px-4 mt-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-6 h-6 text-orange-500" />
                </motion.div>
                <h2 className="text-xl font-bold text-gray-900">Hot Deals</h2>
              </div>
              <Link to={createPageUrl('Shop')} className="text-[#00A89D] text-sm font-semibold flex items-center hover:text-[#00C4B8] transition-colors">
                See All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {hotDeals.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + idx * 0.1 }}
                >
                  <VoucherCard product={product} compact />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <BottomNav activePage="ConsumerHome" />
    </MobileContainer>
  );
}