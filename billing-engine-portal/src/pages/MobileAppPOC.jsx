import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, ArrowLeft, Bell, Wallet, Gift, CreditCard, Sparkles, Users, TrendingUp, BarChart3, Phone, Brain, ShoppingBag, Star } from 'lucide-react';

const renderFeatureVisual = (feature, Icon) => {
  switch(feature.screenshot) {
    case 'membership-card':
      return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
          <div className="bg-gradient-to-r from-[#00A89D] to-[#00C4B8] p-4 pb-16">
            <div className="text-white text-lg font-bold mb-1">Membership Card</div>
            <div className="text-white/80 text-sm">Gold Member</div>
          </div>
          <div className="px-4 -mt-12">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-white text-xs mb-1">MEMBER NAME</div>
                  <div className="text-white font-bold text-lg">John Doe</div>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 px-3 py-1 rounded-full text-white text-xs font-bold">GOLD</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 mt-4">
                <div className="flex gap-1 justify-center mb-2">
                  {[...Array(13)].map((_, i) => (
                    <div key={i} className="w-1 bg-gray-800" style={{ height: i % 2 ? '24px' : '32px' }}></div>
                  ))}
                </div>
                <div className="text-center text-xs text-gray-600 font-mono">1234567890123</div>
              </div>
            </div>
            <div className="mt-4 bg-white rounded-xl p-4">
              <div className="text-sm font-bold text-gray-900 mb-2">Accepted At</div>
              <div className="grid grid-cols-4 gap-2">
                {['Shoprite', 'Checkers', 'Mr Price', 'Edgars'].map(name => (
                  <div key={name} className="bg-gray-100 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-600">{name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    
    case 'notifications':
      return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
          <div className="bg-gradient-to-r from-[#00A89D] to-[#00C4B8] p-4">
            <div className="text-white text-lg font-bold">Notifications</div>
            <div className="text-white/80 text-sm">3 unread</div>
          </div>
          <div className="p-4 space-y-3">
            {[
              { title: 'New Offer Available!', msg: 'Save 10% on Shoprite vouchers', color: 'from-purple-500 to-indigo-600', badge: true },
              { title: 'Voucher Expiring Soon', msg: 'R200 voucher expires in 3 days', color: 'from-orange-500 to-red-600', badge: true },
              { title: 'Points Updated', msg: 'You earned 50 points!', color: 'from-green-500 to-emerald-600', badge: false }
            ].map((notif, i) => (
              <div key={i} className={`bg-white rounded-xl p-3 shadow-sm ${notif.badge ? 'border-l-4 border-blue-500' : ''}`}>
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${notif.color} flex-shrink-0`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-sm">{notif.title}</div>
                      {notif.badge && <div className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded">New</div>}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{notif.msg}</div>
                    <div className="text-xs text-gray-400 mt-1">2 hours ago</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    
    case 'notification-settings':
      return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
          <div className="bg-gradient-to-r from-[#00A89D] to-[#00C4B8] p-4">
            <div className="text-white text-lg font-bold">Notification Settings</div>
            <div className="text-white/80 text-sm">Manage preferences</div>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'New Offers & Deals', color: 'text-purple-600 bg-purple-50' },
              { label: 'Expiring Vouchers', color: 'text-orange-600 bg-orange-50' },
              { label: 'Points Updates', color: 'text-green-600 bg-green-50' },
              { label: 'Low Balance Alerts', color: 'text-red-600 bg-red-50' }
            ].map((setting, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${setting.color} flex-shrink-0`}></div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{setting.label}</div>
                  </div>
                  <div className="w-10 h-6 bg-[#00A89D] rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    
    case 'wallet':
      return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
          <div className="bg-gradient-to-r from-[#00A89D] to-[#00C4B8] p-4 pb-16">
            <div className="text-white text-lg font-bold">My Wallet</div>
          </div>
          <div className="px-4 -mt-12">
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="text-gray-500 text-sm mb-1">Available Balance</div>
              <div className="text-4xl font-bold text-gray-900 mb-6">R1,250.00</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#00A89D] text-white rounded-lg py-2 text-center text-xs font-bold">Add Funds</div>
                <div className="border-2 border-[#00A89D] text-[#00A89D] rounded-lg py-2 text-center text-xs font-bold">Send</div>
                <div className="border-2 border-[#00A89D] text-[#00A89D] rounded-lg py-2 text-center text-xs font-bold">History</div>
              </div>
            </div>
            <div className="mt-4 bg-white rounded-xl p-4">
              <div className="text-sm font-bold mb-3">Recent Transactions</div>
              {[
                { desc: 'Shoprite Voucher', amt: '-R100', date: 'Today' },
                { desc: 'Wallet Top Up', amt: '+R500', date: 'Yesterday' },
                { desc: 'Checkers Voucher', amt: '-R200', date: '2 days ago' }
              ].map((tx, i) => (
                <div key={i} className="flex justify-between py-2 border-b">
                  <div>
                    <div className="text-sm font-medium">{tx.desc}</div>
                    <div className="text-xs text-gray-500">{tx.date}</div>
                  </div>
                  <div className={`font-bold ${tx.amt.startsWith('+') ? 'text-green-600' : 'text-gray-900'}`}>{tx.amt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    
    case 'ai-insights':
      return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
            <div className="text-white text-lg font-bold">AI Insights</div>
            <div className="text-white/80 text-sm">Smart savings predictions</div>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm font-bold mb-2">💰 Total Saved This Month</div>
              <div className="text-3xl font-bold text-[#00A89D]">R240</div>
              <div className="text-xs text-gray-500 mt-1">4% savings on R6,000 spent</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm font-bold mb-3">📊 Spending by Category</div>
              <div className="space-y-2">
                {[
                  { cat: 'Groceries', pct: 60, color: 'bg-green-500' },
                  { cat: 'Fashion', pct: 25, color: 'bg-purple-500' },
                  { cat: 'Transport', pct: 15, color: 'bg-blue-500' }
                ].map(item => (
                  <div key={item.cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{item.cat}</span>
                      <span>{item.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="text-sm font-bold text-orange-900 mb-1">🎯 AI Prediction</div>
              <div className="text-xs text-orange-700">You could save R120 more by shopping on Wednesdays</div>
            </div>
          </div>
        </div>
      );
    
    case 'savings-tracker':
      return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-4">
            <div className="text-white text-lg font-bold">Savings Tracker</div>
            <div className="text-white/80 text-sm">Track your 4% savings</div>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-bold">This Month</div>
                <div className="text-xs text-gray-500">December 2025</div>
              </div>
              <div className="text-center py-6">
                <div className="text-5xl font-bold text-[#00A89D] mb-2">R240</div>
                <div className="text-sm text-gray-600">Total Saved</div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Week</div>
                  <div className="text-lg font-bold">R60</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Today</div>
                  <div className="text-lg font-bold">R12</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Avg/Day</div>
                  <div className="text-lg font-bold">R8</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm font-bold mb-3">📈 Savings Trend</div>
              <div className="flex items-end justify-between h-32 gap-1">
                {[20, 35, 28, 45, 38, 50, 42].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-[#00A89D] to-[#00C4B8] rounded-t" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Mon</span>
                <span>Sun</span>
              </div>
            </div>
          </div>
        </div>
      );
    
    case 'referral':
      return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-4">
          <div className="bg-gradient-to-r from-[#00A89D] to-[#00C4B8] rounded-2xl p-6 shadow-xl text-white mb-4">
            <div className="text-lg font-bold mb-2">Your Referral Code</div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center mb-3">
              <div className="text-3xl font-black tracking-wider">EV2K9X</div>
            </div>
            <div className="text-sm">Earn R20 for every friend who joins!</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm mb-3">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-bold">Your Referrals</div>
              <div className="bg-[#00A89D]/10 text-[#00A89D] px-3 py-1 rounded-full text-xs font-bold">5 Friends</div>
            </div>
            {[
              { name: 'Sarah M.', amt: 'R20', status: 'Joined' },
              { name: 'John D.', amt: 'R20', status: 'Joined' },
              { name: 'Mike K.', amt: 'Pending', status: 'Invited' }
            ].map((ref, i) => (
              <div key={i} className="flex justify-between py-2 border-b">
                <div>
                  <div className="text-sm font-medium">{ref.name}</div>
                  <div className="text-xs text-gray-500">{ref.status}</div>
                </div>
                <div className={`font-bold ${ref.amt === 'Pending' ? 'text-gray-400' : 'text-green-600'}`}>{ref.amt}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm font-bold mb-2">Total Earnings</div>
            <div className="text-3xl font-bold text-[#00A89D]">R100</div>
          </div>
        </div>
      );
    
    case 'shop':
      return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
          <div className="bg-gradient-to-r from-[#00A89D] to-[#00C4B8] p-4">
            <div className="text-white text-lg font-bold mb-3">Shop Vouchers</div>
            <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-2">
              <div className="text-white/60 text-sm">Search merchants...</div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Shoprite', value: 'R100', price: 'R96', color: 'from-red-500 to-red-600' },
                { name: 'Checkers', value: 'R200', price: 'R192', color: 'from-blue-500 to-blue-600' },
                { name: 'Mr Price', value: 'R150', price: 'R144', color: 'from-purple-500 to-purple-600' },
                { name: 'Edgars', value: 'R250', price: 'R240', color: 'from-green-500 to-green-600' }
              ].map((voucher, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className={`bg-gradient-to-br ${voucher.color} h-20 flex items-center justify-center`}>
                    <div className="text-white font-bold">{voucher.name}</div>
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-gray-500">Face Value</div>
                    <div className="text-lg font-bold">{voucher.value}</div>
                    <div className="text-xs text-green-600 font-bold mt-1">Pay {voucher.price}</div>
                    <div className="bg-[#00A89D] text-white text-center py-1.5 rounded-lg mt-2 text-xs font-bold">Buy Now</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    
    case 'rewards':
      return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
          <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-4">
            <div className="text-white text-lg font-bold">Rewards</div>
            <div className="text-white/80 text-sm">Earn points & badges</div>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold">Your Points</div>
                  <div className="text-3xl font-bold text-[#00A89D] mt-1">1,250</div>
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <div className="text-white text-2xl">⭐</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm font-bold mb-3">Achievements</div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { emoji: '🎯', name: 'First Purchase' },
                  { emoji: '💰', name: 'Big Spender' },
                  { emoji: '👥', name: 'Referrer' },
                  { emoji: '🔥', name: '7 Day Streak' }
                ].map((badge, i) => (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-xl">{badge.emoji}</span>
                    </div>
                    <div className="text-xs text-gray-600">{badge.name}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm font-bold mb-3">Current Tier</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500"></div>
                <div className="flex-1">
                  <div className="font-bold">Gold Member</div>
                  <div className="text-xs text-gray-500">500 points to Platinum</div>
                  <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    
    case 'ussd':
      return (
        <div className="h-full bg-gray-900 p-4">
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="text-green-400 font-mono text-sm mb-4">*120*384#</div>
            <div className="bg-black text-green-400 font-mono text-xs p-3 rounded">
              <div className="mb-2">eVoucher Menu</div>
              <div>1. Check Balance</div>
              <div>2. Buy Voucher</div>
              <div>3. My Vouchers</div>
              <div>4. Redeem</div>
              <div>5. Help</div>
              <div className="mt-3 text-yellow-400">Reply with option number</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm font-bold mb-2">📱 Feature Phone Support</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>✓ No smartphone needed</div>
              <div>✓ Works on any mobile phone</div>
              <div>✓ SMS confirmations</div>
              <div>✓ Check balance anytime</div>
            </div>
          </div>
        </div>
      );
    
    default:
      return (
        <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8">
          <div className="text-center">
            <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Feature Visual</p>
          </div>
        </div>
      );
  }
};

export default function MobileAppPOC() {
  const handlePrint = () => {
    window.print();
  };

  const features = [
    {
      title: 'Digital Membership Card',
      description: 'Scannable barcode for in-store redemption - supports financial inclusion',
      icon: CreditCard,
      color: 'from-purple-500 to-indigo-600',
      page: 'MembershipCard',
      highlights: [
        '13-digit barcode for in-store scanning',
        'Works at 100+ partner stores (Shoprite, Checkers, Pep, Mr Price)',
        'Offline-capable for areas without connectivity',
        'Zero-cash system reduces fraud',
        'Digital transparency for government tracking'
      ],
      screenshot: 'membership-card',
      impact: 'Enables 26M+ underserved consumers to access savings'
    },
    {
      title: 'Push Notifications',
      description: 'SMS/App alerts for savings opportunities - works on feature phones',
      icon: Bell,
      color: 'from-blue-500 to-cyan-600',
      page: 'Notifications',
      highlights: [
        'Works via SMS for non-smartphone users',
        'Expiring voucher reminders prevent waste',
        'New offers from government-endorsed retailers',
        'Low balance alerts for grant recipients',
        'Transparent spending notifications',
        'USSD-compatible for rural communities'
      ],
      screenshot: 'notifications',
      impact: 'Ensures all citizens benefit regardless of device ownership'
    },
    {
      title: 'Notification Preferences',
      description: 'Granular control over notification types',
      icon: Bell,
      color: 'from-teal-500 to-green-600',
      page: 'NotificationSettings',
      highlights: [
        'Master toggle for all notifications',
        'Individual preference controls',
        'Category-based management',
        'Save preferences instantly'
      ],
      screenshot: 'notification-settings'
    },
    {
      title: 'Digital Wallet',
      description: 'Secure wallet for voucher purchases and fund management',
      icon: Wallet,
      color: 'from-green-500 to-emerald-600',
      page: 'Wallet',
      highlights: [
        'Real-time balance display',
        'Quick top-up functionality',
        'Transaction history',
        'Multiple payment methods',
        'Send gift vouchers'
      ],
      screenshot: 'wallet'
    },
    {
      title: 'AI Insights',
      description: 'Smart predictions and personalized savings recommendations',
      icon: Brain,
      color: 'from-purple-600 to-pink-600',
      page: 'AIInsights',
      highlights: [
        'Spending pattern analysis',
        'Personalized deal recommendations',
        'Savings projections',
        'Peak shopping day predictions',
        'Category breakdown charts'
      ],
      screenshot: 'ai-insights'
    },
    {
      title: 'Savings Tracker',
      description: 'Visual tracking of accumulated savings over time',
      icon: TrendingUp,
      color: 'from-yellow-500 to-orange-600',
      page: 'SavingsTracker',
      highlights: [
        'Daily, weekly, monthly views',
        'Milestone achievements',
        'Savings goals progress',
        'Category-wise savings breakdown',
        'Yearly projection calculator'
      ],
      screenshot: 'savings-tracker'
    },
    {
      title: 'Referral System',
      description: 'Earn rewards by inviting friends to join eVoucher',
      icon: Users,
      color: 'from-indigo-500 to-purple-600',
      page: 'ConsumerHome',
      highlights: [
        'Unique referral code per user',
        'R20 bonus per successful referral',
        'Track referral count',
        'Easy share functionality',
        'Automated reward distribution'
      ],
      screenshot: 'referral'
    },
    {
      title: 'Voucher Marketplace',
      description: '4% instant savings on vouchers from major retailers',
      icon: ShoppingBag,
      color: 'from-orange-500 to-red-600',
      page: 'Shop',
      highlights: [
        'Browse by merchant or category',
        'Real-time inventory',
        'Personalized recommendations',
        'Quick checkout process',
        'Instant voucher delivery'
      ],
      screenshot: 'shop'
    },
    {
      title: 'Rewards & Gamification',
      description: 'Earn points, unlock badges, and climb tiers',
      icon: Star,
      color: 'from-pink-500 to-rose-600',
      page: 'Rewards',
      highlights: [
        'Points on every purchase',
        'Achievement badges',
        'Leaderboard rankings',
        'Tier progression (Bronze→Platinum)',
        'Exclusive tier benefits'
      ],
      screenshot: 'rewards'
    },
    {
      title: 'USSD/SMS Access (*120*384#)',
      description: 'Feature phone support - no smartphone needed for 18M+ rural users',
      icon: Phone,
      color: 'from-blue-600 to-indigo-700',
      page: 'USSDSimulator',
      highlights: [
        'Dial *120*384# - works on any mobile phone',
        'Serves 60%+ of SA population (townships & rural)',
        'SMS confirmations for all transactions',
        'Offline-capable secure tokens',
        'Financial inclusion for feature phone users',
        'Aligns with NDP digitization goals'
      ],
      screenshot: 'ussd',
      impact: 'Critical for reaching 20M township + 18M rural residents'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          body { background: white; }
          .print-full-width { width: 100% !important; max-width: 100% !important; }
        }
      `}</style>

      {/* Header - No Print */}
      <div className="bg-gradient-to-r from-[#00A89D] to-[#00C4B8] py-6 px-4 shadow-lg no-print sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to={createPageUrl('Landing')}>
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Mobile App Features</h1>
          <Button onClick={handlePrint} className="bg-white text-[#00A89D] hover:bg-gray-100">
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Cover Page */}
      <div className="max-w-6xl mx-auto px-4 py-12 print-full-width">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-gradient-to-br from-[#00A89D] to-[#00C4B8] mb-6 shadow-xl">
            <span className="text-5xl font-black text-white">eV</span>
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-4">eVoucher Mobile App</h1>
          <h2 className="text-3xl font-bold text-[#00A89D] mb-3">Technical Proof of Concept</h2>
          <p className="text-2xl text-gray-700 mb-2 font-semibold">Digital Commerce for Social Impact</p>
          <p className="text-xl text-gray-600 mb-8">Serving the Poorest of the Poor</p>
          
          <div className="grid grid-cols-3 gap-6 mt-12">
            <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-6">
              <p className="text-4xl font-bold text-teal-600 mb-2">26M+</p>
              <p className="text-gray-700 font-medium">Target Beneficiaries</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6">
              <p className="text-4xl font-bold text-orange-600 mb-2">60%+</p>
              <p className="text-gray-700 font-medium">SA Population Reach</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
              <p className="text-4xl font-bold text-blue-600 mb-2">5-10%</p>
              <p className="text-gray-700 font-medium">Consumer Savings</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-700 font-semibold mb-2">Prepared for</p>
            <p className="text-[#00A89D] text-2xl font-bold mb-4">Department of Trade & Industry</p>
            <p className="text-gray-500 text-sm">Government Stakeholder Summary Report</p>
            <p className="text-gray-500 text-sm">December 2025</p>
            <p className="text-[#00A89D] font-semibold mt-4">eVoucher © 2025 | 3P's Social Business Model</p>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      {features.map((feature, idx) => {
        const Icon = feature.icon;
        return (
          <div key={feature.title} className={`max-w-6xl mx-auto px-4 py-8 print-full-width ${idx > 0 ? 'page-break' : ''}`}>
            <Card className="bg-white shadow-xl overflow-hidden">
              {/* Feature Header */}
              <div className={`bg-gradient-to-r ${feature.color} p-8 text-white`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{feature.title}</h2>
                    <p className="text-white/90 text-lg mt-1">{feature.description}</p>
                  </div>
                </div>
                <Link to={createPageUrl(feature.page)} className="no-print">
                  <Button className="bg-white/20 backdrop-blur-md text-white border-0 hover:bg-white/30 mt-4">
                    View Live Demo →
                  </Button>
                </Link>
              </div>

              {/* Feature Content */}
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Key Highlights */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#00A89D]" />
                      Key Highlights
                    </h3>
                    <ul className="space-y-3">
                      {feature.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#00A89D]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[#00A89D] font-bold text-sm">{i + 1}</span>
                          </div>
                          <span className="text-gray-700">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Screenshot Visual */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Screen Preview</h3>
                    <div className="bg-gray-900 rounded-3xl p-3 shadow-2xl">
                      <div className="bg-white rounded-2xl overflow-hidden" style={{ height: '500px' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-10"></div>
                        {renderFeatureVisual(feature, Icon)}
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-3 no-print">
                      <Link to={createPageUrl(feature.page)} className="text-[#00A89D] hover:underline">
                        View live interactive demo →
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Technical Notes */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-semibold text-blue-900 mb-2">✓ Implementation Status</h4>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500 text-white">Fully Implemented</Badge>
                    <Badge className="bg-blue-500 text-white">Mobile Optimized</Badge>
                    <Badge className="bg-purple-500 text-white">Production Ready</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
      })}

      {/* Summary Page */}
      <div className="max-w-6xl mx-auto px-4 py-12 print-full-width page-break">
        <Card className="bg-white shadow-2xl p-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">Government Alignment & Social Impact</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gradient-to-br from-[#00A89D]/10 to-[#00C4B8]/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Social Impact Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Serves 26M+ underserved citizens (60%+ of SA)</li>
                <li>✓ 5-10% direct savings on essential purchases</li>
                <li>✓ USSD/SMS for feature phone users (no smartphone needed)</li>
                <li>✓ Transparent digital trail for grant spending</li>
                <li>✓ Township merchant onboarding (100K+ target)</li>
                <li>✓ Zero-cash system eliminates fraud</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Compliance & Security</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ POPIA compliant data protection</li>
                <li>✓ PASA registered payment system</li>
                <li>✓ SARB aligned operations</li>
                <li>✓ FIC compliant (AML/CFT)</li>
                <li>✓ NDP digital transformation aligned</li>
                <li>✓ Military-grade encryption (AES-256)</li>
              </ul>
            </div>
          </div>

          {/* Economic Model */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-8 mb-8 border-2 border-orange-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Economic Impact Model</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#00A89D]">26.2M</p>
                <p className="text-sm text-gray-600">Potential Members</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">R779</p>
                <p className="text-sm text-gray-600">Avg Monthly Spend</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">R20.4B</p>
                <p className="text-sm text-gray-600">Monthly Volume</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-700 font-semibold">8% Total Discount (70/30 Split)</p>
              <div className="flex justify-center gap-6 mt-3">
                <div><span className="text-[#00A89D] font-bold">5.6%</span> Consumer Savings</div>
                <div><span className="text-purple-600 font-bold">2.4%</span> Platform Revenue</div>
                <div><span className="text-gray-700 font-bold">92%</span> Merchant Payout</div>
              </div>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="bg-gray-50 rounded-xl p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Technology Stack</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge className="bg-blue-500 text-white">React Native (PWA)</Badge>
              <Badge className="bg-green-500 text-white">Offline-First Architecture</Badge>
              <Badge className="bg-orange-500 text-white">USSD/SMS Gateway</Badge>
              <Badge className="bg-purple-500 text-white">AES-256 Encryption</Badge>
              <Badge className="bg-indigo-500 text-white">Base44 BaaS</Badge>
              <Badge className="bg-pink-500 text-white">AI Fraud Detection</Badge>
            </div>
          </div>

          {/* What We Need from DTI */}
          <div className="border-t border-gray-200 pt-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Partnership Requirements from DTI</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="font-semibold text-blue-900">1. National Endorsement</p>
                <p className="text-sm text-blue-700">Official DTI support for retailer & transport partner onboarding</p>
              </div>
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <p className="font-semibold text-green-900">2. CWP Database Access</p>
                <p className="text-sm text-green-700">Integration with Community Work Programme for merchant onboarding</p>
              </div>
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
                <p className="font-semibold text-purple-900">3. SASSA Campaign Integration</p>
                <p className="text-sm text-purple-700">Collaboration to reach 18M+ grant recipients</p>
              </div>
            </div>
          </div>

          {/* Rollout Timeline */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Phased Provincial Rollout (Recommended)</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white border-2 border-[#00A89D] rounded-xl p-4">
                <p className="font-semibold text-[#00A89D] mb-2">Months 1-2</p>
                <p className="text-sm text-gray-600">DTI Partnership & Compliance</p>
              </div>
              <div className="bg-white border-2 border-green-500 rounded-xl p-4">
                <p className="font-semibold text-green-600 mb-2">Months 3-4</p>
                <p className="text-sm text-gray-600">Retailer Onboarding</p>
              </div>
              <div className="bg-white border-2 border-purple-500 rounded-xl p-4">
                <p className="font-semibold text-purple-600 mb-2">Months 5-6</p>
                <p className="text-sm text-gray-600">Phase 1: Gauteng, W. Cape</p>
              </div>
              <div className="bg-white border-2 border-orange-500 rounded-xl p-4">
                <p className="font-semibold text-orange-600 mb-2">Months 7-12</p>
                <p className="text-sm text-gray-600">National Expansion</p>
              </div>
            </div>
          </div>

          {/* Contact & 3P's Model */}
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">3P's Social Business Model</h3>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-6">
                <p className="text-4xl mb-2">👥</p>
                <p className="font-bold text-teal-700 mb-2">People</p>
                <p className="text-sm text-gray-600">Consumer savings & merchant growth</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <p className="text-4xl mb-2">🌍</p>
                <p className="font-bold text-blue-700 mb-2">Planet</p>
                <p className="text-sm text-gray-600">Digital-first, reduced waste</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                <p className="text-4xl mb-2">📈</p>
                <p className="font-bold text-purple-700 mb-2">Profit</p>
                <p className="text-sm text-gray-600">Sustainable platform economics</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4 font-semibold">For more information or partnership discussions:</p>
            <p className="text-[#00A89D] font-bold text-xl mb-2">info@evoucher.co.za</p>
            <p className="text-gray-700 font-semibold">Mr. Chambrey Salemola: 079 421 9987</p>
            <p className="text-gray-500 text-sm mt-6">Government Stakeholder Summary Report</p>
            <p className="text-gray-500 text-sm">December 2025</p>
            <p className="text-[#00A89D] font-bold mt-4">E-Voucher (Pty) Ltd | Reg: 1972/004310/07</p>
            <p className="text-gray-600 text-sm">Digital Commerce for Social Impact</p>
          </div>
        </Card>
      </div>
    </div>
  );
}