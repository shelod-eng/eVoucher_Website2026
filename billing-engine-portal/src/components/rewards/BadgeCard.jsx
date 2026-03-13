import React from 'react';
import { Award, Gift, Users, Zap, Target, Heart, Sun, Shield, TrendingUp, Flame } from 'lucide-react';

const badgeConfig = {
  first_purchase: {
    icon: Gift,
    name: 'First Steps',
    description: 'Made your first voucher purchase',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-100'
  },
  first_redemption: {
    icon: Zap,
    name: 'First Redemption',
    description: 'Redeemed your first voucher',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-100'
  },
  referral_starter: {
    icon: Users,
    name: 'Referral Starter',
    description: 'Referred your first friend',
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-100'
  },
  referral_master: {
    icon: Users,
    name: 'Referral Master',
    description: 'Referred 10+ friends',
    color: 'from-yellow-400 to-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  big_spender: {
    icon: TrendingUp,
    name: 'Big Spender',
    description: 'Spent over R5,000',
    color: 'from-pink-400 to-pink-600',
    bgColor: 'bg-pink-100'
  },
  loyal_customer: {
    icon: Heart,
    name: 'Loyal Customer',
    description: 'Active for 3+ months',
    color: 'from-red-400 to-red-600',
    bgColor: 'bg-red-100'
  },
  early_bird: {
    icon: Sun,
    name: 'Early Bird',
    description: 'One of our first 100 users',
    color: 'from-orange-400 to-orange-600',
    bgColor: 'bg-orange-100'
  },
  community_hero: {
    icon: Shield,
    name: 'Community Hero',
    description: 'Supported 5+ local merchants',
    color: 'from-teal-400 to-teal-600',
    bgColor: 'bg-teal-100'
  },
  savings_champion: {
    icon: Target,
    name: 'Savings Champion',
    description: 'Saved over R500',
    color: 'from-emerald-400 to-emerald-600',
    bgColor: 'bg-emerald-100'
  },
  streak_7_days: {
    icon: Flame,
    name: '7-Day Streak',
    description: 'Active 7 days in a row',
    color: 'from-amber-400 to-amber-600',
    bgColor: 'bg-amber-100'
  }
};

export default function BadgeCard({ badgeType, earned = false, earnedDate, compact = false }) {
  const config = badgeConfig[badgeType] || badgeConfig.first_purchase;
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`relative ${!earned ? 'opacity-40 grayscale' : ''}`}>
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        {earned && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${earned ? 'bg-white border border-gray-100' : 'bg-gray-50 opacity-60'}`}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-md ${!earned ? 'grayscale' : ''}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 text-sm">{config.name}</h4>
        <p className="text-gray-500 text-xs">{config.description}</p>
        {earned && earnedDate && (
          <p className="text-[#00A89D] text-xs mt-0.5">Earned {new Date(earnedDate).toLocaleDateString()}</p>
        )}
      </div>
      {!earned && (
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-xs">🔒</span>
        </div>
      )}
    </div>
  );
}

export { badgeConfig };