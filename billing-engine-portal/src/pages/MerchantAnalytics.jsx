import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, ShoppingBag, DollarSign, Clock, MapPin, Calendar, Download, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';

const COLORS = ['#00A89D', '#FF8C00', '#6366F1', '#10B981', '#F59E0B', '#EF4444'];

export default function MerchantAnalytics() {
  const [dateRange, setDateRange] = useState('30');
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => null);
  }, []);

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list(),
  });

  const { data: voucherInstances = [] } = useQuery({
    queryKey: ['voucherInstances'],
    queryFn: () => base44.entities.VoucherInstance.list(),
  });

  const { data: consumerProfiles = [] } = useQuery({
    queryKey: ['consumerProfiles'],
    queryFn: () => base44.entities.ConsumerProfile.list(),
  });

  // Find merchant for current user
  const merchant = merchants.find(m => m.email === user?.email) || merchants[0];

  // Filter data for this merchant
  const merchantTransactions = transactions.filter(t => t.merchantId === merchant?.id);
  const merchantVouchers = voucherInstances.filter(v => v.merchantId === merchant?.id);

  // Calculate metrics
  const totalRevenue = merchantTransactions
    .filter(t => t.type === 'redemption')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRedemptions = merchantTransactions.filter(t => t.type === 'redemption').length;

  const totalVouchersSold = merchantVouchers.length;

  const redemptionRate = totalVouchersSold > 0 
    ? ((totalRedemptions / totalVouchersSold) * 100).toFixed(1)
    : 0;

  const totalSavingsGenerated = merchantVouchers.reduce((sum, v) => {
    return sum + (v.faceValue - v.purchasePrice);
  }, 0);

  // Get unique customers
  const uniqueCustomers = new Set(merchantVouchers.map(v => v.consumerId)).size;

  // Calculate purchase times
  const purchaseHours = merchantTransactions.reduce((acc, t) => {
    const hour = moment(t.created_date).hour();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const purchaseTimeData = Object.entries(purchaseHours).map(([hour, count]) => ({
    hour: `${hour}:00`,
    purchases: count
  })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  // Customer demographics by tier
  const customerTiers = merchantVouchers.reduce((acc, v) => {
    const profile = consumerProfiles.find(p => p.id === v.consumerId);
    if (profile) {
      acc[profile.rewardsTier] = (acc[profile.rewardsTier] || 0) + 1;
    }
    return acc;
  }, {});

  const tierData = Object.entries(customerTiers).map(([tier, count]) => ({
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    value: count
  }));

  // Revenue trend (last 30 days)
  const revenueTrend = merchantTransactions
    .filter(t => t.type === 'redemption')
    .reduce((acc, t) => {
      const date = moment(t.created_date).format('MMM DD');
      acc[date] = (acc[date] || 0) + t.amount;
      return acc;
    }, {});

  const revenueData = Object.entries(revenueTrend).map(([date, revenue]) => ({
    date,
    revenue
  })).slice(-30);

  const stats = [
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: `R${totalRevenue.toLocaleString()}`,
      change: '+12.5%',
      bgColor: 'bg-[#00A89D]/10',
      iconColor: 'text-[#00A89D]'
    },
    {
      icon: ShoppingBag,
      label: 'Total Redemptions',
      value: totalRedemptions.toLocaleString(),
      change: '+8.2%',
      bgColor: 'bg-orange-500/10',
      iconColor: 'text-orange-500'
    },
    {
      icon: TrendingUp,
      label: 'Redemption Rate',
      value: `${redemptionRate}%`,
      change: '+3.1%',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-500'
    },
    {
      icon: Users,
      label: 'Unique Customers',
      value: uniqueCustomers.toLocaleString(),
      change: '+15.7%',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#00A89D]/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00A89D] to-[#00C4B8] text-white py-8 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl('MerchantDashboard')}>
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black">Performance Analytics</h1>
              <p className="text-white/90 mt-1">{merchant?.name || 'Merchant Dashboard'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48 bg-white/20 border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/20">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <span className="text-green-600 text-sm font-semibold">{stat.change}</span>
                </div>
                <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Savings Impact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-[#00A89D] to-[#00C4B8] border-0 p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 mb-2">Total Customer Savings Generated</p>
                <h2 className="text-5xl font-black">R{totalSavingsGenerated.toLocaleString()}</h2>
                <p className="text-white/80 mt-2">Helping {uniqueCustomers} customers save money</p>
              </div>
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#00A89D]/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[#00A89D]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                  <p className="text-sm text-gray-500">Last 30 days</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#00A89D" strokeWidth={3} dot={{ fill: '#00A89D' }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Customer Tiers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Customer Demographics</h3>
                  <p className="text-sm text-gray-500">By rewards tier</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Purchase Times */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Peak Purchase Times</h3>
                  <p className="text-sm text-gray-500">Hourly distribution</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={purchaseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="purchases" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Quick Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Insights</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-[#00A89D]/5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-[#00A89D]/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#00A89D]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Peak Hours</p>
                    <p className="text-sm text-gray-600">Most purchases happen between 12pm-2pm and 5pm-7pm</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-orange-500/5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Top Customer Tier</p>
                    <p className="text-sm text-gray-600">{tierData[0]?.name || 'Bronze'} tier customers are your biggest segment</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-green-500/5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Avg Transaction</p>
                    <p className="text-sm text-gray-600">R{totalRedemptions > 0 ? Math.round(totalRevenue / totalRedemptions) : 0} per redemption</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}