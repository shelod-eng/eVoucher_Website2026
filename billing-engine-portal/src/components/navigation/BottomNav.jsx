import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ShoppingBag, Trophy, Gift, User } from 'lucide-react';

export default function BottomNav({ activePage = 'Home' }) {
  const navItems = [
    { name: 'Home', icon: Home, page: 'ConsumerHome', color: '#00A89D' },
    { name: 'Shop', icon: ShoppingBag, page: 'Shop', color: '#E85D04' },
    { name: 'Challenges', icon: Trophy, page: 'Challenges', color: '#9333EA' },
    { name: 'Rewards', icon: Gift, page: 'Rewards', color: '#F59E0B' },
    { name: 'Profile', icon: User, page: 'Profile', color: '#3B82F6' },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.page;
          return (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              className="flex flex-col items-center py-2 px-3 rounded-lg transition-all"
            >
              <div 
                className={`p-2 rounded-full ${isActive ? 'ring-2 ring-offset-1' : ''}`}
                style={{ 
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                  ringColor: item.color
                }}
              >
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <span 
                className="text-xs mt-1 font-medium"
                style={{ color: item.color }}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}