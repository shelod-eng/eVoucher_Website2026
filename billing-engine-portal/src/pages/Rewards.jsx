import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import GoldButton from '@/components/ui/GoldButton';
import BadgeCard, { badgeConfig } from '@/components/rewards/BadgeCard';
import Leaderboard from '@/components/rewards/Leaderboard';
import RewardCard from '@/components/rewards/RewardCard';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Star, Crown, Gem, Award, Gift, Trophy, ShoppingBag, Check, Sparkles } from 'lucide-react';

const tiers = [
  { id: 'bronze', name: 'Bronze', icon: Award, color: 'from-amber-600 to-amber-700', minSpend: 0, discount: 4, pointsMultiplier: 1 },
  { id: 'silver', name: 'Silver', icon: Star, color: 'from-gray-400 to-gray-500', minSpend: 2000, discount: 5, pointsMultiplier: 1.5 },
  { id: 'gold', name: 'Gold', icon: Crown, color: 'from-yellow-500 to-yellow-600', minSpend: 5000, discount: 6, pointsMultiplier: 2 },
  { id: 'platinum', name: 'Platinum', icon: Gem, color: 'from-purple-500 to-purple-600', minSpend: 10000, discount: 8, pointsMultiplier: 3 }
];

// Bonus point merchants
const bonusMerchants = [
  { name: 'Shoprite', bonus: '2x' },
  { name: 'Clicks', bonus: '3x' },
  { name: 'Pick n Pay', bonus: '2x' }
];

