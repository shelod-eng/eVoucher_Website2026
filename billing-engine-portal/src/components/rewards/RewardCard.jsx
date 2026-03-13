import React from 'react';
import { Card } from '@/components/ui/card';
import GoldButton from '@/components/ui/GoldButton';
import { Coffee, Percent, Gift, Star } from 'lucide-react';

const categoryIcons = {
  food: Coffee,
  discount: Percent,
  voucher: Gift,
  experience: Star
};

const categoryColors = {
  food: 'from-amber-400 to-amber-600',
  discount: 'from-green-400 to-green-600',
  voucher: 'from-purple-400 to-purple-600',
  experience: 'from-pink-400 to-pink-600'
};

export default function RewardCard({ reward, userPoints = 0, onRedeem }) {
  const Icon = categoryIcons[reward.category] || Gift;
  const colorGradient = categoryColors[reward.category] || 'from-gray-400 to-gray-600';
  const canAfford = userPoints >= reward.pointsCost;

  return (
    <Card className="bg-white rounded-xl overflow-hidden border border-gray-100">
      <div className={`bg-gradient-to-r ${colorGradient} p-4`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold">{reward.name}</h3>
            {reward.merchantName && (
              <p className="text-white/80 text-xs">{reward.merchantName}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs">Cost</p>
            <p className="font-bold text-gray-900">{reward.pointsCost.toLocaleString()} pts</p>
          </div>
          <GoldButton 
            size="sm" 
            onClick={() => onRedeem(reward)}
            disabled={!canAfford}
            className={!canAfford ? 'opacity-50' : ''}
          >
            {canAfford ? 'Redeem' : 'Not enough'}
          </GoldButton>
        </div>
      </div>
    </Card>
  );
}