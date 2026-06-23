import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Search,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  DollarSign,
  Banknote,
  CreditCard,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';
import { useAdminAuth } from '@/auth/admin-auth';
import { listBillingEvents } from '@/api/portal-api';

export default function VoucherLedger() {
  const { session, role } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const dataMode = (import.meta.env.VITE_BILLING_DATA_MODE || 'mock').toLowerCase();
  const usePortalApi = dataMode === 'portal';

  const { data: transactions = [], refetch } = useQuery({
    queryKey: ['ledger-transactions'],
    queryFn: () =>
      usePortalApi && session?.email
        ? listBillingEvents(session, role, { limit: 500 }).then((response) => response?.data ?? [])
        : Promise.resolve([]),
    enabled: usePortalApi && Boolean(session?.email),
    refetchInterval: 5000,
    staleTime: 2000,
  });

  const formatCurrency = (value) => {
    const num = Number(value ?? 0);
    return `R${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPaymentMethod = (metadata) => {
    return (
      metadata?.paymentMethod ??
      metadata?.payment_method ??
      metadata?.method ??
      'Card'
    );
  };

  const getStatusBadge = (status, metadata) => {
    const settlementStatus = metadata?.settlementStatus ?? metadata?.settlement_status ?? status;
    
    if (settlementStatus === 'settled' || status === 'completed') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Settled
        </Badge>
      );
    }
    if (settlementStatus === 'queued' || settlementStatus === 'pending') {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }
    if (settlementStatus === 'failed' || status === 'failed') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800">
        <Clock className="w-3 h-3 mr-1" />
        Processing
      </Badge>
    );
  };

  const processedTransactions = useMemo(() => {
    return transactions.map((txn) => {
      const metadata = txn.metadata ?? {};
      const grossAmount = Number(txn.gross_amount ?? 0);
      const consumerSavings = grossAmount * 0.025;
      const merchantSettlement = grossAmount * 0.96;
      const platformRevenue = grossAmount * 0.012;

      return {
        id: txn.id,
        transactionId: metadata.transactionReference ?? metadata.transaction_reference ?? txn.id?.slice(0, 12),
        dateTime: txn.occurred_at ?? txn.created_at,
        consumerId: txn.customer_id ?? 'N/A',
        consumerName: metadata.customerName ?? metadata.customer_name ?? 'Unknown',
        merchantId: txn.merchant_id ?? 'N/A',
        merchantName: metadata.merchantName ?? metadata.merchant_name ?? 'Unknown',
        paymentMethod: getPaymentMethod(metadata),
        faceValue: grossAmount,
        consumerSavings,
        merchantSettlement,
        platformRevenue,
        status: txn.event_type === 'payment_transaction' ? 'completed' : 'pending',
        voucherCode: metadata.voucherCode ?? metadata.voucher_code ?? 'N/A',
        settlementBatchId: metadata.settlementBatchId ?? metadata.settlement_batch_id ?? null,
        bankservReference: metadata.bankservReference ?? metadata.bankserv_reference ?? null,
        ackStatus: metadata.ackStatus ?? metadata.ack_status ?? null,
        metadata,
        eventType: txn.event_type,
      };
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = processedTransactions;

    if (activeTab === 'purchases') {
      filtered = filtered.filter((t) => t.eventType === 'payment_transaction');
    } else if (activeTab === 'redemptions') {
      filtered = filtered.filter((t) => t.eventType === 'voucher_redemption');
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.transactionId?.toLowerCase().includes(term) ||
          t.merchantName?.toLowerCase().includes(term) ||
          t.consumerName?.toLowerCase().includes(term) ||
          t.voucherCode?.toLowerCase().includes(term)
      );
    }

    if (dateFilter !== 'all') {
      const now = moment();
      filtered = filtered.filter((t) => {
        const txnDate = moment(t.dateTime);
        if (dateFilter === '24h') return now.diff(txnDate, 'hours') <= 24;
        if (dateFilter === '7d') return now.diff(txnDate, 'days') <= 7;
        if (dateFilter === '30d') return now.diff(txnDate, 'days') <= 30;
        return true;
      });
    }

    return filtered.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  }, [processedTransactions, activeTab, searchTerm, dateFilter]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, txn) => ({
        totalVolume: acc.totalVolume + txn.faceValue,
        merchantPayouts: acc.merchantPayouts + txn.merchantSettlement,
        memberBenefits: acc.memberBenefits + txn.consumerSavings,
        platformRevenue: acc.platformRevenue + txn.platformRevenue,
        count: acc.count + 1,
      }),
      { totalVolume: 0, merchantPayouts: 0, memberBenefits: 0, platformRevenue: 0, count: 0 }
    );
  }, [filteredTransactions]);

  const exportToCSV = () => {
    const headers = [
      'Transaction ID',
      'Date/Time',
      'Consumer ID',
      'Consumer Name',
      'Merchant ID',
      'Merchant Name',
      'Payment Method',
      'Face Value',
      'Consumer Savings (2.5%)',
      'Merchant Settlement (96%)',
      'Platform Revenue (1.2%)',
      'Status',
      'Voucher Code',
      'Settlement Batch ID',
      'BankServ Reference',
    ];

    const rows = filteredTransactions.map((t) => [
      t.transactionId,
      moment(t.dateTime).format('YYYY-MM-DD HH:mm:ss'),
      t.consumerId,
      t.consumerName,
      t.merchantId,
      t.merchantName,
      t.paymentMethod,
      t.faceValue.toFixed(2),
      t.consumerSavings.toFixed(2),
      t.merchantSettlement.toFixed(2),
      t.platformRevenue.toFixed(2),
      t.status,
      t.voucherCode,
      t.settlementBatchId ?? 'N/A',
      t.bankservReference ?? 'N/A',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `voucher-ledger-${moment().format('YYYY-MM-DD-HHmmss')}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('BillingEngine')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Voucher Ledger</h1>
              <p className="text-white/60">Real-time transaction tracking & settlement monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              Live • {totals.count} Transactions
            </Badge>
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#00A89D]/20 to-[#00A89D]/10 border-[#00A89D]/30 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Voucher Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{formatCurrency(totals.totalVolume)}</p>
              <p className="text-xs text-white/60 mt-1">{totals.count} transactions processed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border-emerald-500/30 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Merchant Payouts (96%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{formatCurrency(totals.merchantPayouts)}</p>
              <p className="text-xs text-white/60 mt-1">Awaiting settlement batches</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Member Benefits (2.8%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{formatCurrency(totals.memberBenefits)}</p>
              <p className="text-xs text-white/60 mt-1">Credited to wallets</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Platform Revenue (1.2%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{formatCurrency(totals.platformRevenue)}</p>
              <p className="text-xs text-white/60 mt-1">eVoucher earnings</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-white/10 border border-white/20">
                    <TabsTrigger value="all">All Transactions</TabsTrigger>
                    <TabsTrigger value="purchases">Purchases</TabsTrigger>
                    <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Search by ID, Merchant, Consumer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr className="text-left text-white/70">
                    <th className="px-4 py-3 font-medium">Transaction ID</th>
                    <th className="px-4 py-3 font-medium">Date/Time</th>
                    <th className="px-4 py-3 font-medium">Consumer</th>
                    <th className="px-4 py-3 font-medium">Merchant</th>
                    <th className="px-4 py-3 font-medium">Payment Method</th>
                    <th className="px-4 py-3 font-medium text-right">Face Value</th>
                    <th className="px-4 py-3 font-medium text-right">Consumer Savings</th>
                    <th className="px-4 py-3 font-medium text-right">Merchant Settlement</th>
                    <th className="px-4 py-3 font-medium text-right">Platform Revenue</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-4 py-8 text-center text-white/60">
                        No transactions found. Process a payment on www.evoucher.co.za to see it appear here.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((txn) => (
                      <tr
                        key={txn.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-mono font-semibold text-[#00A89D]">
                              {txn.transactionId}
                            </span>
                            <span className="text-xs text-white/50">{txn.voucherCode}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {moment(txn.dateTime).format('MMM D, YYYY')}
                            </span>
                            <span className="text-xs text-white/60">
                              {moment(txn.dateTime).format('HH:mm:ss')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{txn.consumerName}</span>
                            <span className="text-xs text-white/60 font-mono">{txn.consumerId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{txn.merchantName}</span>
                            <span className="text-xs text-white/60 font-mono">{txn.merchantId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-white/10 border-white/20 text-white">
                            {txn.paymentMethod}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-white">
                          {formatCurrency(txn.faceValue)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-purple-300">
                          {formatCurrency(txn.consumerSavings)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-300">
                          {formatCurrency(txn.merchantSettlement)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-[#00A89D]">
                          {formatCurrency(txn.platformRevenue)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="group relative inline-block">
                            {getStatusBadge(txn.status, txn.metadata)}
                            {txn.bankservReference && (
                              <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 border border-white/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                <div className="text-xs space-y-2">
                                  <div>
                                    <span className="text-white/60">BankServ Reference:</span>
                                    <p className="text-white font-mono font-semibold">
                                      {txn.bankservReference}
                                    </p>
                                  </div>
                                  {txn.ackStatus && (
                                    <div>
                                      <span className="text-white/60">ACK Status:</span>
                                      <p className="text-emerald-300 font-semibold">{txn.ackStatus}</p>
                                    </div>
                                  )}
                                  {txn.settlementBatchId && (
                                    <div>
                                      <span className="text-white/60">Batch ID:</span>
                                      <p className="text-white font-mono">{txn.settlementBatchId}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {txn.settlementBatchId && (
                              <Link to={createPageUrl('SettlementPayouts')}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-[#00A89D] hover:bg-[#00A89D]/20"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </Link>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <Info className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
