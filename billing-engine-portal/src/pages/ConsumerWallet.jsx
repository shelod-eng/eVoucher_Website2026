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
import { ArrowLeft, Wallet, ShoppingBag, QrCode, Check, Copy, Send, Plus, Gift } from 'lucide-react';
import VoucherQRModal from '@/components/pos/VoucherQRModal';

export default function ConsumerWalletPage() {
  const [showRedeem, setShowRedeem] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemed, setRedeemed] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: vouchers = [] } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => base44.entities.VoucherInstance.list('-created_date'),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['consumerProfile'],
    queryFn: () => base44.entities.ConsumerProfile.list(),
  });

  const profile = profiles[0] || { walletBalance: 0 };

  const activeVouchers = vouchers.filter(v => v.status === 'active' || v.status === 'partially_redeemed');
  const totalBalance = activeVouchers.reduce((sum, v) => sum + (v.remainingBalance || 0), 0);

  const redeemMutation = useMutation({
    mutationFn: async ({ voucher, amount }) => {
      const newBalance = voucher.remainingBalance - amount;
      
      // Update voucher status
      await base44.entities.VoucherInstance.update(voucher.id, {
        remainingBalance: newBalance,
        status: newBalance <= 0 ? 'fully_redeemed' : 'partially_redeemed'
      });
      
      // Create redemption transaction
      await base44.entities.Transaction.create({
        type: 'redemption',
        amount: amount,
        merchantId: voucher.merchantId,
        merchantName: voucher.merchantName,
        voucherInstanceId: voucher.id,
        status: 'completed',
        description: `Redeemed R${amount} at ${voucher.merchantName}`
      });

      // Create ledger entry for merchant revenue
      await base44.entities.LedgerEntry.create({
        entryType: 'redemption',
        amount: amount,
        merchantId: voucher.merchantId,
        merchantName: voucher.merchantName,
        reference: voucher.voucherCode,
        description: `Voucher redeemed: R${amount}`,
      });

      // If fully redeemed, update merchant payout from liability to posted
      if (newBalance <= 0) {
        await base44.entities.LedgerEntry.create({
          entryType: 'merchant_payout_posted',
          amount: voucher.faceValue * 0.92,
          merchantId: voucher.merchantId,
          merchantName: voucher.merchantName,
          reference: voucher.voucherCode,
          description: `Payout eligible: R${(voucher.faceValue * 0.92).toFixed(2)}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      setRedeemed(true);
    }
  });

  const handleRedeem = (voucher) => {
    setSelectedVoucher(voucher);
    setRedeemAmount('');
    setRedeemed(false);
    setShowRedeem(true);
  };

  const confirmRedeem = () => {
    const amount = parseFloat(redeemAmount);
    if (amount > 0 && amount <= selectedVoucher.remainingBalance) {
      redeemMutation.mutate({ voucher: selectedVoucher, amount });
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <h1 className="text-xl font-bold text-white">My Vouchers</h1>
          </div>

          <div className="text-center">
            <p className="text-white/80 text-sm">Total Voucher Balance</p>
            <h2 className="text-4xl font-bold text-white my-2">R{totalBalance.toLocaleString()}</h2>
            <p className="text-white/60 text-sm">{activeVouchers.length} active vouchers</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 -mt-10">
          <Card className="bg-white rounded-2xl p-4 shadow-lg border-0">
            <div className="grid grid-cols-3 gap-2">
              <Link to={createPageUrl('Shop')} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-[#00A89D]/10 flex items-center justify-center mb-2">
                  <Plus className="w-6 h-6 text-[#00A89D]" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Buy Voucher</span>
              </Link>
              <Link to={createPageUrl('SendVoucher')} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                  <Send className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Send Gift</span>
              </Link>
              <Link to={createPageUrl('TransactionHistory')} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                  <ShoppingBag className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-xs text-gray-600 font-medium">History</span>
              </Link>
            </div>
          </Card>
        </div>

        {/* Vouchers List */}
        <div className="px-4 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">My Vouchers</h2>
          
          {activeVouchers.length === 0 ? (
            <Card className="bg-gray-50 rounded-xl p-8 text-center border-0">
              <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No vouchers yet</p>
              <p className="text-gray-400 text-sm mb-4">Buy your first voucher and start saving!</p>
              <Link to={createPageUrl('Shop')}>
                <GoldButton>Browse Vouchers</GoldButton>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeVouchers.map((voucher) => {
                const usedPercent = ((voucher.faceValue - voucher.remainingBalance) / voucher.faceValue) * 100;
                return (
                  <Card key={voucher.id} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-[#00A89D] to-[#00A89D]/80 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">{voucher.merchantName?.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="text-white font-bold">{voucher.merchantName}</h3>
                            <p className="text-white/70 text-xs">Code: {voucher.voucherCode}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => copyCode(voucher.voucherCode)}
                          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                        >
                          {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-gray-500 text-xs">Remaining</p>
                          <p className="text-gray-900 font-bold text-xl">R{voucher.remainingBalance}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500 text-xs">Original</p>
                          <p className="text-gray-400 text-sm">R{voucher.faceValue}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                        <div 
                          className="h-full bg-gradient-to-r from-[#00A89D] to-[#00A89D]/70 rounded-full"
                          style={{ width: `${100 - usedPercent}%` }}
                        />
                      </div>

                      <div className="flex gap-2">
                        <GoldButton className="flex-1" onClick={() => handleRedeem(voucher)}>
                          Redeem
                        </GoldButton>
                        <button 
                          className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-[#00A89D]/10 transition-colors"
                          onClick={() => {
                            setSelectedVoucher(voucher);
                            setShowQR(true);
                          }}
                        >
                          <QrCode className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Redeem Dialog */}
      <Dialog open={showRedeem} onOpenChange={setShowRedeem}>
        <DialogContent className="bg-white border-gray-200 max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {redeemed ? 'Redemption Successful!' : `Redeem at ${selectedVoucher?.merchantName}`}
            </DialogTitle>
          </DialogHeader>
          
          {redeemed ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-900 font-bold text-xl mb-2">R{redeemAmount} Redeemed</p>
              <p className="text-gray-500 text-sm mb-4">Show this confirmation to the cashier</p>
              <div className="bg-gray-100 rounded-xl p-4 mb-4">
                <p className="text-gray-500 text-xs">Voucher Code</p>
                <p className="text-gray-900 font-mono font-bold text-lg">{selectedVoucher?.voucherCode}</p>
              </div>
              <GoldButton className="w-full" onClick={() => setShowRedeem(false)}>Done</GoldButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm mb-2">Available: R{selectedVoucher?.remainingBalance}</p>
                <Input 
                  type="number"
                  placeholder="Enter amount to redeem"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="h-14 text-xl text-center bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setRedeemAmount(Math.min(amt, selectedVoucher?.remainingBalance || 0).toString())}
                    className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-[#00A89D]/10 hover:text-[#00A89D]"
                  >
                    R{amt}
                  </button>
                ))}
                <button
                  onClick={() => setRedeemAmount(selectedVoucher?.remainingBalance?.toString() || '0')}
                  className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-[#00A89D]/10 hover:text-[#00A89D]"
                >
                  All
                </button>
              </div>
              <GoldButton 
                className="w-full h-12" 
                onClick={confirmRedeem}
                disabled={!redeemAmount || parseFloat(redeemAmount) > selectedVoucher?.remainingBalance}
              >
                Confirm Redemption
              </GoldButton>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <VoucherQRModal 
        open={showQR} 
        onClose={() => setShowQR(false)} 
        voucher={selectedVoucher} 
      />

      <BottomNav activePage="ConsumerWallet" />
    </MobileContainer>
  );
}