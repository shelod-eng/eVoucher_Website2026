import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, User, History, CreditCard, Bell, Settings, 
  HelpCircle, Shield, LogOut, ChevronRight, Gift, Users, Phone
} from 'lucide-react';

export default function Profile() {
  const { data: profiles = [] } = useQuery({
    queryKey: ['consumerProfile'],
    queryFn: () => base44.entities.ConsumerProfile.list(),
  });

  const profile = profiles[0] || { 
    fullName: 'Demo User', 
    email: 'demo@evoucher.co.za',
    phone: '082 000 0000',
    rewardsTier: 'bronze', 
    totalSpent: 0,
    referralCount: 0
  };

  const menuItems = [
    { icon: History, label: 'Transaction History', page: 'TransactionHistory' },
    { icon: CreditCard, label: 'Payment Methods', page: 'PaymentMethods' },
    { icon: Bell, label: 'Notifications', page: 'Notifications' },
    { icon: Settings, label: 'Settings', page: 'Settings' },
    { icon: HelpCircle, label: 'Help & Support', page: 'HelpSupport' },
    { icon: Shield, label: 'Privacy & Security', page: 'PrivacySecurity' },
  ];

  return (
    <MobileContainer>
      <div className="pb-24">
        {/* Header */}
        <div className="bg-[#00A89D] pt-6 pb-16 px-4 rounded-b-[32px]">
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl('ConsumerHome')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">My Profile</h1>
          </div>
        </div>

        {/* Profile Card */}
        <div className="px-4 -mt-10">
          <Card className="bg-white rounded-2xl p-5 shadow-lg border-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-[#00A89D]/10 flex items-center justify-center">
                <User className="w-8 h-8 text-[#00A89D]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
                <p className="text-gray-500 text-sm">{profile.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Gift className="w-4 h-4 text-[#00A89D]" />
                  <span className="text-[#00A89D] text-sm font-medium capitalize">{profile.rewardsTier} Member</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-gray-900 font-bold text-lg">R{profile.totalSpent?.toLocaleString() || 0}</p>
                <p className="text-gray-500 text-xs">Total Spent</p>
              </div>
              <div className="text-center border-x border-gray-100">
                <p className="text-gray-900 font-bold text-lg">{profile.referralCount || 0}</p>
                <p className="text-gray-500 text-xs">Referrals</p>
              </div>
              <div className="text-center">
                <p className="text-gray-900 font-bold text-lg capitalize">{profile.rewardsTier}</p>
                <p className="text-gray-500 text-xs">Tier</p>
              </div>
            </div>
          </Card>
        </div>

        {/* USSD Info */}
        <div className="px-4 mt-4">
          <Card className="bg-blue-50 rounded-xl p-4 border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-blue-900 font-medium text-sm">USSD Access: *120*384#</p>
                <p className="text-blue-600 text-xs">Manage your account without internet</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="px-4 mt-6">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} to={createPageUrl(item.page)}>
                  <Card className="bg-white rounded-xl p-4 border border-gray-100 hover:border-[#00A89D]/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <span className="text-gray-900 font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Logout */}
        <div className="px-4 mt-6">
          <button className="w-full flex items-center justify-center gap-2 py-3 text-red-500 font-medium">
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>

        {/* App Info */}
        <div className="px-4 mt-4 text-center">
          <p className="text-gray-400 text-xs">eVoucher v1.0.0</p>
          <p className="text-gray-400 text-xs">3P's Social Business Model © 2025</p>
        </div>
      </div>
      <BottomNav activePage="Profile" />
    </MobileContainer>
  );
}