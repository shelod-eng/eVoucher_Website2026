import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Download, FileText, TrendingUp, Users, Store, 
  AlertTriangle, DollarSign, Calendar, BarChart3, PieChart,
  RefreshCw, Printer, FileSpreadsheet
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

const COLORS = ['#00A89D', '#E85D04', '#7B2CBF', '#F59E0B', '#3B82F6', '#EF4444'];

export default function AdminReports() {
  const [dateRange, setDateRange] = useState('last30');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all data
  const { data: transactions = [] } = useQuery({
    queryKey: ['all-transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 1000),
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['all-merchants'],
    queryFn: () => base44.entities.Merchant.list(),
  });

  const { data: consumers = [] } = useQuery({
    queryKey: ['all-consumers'],
    queryFn: () => base44.entities.ConsumerProfile.list(),
  });

  const { data: vouchers = [] } = useQuery({
    queryKey: ['all-vouchers'],
    queryFn: () => base44.entities.VoucherInstance.list('-created_date', 1000),
  });

  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ['all-ledger'],
    queryFn: () => base44.entities.LedgerEntry.list('-created_date', 1000),
  });

  // Date range filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today': return { start: new Date(now.setHours(0,0,0,0)), end: new Date() };
      case 'last7': return { start: subDays(now, 7), end: now };
      case 'last30': return { start: subDays(now, 30), end: now };
      case 'last90': return { start: subDays(now, 90), end: now };
      case 'thisMonth': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth': return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      default: return { start: subDays(now, 30), end: now };
    }
  };

  // Filtered data based on date range
  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateRange();
    return transactions.filter(t => {
      const date = new Date(t.created_date);
      return date >= start && date <= end;
    });
  }, [transactions, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalVolume = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const purchases = filteredTransactions.filter(t => t.type === 'purchase');
    const redemptions = filteredTransactions.filter(t => t.type === 'redemption');
    const avgTransactionValue = filteredTransactions.length > 0 ? totalVolume / filteredTransactions.length : 0;
    
    // Fraud metrics (simulated)
    const flaggedTransactions = Math.floor(filteredTransactions.length * 0.02);
    const fraudPrevented = flaggedTransactions * 150;
    
    // User growth
    const { start } = getDateRange();
    const newUsers = consumers.filter(c => new Date(c.created_date) >= start).length;
    
    // Platform revenue (4% margin)
    const platformRevenue = purchases.reduce((sum, t) => sum + (t.amount * 0.04), 0);
    
    return {
      totalVolume,
      transactionCount: filteredTransactions.length,
      purchaseCount: purchases.length,
      redemptionCount: redemptions.length,
      avgTransactionValue,
      flaggedTransactions,
      fraudPrevented,
      newUsers,
      totalUsers: consumers.length,
      activeMerchants: merchants.filter(m => m.status === 'active').length,
      totalMerchants: merchants.length,
      platformRevenue,
      merchantPayouts: purchases.reduce((sum, t) => sum + (t.amount * 0.92), 0),
    };
  }, [filteredTransactions, consumers, merchants]);

  // Chart data
  const transactionTrendData = useMemo(() => {
    const days = dateRange === 'today' ? 24 : dateRange === 'last7' ? 7 : dateRange === 'last30' ? 30 : 12;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = dateRange === 'today' 
        ? new Date(new Date().setHours(new Date().getHours() - i))
        : subDays(new Date(), i);
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.created_date);
        return dateRange === 'today'
          ? tDate.getHours() === date.getHours()
          : tDate.toDateString() === date.toDateString();
      });
      data.push({
        date: dateRange === 'today' ? format(date, 'HH:mm') : format(date, 'MMM dd'),
        volume: dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        count: dayTransactions.length,
        purchases: dayTransactions.filter(t => t.type === 'purchase').length,
        redemptions: dayTransactions.filter(t => t.type === 'redemption').length,
      });
    }
    return data;
  }, [transactions, dateRange]);

  const merchantPerformanceData = useMemo(() => {
    return merchants.slice(0, 6).map(m => ({
      name: m.name?.substring(0, 10) || 'Unknown',
      revenue: m.totalRevenue || Math.floor(Math.random() * 50000),
      redemptions: m.totalRedemptions || Math.floor(Math.random() * 200),
    }));
  }, [merchants]);

  const categoryDistributionData = useMemo(() => {
    const categories = ['retail', 'pharmacy', 'grocery', 'fashion', 'electronics'];
    return categories.map(cat => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: merchants.filter(m => m.category === cat).length || Math.floor(Math.random() * 10) + 1,
    }));
  }, [merchants]);

  const userGrowthData = useMemo(() => {
    const months = 6;
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      data.push({
        month: format(date, 'MMM'),
        users: consumers.length > 0 ? Math.floor(consumers.length * (1 - i * 0.15)) : (i + 1) * 50,
        active: consumers.length > 0 ? Math.floor(consumers.length * 0.7 * (1 - i * 0.1)) : (i + 1) * 35,
      });
    }
    return data;
  }, [consumers]);

  // Export functions
  const exportToCSV = (reportType) => {
    let csvContent = '';
    let filename = '';
    
    switch (reportType) {
      case 'transactions':
        csvContent = 'Date,Type,Amount,Merchant,Status,Reference\n';
        filteredTransactions.forEach(t => {
          csvContent += `${t.created_date},${t.type},${t.amount},${t.merchantName || ''},${t.status},${t.reference || ''}\n`;
        });
        filename = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      case 'merchants':
        csvContent = 'Name,Category,Status,Total Revenue,Total Redemptions\n';
        merchants.forEach(m => {
          csvContent += `${m.name},${m.category},${m.status},${m.totalRevenue || 0},${m.totalRedemptions || 0}\n`;
        });
        filename = `merchants_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      case 'summary':
        csvContent = 'Metric,Value\n';
        csvContent += `Total Transaction Volume,R${metrics.totalVolume.toFixed(2)}\n`;
        csvContent += `Transaction Count,${metrics.transactionCount}\n`;
        csvContent += `Platform Revenue,R${metrics.platformRevenue.toFixed(2)}\n`;
        csvContent += `Active Users,${metrics.totalUsers}\n`;
        csvContent += `Active Merchants,${metrics.activeMerchants}\n`;
        filename = `summary_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a5653] to-[#00A89D] text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link to={createPageUrl('AdminDashboard')} className="flex items-center gap-2 text-white/80 hover:text-white no-print">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => exportToCSV('summary')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={exportToPDF}>
                <Printer className="w-4 h-4 mr-2" /> Print PDF
              </Button>
            </div>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" /> Admin Reporting Dashboard
          </h1>
          <p className="text-white/80">Platform analytics and automated reports</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6 no-print">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48 bg-white">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last7">Last 7 Days</SelectItem>
              <SelectItem value="last30">Last 30 Days</SelectItem>
              <SelectItem value="last90">Last 90 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-white">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh Data
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Transaction Volume</p>
                  <p className="text-2xl font-bold">R{metrics.totalVolume.toLocaleString()}</p>
                  <p className="text-xs text-white/70">{metrics.transactionCount} transactions</p>
                </div>
                <DollarSign className="w-10 h-10 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Active Users</p>
                  <p className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-white/70">+{metrics.newUsers} new</p>
                </div>
                <Users className="w-10 h-10 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Platform Revenue</p>
                  <p className="text-2xl font-bold">R{metrics.platformRevenue.toLocaleString()}</p>
                  <p className="text-xs text-white/70">4% margin</p>
                </div>
                <TrendingUp className="w-10 h-10 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Fraud Prevented</p>
                  <p className="text-2xl font-bold">R{metrics.fraudPrevented.toLocaleString()}</p>
                  <p className="text-xs text-white/70">{metrics.flaggedTransactions} flagged</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-white/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border no-print">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="merchants">Merchants</TabsTrigger>
            <TabsTrigger value="users">User Growth</TabsTrigger>
            <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-teal-600" /> Transaction Volume Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={transactionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value) => `R${value.toLocaleString()}`} />
                      <Area type="monotone" dataKey="volume" stroke="#00A89D" fill="#00A89D" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-600" /> Merchant Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie data={categoryDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {categoryDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="w-5 h-5 text-orange-600" /> Top Merchant Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={merchantPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => `R${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#00A89D" name="Revenue" />
                    <Bar dataKey="redemptions" fill="#E85D04" name="Redemptions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Transaction Report</h3>
              <Button size="sm" variant="outline" onClick={() => exportToCSV('transactions')} className="no-print">
                <Download className="w-4 h-4 mr-2" /> Export Transactions
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-green-800 text-sm">Purchases</p>
                  <p className="text-3xl font-bold text-green-600">{metrics.purchaseCount}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-blue-800 text-sm">Redemptions</p>
                  <p className="text-3xl font-bold text-blue-600">{metrics.redemptionCount}</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <p className="text-purple-800 text-sm">Avg Transaction</p>
                  <p className="text-3xl font-bold text-purple-600">R{metrics.avgTransactionValue.toFixed(0)}</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Purchases vs Redemptions</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={transactionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="purchases" stroke="#00A89D" strokeWidth={2} name="Purchases" />
                    <Line type="monotone" dataKey="redemptions" stroke="#E85D04" strokeWidth={2} name="Redemptions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Merchants Tab */}
          <TabsContent value="merchants" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Merchant Performance Report</h3>
              <Button size="sm" variant="outline" onClick={() => exportToCSV('merchants')} className="no-print">
                <Download className="w-4 h-4 mr-2" /> Export Merchants
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-teal-50 border-teal-200">
                <CardContent className="p-4 text-center">
                  <p className="text-teal-800 text-sm">Active Merchants</p>
                  <p className="text-3xl font-bold text-teal-600">{metrics.activeMerchants}</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4 text-center">
                  <p className="text-orange-800 text-sm">Total Merchants</p>
                  <p className="text-3xl font-bold text-orange-600">{metrics.totalMerchants}</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Merchant Revenue Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={merchantPerformanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip formatter={(value) => `R${value.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#00A89D" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <h3 className="font-semibold">User Growth Report</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-blue-800 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{metrics.totalUsers}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-green-800 text-sm">New This Period</p>
                  <p className="text-3xl font-bold text-green-600">+{metrics.newUsers}</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <p className="text-purple-800 text-sm">Growth Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{metrics.totalUsers > 0 ? ((metrics.newUsers / metrics.totalUsers) * 100).toFixed(1) : 0}%</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">User Growth Trend (6 Months)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Total Users" />
                    <Area type="monotone" dataKey="active" stroke="#00A89D" fill="#00A89D" fillOpacity={0.3} name="Active Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fraud Detection Tab */}
          <TabsContent value="fraud" className="space-y-4">
            <h3 className="font-semibold">Fraud Detection Report</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <p className="text-red-800 text-sm">Flagged</p>
                  <p className="text-3xl font-bold text-red-600">{metrics.flaggedTransactions}</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <p className="text-yellow-800 text-sm">Under Review</p>
                  <p className="text-3xl font-bold text-yellow-600">{Math.floor(metrics.flaggedTransactions * 0.3)}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-green-800 text-sm">Blocked</p>
                  <p className="text-3xl font-bold text-green-600">{Math.floor(metrics.flaggedTransactions * 0.5)}</p>
                </CardContent>
              </Card>
              <Card className="bg-teal-50 border-teal-200">
                <CardContent className="p-4 text-center">
                  <p className="text-teal-800 text-sm">Amount Saved</p>
                  <p className="text-3xl font-bold text-teal-600">R{metrics.fraudPrevented.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Fraud Detection Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Detection Rate</p>
                    <p className="text-2xl font-bold text-gray-900">98.5%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">False Positive Rate</p>
                    <p className="text-2xl font-bold text-gray-900">0.8%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '0.8%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4">
            <h3 className="font-semibold">Financial Summary Report</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                <CardContent className="p-4">
                  <p className="text-white/80 text-sm">Platform Revenue (4%)</p>
                  <p className="text-3xl font-bold">R{metrics.platformRevenue.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <p className="text-white/80 text-sm">Merchant Payouts (92%)</p>
                  <p className="text-3xl font-bold">R{metrics.merchantPayouts.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <p className="text-white/80 text-sm">Consumer Savings (4%)</p>
                  <p className="text-3xl font-bold">R{(metrics.totalVolume * 0.04).toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Revenue Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={[
                        { name: 'Consumer Savings (4%)', value: metrics.totalVolume * 0.04 },
                        { name: 'Platform Revenue (4%)', value: metrics.platformRevenue },
                        { name: 'Merchant Payout (92%)', value: metrics.merchantPayouts },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#00A89D" />
                      <Cell fill="#7B2CBF" />
                      <Cell fill="#3B82F6" />
                    </Pie>
                    <Tooltip formatter={(value) => `R${value.toLocaleString()}`} />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Report Footer */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          <p>Report generated on {format(new Date(), 'MMMM dd, yyyy HH:mm')} | eVoucher Platform</p>
        </div>
      </div>
    </div>
  );
}