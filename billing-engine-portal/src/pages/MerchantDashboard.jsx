import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Store, TrendingUp, Wallet, Package, Plus, ArrowLeft,
  DollarSign, Users, ShoppingBag, ChevronRight, Loader2, QrCode
} from 'lucide-react';
import moment from 'moment';

export default function MerchantDashboard() {
  const queryClient = useQueryClient();
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    description: '',
    faceValue: 1000
  });
  
  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list()
  });
  
  const { data: products = [] } = useQuery({
    queryKey: ['merchantProducts', selectedMerchant?.id],
    queryFn: () => base44.entities.VoucherProduct.filter({ merchantId: selectedMerchant?.id }),
    enabled: !!selectedMerchant
  });
  
  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ['merchantLedger', selectedMerchant?.id],
    queryFn: () => base44.entities.LedgerEntry.filter({ merchantId: selectedMerchant?.id }),
    enabled: !!selectedMerchant
  });
  
  const { data: redemptions = [] } = useQuery({
    queryKey: ['merchantRedemptions', selectedMerchant?.id],
    queryFn: () => base44.entities.Transaction.filter({ merchantId: selectedMerchant?.id, type: 'redemption' }),
    enabled: !!selectedMerchant
  });
  
  // TRD v2 split: 96% merchant gross, 0.5% bank fee on gross, 2.8% consumer benefit, 1.2% platform revenue
  function calcTrdV2(faceValue) {
    const fv = Number(faceValue) || 0;
    const merchantGross = Number((fv * 0.96).toFixed(2));
    const bankFee = Number((merchantGross * 0.005).toFixed(2));
    const merchantNet = Number((merchantGross - bankFee).toFixed(2));
    const consumerBenefit = Number((fv * 0.028).toFixed(2));
    const platformRevenue = Number((fv * 0.012).toFixed(2));
    return { merchantGross, bankFee, merchantNet, consumerBenefit, platformRevenue };
  }

  const createProductMutation = useMutation({
    mutationFn: async (productData) => {
      const faceValue = parseFloat(productData.faceValue);
      const trd = calcTrdV2(faceValue);
      await base44.entities.VoucherProduct.create({
        merchantId: selectedMerchant.id,
        merchantName: selectedMerchant.name,
        description: productData.description,
        faceValue,
        consumerPrice: Number((faceValue * 0.96).toFixed(2)),
        merchantPayout: trd.merchantNet,
        platformMargin: trd.platformRevenue,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['merchantProducts']);
      setShowCreateProduct(false);
      setNewProduct({ description: '', faceValue: 1000 });
    }
  });
  
  const totalRevenue = ledgerEntries
    .filter(e => e.entryType === 'merchant_revenue')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const pendingPayout = ledgerEntries
    .filter(e => e.entryType === 'merchant_payout_liability')
    .reduce((sum, e) => sum + e.amount, 0);
  
  // Merchant Selection
  if (!selectedMerchant) {
    return (
      <MobileContainer>
        <div className="pb-8">
          <div className="px-4 pt-6 pb-4">
            <div className="flex items-center gap-4 mb-6">
              <Link to={createPageUrl('Landing')}>
                <button className="w-10 h-10 rounded-full bg-[#111827] border border-[#1F2937] flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              </Link>
              <h1 className="text-2xl font-bold text-white">Merchant Portal</h1>
            </div>
            
            <p className="text-[#9CA3AF] mb-4">Select your merchant account:</p>
            
            <div className="space-y-3">
              {merchants.map((merchant) => (
                <button
                  key={merchant.id}
                  onClick={() => setSelectedMerchant(merchant)}
                  className="w-full"
                >
                  <Card className="bg-[#111827] border-[#1F2937] p-4 hover:border-[#D4AF37] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#2DD4BF] flex items-center justify-center">
                          <span className="text-xl font-bold text-black">{merchant.name?.charAt(0)}</span>
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-white">{merchant.name}</h3>
                          <p className="text-sm text-[#9CA3AF]">{merchant.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
                    </div>
                  </Card>
                </button>
              ))}
              
              {merchants.length === 0 && (
                <div className="text-center py-12 text-[#9CA3AF]">
                  <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No merchants registered</p>
                  <p className="text-sm mt-1">Contact admin to register</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="pb-8">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => setSelectedMerchant(null)}
              className="w-10 h-10 rounded-full bg-[#111827] border border-[#1F2937] flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{selectedMerchant.name}</h1>
              <p className="text-sm text-[#9CA3AF]">Merchant Dashboard</p>
            </div>
          </div>
        </div>
        
        {/* POS Terminal Button */}
        <div className="px-4 mb-4">
          <Link to={createPageUrl('MerchantPOS') + `?merchantId=${selectedMerchant.id}`}>
            <Card className="bg-gradient-to-r from-[#00A89D] to-[#00A89D]/80 border-0 p-4 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">POS Terminal</h3>
                    <p className="text-white/80 text-sm">Scan & redeem vouchers</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-white/80" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border-[#D4AF37]/30 p-4">
              <TrendingUp className="w-6 h-6 text-[#D4AF37] mb-2" />
              <p className="text-[#9CA3AF] text-xs">Total Revenue</p>
              <p className="text-xl font-bold text-[#D4AF37]">R{totalRevenue.toLocaleString()}</p>
            </Card>
            <Card className="bg-gradient-to-br from-[#2DD4BF]/20 to-[#2DD4BF]/5 border-[#2DD4BF]/30 p-4">
              <Wallet className="w-6 h-6 text-[#2DD4BF] mb-2" />
              <p className="text-[#9CA3AF] text-xs">Pending Payout</p>
              <p className="text-xl font-bold text-[#2DD4BF]">R{pendingPayout.toLocaleString()}</p>
            </Card>
            <Card className="bg-[#111827] border-[#1F2937] p-4">
              <Package className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-[#9CA3AF] text-xs">Products</p>
              <p className="text-xl font-bold text-white">{products.length}</p>
            </Card>
            <Card className="bg-[#111827] border-[#1F2937] p-4">
              <ShoppingBag className="w-6 h-6 text-pink-400 mb-2" />
              <p className="text-[#9CA3AF] text-xs">Redemptions</p>
              <p className="text-xl font-bold text-white">{redemptions.length}</p>
            </Card>
          </div>
        </div>
        
        {/* Products */}
        <div className="px-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-white">Voucher Products</h2>
            <GoldButton size="sm" onClick={() => setShowCreateProduct(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </GoldButton>
          </div>
          
          <div className="space-y-3">
            {products.map((product) => (
              <Card key={product.id} className="bg-[#111827] border-[#1F2937] p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">{product.description || 'Standard Voucher'}</p>
                    <p className="text-sm text-[#9CA3AF]">Face Value: R{product.faceValue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D4AF37] font-semibold">R{product.consumerPrice}</p>
                    <p className="text-xs text-[#9CA3AF]">Consumer Price</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#1F2937] flex justify-between text-sm">
                  <span className="text-[#9CA3AF]">Your Payout: <span className="text-[#2DD4BF]">R{product.merchantPayout}</span></span>
                  <span className="text-[#9CA3AF]">Platform: <span className="text-white">R{product.platformMargin}</span></span>
                </div>
              </Card>
            ))}
            
            {products.length === 0 && (
              <div className="text-center py-8 text-[#9CA3AF]">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No products yet</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Redemptions */}
        <div className="px-4">
          <h2 className="text-lg font-semibold text-white mb-3">Recent Redemptions</h2>
          <div className="space-y-2">
            {redemptions.slice(0, 5).map((txn) => (
              <Card key={txn.id} className="bg-[#111827] border-[#1F2937] p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">R{txn.amount}</p>
                    <p className="text-xs text-[#9CA3AF]">{txn.reference}</p>
                  </div>
                  <p className="text-xs text-[#9CA3AF]">{moment(txn.created_date).fromNow()}</p>
                </div>
              </Card>
            ))}
            
            {redemptions.length === 0 && (
              <div className="text-center py-6 text-[#9CA3AF]">
                <p className="text-sm">No redemptions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Product Dialog */}
      <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
        <DialogContent className="bg-[#111827] border-[#1F2937] text-white max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Create Voucher Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#9CA3AF] mb-2 block">Description</label>
              <Input
                placeholder="e.g., Holiday Special"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                className="bg-[#0B0B0D] border-[#1F2937] text-white h-12"
              />
            </div>
            <div>
              <label className="text-sm text-[#9CA3AF] mb-2 block">Face Value (R)</label>
              <Input
                type="number"
                value={newProduct.faceValue}
                onChange={(e) => setNewProduct({...newProduct, faceValue: e.target.value})}
                className="bg-[#0B0B0D] border-[#1F2937] text-white h-12"
              />
            </div>
            
            {(() => {
              const trd = calcTrdV2(newProduct.faceValue);
              return (
                <div className="bg-[#0B0B0D] rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">Consumer Price (96% of face value)</span>
                    <span className="text-[#D4AF37]">R{(parseFloat(newProduct.faceValue) * 0.96).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">Merchant Gross (96%)</span>
                    <span className="text-[#2DD4BF]">R{trd.merchantGross.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">Bank Fee (0.5% of gross)</span>
                    <span className="text-red-400">−R{trd.bankFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-2">
                    <span className="text-[#9CA3AF]">Your Net Payout</span>
                    <span className="text-[#2DD4BF]">R{trd.merchantNet.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">Consumer Benefit (2.8%)</span>
                    <span className="text-purple-300">R{trd.consumerBenefit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">Platform Revenue (1.2%)</span>
                    <span className="text-white">R{trd.platformRevenue.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}
            
            <GoldButton 
              className="w-full h-12" 
              onClick={() => createProductMutation.mutate(newProduct)}
              disabled={createProductMutation.isPending}
            >
              {createProductMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Create Product'
              )}
            </GoldButton>
          </div>
        </DialogContent>
      </Dialog>
    </MobileContainer>
  );
}