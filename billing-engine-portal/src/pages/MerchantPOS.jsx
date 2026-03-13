import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, Camera, QrCode, Search, Check, X, AlertCircle, 
  Loader2, History, TrendingUp, DollarSign, CreditCard
} from 'lucide-react';

export default function MerchantPOS() {
  const [activeTab, setActiveTab] = useState('scan');
  const [manualCode, setManualCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const merchantId = urlParams.get('merchantId');

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list(),
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['merchantRedemptions', selectedMerchant?.id],
    queryFn: () => base44.entities.Transaction.filter({ 
      merchantId: selectedMerchant?.id, 
      type: 'redemption' 
    }, '-created_date', 50),
    enabled: !!selectedMerchant?.id,
  });

  useEffect(() => {
    if (merchantId && merchants.length > 0) {
      const merchant = merchants.find(m => m.id === merchantId);
      if (merchant) setSelectedMerchant(merchant);
    }
  }, [merchantId, merchants]);

  const todayRedemptions = redemptions.filter(r => {
    const today = new Date().toDateString();
    return new Date(r.created_date).toDateString() === today;
  });
  
  const todayTotal = todayRedemptions.reduce((sum, r) => sum + r.amount, 0);

  const searchVoucher = async () => {
    if (!manualCode.trim()) return;
    setSearching(true);
    setSearchResult(null);
    
    try {
      const vouchers = await base44.entities.VoucherInstance.filter({ voucherCode: manualCode.trim().toUpperCase() });
      if (vouchers.length > 0) {
        const voucher = vouchers[0];
        // Check if voucher is for this merchant
        if (selectedMerchant && voucher.merchantId !== selectedMerchant.id) {
          setSearchResult({ error: 'This voucher is for a different merchant' });
        } else if (voucher.status === 'fully_redeemed' || voucher.remainingBalance <= 0) {
          setSearchResult({ error: 'This voucher has been fully redeemed', voucher });
        } else if (voucher.status === 'expired') {
          setSearchResult({ error: 'This voucher has expired', voucher });
        } else {
          setSearchResult({ voucher });
        }
      } else {
        setSearchResult({ error: 'Voucher not found' });
      }
    } catch (err) {
      setSearchResult({ error: 'Error searching for voucher' });
    }
    setSearching(false);
  };

  const redeemMutation = useMutation({
    mutationFn: async ({ voucher, amount }) => {
      const newBalance = voucher.remainingBalance - amount;
      await base44.entities.VoucherInstance.update(voucher.id, {
        remainingBalance: newBalance,
        status: newBalance <= 0 ? 'fully_redeemed' : 'partially_redeemed'
      });
      await base44.entities.Transaction.create({
        type: 'redemption',
        amount: amount,
        merchantId: voucher.merchantId,
        merchantName: voucher.merchantName,
        voucherInstanceId: voucher.id,
        status: 'completed',
        reference: voucher.voucherCode,
        description: `POS redemption - ${voucher.voucherCode}`
      });
      // Update merchant stats
      if (selectedMerchant) {
        await base44.entities.Merchant.update(selectedMerchant.id, {
          totalRedemptions: (selectedMerchant.totalRedemptions || 0) + 1,
          totalRevenue: (selectedMerchant.totalRevenue || 0) + amount
        });
      }
    },
    onSuccess: () => {
      setRedeemSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['merchantRedemptions'] });
    }
  });

  const handleRedeem = () => {
    const amount = parseFloat(redeemAmount);
    if (amount > 0 && amount <= searchResult.voucher.remainingBalance) {
      redeemMutation.mutate({ voucher: searchResult.voucher, amount });
    }
  };

  const resetSearch = () => {
    setManualCode('');
    setSearchResult(null);
    setRedeemAmount('');
    setRedeemSuccess(false);
    setShowRedeemDialog(false);
  };

  // Merchant selection screen
  if (!selectedMerchant) {
    return (
      <MobileContainer>
        <div className="min-h-screen bg-gray-50">
          <div className="bg-[#00A89D] pt-6 pb-6 px-4">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('MerchantDashboard')}>
                <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              </Link>
              <h1 className="text-xl font-bold text-white">POS Terminal</h1>
            </div>
          </div>
          
          <div className="px-4 py-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Select Your Store</h2>
            <div className="space-y-3">
              {merchants.map((merchant) => (
                <Card 
                  key={merchant.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 cursor-pointer hover:border-[#00A89D] transition-colors"
                  onClick={() => setSelectedMerchant(merchant)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#00A89D]/10 flex items-center justify-center">
                      <span className="text-xl font-bold text-[#00A89D]">{merchant.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{merchant.name}</h3>
                      <p className="text-gray-500 text-sm capitalize">{merchant.category}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#00A89D] pt-6 pb-4 px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedMerchant(null)}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <p className="text-white/80 text-xs">POS Terminal</p>
                <h1 className="text-lg font-bold text-white">{selectedMerchant.name}</h1>
              </div>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-white/20 rounded-xl p-3 border-0">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-white/80" />
                <div>
                  <p className="text-white/70 text-xs">Today's Total</p>
                  <p className="text-white font-bold">R{todayTotal.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card className="bg-white/20 rounded-xl p-3 border-0">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-white/80" />
                <div>
                  <p className="text-white/70 text-xs">Redemptions</p>
                  <p className="text-white font-bold">{todayRedemptions.length}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex gap-2">
            {[
              { id: 'scan', label: 'Scan/Enter', icon: QrCode },
              { id: 'history', label: 'History', icon: History }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-[#00A89D] text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-4">
          {activeTab === 'scan' && (
            <div className="space-y-4">
              {/* Manual Code Entry */}
              <Card className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#00A89D]" />
                  Enter Voucher Code
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., EV12ABC34"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    className="flex-1 h-12 bg-gray-50 border-gray-200 text-gray-900 font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && searchVoucher()}
                  />
                  <GoldButton onClick={searchVoucher} disabled={searching} className="h-12 px-6">
                    {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                  </GoldButton>
                </div>
              </Card>

              {/* Search Result */}
              {searchResult && (
                <Card className={`rounded-xl p-4 border-2 ${
                  searchResult.error 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  {searchResult.error ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <X className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-red-900">{searchResult.error}</p>
                        {searchResult.voucher && (
                          <p className="text-red-700 text-sm">Balance: R{searchResult.voucher.remainingBalance}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900">Valid Voucher Found</p>
                          <p className="text-green-700 text-sm">Code: {searchResult.voucher.voucherCode}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Available Balance</span>
                          <span className="text-2xl font-bold text-green-600">R{searchResult.voucher.remainingBalance}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span className="text-gray-500">Original Value</span>
                          <span className="text-gray-700">R{searchResult.voucher.faceValue}</span>
                        </div>
                      </div>

                      <GoldButton 
                        className="w-full h-12" 
                        onClick={() => {
                          setRedeemAmount(searchResult.voucher.remainingBalance.toString());
                          setShowRedeemDialog(true);
                        }}
                      >
                        Process Redemption
                      </GoldButton>
                    </div>
                  )}
                </Card>
              )}

              {/* Quick Tips */}
              <Card className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Quick Tips
                </h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Ask customer to show their QR code</li>
                  <li>• Enter the code starting with "EV"</li>
                  <li>• Partial redemptions are allowed</li>
                  <li>• Always confirm amount before processing</li>
                </ul>
              </Card>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Recent Redemptions</h3>
              {redemptions.length === 0 ? (
                <Card className="bg-gray-50 rounded-xl p-8 text-center border-0">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No redemptions yet</p>
                </Card>
              ) : (
                redemptions.slice(0, 20).map((tx) => (
                  <Card key={tx.id} className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">R{tx.amount}</p>
                          <p className="text-gray-500 text-xs">{tx.reference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 text-xs">
                          {new Date(tx.created_date).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(tx.created_date).toLocaleDateString('en-ZA')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Redeem Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {redeemSuccess ? 'Redemption Complete!' : 'Process Redemption'}
            </DialogTitle>
          </DialogHeader>
          
          {redeemSuccess ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600 mb-2">R{redeemAmount}</p>
              <p className="text-gray-500 mb-4">Successfully redeemed</p>
              <div className="bg-gray-100 rounded-xl p-3 mb-4">
                <p className="text-gray-500 text-xs">New Balance</p>
                <p className="text-gray-900 font-bold">
                  R{(searchResult?.voucher?.remainingBalance || 0) - parseFloat(redeemAmount || 0)}
                </p>
              </div>
              <GoldButton className="w-full" onClick={resetSearch}>Done</GoldButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Voucher Code</span>
                  <span className="font-mono font-bold text-gray-900">{searchResult?.voucher?.voucherCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available</span>
                  <span className="font-bold text-green-600">R{searchResult?.voucher?.remainingBalance}</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block">Redemption Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="h-14 text-2xl text-center bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {[50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setRedeemAmount(Math.min(amt, searchResult?.voucher?.remainingBalance || 0).toString())}
                    className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-[#00A89D]/10 hover:text-[#00A89D]"
                  >
                    R{amt}
                  </button>
                ))}
                <button
                  onClick={() => setRedeemAmount(searchResult?.voucher?.remainingBalance?.toString() || '0')}
                  className="px-4 py-2 rounded-full bg-[#00A89D]/10 text-[#00A89D] text-sm font-medium"
                >
                  Full Amount
                </button>
              </div>

              <div className="flex gap-3">
                <GoldButton variant="outline" className="flex-1" onClick={() => setShowRedeemDialog(false)}>
                  Cancel
                </GoldButton>
                <GoldButton 
                  className="flex-1" 
                  onClick={handleRedeem}
                  disabled={!redeemAmount || parseFloat(redeemAmount) > (searchResult?.voucher?.remainingBalance || 0) || parseFloat(redeemAmount) <= 0}
                >
                  Confirm R{redeemAmount || 0}
                </GoldButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MobileContainer>
  );
}