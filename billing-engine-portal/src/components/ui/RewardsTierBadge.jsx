import React from 'react';
import { Crown, Medal, Award, Star } from 'lucide-react';

const tierConfig = {
  bronze: {
    icon: Medal,
    gradient: 'from-amber-700 to-amber-900',
    text: 'Bronze',
    benefit: 'R20 off next purchase',
    minSpend: 0,
    maxSpend: 1999
  },
  silver: {
    icon: Award,
    gradient: 'from-gray-300 to-gray-500',
    text: 'Silver',
    benefit: 'R50 off next purchase',
    minSpend: 2000,
    maxSpend: 4999
  },
  gold: {
    icon: Star,
    gradient: 'from-[#D4AF37] to-[#B8962E]',
    text: 'Gold',
    benefit: 'R100 off next purchase',
    minSpend: 5000,
    maxSpend: 9999
  },
  platinum: {
    icon: Crown,
    gradient: 'from-purple-400 to-purple-700',
    text: 'Platinum',
    benefit: 'R200+ off premium products',
    minSpend: 10000,
    maxSpend: null
  }
};

export default function RewardsTierBadge({ tier = 'bronze', totalSpent = 0, compact = false }) {
  const config = tierConfig[tier] || tierConfig.bronze;
  const Icon = config.icon;
  
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r ${config.gradient}`}>
        <Icon className="w-3 h-3 text-black" />
        <span className="text-xs font-semibold text-black">{config.text}</span>
      </div>
    );
  }
  
  const nextTier = tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : tier === 'gold' ? 'platinum' : null;
  const nextTierConfig = nextTier ? tierConfig[nextTier] : null;
  const progressToNext = nextTierConfig 
    ? Math.min(100, ((totalSpent - config.minSpend) / (nextTierConfig.minSpend - config.minSpend)) * 100)
    : 100;
  
  return (
    <div className="bg-[#111827] rounded-xl p-4 border border-[#1F2937]">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-black" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{config.text} Member</h3>
          <p className="text-[#2DD4BF] text-sm">{config.benefit}</p>
        </div>
      </div>
      
      {nextTierConfig && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-[#9CA3AF] mb-1">
            <span>R{totalSpent.toLocaleString()} spent</span>
            <span>R{nextTierConfig.minSpend.toLocaleString()} for {nextTierConfig.text}</span>
          </div>
          <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${nextTierConfig.gradient}`}
              style={{ width: `${progressToNext}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}