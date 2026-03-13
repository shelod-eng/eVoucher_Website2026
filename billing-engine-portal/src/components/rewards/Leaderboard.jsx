import React from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

export default function Leaderboard({ users = [], currentUserId }) {
  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-gray-500 font-bold text-sm">{rank}</span>;
    }
  };

  const getRankBg = (rank) => {
    switch(rank) {
      case 1: return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2: return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3: return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
      default: return 'bg-white border-gray-100';
    }
  };

  return (
    <div className="space-y-2">
      {users.slice(0, 10).map((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.id === currentUserId;
        
        return (
          <Card 
            key={user.id || index} 
            className={`p-3 rounded-xl border ${getRankBg(rank)} ${isCurrentUser ? 'ring-2 ring-[#00A89D]' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                {getRankIcon(rank)}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A89D] to-[#00A89D]/70 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">
                  {user.name || 'Anonymous'}
                  {isCurrentUser && <span className="text-[#00A89D] ml-1">(You)</span>}
                </p>
                <p className="text-gray-500 text-xs">{user.badgeCount || 0} badges</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#00A89D]">{(user.points || 0).toLocaleString()}</p>
                <p className="text-gray-400 text-xs">points</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}