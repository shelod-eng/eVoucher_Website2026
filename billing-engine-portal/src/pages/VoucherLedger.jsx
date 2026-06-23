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
  Users,
  Store,
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

  const { data: eventsResponse, refetch } = useQuery({
    queryKey: ['voucher-ledger-events'],
    queryFn: () => listBillingEvents(session, role, { limit: 1000 }),
    enabled: Boolean(session?.email),
    refetchInterval: 5000,
    staleTime: 2000,
  });

  const events = eventsResponse?.data ?? [];

  const formatCurrency = (value) => {
    const num = Number(value ?? 0);
    return `R${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPaymentMethod = (metadata) => {
    const method = metadata?.paymentMethod ?? metadata?.payment_method ?? metadata?.method ?? 'Card';
    const methodMap = {
      card: 'Card',
      '3ds': '3DS Secure',
      payfast: 'PayFast',
      payshap: 'PayShap',
      cash: 'Cash at Till',
      ussd: 'USSD',
      airtime: 'Airtime',
      wallet: 'Wallet',
      eft: 'EFT',
    };
    return methodMap[method?.toLowerCase()] ?? method;
  };

  const getStatusBadge = (event) => {
    const metadata = event.metadata ?? {};
    const settlementStatus = metadata.settlementStatus ?? metadata.settlement_status;
    
    if (settlementStatus === 'settled' || event.event_type === 'voucher_redemption') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Settled
        </Badge>
      );
    }
    if (settlementStatus === 'pending' || event.event_type === 'payment_transaction') {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    }
    if (settlementStatus === 'failed') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Failed
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Processing
      </Badge>
    );
  };

  const processedTransactions = useMemo(() => {
    return events.map((event) => {
      const metadata = event.metadata ?? {};
      const grossAmount = Number(event.gross_amount ?? 0);
      const discountAmount = Number(event.total_discount_amount ?? 0);
      
      // 70/30 split: 70% consumer benefit, 30% platform
      const consumerSavings = discountAmount * 0.7; // 2.5% of face value
      const platformRevenue = discountAmount * 0.3; // 1.2% of face value
      
      // Merchant gets 96% of face value
      const merchantGross = grossAmount * 0.96;
      const bankFee = merchantGross * 0.005; // 0.5% bank fee
      const merchantNet = merchantGross - bankFee;

      return {
        id: event.id,
        transactionId: metadata.transactionReference ?? metadata.transaction_reference ?? event.id?.slice(0, 12),
        dateTime: event.occurred_at ?? event.created_at,
        consumerId: event.customer_id ?? 'N/A',
        consumerName: metadata.customerName ?? metadata.customer_name ?? metadata.consumerName ?? 'Unknown Consumer',
        merchantId: event.merchant_id ?? 'N/A',
        merchantName: metadata.merchantName ?? metadata.merchant_name ?? 'Unknown Merchant',
        paymentMethod: getPaymentMethod(metadata),
        faceValue: grossAmount,
        consumerSavings,
        merchantSettlement: merchantNet,
        platformRevenue,
        status: event.event_type,
        voucherCode: metadata.voucherCode ?? metadata.voucher_code ?? 'N/A',
        settlementBatchId: metadata.settlementBatchId ?? metadata.settlement_batch_id ?? null,
        bankservReference: metadata.bankservReference ?? metadata.bankserv_reference ?? null,
        ackStatus: metadata.ackStatus ?? metadata.ack_status ?? null,
        metadata,
        eventType: event.event_type,
      };
    });
  }, [events]);

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
      'Consumer Savings',
      'Merchant Settlement',
      'Platform Revenue',
      'Status',
      'Voucher Code',
      'Settlement Batch ID',
      'BankServ Reference',
      'ACK Status',
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
      t.ackStatus ?? 'N/A',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `voucher-ledger-${moment().format('YYYY-MM-DD-HHmmss')}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('BillingEngine')}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Voucher Ledger</h1>
              <p className="text-white/60">Fintech-grade transaction tracking synced with www.evoucher.co.za</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-4 py-2">
              Live • {totals.count} Transactions
            </Badge>
            <Button
              onClick={exportToCSV}
              className="bg-[#00A89D] hover:bg-[#00A89D]/90 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#00A89D]/20 to-[#00A89D]/10 border-[#00A89D]/30">
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

          <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border-emerald-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Merchant Payouts (96%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{formatCurrency(totals.merchantPayouts)}</p>
              <p className="text-xs text-white/60 mt-1">Net after 0.5% bank fee</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Member Benefits (2.5%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{formatCurrency(totals.memberBenefits)}</p>
              <p className="text-xs text-white/60 mt-1">Credited to wallets</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30">
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white/10 border border-white/20">
                  <TabsTrigger value="all" className="data-[state=active]:bg-[#00A89D] data-[state=active]:text-white">
                    All Transactions
                  </TabsTrigger>
                  <TabsTrigger value="purchases" className="data-[state=active]:bg-[#00A89D] data-[state=active]:text-white">
                    Purchases
                  </TabsTrigger>
                  <TabsTrigger value="redemptions" className="data-[state=active]:bg-[#00A89D] data-[state=active]:text-white">
                    Redemptions
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Search by ID, Merchant, Consumer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-72 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white text-sm"
                >
                  <option value="all" className="bg-slate-900">All Time</option>
                  <option value="24h" className="bg-slate-900">Last 24 Hours</option>
                  <option value="7d" className="bg-slate-900">Last 7 Days</option>
                  <option value="30d" className="bg-slate-900">Last 30 Days</option>
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
                      <td colSpan="11" className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <CreditCard className="w-12 h-12 text-white/20" />
                          <p className="text-white/60">No transactions found</p>
                          <p className="text-xs text-white/40">Process a payment on www.evoucher.co.za to see it appear here within 5 seconds</p>
                        </div>
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
                              {moment(txn.dateTime).format('DD MMM YYYY')}
                            </span>
                            <span className="text-xs text-white/60">
                              {moment(txn.dateTime).format('HH:mm:ss')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-white/40" />
                            <div className="flex flex-col">
                              <span className="font-medium">{txn.consumerName}</span>
                              <span className="text-xs text-white/60 font-mono">{txn.consumerId.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-white/40" />
                            <div className="flex flex-col">
                              <span className="font-medium">{txn.merchantName}</span>
                              <span className="text-xs text-white/60 font-mono">{txn.merchantId.slice(0, 8)}</span>
                            </div>
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
                            {getStatusBadge(txn)}
                            {txn.bankservReference && (
                              <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-slate-900 border border-white/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
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
                          <Link to={createPageUrl('SettlementPayouts')}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[#00A89D] hover:bg-[#00A89D]/20"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
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
