import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Store, FileText, Wallet,
  Plus, TrendingUp, DollarSign,
  Building2, BarChart3
} from 'lucide-react';
import moment from 'moment';
import { getBillingDashboard, listBillingEvents, listPortalMerchants } from '@/api/portal-api';
import { useAdminAuth } from '@/auth/admin-auth';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { session, role } = useAdminAuth();
  const dataMode = (import.meta.env.VITE_BILLING_DATA_MODE || 'mock').toLowerCase();
  const usePortalApi = dataMode === 'portal';
  
  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () =>
      usePortalApi
        ? listPortalMerchants().then((response) => response?.data ?? response?.merchants ?? [])
        : Promise.resolve([]),
  });
  
  const { data: transactions = [] } = useQuery({
    queryKey: ['allTransactions'],
    queryFn: () =>
      usePortalApi
        ? listBillingEvents(session, role, { limit: 50 }).then((response) => response?.data ?? [])
        : Promise.resolve([]),
    enabled: !usePortalApi || Boolean(session?.email),
  });
  
  const { data: dashboardResponse } = useQuery({
    queryKey: ['admin-dashboard-summary'],
    queryFn: () => (usePortalApi ? getBillingDashboard(session, role) : Promise.resolve(null)),
    enabled: !usePortalApi || Boolean(session?.email),
  });

  const dashboardTotals = dashboardResponse?.data?.totals ?? {};
  const platformRevenue = Number(dashboardTotals.platformRevenue ?? 0);
  const totalVolume = Number(dashboardTotals.totalVoucherVolume ?? 0);
  const pendingPayouts = Number(dashboardTotals.pendingMerchantPayouts ?? 0);

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
                    <p className="text-gray-900 text-sm capitalize font-medium">{String(txn.event_type || 'event').replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{txn.merchant_id || 'Merchant event'}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[#00A89D] font-semibold">R{Number(txn.gross_amount || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">{moment(txn.occurred_at).fromNow()}</p>
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
              <GoldButton size="sm" disabled>
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
                      <h3 className="font-semibold text-gray-900">{merchant.businessName || merchant.business_name}</h3>
                      <p className="text-sm text-gray-500">{merchant.city || merchant.province || 'eVoucher merchant'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-500 text-xs">Brand</p>
                      <p className="text-gray-900 font-medium">{merchant.parentBrand || merchant.parent_brand || 'Not set'}</p>
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
              {transactions.slice(0, 20).map((entry) => (
                <Card key={entry.id} className="bg-white border-0 shadow-md p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-900 text-sm capitalize font-medium">
                        {String(entry.event_type || 'event').replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">{entry.merchant_id || 'Platform'}</p>
                      <p className="text-xs text-gray-400">{entry.event_key}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        entry.event_type === 'payment_transaction' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        R{Number(entry.gross_amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">{moment(entry.occurred_at).format('DD MMM HH:mm')}</p>
                    </div>
                  </div>
                </Card>
              ))}
              
              {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No billing events yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MobileContainer>
  );
}
