import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Shield, Users, TrendingUp, Phone, Zap, ArrowRight, CheckCircle2, Gift, Wallet, Crown, Heart, Brain, Rocket, Globe, Target, Award, ChevronDown, Plus, Star, Flame, MessageSquare } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Website() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);
  const queryClient = useQueryClient();

  const [requestForm, setRequestForm] = useState({
    merchantName: '',
    category: '',
    reason: ''
  });

  const [userPreferences, setUserPreferences] = useState(() => {
    const stored = localStorage.getItem('evoucher_preferences');
    return stored ? JSON.parse(stored) : { interests: [], viewHistory: {} };
  });

  const [showPreferenceSelector, setShowPreferenceSelector] = useState(false);

  React.useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  React.useEffect(() => {
    localStorage.setItem('evoucher_preferences', JSON.stringify(userPreferences));
  }, [userPreferences]);

  const handleInterestToggle = (category) => {
    setUserPreferences(prev => {
      const interests = prev.interests.includes(category)
        ? prev.interests.filter(i => i !== category)
        : [...prev.interests, category];
      return { ...prev, interests };
    });
  };

  const trackMerchantView = (category) => {
    setUserPreferences(prev => ({
      ...prev,
      viewHistory: {
        ...prev.viewHistory,
        [category]: (prev.viewHistory[category] || 0) + 1
      }
    }));
  };

  const requestMerchantMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me().catch(() => null);
      return base44.entities.MerchantRequest.create({
        ...data,
        requestedBy: user?.email || 'anonymous'
      });
    },
    onSuccess: () => {
      toast.success('Merchant request submitted! We\'ll review it soon.');
      setRequestForm({ merchantName: '', category: '', reason: '' });
      queryClient.invalidateQueries(['merchantRequests']);
    }
  });
  const benefits = [
    { icon: Sparkles, title: 'Save 4% Instantly', desc: 'Pay R960 for R1,000 vouchers' },
    { icon: Shield, title: 'Trusted Merchants', desc: 'Shoprite, Checkers, Mr Price & more' },
    { icon: Users, title: 'Community Driven', desc: 'Refer friends, earn rewards together' },
    { icon: TrendingUp, title: 'Track Savings', desc: 'See your savings grow over time' },
    { icon: Phone, title: 'Works on Any Phone', desc: 'USSD & SMS for feature phones' },
    { icon: Gift, title: 'Gamified Rewards', desc: 'Complete challenges, win bonuses' },
  ];

  const merchants = [
    { name: 'Shoprite', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/290650325_shoprite.png' },
    { name: 'Checkers', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/6383d090f_checkers.png' },
    { name: 'Mr Price', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/077e938f6_MrPrice.png' },
    { name: 'Game', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/0d4e37fc3_game.png' },
    { name: 'Edgars', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/7d87eb85d_Edgars.png' },
    { name: 'Boxer', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/f74bf546e_boxer.png' },
  ];

  const newMerchants = [
    { name: 'Engen', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/9cd5308fa_engen.png', tag: 'New', category: 'fuel' },
    { name: 'Cell C', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/af84a330d_CellC.png', tag: 'Popular', category: 'electronics' },
    { name: 'Telkom', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/09d12ab0e_Telkom.jpg', tag: 'New', category: 'electronics' },
  ];

  const merchantsByCategory = {
    fashion: [
      { name: 'Mr Price', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/077e938f6_MrPrice.png' },
      { name: 'Edgars', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/7d87eb85d_Edgars.png' },
    ],
    grocery: [
      { name: 'Shoprite', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/290650325_shoprite.png' },
      { name: 'Checkers', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/6383d090f_checkers.png' },
      { name: 'Boxer', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/f74bf546e_boxer.png' },
    ],
    electronics: [
      { name: 'Game', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/0d4e37fc3_game.png' },
      { name: 'Cell C', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/af84a330d_CellC.png' },
      { name: 'Telkom', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/09d12ab0e_Telkom.jpg' },
    ],
    fuel: [
      { name: 'Engen', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/9cd5308fa_engen.png' },
    ]
  };

  const getPersonalizedMerchants = () => {
    const { interests, viewHistory } = userPreferences;
    
    if (interests.length === 0 && Object.keys(viewHistory).length === 0) {
      return [];
    }

    // Combine explicit interests and view history
    const categoryScores = {};
    interests.forEach(cat => categoryScores[cat] = (categoryScores[cat] || 0) + 10);
    Object.entries(viewHistory).forEach(([cat, count]) => {
      categoryScores[cat] = (categoryScores[cat] || 0) + count;
    });

    // Get top categories
    const topCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([cat]) => cat);

    // Get merchants from top categories
    const recommended = [];
    topCategories.forEach(cat => {
      if (merchantsByCategory[cat]) {
        recommended.push(...merchantsByCategory[cat]);
      }
    });

    return recommended.slice(0, 6);
  };

  const personalizedMerchants = getPersonalizedMerchants();

  const categoryOptions = [
    { value: 'fashion', label: 'Fashion & Clothing', icon: '👕' },
    { value: 'grocery', label: 'Groceries & Food', icon: '🛒' },
    { value: 'electronics', label: 'Electronics & Tech', icon: '📱' },
    { value: 'fuel', label: 'Fuel & Transport', icon: '⛽' },
    { value: 'pharmacy', label: 'Health & Pharmacy', icon: '💊' },
  ];

  const stats = [
    { value: '4%', label: 'Instant Savings' },
    { value: '50+', label: 'Partner Merchants' },
    { value: '10K+', label: 'Active Users' },
    { value: 'R2M+', label: 'Total Saved' },
  ];

  const howItWorks = [
    { step: 1, title: 'Sign Up Free', desc: 'Create your account in seconds', icon: Users },
    { step: 2, title: 'Add Funds', desc: 'Load money into your wallet', icon: Wallet },
    { step: 3, title: 'Buy Vouchers', desc: 'Get 4% off at top stores', icon: Gift },
    { step: 4, title: 'Save Money', desc: 'Track your savings grow', icon: TrendingUp },
  ];

  const comparisons = [
    { feature: 'Instant Savings', evoucher: '4% on every purchase', other: 'Up to 25% (but complex tiers)', winner: 'us' },
    { feature: 'Accessibility', evoucher: 'USSD, SMS, Web - No smartphone needed', other: 'Smartphone apps only', winner: 'us' },
    { feature: 'Fees', evoucher: 'R0 - Completely free forever', other: 'Monthly fees + hidden costs', winner: 'us' },
    { feature: 'Complexity', evoucher: 'Simple - Buy & save instantly', other: 'Complex rules & conditions', winner: 'us' },
    { feature: 'Market', evoucher: 'Everyone - True inclusion', other: 'High-income focus', winner: 'us' },
    { feature: 'Impact', evoucher: 'Community upliftment first', other: 'Profit-driven model', winner: 'us' }
  ];

  const futureVision = [
    { icon: Brain, title: 'AI-Powered Savings', desc: 'ML predicts spending & recommends optimal purchases', color: 'purple' },
    { icon: Globe, title: 'Pan-African Scale', desc: '10 countries by 2027, empowering 50M+ users', color: 'blue' },
    { icon: Zap, title: 'Blockchain Settlement', desc: 'Real-time merchant payouts in seconds', color: 'yellow' },
    { icon: Users, title: 'Community-Owned', desc: 'User-owned cooperative model by 2026', color: 'green' }
  ];

  const newStats = [
    { value: '50M+', label: 'Target Users by 2030', icon: Users },
    { value: 'R2.4B', label: 'Annual Savings Goal', icon: TrendingUp },
    { value: '10', label: 'African Countries', icon: Globe },
    { value: '100%', label: 'Inclusion Rate', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section - Futuristic */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        
        {/* Glowing orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#00A89D] rounded-full blur-[128px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[128px]" 
        />
        
        <motion.div 
          style={{ opacity, scale }}
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-block mb-6"
          >
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#00A89D] via-cyan-400 to-blue-500 flex items-center justify-center shadow-2xl shadow-cyan-500/50">
              <span className="text-6xl font-black text-white">eV</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-white via-cyan-200 to-[#00A89D] bg-clip-text text-transparent"
          >
            The Future of Savings<br />Is Here
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            While others complicate savings with complex rules, we give you <span className="text-[#00A89D] font-bold">instant 4% off</span>. 
            No tiers. No fees. No complexity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link to={createPageUrl('ConsumerHome')}>
              <Button className="bg-gradient-to-r from-[#00A89D] to-cyan-500 text-white hover:shadow-2xl hover:shadow-cyan-500/50 text-xl px-12 py-7 rounded-2xl font-bold transition-all">
                Start Saving Now <Rocket className="ml-2 w-6 h-6" />
              </Button>
            </Link>
            <Button variant="outline" className="border-2 border-gray-600 text-white hover:bg-white/5 text-xl px-12 py-7 rounded-2xl font-bold">
              Watch Demo <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex justify-center"
          >
            <ChevronDown className="w-8 h-8 text-gray-500 animate-bounce" />
          </motion.div>
        </motion.div>
      </div>

      {/* Why We're Better Than Discovery */}
      <div className="relative py-32 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-6 py-2 mb-6">
              <Target className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-bold">The eVoucher Difference</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Why eVoucher Works Better
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              No complex rules. No hidden fees. Just instant savings that work for everyone.
            </p>
          </motion.div>

          <div className="space-y-4">
            {comparisons.map((comp, idx) => (
              <motion.div
                key={comp.feature}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
              >
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">{comp.feature}</div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#00A89D]" />
                      <span className="text-white font-bold">{comp.evoucher}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl">vs</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Other Programs</div>
                    <div className="text-gray-400">{comp.other}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <div className="inline-block bg-gradient-to-r from-[#00A89D] to-cyan-500 rounded-2xl p-8">
              <Award className="w-12 h-12 text-white mx-auto mb-4" />
              <p className="text-2xl font-bold text-white">eVoucher: Leading with accessibility, simplicity & social impact</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Future Vision */}
      <div className="relative py-32 bg-black">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-6 py-2 mb-6">
              <Rocket className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400 font-bold">Building Tomorrow</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              The Next Decade
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We're not just a voucher app. We're building Africa's financial inclusion infrastructure.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {futureVision.map((vision, idx) => (
              <motion.div
                key={vision.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity" />
                <Card className="relative bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-3xl p-8 hover:border-cyan-500/50 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50">
                    <vision.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{vision.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{vision.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Vision Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newStats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00A89D] to-cyan-500 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-cyan-500/50">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section - Modern Dark */}
      <div className="relative py-32 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black mb-4 text-white">Built Different</h2>
            <p className="text-xl text-gray-400">Real benefits. Zero complexity.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
                  <Card className="relative p-8 hover:shadow-2xl transition-all bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 hover:border-cyan-500/50 rounded-3xl">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00A89D] to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50">
                      <benefit.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                    <p className="text-gray-400">{benefit.desc}</p>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Personalized Recommendations */}
      {personalizedMerchants.length > 0 && (
        <div className="relative py-32 bg-gradient-to-b from-black via-purple-950/20 to-black">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-6 py-2 mb-6">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 font-bold">Personalized For You</span>
              </div>
              <h2 className="text-5xl font-black text-white mb-4">Based on Your Interests</h2>
              <p className="text-xl text-gray-400">Merchants we think you'll love</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {personalizedMerchants.map((merchant, idx) => (
                <motion.div
                  key={merchant.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity" />
                    <Card className="relative bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 hover:border-purple-500/50 rounded-3xl p-8 transition-all">
                      <div className="absolute top-4 right-4">
                        <div className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          For You
                        </div>
                      </div>
                      <div className="w-32 h-32 rounded-2xl bg-white mx-auto mb-4 flex items-center justify-center p-4 shadow-2xl">
                        <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-contain" />
                      </div>
                      <h3 className="text-2xl font-bold text-white text-center">{merchant.name}</h3>
                      <p className="text-gray-400 text-center mt-2">Save 4% instantly</p>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preference Selector */}
      <div className="relative py-16 bg-black">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Personalize Your Experience</h3>
                  <p className="text-gray-400">Select your interests to see relevant merchants</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowPreferenceSelector(!showPreferenceSelector)}
                  className="border-gray-600 text-white hover:bg-white/5"
                >
                  {showPreferenceSelector ? 'Hide' : 'Customize'}
                </Button>
              </div>

              {showPreferenceSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid md:grid-cols-2 gap-3"
                >
                  {categoryOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleInterestToggle(option.value)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        userPreferences.interests.includes(option.value)
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-3xl">{option.icon}</span>
                      <span className="text-white font-medium">{option.label}</span>
                      {userPreferences.interests.includes(option.value) && (
                        <CheckCircle2 className="w-5 h-5 text-purple-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      {/* New & Trending Merchants */}
      <div className="relative py-32 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-6 py-2 mb-6">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-bold">Hot Right Now</span>
            </div>
            <h2 className="text-5xl font-black text-white mb-4">New & Trending Partners</h2>
            <p className="text-xl text-gray-400">Just joined the eVoucher network</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {newMerchants.map((merchant, idx) => (
              <motion.div
                key={merchant.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity" />
                  <Card 
                    className="relative bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 hover:border-orange-500/50 rounded-3xl p-8 transition-all cursor-pointer"
                    onClick={() => trackMerchantView(merchant.category)}
                  >
                    <div className="absolute top-4 right-4">
                      <div className={`${merchant.tag === 'New' ? 'bg-green-500' : 'bg-orange-500'} text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
                        {merchant.tag === 'New' ? <Sparkles className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                        {merchant.tag}
                      </div>
                    </div>
                    <div className="w-32 h-32 rounded-2xl bg-white mx-auto mb-4 flex items-center justify-center p-4 shadow-2xl">
                      <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-contain" />
                    </div>
                    <h3 className="text-2xl font-bold text-white text-center">{merchant.name}</h3>
                    <p className="text-gray-400 text-center mt-2">Save 4% instantly</p>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>

          {/* All Partners Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-black text-white text-center mb-12">100+ Partner Stores</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8">
              {merchants.map((merchant, idx) => (
                <motion.div
                  key={merchant.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-center group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity" />
                    <div className="relative w-24 h-24 rounded-2xl bg-white shadow-2xl flex items-center justify-center p-4 hover:scale-110 transition-transform">
                      <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-contain" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Request a Merchant */}
      <div className="relative py-32 bg-black">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-6 py-2 mb-6">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400 font-bold">Your Voice Matters</span>
            </div>
            <h2 className="text-5xl font-black text-white mb-4">Missing Your Favorite Store?</h2>
            <p className="text-xl text-gray-400">Tell us which merchants you'd like to see on eVoucher</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-3xl p-8">
              <div className="space-y-6">
                <div>
                  <label className="text-white font-bold mb-2 block">Merchant Name *</label>
                  <Input
                    placeholder="e.g., Pick n Pay, Woolworths"
                    value={requestForm.merchantName}
                    onChange={(e) => setRequestForm({ ...requestForm, merchantName: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-white font-bold mb-2 block">Category *</label>
                  <Select value={requestForm.category} onValueChange={(value) => setRequestForm({ ...requestForm, category: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="grocery">Grocery</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="fuel">Fuel</SelectItem>
                      <SelectItem value="restaurants">Restaurants</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white font-bold mb-2 block">Why do you want this merchant?</label>
                  <Textarea
                    placeholder="Tell us why this merchant would be valuable..."
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={() => requestMerchantMutation.mutate(requestForm)}
                  disabled={!requestForm.merchantName || !requestForm.category || requestMerchantMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-2xl hover:shadow-purple-500/50 text-lg py-6 rounded-2xl font-bold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {requestMerchantMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Become a Partner CTA */}
      <div className="relative py-32 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur-2xl opacity-20" />
            <Card className="relative bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-green-500/50 rounded-3xl p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4">Are You a Merchant?</h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Join 100+ businesses already partnered with eVoucher. Reach thousands of customers and grow your revenue.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={createPageUrl('MerchantOnboardingFlow')}>
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-2xl hover:shadow-green-500/50 text-xl px-12 py-7 rounded-2xl font-black">
                    Apply Now <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
                <Link to={createPageUrl('MerchantProspectus')}>
                  <Button variant="outline" className="border-2 border-gray-600 text-white hover:bg-white/5 text-xl px-12 py-7 rounded-2xl font-bold">
                    Learn More
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Final CTA - Epic */}
      <div className="relative py-40 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/30 via-transparent to-transparent" />
        
        {/* Massive glowing sphere */}
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#00A89D] via-cyan-500 to-blue-500 rounded-full blur-[200px]" 
        />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
              Join the Revolution
            </h2>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto mb-12">
              50,000+ South Africans already saving with eVoucher. Join the movement today.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <Link to={createPageUrl('ConsumerHome')}>
              <Button className="bg-gradient-to-r from-[#00A89D] via-cyan-500 to-blue-500 text-white hover:shadow-2xl hover:shadow-cyan-500/50 text-2xl px-16 py-8 rounded-2xl font-black transition-all">
                Start Saving Now <Rocket className="ml-3 w-7 h-7" />
              </Button>
            </Link>
            <Link to={createPageUrl('MerchantOnboardingFlow')}>
              <Button variant="outline" className="border-3 border-gray-600 text-white hover:bg-white/5 text-2xl px-16 py-8 rounded-2xl font-black">
                Partner With Us
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 mt-12 text-lg"
          >
            No fees. No complexity. No excuses.
          </motion.p>
        </div>
      </div>

      {/* Footer - Dark & Minimal */}
      <footer className="bg-black border-t border-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00A89D] to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <span className="text-xl font-black text-white">eV</span>
                </div>
                <span className="text-2xl font-black">eVoucher</span>
              </div>
              <p className="text-gray-500">Building Africa's financial future</p>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-gray-400">Product</h3>
              <ul className="space-y-3 text-gray-500">
                <li><Link to={createPageUrl('ConsumerHome')} className="hover:text-cyan-400 transition-colors">Consumer App</Link></li>
                <li><Link to={createPageUrl('Shop')} className="hover:text-cyan-400 transition-colors">Shop Vouchers</Link></li>
                <li><Link to={createPageUrl('Rewards')} className="hover:text-cyan-400 transition-colors">Rewards</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-gray-400">Business</h3>
              <ul className="space-y-3 text-gray-500">
                <li><Link to={createPageUrl('MerchantOnboardingFlow')} className="hover:text-cyan-400 transition-colors">Partner Program</Link></li>
                <li><Link to={createPageUrl('AdminDashboard')} className="hover:text-cyan-400 transition-colors">Admin Portal</Link></li>
                <li><Link to={createPageUrl('InvestecPresentation')} className="hover:text-cyan-400 transition-colors">Investors</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-gray-400">Resources</h3>
              <ul className="space-y-3 text-gray-500">
                <li><Link to={createPageUrl('TechSpec')} className="hover:text-cyan-400 transition-colors">Tech Specs</Link></li>
                <li><Link to={createPageUrl('StakeholderHub')} className="hover:text-cyan-400 transition-colors">Stakeholder Hub</Link></li>
                <li><Link to={createPageUrl('Reports')} className="hover:text-cyan-400 transition-colors">Reports</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">© 2025 eVoucher. Built for Africa.</p>
            <div className="flex gap-6 text-gray-600 text-sm">
              <button className="hover:text-cyan-400 transition-colors">Privacy</button>
              <button className="hover:text-cyan-400 transition-colors">Terms</button>
              <button className="hover:text-cyan-400 transition-colors">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}