import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ShoppingBag, CreditCard, ArrowDownLeft, ArrowUpRight, Gift, Users, Loader2 } from 'lucide-react';

export default function TransactionHistoryPage() {
  const [filter, setFilter] = useState('all');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 50),
  });

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  const getIcon = (type) => {
    switch(type) {
      case 'purchase': return <ShoppingBag className="w-5 h-5 text-purple-500" />;
      case 'redemption': return <CreditCard className="w-5 h-5 text-orange-500" />;
      case 'deposit': return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'payout': return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'gift_voucher': return <Gift className="w-5 h-5 text-pink-500" />;
      case 'referral_bonus': return <Users className="w-5 h-5 text-blue-500" />;
      default: return <CreditCard className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBgColor = (type) => {
    switch(type) {
      case 'purchase': return 'bg-purple-100';
      case 'redemption': return 'bg-orange-100';
      case 'deposit': return 'bg-green-100';
      case 'payout': return 'bg-red-100';
      case 'gift_voucher': return 'bg-pink-100';
      case 'referral_bonus': return 'bg-blue-100';
      default: return 'bg-gray-100';
    }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'purchase', label: 'Purchases' },
    { id: 'redemption', label: 'Redemptions' },
  ];

  return (
    <MobileContainer>
      <div className="pb-24">
        {/* Header */}
        <div className="bg-[#00A89D] pt-6 pb-6 px-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Profile')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">Transaction History</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-[#00A89D] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#00A89D] animate-spin" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <Card className="bg-gray-50 rounded-xl p-8 text-center border-0">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transactions found</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => (
                <Card key={tx.id} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${getBgColor(tx.type)} flex items-center justify-center`}>
                        {getIcon(tx.type)}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{tx.description || tx.merchantName || tx.type}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(tx.created_date).toLocaleDateString('en-ZA', { 
                            day: 'numeric', 
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        tx.type === 'purchase' || tx.type === 'payout' || tx.type === 'gift_voucher'
                          ? 'text-gray-900' 
                          : 'text-green-600'
                      }`}>
                        {tx.type === 'purchase' || tx.type === 'payout' || tx.type === 'gift_voucher' ? '-' : '+'}R{tx.amount}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav activePage="Profile" />
    </MobileContainer>
  );
}