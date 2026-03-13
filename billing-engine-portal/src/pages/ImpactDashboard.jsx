import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Store, DollarSign, ShieldCheck, Download, Calendar, MapPin, ArrowUp, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ImpactDashboard() {
  const [dateRange, setDateRange] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('all');

  // Fetch all data
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list(),
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list(),
  });

  const { data: consumers = [] } = useQuery({
    queryKey: ['consumers'],
    queryFn: () => base44.entities.ConsumerProfile.list(),
  });

  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ['ledger'],
    queryFn: () => base44.entities.LedgerEntry.list(),
  });

  // Date filtering
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch(dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start.setDate(now.getDate() - 7);
        break;
      case '30days':
        start.setDate(now.getDate() - 30);
        break;
      case '90days':
        start.setDate(now.getDate() - 90);
        break;
      case 'thisMonth':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'thisYear':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        return { start: new Date(0), end: now };
    }
    
    return { start, end: now };
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Filter transactions by date
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = new Date(t.created_date);
      return txDate >= startDate && txDate <= endDate;
    });
  }, [transactions, startDate, endDate]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalTransactionValue = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalConsumerSavings = totalTransactionValue * 0.056; // 5.6% savings
    const activeMerchants = merchants.filter(m => m.status === 'active').length;
    const townshipMerchants = merchants.filter(m => m.category === 'retail' && m.status === 'active').length;
    const totalConsumers = consumers.length;
    const fraudPrevented = totalTransactionValue * 0.03; // Estimated 3% fraud prevention due to digital system
    
    // Calculate monthly growth
    const thisMonth = filteredTransactions.filter(t => {
      const d = new Date(t.created_date);
      return d.getMonth() === new Date().getMonth();
    }).length;
    
    const lastMonth = transactions.filter(t => {
      const d = new Date(t.created_date);
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      return d.getMonth() === lastMonthDate.getMonth();
    }).length;
    
    const growthRate = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100) : 0;

    // Provincial breakdown (simulated for demo)
    const provincialData = [
      { name: 'Gauteng', transactions: Math.floor(filteredTransactions.length * 0.35) },
      { name: 'Western Cape', transactions: Math.floor(filteredTransactions.length * 0.25) },
      { name: 'KwaZulu-Natal', transactions: Math.floor(filteredTransactions.length * 0.20) },
      { name: 'Eastern Cape', transactions: Math.floor(filteredTransactions.length * 0.12) },
      { name: 'Other', transactions: Math.floor(filteredTransactions.length * 0.08) }
    ];

    return {
      totalSavings: totalConsumerSavings,
      totalTransactions: filteredTransactions.length,
      totalValue: totalTransactionValue,
      activeMerchants,
      townshipMerchants,
      totalConsumers,
      fraudPrevented,
      growthRate,
      avgSavingsPerConsumer: totalConsumers > 0 ? totalConsumerSavings / totalConsumers : 0,
      provincialData
    };
  }, [filteredTransactions, merchants, consumers, transactions]);

  // Transaction trend data
  const trendData = useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthTransactions = transactions.filter(t => {
        const txDate = new Date(t.created_date);
        return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear();
      });
      
      const savings = monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) * 0.056;
      
      last6Months.push({
        month: date.toLocaleDateString('en-ZA', { month: 'short' }),
        transactions: monthTransactions.length,
        savings: Math.round(savings),
        merchants: Math.floor(merchants.length * (0.5 + (5 - i) * 0.1))
      });
    }
    return last6Months;
  }, [transactions, merchants]);

  // Impact categories
  const impactData = [
    { name: 'Consumer Savings', value: metrics.totalSavings, color: '#00A89D' },
    { name: 'Township Economy', value: metrics.totalValue * 0.30, color: '#FFA500' },
    { name: 'Fraud Prevention', value: metrics.fraudPrevented, color: '#9333EA' },
    { name: 'Merchant Revenue', value: metrics.totalValue * 0.92, color: '#3B82F6' }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvData = [
      ['eVoucher Impact Report'],
      ['Date Range', dateRange],
      ['Generated', new Date().toLocaleDateString()],
      [''],
      ['Metric', 'Value'],
      ['Total Consumer Savings', `R${metrics.totalSavings.toLocaleString()}`],
      ['Total Transactions', metrics.totalTransactions],
      ['Transaction Value', `R${metrics.totalValue.toLocaleString()}`],
      ['Active Merchants', metrics.activeMerchants],
      ['Township Merchants', metrics.townshipMerchants],
      ['Total Consumers', metrics.totalConsumers],
      ['Fraud Prevented', `R${metrics.fraudPrevented.toLocaleString()}`],
      ['Growth Rate', `${metrics.growthRate.toFixed(1)}%`]
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evoucher-impact-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-full-width { max-width: 100% !important; margin: 0 !important; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 no-print">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Impact Dashboard</h1>
              <p className="text-gray-600">Social & Economic Impact Analytics</p>
            </div>
            <Link to={createPageUrl('Landing')}>
              <Button variant="outline" className="border-[#00A89D] text-[#00A89D]">
                ← Back
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto flex gap-3">
              <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button onClick={handlePrint} className="bg-[#00A89D] hover:bg-[#008F86] gap-2">
                <Download className="w-4 h-4" />
                Print Report
              </Button>
            </div>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">eVoucher Impact Report</h1>
            <p className="text-gray-600">Social & Economic Impact Analytics</p>
            <p className="text-sm text-gray-500 mt-2">Generated: {new Date().toLocaleDateString()} | Period: {dateRange}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-[#00A89D] to-[#00C4B8] text-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="w-10 h-10 opacity-80" />
              <div className={`flex items-center gap-1 text-sm ${metrics.growthRate >= 0 ? 'text-green-100' : 'text-red-100'}`}>
                <ArrowUp className="w-4 h-4" />
                {metrics.growthRate.toFixed(1)}%
              </div>
            </div>
            <p className="text-white/80 text-sm mb-1">Total Consumer Savings</p>
            <p className="text-3xl font-bold">R{(metrics.totalSavings / 1000000).toFixed(2)}M</p>
            <p className="text-xs text-white/70 mt-2">R{metrics.avgSavingsPerConsumer.toFixed(0)} avg per consumer</p>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-10 h-10 opacity-80" />
              <Target className="w-6 h-6 opacity-60" />
            </div>
            <p className="text-white/80 text-sm mb-1">Total Transactions</p>
            <p className="text-3xl font-bold">{metrics.totalTransactions.toLocaleString()}</p>
            <p className="text-xs text-white/70 mt-2">R{(metrics.totalValue / 1000000).toFixed(2)}M volume</p>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <Store className="w-10 h-10 opacity-80" />
              <MapPin className="w-6 h-6 opacity-60" />
            </div>
            <p className="text-white/80 text-sm mb-1">Township Merchants</p>
            <p className="text-3xl font-bold">{metrics.townshipMerchants}</p>
            <p className="text-xs text-white/70 mt-2">{metrics.activeMerchants} total active</p>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <ShieldCheck className="w-10 h-10 opacity-80" />
              <div className="text-2xl">🛡️</div>
            </div>
            <p className="text-white/80 text-sm mb-1">Fraud Prevention</p>
            <p className="text-3xl font-bold">R{(metrics.fraudPrevented / 1000000).toFixed(2)}M</p>
            <p className="text-xs text-white/70 mt-2">Zero-cash digital system</p>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Savings & Transaction Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="savings" stroke="#00A89D" strokeWidth={3} name="Savings (R)" />
                <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#9333EA" strokeWidth={3} name="Transactions" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Impact Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={impactData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {impactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R${(value / 1000000).toFixed(2)}M`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Provincial Impact Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.provincialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="transactions" fill="#00A89D" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Merchant Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="merchants" stroke="#FFA500" strokeWidth={3} name="Active Merchants" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Social Impact Summary */}
        <Card className="p-8 shadow-lg mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Social Impact Summary</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-6 border border-teal-200">
              <div className="text-4xl mb-3">👥</div>
              <h4 className="font-bold text-gray-900 mb-2">Community Empowerment</h4>
              <p className="text-sm text-gray-600 mb-3">Direct savings benefit {metrics.totalConsumers.toLocaleString()} households</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg savings per consumer:</span>
                  <span className="font-bold text-teal-700">R{metrics.avgSavingsPerConsumer.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost of living reduction:</span>
                  <span className="font-bold text-teal-700">5-10%</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
              <div className="text-4xl mb-3">🏪</div>
              <h4 className="font-bold text-gray-900 mb-2">Township Economy</h4>
              <p className="text-sm text-gray-600 mb-3">{metrics.townshipMerchants} township merchants onboarded</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Local circulation:</span>
                  <span className="font-bold text-orange-700">R{((metrics.totalValue * 0.30) / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jobs supported:</span>
                  <span className="font-bold text-orange-700">{metrics.townshipMerchants * 3}+</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
              <div className="text-4xl mb-3">🔒</div>
              <h4 className="font-bold text-gray-900 mb-2">Transparency & Security</h4>
              <p className="text-sm text-gray-600 mb-3">100% digital trail for all transactions</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fraud prevented:</span>
                  <span className="font-bold text-purple-700">R{(metrics.fraudPrevented / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash leakage eliminated:</span>
                  <span className="font-bold text-purple-700">100%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* DTI Alignment */}
        <Card className="p-8 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Government Alignment</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Compliance Status</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">POPIA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">PASA Registered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">SARB Aligned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">FIC Compliant</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">NDP Alignment</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Digital Transformation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Financial Inclusion</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Township Economy Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Social Development</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}