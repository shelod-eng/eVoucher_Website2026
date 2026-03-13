import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Brain, TrendingUp, TrendingDown, DollarSign, Calendar,
  Target, Zap, Sparkles, ChevronRight, PieChart, BarChart3, Clock
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#00A89D', '#00C4B8', '#8B5CF6', '#EC4899', '#F59E0B'];

export default function AIInsights() {
  const { data: profile = {} } = useQuery({
    queryKey: ['consumerProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.ConsumerProfile.list();
      return profiles[0] || {};
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['userTransactions'],
    queryFn: () => base44.entities.Transaction.filter({ userEmail: profile.email }),
    enabled: !!profile.email,
  });

  const { data: vouchers = [] } = useQuery({
    queryKey: ['userVouchers'],
    queryFn: () => base44.entities.VoucherInstance.filter({ consumerEmail: profile.email }),
    enabled: !!profile.email,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => base44.entities.VoucherProduct.filter({ status: 'active' }),
  });

  // AI-Powered Deal Recommendations
  const getAIRecommendations = () => {
    if (!profile.email || transactions.length === 0) return [];
    
    // Analyze spending patterns
    const merchantFrequency = {};
    const categorySpending = {};
    
    transactions.forEach(t => {
      if (t.merchantName) {
        merchantFrequency[t.merchantName] = (merchantFrequency[t.merchantName] || 0) + 1;
      }
    });

    // Score products based on user behavior
    return allProducts.map(product => {
      const merchantScore = merchantFrequency[product.merchantName] || 0;
      const aiScore = merchantScore * 10 + Math.random() * 5;
      const potentialSavings = product.faceValue * 0.04;
      
      return {
        ...product,
        aiScore,
        reason: merchantScore > 2 
          ? `You've shopped at ${product.merchantName} ${merchantScore} times`
          : 'Popular in your area',
        potentialSavings: Math.round(potentialSavings),
        isExclusive: merchantScore > 3
      };
    }).sort((a, b) => b.aiScore - a.aiScore).slice(0, 4);
  };

  const aiRecommendations = getAIRecommendations();

  // Calculate insights
  const totalSpent = profile.totalSpent || 0;
  const totalSaved = totalSpent * 0.04;
  const avgMonthlySpend = totalSpent / Math.max((new Date().getMonth() + 1), 1);
  const projectedYearlySavings = avgMonthlySpend * 12 * 0.04;

  // Spending trend data (mock)
  const spendingTrend = [
    { month: 'Jan', amount: avgMonthlySpend * 0.8 },
    { month: 'Feb', amount: avgMonthlySpend * 0.9 },
    { month: 'Mar', amount: avgMonthlySpend * 1.1 },
    { month: 'Apr', amount: avgMonthlySpend * 1.0 },
    { month: 'May', amount: avgMonthlySpend * 1.2 },
    { month: 'Jun', amount: avgMonthlySpend * 0.95 },
  ];

  // Category breakdown (mock)
  const categoryData = [
    { name: 'Groceries', value: 45, color: COLORS[0] },
    { name: 'Fashion', value: 25, color: COLORS[1] },
    { name: 'Electronics', value: 15, color: COLORS[2] },
    { name: 'Services', value: 10, color: COLORS[3] },
    { name: 'Other', value: 5, color: COLORS[4] },
  ];

  // Savings milestones
  const savingsMilestones = [
    { target: 500, current: totalSaved, label: 'Bronze Saver' },
    { target: 2000, current: totalSaved, label: 'Silver Saver' },
    { target: 5000, current: totalSaved, label: 'Gold Saver' },
  ];

  const currentMilestone = savingsMilestones.find(m => m.current < m.target) || savingsMilestones[2];
  const progressPercent = (currentMilestone.current / currentMilestone.target) * 100;

  // AI Predictions
  const predictions = [
    {
      icon: TrendingUp,
      title: 'Peak Shopping Days',
      description: 'You typically shop more on weekends. Plan ahead to maximize savings!',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: Target,
      title: 'Savings Goal',
      description: `You're on track to save R${Math.round(projectedYearlySavings)} this year`,
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Sparkles,
      title: 'Smart Recommendations',
      description: 'Based on your spending, try Shoprite vouchers next',
      color: 'from-purple-500 to-pink-600'
    },
  ];

  return (
    <MobileContainer>
      <div className="pb-24 bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50 min-h-screen">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 pt-6 pb-20 px-4 rounded-b-[40px] relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300/20 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Link to={createPageUrl('ConsumerHome')}>
                <motion.button 
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </motion.button>
              </Link>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
            </div>
            
            <motion.h1 
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              AI Insights
            </motion.h1>
            <motion.p 
              className="text-purple-100 text-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Smart predictions powered by machine learning
            </motion.p>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="px-4 -mt-12">
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-3">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <p className="text-gray-500 text-xs mb-1">Total Saved</p>
                <p className="text-2xl font-bold text-gray-900">R{Math.round(totalSaved)}</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <p className="text-gray-500 text-xs mb-1">Avg Monthly</p>
                <p className="text-2xl font-bold text-gray-900">R{Math.round(avgMonthlySpend)}</p>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Savings Progress */}
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-white/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Next Milestone</p>
                  <p className="text-xl font-bold text-gray-900">{currentMilestone.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="text-2xl font-bold text-[#00A89D]">{Math.min(Math.round(progressPercent), 100)}%</p>
                </div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#00A89D] to-[#00C4B8] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                  transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                R{Math.round(currentMilestone.current)} of R{currentMilestone.target}
              </p>
            </Card>
          </motion.div>
        </div>

        {/* AI Predictions */}
        <div className="px-4 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">AI Predictions</h2>
          <div className="space-y-3">
            {predictions.map((pred, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
              >
                <Card className={`bg-gradient-to-r ${pred.color} rounded-2xl p-4 shadow-lg border-0`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                      <pred.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold mb-1">{pred.title}</p>
                      <p className="text-white/90 text-sm">{pred.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Spending Trend Chart */}
        <div className="px-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-white/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Spending Trend</h3>
                <BarChart3 className="w-5 h-5 text-[#00A89D]" />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={spendingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#999" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#00A89D" 
                    strokeWidth={3}
                    dot={{ fill: '#00A89D', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Category Breakdown */}
        <div className="px-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-white/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Category Breakdown</h3>
                <PieChart className="w-5 h-5 text-[#00A89D]" />
              </div>
              <div className="flex items-center justify-center mb-4">
                <ResponsiveContainer width="100%" height={160}>
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {categoryData.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* AI Recommended Deals */}
        {aiRecommendations.length > 0 && (
          <div className="px-4 mt-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Recommended For You</h3>
                  <p className="text-xs text-purple-600 font-medium">Personalized based on your spending</p>
                </div>
              </div>

              <div className="space-y-3">
                {aiRecommendations.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + idx * 0.1 }}
                  >
                    <Link to={createPageUrl('Shop')}>
                      <Card className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-purple-100 hover:shadow-xl transition-all relative overflow-hidden">
                        {product.isExclusive && (
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            EXCLUSIVE
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00A89D] to-[#00C4B8] flex items-center justify-center shadow-md flex-shrink-0">
                            <DollarSign className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{product.merchantName}</p>
                            <p className="text-sm text-gray-600">{product.description || 'Voucher'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-purple-600 font-semibold">💡 {product.reason}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 line-through">R{product.faceValue}</p>
                            <p className="text-xl font-bold text-[#00A89D]">R{product.consumerPrice}</p>
                            <p className="text-xs text-green-600 font-semibold">Save R{product.potentialSavings}</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
      <BottomNav activePage="ConsumerHome" />
    </MobileContainer>
  );
}