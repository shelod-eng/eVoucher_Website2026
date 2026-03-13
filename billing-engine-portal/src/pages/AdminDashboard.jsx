import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, LayoutDashboard, Store, FileText, Wallet,
  Plus, TrendingUp, Users, ShoppingBag, DollarSign,
  CheckCircle2, Loader2, Building2, BarChart3
} from 'lucide-react';
import moment from 'moment';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateMerchant, setShowCreateMerchant] = useState(false);
  const [newMerchant, setNewMerchant] = useState({
    name: '',
    email: '',
    bankName: '',
    accountNumber: '',
    branchCode: ''
  });
  
  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list()
  });
  
  const { data: transactions = [] } = useQuery({
    queryKey: ['allTransactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date')
  });
  
  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ['allLedger'],
    queryFn: () => base44.entities.LedgerEntry.list('-created_date')
  });
  
  const { data: voucherInstances = [] } = useQuery({
    queryKey: ['allVouchers'],
    queryFn: () => base44.entities.VoucherInstance.list()
  });
  
  const createMerchantMutation = useMutation({
    mutationFn: async (merchantData) => {
      await base44.entities.Merchant.create({
        ...merchantData,
        status: 'active',
        totalRevenue: 0,
        totalRedemptions: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['merchants']);
      setShowCreateMerchant(false);
      setNewMerchant({ name: '', email: '', bankName: '', accountNumber: '', branchCode: '' });
    }
  });
  
  // Calculate stats
  const platformRevenue = ledgerEntries
    .filter(e => e.entryType === 'platform_revenue')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalVolume = transactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const pendingPayouts = ledgerEntries
    .filter(e => e.entryType === 'merchant_payout_liability')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <MobileContainer>
      <div className="pb-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00A89D] to-teal-600 pt-6 pb-12 px-4 rounded-b-[32px]">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('Landing')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-white/80">Department of Trade & Industry</p>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 -mt-6">
          <TabsList className="w-full bg-white shadow-lg p-1 rounded-xl">
            <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-[#00A89D] data-[state=active]:text-white rounded-lg">
              Overview
            </TabsTrigger>
            <TabsTrigger value="merchants" className="flex-1 data-[state=active]:bg-[#00A89D] data-[state=active]:text-white rounded-lg">
              Merchants
            </TabsTrigger>
            <TabsTrigger value="ledger" className="flex-1 data-[state=active]:bg-[#00A89D] data-[state=active]:text-white rounded-lg">
              Ledger
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link to={createPageUrl('SettlementPayouts')}>
                <Card className="bg-gradient-to-r from-[#00A89D] to-teal-600 border-0 p-4 shadow-lg h-full">
                  <Wallet className="w-6 h-6 text-white mb-2" />
                  <p className="text-white font-semibold text-sm">Settlements</p>
                  <p className="text-white/80 text-xs">Process payouts</p>
                </Card>
              </Link>
              <Link to={createPageUrl('AdminReports')}>
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 border-0 p-4 shadow-lg h-full">
                  <BarChart3 className="w-6 h-6 text-white mb-2" />
                  <p className="text-white font-semibold text-sm">Reports</p>
                  <p className="text-white/80 text-xs">View analytics</p>
                </Card>
              </Link>
              <Link to={createPageUrl('BillingEngine')}>
                <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 border-0 p-4 shadow-lg h-full">
                  <Building2 className="w-6 h-6 text-white mb-2" />
                  <p className="text-white font-semibold text-sm">Billing Engine</p>
                  <p className="text-white/80 text-xs">Invoices & Banks</p>
                </Card>
              </Link>
              <Link to={createPageUrl('StakeholderFinancialReport')}>
                <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0 p-4 shadow-lg h-full">
                  <TrendingUp className="w-6 h-6 text-white mb-2" />
                  <p className="text-white font-semibold text-sm">Financial Report</p>
                  <p className="text-white/80 text-xs">Download PDF</p>
                </Card>
              </Link>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-white border-0 shadow-md p-4">
                <DollarSign className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-gray-500 text-xs">Platform Revenue</p>
                <p className="text-xl font-bold text-gray-900">R{platformRevenue.toLocaleString()}</p>
              </Card>
              <Card className="bg-white border-0 shadow-md p-4">
                <TrendingUp className="w-6 h-6 text-[#00A89D] mb-2" />
                <p className="text-gray-500 text-xs">Total Volume</p>
                <p className="text-xl font-bold text-gray-900">R{totalVolume.toLocaleString()}</p>
              </Card>
              <Card className="bg-white border-0 shadow-md p-4">
                <Store className="w-6 h-6 text-purple-600 mb-2" />
                <p className="text-gray-500 text-xs">Merchants</p>
                <p className="text-xl font-bold text-gray-900">{merchants.length}</p>
              </Card>
              <Card className="bg-white border-0 shadow-md p-4">
                <Wallet className="w-6 h-6 text-orange-600 mb-2" />
                <p className="text-gray-500 text-xs">Pending Payouts</p>
                <p className="text-xl font-bold text-gray-900">R{pendingPayouts.toLocaleString()}</p>
              </Card>
            </div>
            
            {/* Recent Activity */}
            <Card className="bg-white border-0 shadow-md p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Recent Transactions</h3>
              <div className="space-y-2">
                {transactions.slice(0, 5).map((txn) => (
                  <div key={txn.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-gray-900 text-sm capitalize font-medium">{txn.type}</p>
                      <p className="text-xs text-gray-500">{txn.merchantName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#00A89D] font-semibold">R{txn.amount}</p>
                      <p className="text-xs text-gray-400">{moment(txn.created_date).fromNow()}</p>
                    </div>
                  </div>
                ))}
                
                {transactions.length === 0 && (
                  <p className="text-center text-gray-400 py-4">No transactions yet</p>
                )}
              </div>
            </Card>
          </TabsContent>
          
          {/* Merchants Tab */}
          <TabsContent value="merchants" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Registered Merchants</h2>
              <GoldButton size="sm" onClick={() => setShowCreateMerchant(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </GoldButton>
            </div>
            
            <div className="space-y-3">
              {merchants.map((merchant) => (
                <Card key={merchant.id} className="bg-white border-0 shadow-md p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#00A89D] to-teal-500 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">{merchant.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{merchant.name}</h3>
                      <p className="text-sm text-gray-500">{merchant.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-500 text-xs">Bank</p>
                      <p className="text-gray-900 font-medium">{merchant.bankName || 'Not set'}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-500 text-xs">Status</p>
                      <p className="text-[#00A89D] capitalize font-medium">{merchant.status}</p>
                    </div>
                  </div>
                </Card>
              ))}
              
              {merchants.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Store className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No merchants registered</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Ledger Tab */}
          <TabsContent value="ledger" className="mt-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Platform Ledger</h2>
            
            <div className="space-y-2">
              {ledgerEntries.slice(0, 20).map((entry) => (
                <Card key={entry.id} className="bg-white border-0 shadow-md p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-900 text-sm capitalize font-medium">
                        {entry.entryType?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">{entry.merchantName || 'Platform'}</p>
                      <p className="text-xs text-gray-400">{entry.reference}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        entry.entryType === 'platform_revenue' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        R{entry.amount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">{moment(entry.created_date).format('DD MMM HH:mm')}</p>
                    </div>
                  </div>
                </Card>
              ))}
              
              {ledgerEntries.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No ledger entries yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Create Merchant Dialog */}
      <Dialog open={showCreateMerchant} onOpenChange={setShowCreateMerchant}>
        <DialogContent className="bg-white max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add New Merchant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 mb-2 block font-medium">Merchant Name</label>
              <Input
                placeholder="e.g., Game Stores"
                value={newMerchant.name}
                onChange={(e) => setNewMerchant({...newMerchant, name: e.target.value})}
                className="h-12"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-2 block font-medium">Email</label>
              <Input
                type="email"
                placeholder="merchant@email.com"
                value={newMerchant.email}
                onChange={(e) => setNewMerchant({...newMerchant, email: e.target.value})}
                className="h-12"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-2 block font-medium">Bank Name</label>
              <Input
                placeholder="e.g., Standard Bank"
                value={newMerchant.bankName}
                onChange={(e) => setNewMerchant({...newMerchant, bankName: e.target.value})}
                className="h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-700 mb-2 block font-medium">Account No.</label>
                <Input
                  placeholder="0123456789"
                  value={newMerchant.accountNumber}
                  onChange={(e) => setNewMerchant({...newMerchant, accountNumber: e.target.value})}
                  className="h-12"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 mb-2 block font-medium">Branch Code</label>
                <Input
                  placeholder="051001"
                  value={newMerchant.branchCode}
                  onChange={(e) => setNewMerchant({...newMerchant, branchCode: e.target.value})}
                  className="h-12"
                />
              </div>
            </div>
            
            <GoldButton 
              className="w-full h-12" 
              onClick={() => createMerchantMutation.mutate(newMerchant)}
              disabled={createMerchantMutation.isPending || !newMerchant.name || !newMerchant.email}
            >
              {createMerchantMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Create Merchant'
              )}
            </GoldButton>
          </div>
        </DialogContent>
      </Dialog>
    </MobileContainer>
  );
}