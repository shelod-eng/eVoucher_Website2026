import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Flame, Users, Gift, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Challenges() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('active');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      const profiles = await base44.entities.ConsumerProfile.filter({ email: userData.email });
      return profiles[0] || { email: userData.email, rewardsPoints: 0 };
    },
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.SavingsChallenge.filter({ status: 'active' }),
  });

  const { data: userChallenges = [] } = useQuery({
    queryKey: ['userChallenges', user?.email],
    queryFn: () => base44.entities.UserChallenge.filter({ userEmail: user?.email }),
    enabled: !!user?.email,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const profiles = await base44.entities.ConsumerProfile.list('-totalSpent', 10);
      return profiles.map((p, idx) => ({
        ...p,
        rank: idx + 1,
        savings: (p.totalSpent || 0) * 0.056
      }));
    },
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challenge) => {
      return await base44.entities.UserChallenge.create({
        userId: user.id,
        userEmail: user.email,
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        target: challenge.targetAmount || challenge.targetTransactions || challenge.targetDays || 0,
        progress: 0,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userChallenges']);
    },
  });

  const getChallengeIcon = (type) => {
    switch(type) {
      case 'weekly_goal': return Target;
      case 'monthly_goal': return Trophy;
      case 'streak': return Flame;
      case 'milestone': return Award;
      case 'community': return Users;
      default: return Target;
    }
  };

  const getChallengeColor = (type) => {
    switch(type) {
      case 'weekly_goal': return 'from-blue-500 to-cyan-600';
      case 'monthly_goal': return 'from-purple-500 to-pink-600';
      case 'streak': return 'from-orange-500 to-red-600';
      case 'milestone': return 'from-green-500 to-emerald-600';
      case 'community': return 'from-yellow-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const isJoined = (challengeId) => {
    return userChallenges.some(uc => uc.challengeId === challengeId && uc.status === 'active');
  };

  const getUserProgress = (challengeId) => {
    return userChallenges.find(uc => uc.challengeId === challengeId && uc.status === 'active');
  };

  return (
    <MobileContainer>
      <div className="pb-24 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-b-[40px]">
          <h1 className="text-2xl font-bold text-white mb-2">Savings Challenges</h1>
          <p className="text-white/80 text-sm">Level up your savings game!</p>
          
          <div className="mt-4 flex gap-3">
            <div className="bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <div>
                <p className="text-white/70 text-xs">Your Points</p>
                <p className="text-white font-bold">{user?.rewardsPoints || 0}</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-300" />
              <div>
                <p className="text-white/70 text-xs">Rank</p>
                <p className="text-white font-bold">#{leaderboard.findIndex(l => l.email === user?.email) + 1 || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            {/* Active Challenges */}
            <TabsContent value="active" className="space-y-4">
              <AnimatePresence>
                {challenges.map((challenge, idx) => {
                  const Icon = getChallengeIcon(challenge.type);
                  const userProgress = getUserProgress(challenge.id);
                  const progressPercent = userProgress ? (userProgress.progress / userProgress.target) * 100 : 0;
                  
                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="overflow-hidden">
                        <div className={`bg-gradient-to-r ${getChallengeColor(challenge.type)} p-4 text-white`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="w-6 h-6" />
                              <h3 className="font-bold text-lg">{challenge.title}</h3>
                            </div>
                            {challenge.badgeIcon && <span className="text-2xl">{challenge.badgeIcon}</span>}
                          </div>
                          <p className="text-white/90 text-sm">{challenge.description}</p>
                        </div>
                        
                        <div className="p-4">
                          {userProgress ? (
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-bold text-purple-600">
                                  {userProgress.progress} / {userProgress.target}
                                </span>
                              </div>
                              <Progress value={progressPercent} className="mb-3" />
                              
                              {progressPercent >= 100 ? (
                                <Badge className="bg-green-500 text-white">Completed! 🎉</Badge>
                              ) : (
                                <p className="text-sm text-gray-600">
                                  {(userProgress.target - userProgress.progress).toFixed(0)} more to go!
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Rewards</p>
                                <div className="flex gap-2">
                                  {challenge.rewardPoints > 0 && (
                                    <Badge className="bg-purple-100 text-purple-700">
                                      +{challenge.rewardPoints} pts
                                    </Badge>
                                  )}
                                  {challenge.rewardBonus > 0 && (
                                    <Badge className="bg-green-100 text-green-700">
                                      +R{challenge.rewardBonus}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <GoldButton
                                onClick={() => joinChallengeMutation.mutate(challenge)}
                                disabled={isJoined(challenge.id)}
                                className="text-sm"
                              >
                                {isJoined(challenge.id) ? 'Joined' : 'Join Challenge'}
                              </GoldButton>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {challenges.length === 0 && (
                <Card className="p-8 text-center">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No active challenges at the moment</p>
                  <p className="text-gray-400 text-sm mt-2">Check back soon for new challenges!</p>
                </Card>
              )}
            </TabsContent>

            {/* Leaderboard */}
            <TabsContent value="leaderboard" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Top Savers</h3>
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                
                <div className="space-y-3">
                  {leaderboard.map((leader, idx) => (
                    <div
                      key={leader.id}
                      className={`flex items-center gap-4 p-3 rounded-xl ${
                        leader.email === user?.email ? 'bg-purple-50 border-2 border-purple-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-yellow-400 text-white' :
                        idx === 1 ? 'bg-gray-300 text-white' :
                        idx === 2 ? 'bg-orange-400 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {idx + 1}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {leader.fullName || 'User'}
                          {leader.email === user?.email && ' (You)'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Saved R{leader.savings.toFixed(0)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-gray-500 capitalize">{leader.rewardsTier} tier</p>
                        <p className="font-bold text-[#00A89D]">{leader.rewardsPoints || 0} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-200">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                  <h4 className="font-bold text-gray-900">Climb the Ranks!</h4>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Keep saving to move up the leaderboard. Top 10 savers get exclusive rewards each month!
                </p>
                <Link to={createPageUrl('Shop')}>
                  <GoldButton className="w-full text-sm">
                    Start Saving Now
                  </GoldButton>
                </Link>
              </Card>
            </TabsContent>

            {/* Rewards */}
            <TabsContent value="rewards" className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">Your Points</h3>
                  <Gift className="w-8 h-8" />
                </div>
                <p className="text-5xl font-black mb-2">{user?.rewardsPoints || 0}</p>
                <p className="text-white/80 text-sm">Available to redeem</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Referral Rewards</h3>
                <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-xl p-4 mb-4 border border-teal-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">Your Referral Code</p>
                      <p className="text-2xl font-black text-[#00A89D] tracking-wider">
                        {user?.referralCode || 'EV' + Math.random().toString(36).substr(2, 6).toUpperCase()}
                      </p>
                    </div>
                    <Users className="w-10 h-10 text-[#00A89D]" />
                  </div>
                  <p className="text-sm text-gray-700">
                    Share with friends and both get <span className="font-bold text-green-600">R20 bonus</span> + 
                    <span className="font-bold text-purple-600"> 100 points</span>!
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Friends referred</span>
                    <span className="font-bold text-[#00A89D]">{user?.referralCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Total earned</span>
                    <span className="font-bold text-green-600">R{user?.referralEarnings || 0}</span>
                  </div>
                </div>

                <Link to={createPageUrl('ConsumerHome')}>
                  <GoldButton className="w-full mt-4">
                    Share Your Code
                  </GoldButton>
                </Link>
              </Card>

              <Link to={createPageUrl('Rewards')}>
                <Card className="p-4 flex items-center justify-between hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">View All Rewards</p>
                      <p className="text-sm text-gray-500">Redeem your points</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Card>
              </Link>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <BottomNav activePage="Challenges" />
    </MobileContainer>
  );
}