import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import GoldButton from '@/components/ui/GoldButton';
import { ArrowLeft, Bell, Gift, AlertCircle, TrendingUp, Wallet, Sparkles, Users, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const notificationTypes = [
  {
    key: 'newOffers',
    label: 'New Offers & Deals',
    description: 'Get notified about exclusive offers and promotions',
    icon: Gift,
    color: 'text-purple-600 bg-purple-50',
  },
  {
    key: 'expiringVouchers',
    label: 'Expiring Vouchers',
    description: 'Reminders before your vouchers expire',
    icon: AlertCircle,
    color: 'text-orange-600 bg-orange-50',
  },
  {
    key: 'pointsUpdates',
    label: 'Points Balance Updates',
    description: 'Updates when you earn or spend points',
    icon: TrendingUp,
    color: 'text-green-600 bg-green-50',
  },
  {
    key: 'lowBalance',
    label: 'Low Wallet Balance',
    description: 'Alert when your wallet balance is running low',
    icon: Wallet,
    color: 'text-red-600 bg-red-50',
  },
  {
    key: 'tierUpgrades',
    label: 'Tier Upgrades',
    description: 'Celebrate when you reach a new rewards tier',
    icon: Sparkles,
    color: 'text-yellow-600 bg-yellow-50',
  },
  {
    key: 'referralSuccess',
    label: 'Referral Success',
    description: 'Know when friends join using your code',
    icon: Users,
    color: 'text-blue-600 bg-blue-50',
  },
];

export default function NotificationSettings() {
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['consumerProfile'],
    queryFn: () => base44.entities.ConsumerProfile.list(),
  });

  const profile = profiles[0] || {};
  const [preferences, setPreferences] = useState(
    profile.notificationPreferences || {
      newOffers: true,
      expiringVouchers: true,
      pointsUpdates: true,
      lowBalance: true,
      tierUpgrades: true,
      referralSuccess: true,
    }
  );

  const updatePreferencesMutation = useMutation({
    mutationFn: (newPreferences) =>
      base44.entities.ConsumerProfile.update(profile.id, {
        notificationPreferences: newPreferences,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumerProfile'] });
      toast.success('Notification preferences saved!');
    },
  });

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  const allEnabled = Object.values(preferences).every((v) => v);

  const toggleAll = () => {
    const newState = !allEnabled;
    const newPreferences = Object.keys(preferences).reduce((acc, key) => {
      acc[key] = newState;
      return acc;
    }, {});
    setPreferences(newPreferences);
  };

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00A89D] to-[#00C4B8] pt-6 pb-8 px-4 rounded-b-3xl shadow-lg">
          <Link to={createPageUrl('Notifications')}>
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
              <p className="text-white/90 text-sm">Manage your preferences</p>
            </div>
          </div>
        </div>

        {/* Master Toggle */}
        <div className="px-4 mt-6">
          <Card className="bg-white p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">All Notifications</h3>
                <p className="text-sm text-gray-500">
                  {allEnabled ? 'Turn off all notifications' : 'Turn on all notifications'}
                </p>
              </div>
              <Switch checked={allEnabled} onCheckedChange={toggleAll} />
            </div>
          </Card>
        </div>

        {/* Individual Preferences */}
        <div className="px-4 mt-4 space-y-3">
          {notificationTypes.map((type, idx) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="font-semibold text-gray-900">{type.label}</h3>
                          <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                        </div>
                        <Switch
                          checked={preferences[type.key]}
                          onCheckedChange={() => handleToggle(type.key)}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="px-4 mt-6">
          <GoldButton
            className="w-full h-12"
            onClick={handleSave}
            disabled={updatePreferencesMutation.isPending}
          >
            <Save className="w-5 h-5 mr-2" />
            {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </GoldButton>
        </div>

        {/* Info Card */}
        <div className="px-4 mt-4">
          <Card className="bg-blue-50 border-blue-200 p-4">
            <p className="text-sm text-blue-900">
              💡 <span className="font-semibold">Tip:</span> You can always change these settings later. 
              We'll only send you notifications that matter to you.
            </p>
          </Card>
        </div>
      </div>
    </MobileContainer>
  );
}