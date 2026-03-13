import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, BellOff, Settings, Gift, AlertCircle, TrendingUp, Wallet, Users, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

const notificationIcons = {
  new_offer: Gift,
  expiring_voucher: AlertCircle,
  points_update: TrendingUp,
  low_balance: Wallet,
  tier_upgrade: Sparkles,
  referral_success: Users,
};

const notificationColors = {
  new_offer: 'text-purple-600 bg-purple-50',
  expiring_voucher: 'text-orange-600 bg-orange-50',
  points_update: 'text-green-600 bg-green-50',
  low_balance: 'text-red-600 bg-red-50',
  tier_upgrade: 'text-yellow-600 bg-yellow-50',
  referral_success: 'text-blue-600 bg-blue-50',
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // all, unread

  const { data: profiles = [] } = useQuery({
    queryKey: ['consumerProfile'],
    queryFn: () => base44.entities.ConsumerProfile.list(),
  });

  const profile = profiles[0];

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', profile?.email],
    queryFn: () => base44.entities.Notification.filter({ userEmail: profile.email }, '-created_date'),
    enabled: !!profile?.email,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => base44.entities.Notification.update(n.id, { read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00A89D] to-[#00C4B8] pt-6 pb-8 px-4 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Link to={createPageUrl('ConsumerHome')}>
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <Link to={createPageUrl('NotificationSettings')}>
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </button>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-white/90 text-sm">{unreadCount} unread</p>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-4 flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-[#00A89D] text-white' : ''}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            className={filter === 'unread' ? 'bg-[#00A89D] text-white' : ''}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              className="ml-auto text-sm text-[#00A89D]"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="px-4 space-y-3">
          <AnimatePresence>
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-white p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <BellOff className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500 text-sm">
                    {filter === 'unread' ? "You're all caught up!" : "You'll see updates here when they arrive"}
                  </p>
                </Card>
              </motion.div>
            ) : (
              filteredNotifications.map((notification, idx) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const colorClass = notificationColors[notification.type] || 'text-gray-600 bg-gray-50';

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link 
                      to={notification.actionUrl ? createPageUrl(notification.actionUrl) : '#'}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <Card className={`p-4 ${!notification.read ? 'bg-blue-50/50 border-blue-200' : 'bg-white'} hover:shadow-md transition-all`}>
                        <div className="flex gap-3">
                          <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className={`font-semibold text-gray-900 ${!notification.read ? 'font-bold' : ''}`}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <Badge className="bg-[#00A89D] text-white text-xs">New</Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-gray-400 text-xs">
                                {moment(notification.created_date).fromNow()}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteNotificationMutation.mutate(notification.id);
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
      <BottomNav activePage="Notifications" />
    </MobileContainer>
  );
}