export default function Rewards() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['consumerProfile'],
    queryFn: () => base44.entities.ConsumerProfile.list(),
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list(),
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['pointsRewards'],
    queryFn: () => base44.entities.PointsReward.filter({ status: 'active' }),
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => base44.entities.ConsumerProfile.list('-rewardsPoints', 10),
  });

  const profile = profiles[0] || { totalSpent: 0, rewardsTier: 'bronze', rewardsPoints: 250 };
  const currentTier = tiers.find(t => t.id === profile.rewardsTier) || tiers[0];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];
  
  const progress = nextTier 
    ? Math.min(100, ((profile.totalSpent - currentTier.minSpend) / (nextTier.minSpend - currentTier.minSpend)) * 100)
    : 100;

  const earnedBadgeTypes = badges.map(b => b.badgeType);
  const allBadgeTypes = Object.keys(badgeConfig);

  const leaderboardUsers = allProfiles.map(p => ({
    id: p.id,
    name: p.fullName || 'Anonymous',
    points: p.rewardsPoints || 0,
    badgeCount: badges.filter(b => b.userId === p.userId).length
  }));

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      const code = 'RW' + Math.random().toString(36).substr(2, 8).toUpperCase();
      await base44.entities.PointsRedemption.create({
        rewardId: reward.id,
        rewardName: reward.name,
        pointsSpent: reward.pointsCost,
        redemptionCode: code,
        status: 'pending'
      });
      // In real app, would deduct points from profile
    },
    onSuccess: () => {
      setRedeemSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['consumerProfile'] });
    }
  });

  const handleRedeem = (reward) => {
    setSelectedReward(reward);
    setRedeemSuccess(false);
    setShowRedeemDialog(true);
  };

  const confirmRedeem = () => {
    redeemMutation.mutate(selectedReward);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Star },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'store', label: 'Store', icon: Gift },
    { id: 'leaderboard', label: 'Top Users', icon: Trophy }
  ];

  return (
    <MobileContainer>
      <div className="pb-24">
        {/* Header */}
        <div className={`bg-gradient-to-r ${currentTier.color} pt-6 pb-16 px-4 rounded-b-[32px]`}>
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl('ConsumerHome')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">Rewards</h1>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-2">
              <currentTier.icon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{currentTier.name} Member</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Sparkles className="w-5 h-5 text-white/80" />
              <span className="text-2xl font-bold text-white">{(profile.rewardsPoints || 250).toLocaleString()}</span>
              <span className="text-white/80">points</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 -mt-6">
          <Card className="bg-white rounded-2xl p-2 shadow-lg border-0 mb-4">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                      activeTab === tab.id 
                        ? 'bg-[#00A89D] text-white' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="px-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Progress to next tier */}
              {nextTier && (
                <Card className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 text-sm">Progress to {nextTier.name}</span>
                    <span className="text-gray-900 font-medium text-sm">R{profile.totalSpent?.toLocaleString() || 0} / R{nextTier.minSpend.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${nextTier.color} rounded-full transition-all`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[#00A89D] text-xs mt-2">
                    Earn {nextTier.pointsMultiplier}x points at {nextTier.name} tier!
                  </p>
                </Card>
              )}

              {/* Bonus Points Section */}
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 border-0">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Bonus Point Merchants
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {bonusMerchants.map((m) => (
                    <div key={m.name} className="bg-white/20 rounded-lg px-3 py-2 flex-shrink-0">
                      <p className="text-white font-medium text-sm">{m.name}</p>
                      <p className="text-white/80 text-xs">{m.bonus} points</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent Badges */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-900">Your Badges</h3>
                  <button onClick={() => setActiveTab('badges')} className="text-[#00A89D] text-sm font-medium">
                    View All
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {allBadgeTypes.slice(0, 6).map((type) => (
                    <BadgeCard 
                      key={type} 
                      badgeType={type} 
                      earned={earnedBadgeTypes.includes(type)}
                      compact 
                    />
                  ))}
                </div>
              </div>

              {/* How to earn points */}
              <Card className="bg-gray-50 rounded-xl p-4 border-0">
                <h3 className="font-bold text-gray-900 mb-3">How to Earn Points</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Every R10 spent</span>
                    <span className="text-[#00A89D] font-medium">+10 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refer a friend</span>
                    <span className="text-[#00A89D] font-medium">+100 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">First purchase</span>
                    <span className="text-[#00A89D] font-medium">+50 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily login streak</span>
                    <span className="text-[#00A89D] font-medium">+5 points/day</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-[#00A89D]" />
                <span className="text-gray-900 font-medium">
                  {earnedBadgeTypes.length} / {allBadgeTypes.length} earned
                </span>
              </div>
              {allBadgeTypes.map((type) => {
                const badge = badges.find(b => b.badgeType === type);
                return (
                  <BadgeCard 
                    key={type} 
                    badgeType={type} 
                    earned={earnedBadgeTypes.includes(type)}
                    earnedDate={badge?.earnedDate}
                  />
                );
              })}
            </div>
          )}

          {/* Store Tab */}
          {activeTab === 'store' && (
            <div className="space-y-4">
              <Card className="bg-[#00A89D]/10 rounded-xl p-3 border border-[#00A89D]/20">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Your Points</span>
                  <span className="font-bold text-[#00A89D] text-lg">{(profile.rewardsPoints || 250).toLocaleString()}</span>
                </div>
              </Card>

              {rewards.length === 0 ? (
                <>
                  {/* Default rewards if none in DB */}
                  <RewardCard 
                    reward={{ id: '1', name: 'Free Coffee', description: 'Enjoy a free coffee at any Vida e Caffè', pointsCost: 200, category: 'food', merchantName: 'Vida e Caffè' }}
                    userPoints={profile.rewardsPoints || 250}
                    onRedeem={handleRedeem}
                  />
                  <RewardCard 
                    reward={{ id: '2', name: 'R10 Off', description: 'R10 discount on your next voucher purchase', pointsCost: 100, category: 'discount' }}
                    userPoints={profile.rewardsPoints || 250}
                    onRedeem={handleRedeem}
                  />
                  <RewardCard 
                    reward={{ id: '3', name: 'R25 Bonus Voucher', description: 'Free R25 voucher for any merchant', pointsCost: 500, category: 'voucher' }}
                    userPoints={profile.rewardsPoints || 250}
                    onRedeem={handleRedeem}
                  />
                  <RewardCard 
                    reward={{ id: '4', name: 'Double Points Day', description: 'Earn 2x points on your next purchase', pointsCost: 150, category: 'experience' }}
                    userPoints={profile.rewardsPoints || 250}
                    onRedeem={handleRedeem}
                  />
                </>
              ) : (
                rewards.map((reward) => (
                  <RewardCard 
                    key={reward.id}
                    reward={reward}
                    userPoints={profile.rewardsPoints || 250}
                    onRedeem={handleRedeem}
                  />
                ))
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-gray-900">Top Point Earners</h3>
              </div>
              {leaderboardUsers.length === 0 ? (
                <Leaderboard 
                  users={[
                    { id: '1', name: 'Thabo M.', points: 2450, badgeCount: 5 },
                    { id: '2', name: 'Nomsa K.', points: 2100, badgeCount: 4 },
                    { id: '3', name: 'Sipho N.', points: 1850, badgeCount: 4 },
                    { id: '4', name: 'Lerato P.', points: 1620, badgeCount: 3 },
                    { id: '5', name: 'Bongani S.', points: 1400, badgeCount: 3 },
                    { id: 'current', name: 'You', points: profile.rewardsPoints || 250, badgeCount: earnedBadgeTypes.length }
                  ]}
                  currentUserId="current"
                />
              ) : (
                <Leaderboard users={leaderboardUsers} currentUserId={profile.userId} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Redeem Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {redeemSuccess ? 'Reward Redeemed!' : 'Confirm Redemption'}
            </DialogTitle>
          </DialogHeader>
          
          {redeemSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-900 font-bold mb-2">{selectedReward?.name}</p>
              <p className="text-gray-500 text-sm mb-4">Your reward code has been generated</p>
              <div className="bg-gray-100 rounded-xl p-4 mb-4">
                <p className="text-gray-500 text-xs">Redemption Code</p>
                <p className="text-gray-900 font-mono font-bold text-lg">RW{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
              </div>
              <GoldButton className="w-full" onClick={() => setShowRedeemDialog(false)}>Done</GoldButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-900 font-bold text-lg">{selectedReward?.name}</p>
                <p className="text-gray-500 text-sm">{selectedReward?.description}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Points Cost</span>
                  <span className="font-bold text-gray-900">{selectedReward?.pointsCost?.toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Your Balance After</span>
                  <span className="font-bold text-[#00A89D]">
                    {((profile.rewardsPoints || 250) - (selectedReward?.pointsCost || 0)).toLocaleString()} pts
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <GoldButton variant="outline" className="flex-1" onClick={() => setShowRedeemDialog(false)}>
                  Cancel
                </GoldButton>
                <GoldButton className="flex-1" onClick={confirmRedeem}>
                  Confirm
                </GoldButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav activePage="Rewards" />
    </MobileContainer>
  );
}