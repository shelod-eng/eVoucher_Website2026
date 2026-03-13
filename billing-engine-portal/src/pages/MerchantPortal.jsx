import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, Store, DollarSign, TrendingUp, Package, QrCode,
  Settings, CreditCard, Plus, Loader2, BarChart3, Edit, 
  CheckCircle2, Clock, Users, Wallet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import moment from 'moment';

export default function MerchantPortal() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [newProduct, setNewProduct] = useState({ faceValue: '', description: '' });
  
  const urlParams = new URLSearchParams(window.location.search);
  const merchantId = urlParams.get('id');

  // Fetch merchant
  const { data: merchants = [] } = useQuery({
    queryKey: ['merchant', merchantId],
    queryFn: () => base44.entities.Merchant.filter({ id: merchantId }),
    enabled: !!merchantId,
  });
  const merchant = merchants[0];

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['merchant-products', merchantId],
    queryFn: () => base44.entities.VoucherProduct.filter({ merchantId }),
    enabled: !!merchantId,
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['merchant-transactions', merchantId],
    queryFn: () => base44.entities.Transaction.filter({ merchantId }, '-created_date', 50),
    enabled: !!merchantId,
  });

  // Fetch voucher instances
  const { data: vouchers = [] } = useQuery({
    queryKey: ['merchant-vouchers', merchantId],
    queryFn: () => base44.entities.VoucherInstance.filter({ merchantId }),
    enabled: !!merchantId,
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      const faceValue = parseFloat(data.faceValue);
      await base44.entities.VoucherProduct.create({
        merchantId,
        merchantName: merchant?.name,
        faceValue,
        consumerPrice: faceValue * 0.96,
        merchantPayout: faceValue * 0.92,
        platformMargin: faceValue * 0.04,
        description: data.description,
        status: 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['merchant-products']);
      setShowCreateProduct(false);
      setNewProduct({ faceValue: '', description: '' });
    },
  });

  // Calculate stats
  const totalRevenue = transactions
    .filter(t => t.type === 'redemption')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const pendingPayout = vouchers
    .filter(v => v.status === 'fully_redeemed')
    .reduce((sum, v) => sum + (v.faceValue * 0.92), 0);

  const activeVouchers = vouchers.filter(v => v.status === 'active' || v.status === 'partially_redeemed').length;

  // Chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = moment().subtract(6 - i, 'days');
    const dayTxns = transactions.filter(t => 
      moment(t.created_date).isSame(date, 'day') && t.type === 'redemption'
    );
    return {
      day: date.format('ddd'),
      amount: dayTxns.reduce((sum, t) => sum + (t.amount || 0), 0),
    };
  });

  if (!merchant) {
    return (
      <MobileContainer>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-[#00A89D]" />
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00A89D] to-teal-600 pt-6 pb-16 px-4 rounded-b-[32px]">
          <div className="flex items-center justify-between mb-4">
            <Link to={createPageUrl('Landing')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <button 
              onClick={() => setShowEditProfile(true)}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden">
              {merchant.logo ? (
                <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-contain" />
              ) : (
                <Store className="w-8 h-8 text-[#00A89D]" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{merchant.name}</h1>
              <p className="text-white/80 text-sm capitalize">{merchant.category} • {merchant.status}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 -mt-8">
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-white rounded-xl p-4 shadow-lg border-0">
              <DollarSign className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-gray-500 text-xs">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">R{totalRevenue.toLocaleString()}</p>
            </Card>
            <Card className="bg-white rounded-xl p-4 shadow-lg border-0">
              <Wallet className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-gray-500 text-xs">Pending Payout</p>
              <p className="text-xl font-bold text-gray-900">R{pendingPayout.toLocaleString()}</p>
            </Card>
            <Card className="bg-white rounded-xl p-4 shadow-lg border-0">
              <Package className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-gray-500 text-xs">Active Vouchers</p>
              <p className="text-xl font-bold text-gray-900">{activeVouchers}</p>
            </Card>
            <Card className="bg-white rounded-xl p-4 shadow-lg border-0">
              <TrendingUp className="w-6 h-6 text-orange-600 mb-2" />
              <p className="text-gray-500 text-xs">Redemptions</p>
              <p className="text-xl font-bold text-gray-900">{merchant.totalRedemptions || 0}</p>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mt-4 flex gap-3">
          <Link to={createPageUrl('MerchantPOS') + `?merchant=${merchantId}`} className="flex-1">
            <GoldButton className="w-full h-12">
              <QrCode className="w-5 h-5 mr-2" /> Open POS
            </GoldButton>
          </Link>
          <GoldButton variant="outline" className="flex-1 h-12" onClick={() => setShowCreateProduct(true)}>
            <Plus className="w-5 h-5 mr-2" /> Add Product
          </GoldButton>
        </div>

        {/* Tabs */}
        <div className="px-4 mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-gray-100 p-1">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="products" className="flex-1">Products</TabsTrigger>
              <TabsTrigger value="transactions" className="flex-1">History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card className="bg-white rounded-xl p-4 border">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#00A89D]" /> Weekly Revenue
                </h3>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `R${v}`} />
                    <Bar dataKey="amount" fill="#00A89D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Bank Details</p>
                    <p className="text-sm text-blue-700">
                      {merchant.bankName} • ****{merchant.accountNumber?.slice(-4)}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="mt-4 space-y-3">
              {products.map((product) => (
                <Card key={product.id} className="bg-white rounded-xl p-4 border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">R{product.faceValue} Voucher</p>
                      <p className="text-sm text-gray-500">{product.description || 'Standard voucher'}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Consumer: R{product.consumerPrice}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          Payout: R{product.merchantPayout}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                </Card>
              ))}
              
              {products.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No products yet</p>
                  <GoldButton size="sm" className="mt-3" onClick={() => setShowCreateProduct(true)}>
                    Create First Product
                  </GoldButton>
                </div>
              )}
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="mt-4 space-y-3">
              {transactions.slice(0, 10).map((txn) => (
                <Card key={txn.id} className="bg-white rounded-xl p-4 border">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === 'redemption' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {txn.type === 'redemption' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{txn.type}</p>
                        <p className="text-xs text-gray-500">{moment(txn.created_date).fromNow()}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${txn.type === 'redemption' ? 'text-green-600' : 'text-gray-900'}`}>
                      R{txn.amount}
                    </p>
                  </div>
                </Card>
              ))}
              
              {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Product Dialog */}
      <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Create Voucher Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Face Value (R)</label>
              <Input
                type="number"
                placeholder="e.g., 100"
                value={newProduct.faceValue}
                onChange={(e) => setNewProduct(prev => ({ ...prev, faceValue: e.target.value }))}
                className="h-12"
              />
              {newProduct.faceValue && (
                <div className="mt-2 text-xs text-gray-500">
                  Consumer pays: R{(newProduct.faceValue * 0.96).toFixed(2)} | 
                  You receive: R{(newProduct.faceValue * 0.92).toFixed(2)}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Input
                placeholder="e.g., General shopping voucher"
                value={newProduct.description}
                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                className="h-12"
              />
            </div>
            <GoldButton 
              className="w-full h-12" 
              onClick={() => createProductMutation.mutate(newProduct)}
              disabled={!newProduct.faceValue || createProductMutation.isPending}
            >
              {createProductMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Create Product'
              )}
            </GoldButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Merchant Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                {merchant.logo ? (
                  <img src={merchant.logo} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Store className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-semibold">{merchant.name}</p>
                <p className="text-sm text-gray-500">{merchant.email}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600"><strong>Category:</strong> {merchant.category}</p>
              <p className="text-sm text-gray-600"><strong>Status:</strong> {merchant.status}</p>
              <p className="text-sm text-gray-600"><strong>Bank:</strong> {merchant.bankName}</p>
            </div>

            <Link to={createPageUrl('MerchantOnboarding') + `?email=${merchant.email}`}>
              <GoldButton variant="outline" className="w-full h-12">
                <Edit className="w-4 h-4 mr-2" /> Edit Profile
              </GoldButton>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </MobileContainer>
  );
}