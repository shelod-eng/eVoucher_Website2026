import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { mockBanks, mockInvoices, mockMerchants, mockSettlements, mockTransactions } from '@/api/billing-mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import GoldButton from '@/components/ui/GoldButton';
import { 
  Building2, 
  FileText, 
  TrendingUp, 
  CreditCard, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Banknote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';
import { logAuditEvent } from '@/audit/audit-log';

export default function BillingEngine() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const dataMode = (import.meta.env.VITE_BILLING_DATA_MODE || 'mock').toLowerCase();
  const useMock = dataMode !== 'base44';

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => (useMock ? Promise.resolve(mockInvoices) : base44.entities.Invoice.list('-created_date')),
  });

  const { data: banks = [] } = useQuery({
    queryKey: ['bankSponsors'],
    queryFn: () => (useMock ? Promise.resolve(mockBanks) : base44.entities.BankSponsor.filter({ status: 'active' })),
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => (useMock ? Promise.resolve(mockMerchants) : base44.entities.Merchant.list()),
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ['settlements'],
    queryFn: () => (useMock ? Promise.resolve(mockSettlements) : base44.entities.Settlement.list('-created_date')),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => (useMock ? Promise.resolve(mockTransactions) : base44.entities.Transaction.list('-created_date', 100)),
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async ({ merchantId, periodStart, periodEnd }) => {
      if (useMock) {
        return {
          id: `inv_mock_${Date.now()}`,
          invoiceNumber: `INV-${Date.now()}-MOCK`,
          merchantId,
          periodStart,
          periodEnd,
          status: 'pending',
        };
      }
      const merchant = merchants.find(m => m.id === merchantId);
      const periodTransactions = transactions.filter(t => 
        t.merchantId === merchantId &&
        t.type === 'purchase' &&
        new Date(t.created_date) >= new Date(periodStart) &&
        new Date(t.created_date) <= new Date(periodEnd)
      );

      const totalVouchersSold = periodTransactions.length;
      const totalFaceValue = periodTransactions.reduce((sum, t) => sum + (t.amount / 0.96), 0);
      const merchantPayoutAmount = totalFaceValue * 0.92;
      const platformRevenue = totalFaceValue * 0.04;
      const consumerDiscount = totalFaceValue * 0.04;
      
      const bank = banks[Math.floor(Math.random() * banks.length)];
      const bankFees = merchantPayoutAmount * (bank?.transactionFeePercentage || 0.005);
      const netPayable = merchantPayoutAmount - bankFees;

      const invoiceNumber = `INV-${Date.now()}-${merchantId.substr(0, 6)}`;

      return await base44.entities.Invoice.create({
        invoiceNumber,
        merchantId,
        merchantName: merchant.name,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        totalVouchersSold,
        totalFaceValue,
        merchantPayoutAmount,
        platformRevenue,
        consumerDiscount,
        bankFees,
        netPayable,
        bankSponsorId: bank?.id,
        bankName: bank?.bankName,
        status: 'pending',
        dueDate: moment().add(7, 'days').format('YYYY-MM-DD')
      });
    },
    onSuccess: () => {
      logAuditEvent('invoice.generate', { mode: useMock ? 'mock' : 'base44' });
      queryClient.invalidateQueries(['invoices']);
    }
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (invoiceId) => {
      if (useMock) {
        return { id: invoiceId, status: 'paid' };
      }
      return await base44.entities.Invoice.update(invoiceId, {
        status: 'paid',
        paidDate: new Date().toISOString(),
        paymentReference: `PAY-${Date.now()}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
    }
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.platformRevenue || 0), 0);
  const totalBankFees = invoices.reduce((sum, inv) => sum + (inv.bankFees || 0), 0);
  const pendingPayouts = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.netPayable || 0), 0);
  const paidOut = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.netPayable || 0), 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto space-y-6">
        {useMock ? (
          <div className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-md px-3 py-2">
            Demo mode: showing mock billing data. Set <code className="font-mono">VITE_BILLING_DATA_MODE=base44</code> to use Base44 data wiring.
          </div>
        ) : null}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Billing Engine</h1>
              <p className="text-white/60">Merchant invoicing & bank integration</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Platform Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">R{totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-white/60 mt-1">4% margin collected</p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#00A89D]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Pending Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-300">R{pendingPayouts.toLocaleString()}</p>
                  <p className="text-xs text-white/60 mt-1">Awaiting payment</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Paid Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-300">R{paidOut.toLocaleString()}</p>
                  <p className="text-xs text-white/60 mt-1">Successfully paid</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Bank Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">R{totalBankFees.toLocaleString()}</p>
                  <p className="text-xs text-white/60 mt-1">Processing costs</p>
                </div>
                <CreditCard className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-white/5 border border-white/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="banks">Bank Sponsors</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Flow */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Flow Architecture</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-semibold text-blue-900 mb-2">1. Consumer Purchase</h4>
                    <p className="text-sm text-blue-700">Consumer pays <strong>R960</strong> for R1,000 voucher (4% discount)</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-semibold text-green-900 mb-2">2. Platform Revenue</h4>
                    <p className="text-sm text-green-700">Platform keeps <strong>R40</strong> (4% margin)</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                    <h4 className="font-semibold text-purple-900 mb-2">3. Merchant Payout</h4>
                    <p className="text-sm text-purple-700">Merchant receives <strong>R920</strong> (92% of face value)</p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                    <h4 className="font-semibold text-orange-900 mb-2">4. Bank Processing</h4>
                    <p className="text-sm text-orange-700">Bank sponsor processes payment, charges <strong>~0.5%</strong> fee</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <GoldButton 
                    className="w-full"
                    onClick={() => {
                      if (merchants.length > 0) {
                        const merchant = merchants[0];
                        const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
                        const endDate = moment().format('YYYY-MM-DD');
                        generateInvoiceMutation.mutate({
                          merchantId: merchant.id,
                          periodStart: startDate,
                          periodEnd: endDate
                        });
                      }
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Monthly Invoice
                  </GoldButton>
                  
                  <Link to={createPageUrl('SettlementPayouts')}>
                    <GoldButton variant="outline" className="w-full">
                      <Banknote className="w-4 h-4 mr-2" />
                      Process Settlements
                    </GoldButton>
                  </Link>
                  
                  <Link to={createPageUrl('StakeholderTipping')}>
                    <GoldButton variant="outline" className="w-full">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Stakeholder Tips
                    </GoldButton>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Merchant Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No invoices generated yet.</p>
                  ) : (
                    invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{invoice.merchantName}</h4>
                            <p className="text-sm text-gray-500">
                              {invoice.invoiceNumber} • {moment(invoice.billingPeriodStart).format('MMM D')} - {moment(invoice.billingPeriodEnd).format('MMM D, YYYY')}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                              <span>Vouchers: {invoice.totalVouchersSold}</span>
                              <span>Payable: R{invoice.netPayable?.toLocaleString()}</span>
                              <span>via {invoice.bankName}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1 capitalize">{invoice.status}</span>
                          </Badge>
                          {invoice.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => processPaymentMutation.mutate(invoice.id)}
                            >
                              Pay Now
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banks">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banks.map((bank) => (
                <Card key={bank.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{bank.bankName}</CardTitle>
                      <Badge className="bg-green-100 text-green-800">Active Partner</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">SWIFT Code</p>
                      <p className="font-mono font-semibold">{bank.swiftCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monthly Sponsorship</p>
                      <p className="text-2xl font-bold text-[#00A89D]">R{bank.sponsorshipAmount?.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Transaction Fee</p>
                        <p className="font-semibold">{bank.transactionFeePercentage}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Transactions</p>
                        <p className="font-semibold">{bank.totalTransactionsProcessed}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Fees Collected</p>
                      <p className="text-lg font-semibold">R{bank.totalFeesCollected?.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
