import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Wallet, Plus, Send, ArrowDownLeft, ArrowUpRight, Gift, Users, History } from 'lucide-react';

export default function WalletPage() {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['consumerProfile'],
    queryFn: () => base44.entities.ConsumerProfile.list(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['walletTransactions'],
    queryFn: () => base44.entities.WalletTransaction.list('-created_date', 20),
  });

  const profile = profiles[0] || { walletBalance: 0, referralEarnings: 0 };

  const quickAmounts = [50, 100, 200, 500, 1000];

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'deposit': return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'withdrawal': return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'voucher_purchase': return <Gift className="w-5 h-5 text-purple-500" />;
      case 'referral_bonus': return <Users className="w-5 h-5 text-blue-500" />;
      case 'gift_voucher': return <Send className="w-5 h-5 text-orange-500" />;
      default: return <Wallet className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <MobileContainer>
      <div className="pb-24">
        {/* Header */}
        <div className="bg-[#00A89D] pt-6 pb-20 px-4 rounded-b-[32px]">
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl('ConsumerHome')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">My Wallet</h1>
          </div>

          <div className="text-center">
            <p className="text-white/80 text-sm">Available Balance</p>
            <h2 className="text-4xl font-bold text-white my-2">R{(profile.walletBalance || 0).toLocaleString()}</h2>
          </div>
        </div>

        {/* Action Cards */}
        <div className="px-4 -mt-10">
          <Card className="bg-white rounded-2xl p-4 shadow-lg border-0">
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => setShowAddFunds(true)} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-[#00A89D]/10 flex items-center justify-center mb-2">
                  <Plus className="w-6 h-6 text-[#00A89D]" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Add Funds</span>
              </button>
              <Link to={createPageUrl('SendVoucher')} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                  <Send className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Send Gift</span>
              </Link>
              <Link to={createPageUrl('Shop')} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                  <Gift className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Buy Voucher</span>
              </Link>
              <Link to={createPageUrl('TransactionHistory')} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <History className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs text-gray-600 font-medium">History</span>
              </Link>
            </div>
          </Card>
        </div>

        {/* Referral Earnings */}
        <div className="px-4 mt-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Referral Earnings</p>
                <p className="text-white font-bold text-xl">R{(profile.referralEarnings || 0).toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-white/50" />
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div className="px-4 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <Card className="bg-gray-50 rounded-xl p-6 text-center border-0">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No transactions yet</p>
              </Card>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <Card key={tx.id} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium text-sm">{tx.description || tx.type}</p>
                        <p className="text-gray-500 text-xs">{new Date(tx.created_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${tx.type === 'withdrawal' || tx.type === 'voucher_purchase' ? 'text-red-500' : 'text-green-500'}`}>
                      {tx.type === 'withdrawal' || tx.type === 'voucher_purchase' ? '-' : '+'}R{tx.amount}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
        <DialogContent className="bg-white border-gray-200 max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add Funds to Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 mb-2 block">Amount</label>
              <Input 
                type="number" 
                placeholder="Enter amount" 
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="h-14 text-xl text-center bg-gray-50 border-gray-200" 
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAddAmount(amt.toString())}
                  className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-[#00A89D]/10 hover:text-[#00A89D]"
                >
                  R{amt}
                </button>
              ))}
            </div>
            <GoldButton className="w-full h-12" onClick={() => setShowAddFunds(false)}>
              Continue to Payment
            </GoldButton>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav activePage="ConsumerWallet" />
    </MobileContainer>
  );
}