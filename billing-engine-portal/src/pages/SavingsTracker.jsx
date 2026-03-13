import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Download, Sparkles, Target, Award, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths } from 'date-fns';

export default function SavingsTracker() {
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 100),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['consumerProfile'],
    queryFn: () => base44.entities.ConsumerProfile.list(),
  });

  const profile = profiles[0] || {};

  // Calculate savings (4% on each purchase)
  const purchases = transactions.filter(t => t.type === 'purchase');
  const totalSavings = purchases.reduce((sum, t) => sum + (t.amount * 0.04), 0);
  const totalSpent = purchases.reduce((sum, t) => sum + t.amount, 0);
  const savingsPercentage = totalSpent > 0 ? (totalSavings / (totalSpent + totalSavings)) * 100 : 0;

  // Monthly savings trend
  const monthlySavings = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthTxns = purchases.filter(t => {
      const txnDate = new Date(t.created_date);
      return txnDate.getMonth() === date.getMonth() && txnDate.getFullYear() === date.getFullYear();
    });
    return {
      month: format(date, 'MMM'),
      savings: monthTxns.reduce((sum, t) => sum + (t.amount * 0.04), 0),
      spent: monthTxns.reduce((sum, t) => sum + t.amount, 0),
    };
  });

  const downloadStatement = async () => {
    const statement = `
eVOUCHER SAVINGS STATEMENT
Generated: ${format(new Date(), 'MMMM dd, yyyy')}

Customer: ${profile.fullName || 'eVoucher User'}
Email: ${profile.email || ''}

SAVINGS SUMMARY
Total Saved: R${totalSavings.toFixed(2)}
Total Spent: R${totalSpent.toFixed(2)}
Savings Rate: ${savingsPercentage.toFixed(2)}%
Transactions: ${purchases.length}

MONTHLY BREAKDOWN
${monthlySavings.map(m => `${m.month}: Saved R${m.savings.toFixed(2)} on R${m.spent.toFixed(2)}`).join('\n')}

Thank you for using eVoucher!
    `.trim();

    const blob = new Blob([statement], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eVoucher_Savings_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MobileContainer>
      <div className="pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00A89D] to-teal-600 pt-6 pb-16 px-4 rounded-b-[32px]">
          <div className="flex items-center justify-between mb-6">
            <Link to={createPageUrl('ConsumerHome')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <button onClick={downloadStatement} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-3">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Your Savings</h1>
            <p className="text-white/80 text-sm">Every voucher = 4% off instantly</p>
          </div>
        </div>

        {/* Total Savings Card */}
        <div className="px-4 -mt-10">
          <Card className="bg-white rounded-2xl p-6 shadow-xl border-0 mb-6">
            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm mb-1">Total Savings</p>
              <p className="text-5xl font-bold text-[#00A89D]">R{totalSavings.toFixed(2)}</p>
              <p className="text-gray-400 text-sm mt-2">
                {savingsPercentage.toFixed(1)}% saved on all purchases
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-blue-600 font-bold text-lg">{purchases.length}</p>
                <p className="text-blue-600 text-xs">Purchases</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <p className="text-purple-600 font-bold text-lg">R{totalSpent.toFixed(0)}</p>
                <p className="text-purple-600 text-xs">Spent</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <p className="text-orange-600 font-bold text-lg">{profile.rewardsTier || 'Bronze'}</p>
                <p className="text-orange-600 text-xs">Tier</p>
              </div>
            </div>
          </Card>

          {/* Savings Trend Chart */}
          <Card className="bg-white rounded-2xl p-4 shadow-lg border-0 mb-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00A89D]" />
              6-Month Savings Trend
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlySavings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `R${value.toFixed(2)}`} />
                <Line type="monotone" dataKey="savings" stroke="#00A89D" strokeWidth={3} dot={{ fill: '#00A89D', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* How It Works */}
          <Card className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-4 shadow-lg border-0 mb-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-600" />
              How Your Savings Work
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Buy vouchers at 4% off</p>
                  <p className="text-gray-600 text-sm">Pay R960 for R1,000 worth of value</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Use at partner stores</p>
                  <p className="text-gray-600 text-sm">Redeem full face value everywhere</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Track your savings</p>
                  <p className="text-gray-600 text-sm">Watch your cumulative savings grow</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Achievements */}
          <Card className="bg-white rounded-2xl p-4 shadow-lg border-0">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Savings Milestones
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  totalSavings >= 100 ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Award className={`w-5 h-5 ${totalSavings >= 100 ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">R100 Saved</p>
                  <div className="h-2 bg-gray-100 rounded-full mt-1">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min((totalSavings / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  totalSavings >= 500 ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Award className={`w-5 h-5 ${totalSavings >= 500 ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">R500 Saved</p>
                  <div className="h-2 bg-gray-100 rounded-full mt-1">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min((totalSavings / 500) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  totalSavings >= 1000 ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <Award className={`w-5 h-5 ${totalSavings >= 1000 ? 'text-purple-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">R1,000 Saved</p>
                  <div className="h-2 bg-gray-100 rounded-full mt-1">
                    <div 
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${Math.min((totalSavings / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="mt-6">
            <Link to={createPageUrl('Shop')}>
              <GoldButton className="w-full h-12">
                Save More - Browse Vouchers
              </GoldButton>
            </Link>
          </div>
        </div>
      </div>

      <BottomNav activePage="ConsumerHome" />
    </MobileContainer>
  );
}