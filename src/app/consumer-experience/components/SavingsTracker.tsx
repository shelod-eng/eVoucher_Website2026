'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface SavingsData {
  month: string;
  amount: number;
}

interface TransactionData {
  id: string;
  merchant: string;
  date: string;
  original: number;
  saved: number;
  paid: number;
}

const SavingsTracker = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const savingsData: SavingsData[] = [
    { month: 'Jan', amount: 847 },
    { month: 'Feb', amount: 923 },
    { month: 'Mar', amount: 756 },
    { month: 'Apr', amount: 1012 },
    { month: 'May', amount: 889 },
    { month: 'Jun', amount: 967 },
  ];

  const recentTransactions: TransactionData[] = [
    {
      id: 'TXN001',
      merchant: 'Shoprite Soweto',
      date: '2026-01-03',
      original: 850,
      saved: 178,
      paid: 672,
    },
    {
      id: 'TXN002',
      merchant: 'Pick n Pay Alexandra',
      date: '2026-01-02',
      original: 450,
      saved: 94,
      paid: 356,
    },
    {
      id: 'TXN003',
      merchant: 'Spar Khayelitsha',
      date: '2025-12-30',
      original: 620,
      saved: 130,
      paid: 490,
    },
  ];

  const totalSavings = savingsData.reduce((sum, data) => sum + data.amount, 0);
  const avgMonthlySavings = Math.round(totalSavings / savingsData.length);

  if (!isHydrated) {
    return (
      <section className="bg-background py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-accent/10 rounded-full mb-6">
            <Icon name="ChartBarSquareIcon" size={20} variant="solid" className="text-accent" />
            <span className="text-sm font-headline font-semibold text-accent">
              Track Your Impact
            </span>
          </div>

          <h2 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
            Watch Your Savings Grow
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Monitor every rand saved with detailed transaction history and visual analytics.
            Available via SMS or app.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Total Savings Card */}
          <div className="bg-gradient-to-br from-success/20 to-success/5 rounded-xl p-6 shadow-lg border-2 border-success/30">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                <Icon name="BanknotesIcon" size={24} variant="solid" className="text-success" />
              </div>
              <Icon name="TrendingUpIcon" size={24} variant="solid" className="text-success" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">Total Savings (6 months)</p>
            <p className="text-4xl font-headline font-bold text-success mb-1">
              R{totalSavings.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">+12% from last period</p>
          </div>

          {/* Average Monthly Card */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-6 shadow-lg border-2 border-primary/30">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Icon name="CalculatorIcon" size={24} variant="solid" className="text-primary" />
              </div>
              <Icon name="ChartBarIcon" size={24} variant="solid" className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">Average Monthly Savings</p>
            <p className="text-4xl font-headline font-bold text-primary mb-1">
              R{avgMonthlySavings}
            </p>
            <p className="text-xs text-muted-foreground">Consistent growth</p>
          </div>

          {/* Vouchers Used Card */}
          <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-xl p-6 shadow-lg border-2 border-secondary/30">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                <Icon name="TicketIcon" size={24} variant="solid" className="text-secondary" />
              </div>
              <Icon name="CheckCircleIcon" size={24} variant="solid" className="text-secondary" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">Vouchers Redeemed</p>
            <p className="text-4xl font-headline font-bold text-secondary mb-1">47</p>
            <p className="text-xs text-muted-foreground">Across 12 merchants</p>
          </div>
        </div>

        {/* Savings Chart */}
        <div className="bg-card rounded-2xl shadow-xl p-8 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline font-bold text-2xl text-foreground">Savings Timeline</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-4 py-2 rounded-lg text-sm font-headline font-semibold transition-all duration-300 ${
                  selectedPeriod === 'month'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setSelectedPeriod('quarter')}
                className={`px-4 py-2 rounded-lg text-sm font-headline font-semibold transition-all duration-300 ${
                  selectedPeriod === 'quarter'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Quarter
              </button>
              <button
                onClick={() => setSelectedPeriod('year')}
                className={`px-4 py-2 rounded-lg text-sm font-headline font-semibold transition-all duration-300 ${
                  selectedPeriod === 'year'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Year
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {savingsData.map((data, index) => {
              const maxAmount = Math.max(...savingsData.map((d) => d.amount));
              const widthPercentage = (data.amount / maxAmount) * 100;

              return (
                <div key={index} className="flex items-center space-x-4">
                  <span className="font-headline font-semibold text-sm text-muted-foreground w-12">
                    {data.month}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-10 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-success to-accent h-full flex items-center justify-end pr-4 transition-all duration-500"
                      style={{ width: `${widthPercentage}%` }}
                    >
                      <span className="font-headline font-bold text-sm text-white">
                        R{data.amount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card rounded-2xl shadow-xl p-8">
          <h3 className="font-headline font-bold text-2xl text-foreground mb-6">
            Recent Transactions
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-headline font-semibold text-sm text-muted-foreground">
                    Merchant
                  </th>
                  <th className="text-left py-3 px-4 font-headline font-semibold text-sm text-muted-foreground">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 font-headline font-semibold text-sm text-muted-foreground">
                    Original
                  </th>
                  <th className="text-right py-3 px-4 font-headline font-semibold text-sm text-muted-foreground">
                    Saved
                  </th>
                  <th className="text-right py-3 px-4 font-headline font-semibold text-sm text-muted-foreground">
                    Paid
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors duration-200"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon
                            name="BuildingStorefrontIcon"
                            size={20}
                            variant="solid"
                            className="text-primary"
                          />
                        </div>
                        <span className="font-body font-medium text-foreground">
                          {transaction.merchant}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString('en-ZA', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4 text-right font-body text-muted-foreground">
                      R{transaction.original.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-headline font-bold text-success">
                      R{transaction.saved.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-headline font-bold text-foreground">
                      R{transaction.paid.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-center">
            <button className="flex items-center space-x-2 px-6 py-3 bg-muted text-foreground rounded-lg font-headline font-semibold hover:bg-muted/80 transition-colors duration-300">
              <span>View All Transactions</span>
              <Icon name="ArrowRightIcon" size={20} variant="solid" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SavingsTracker;
