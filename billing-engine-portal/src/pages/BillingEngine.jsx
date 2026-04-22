import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useAdminAuth } from '@/auth/admin-auth';
import {
  createBillingInvoice,
  getBillingDashboard,
  listBillingEvents,
  listBillingInvoices,
  listPortalMerchants,
  listBillingSettlements,
  runBillingEngine,
  runBillingSimulation,
} from '@/api/portal-api';

export default function BillingEngine() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const { session, role } = useAdminAuth();
  const [stockRows, setStockRows] = useState([
    { sku: 'SPC-WASH-DOUBLE', merchant: 'SuperPrecast', onHand: 42, reserved: 6, reorderLevel: 20 },
    { sku: 'SPC-WASH-SINGLE', merchant: 'SuperPrecast', onHand: 27, reserved: 4, reorderLevel: 18 },
    { sku: 'PNP-GROC-200', merchant: 'Pick n Pay', onHand: 120, reserved: 10, reorderLevel: 40 },
    { sku: 'SHOP-FOOD-500', merchant: 'Shoprite', onHand: 88, reserved: 12, reorderLevel: 35 },
  ]);
  const [orders, setOrders] = useState([
    {
      id: 'ORD-24001',
      merchant: 'SuperPrecast',
      sku: 'SPC-WASH-DOUBLE',
      qty: 5,
      status: 'pending',
      settlementGate: 'awaiting_delivery',
      createdAt: '2026-03-23',
      eta: '2026-03-24',
    },
    {
      id: 'ORD-24002',
      merchant: 'Pick n Pay',
      sku: 'PNP-GROC-200',
      qty: 12,
      status: 'picked',
      settlementGate: 'awaiting_delivery',
      createdAt: '2026-03-23',
      eta: '2026-03-24',
    },
    {
      id: 'ORD-24003',
      merchant: 'Shoprite',
      sku: 'SHOP-FOOD-500',
      qty: 8,
      status: 'in_transit',
      settlementGate: 'awaiting_delivery',
      createdAt: '2026-03-22',
      eta: '2026-03-23',
    },
  ]);
  const [newOrder, setNewOrder] = useState({
    merchant: 'SuperPrecast',
    sku: 'SPC-WASH-DOUBLE',
    qty: 1,
    eta: moment().add(1, 'day').format('YYYY-MM-DD'),
  });
  const [lastSimulationRef, setLastSimulationRef] = useState('');

  const dataMode = (import.meta.env.VITE_BILLING_DATA_MODE || 'mock').toLowerCase();
  const useMock = dataMode === 'mock';
  const usePortalApi = dataMode === 'portal';

  function formatCurrency(value) {
    const num = Number(value ?? 0);
    return `R${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const { data: dashboardResponse } = useQuery({
    queryKey: ['billing-dashboard'],
    queryFn: () => (usePortalApi && session?.email ? getBillingDashboard(session, role) : null),
    enabled: usePortalApi && Boolean(session?.email),
    staleTime: 15000,
  });

  const dashboardTotals = dashboardResponse?.data?.totals || null;
  const dashboardSplit = dashboardResponse?.data?.splitModel || null;

  const { data: invoicesResponse } = useQuery({
    queryKey: ['invoices'],
    queryFn: () =>
      usePortalApi && session?.email
        ? listBillingInvoices(session, role, { page: 1, limit: 200 })
        : Promise.resolve({ success: true, data: mockInvoices }),
    enabled: useMock || (usePortalApi && Boolean(session?.email)),
  });
  const rawInvoices = invoicesResponse?.data ?? invoicesResponse ?? [];
  const invoices = useMemo(() => {
    return (rawInvoices ?? []).map((inv) => ({
      ...inv,
      invoiceNumber: inv.invoiceNumber ?? inv.invoice_number,
      merchantId: inv.merchantId ?? inv.merchant_id,
      merchantName: inv.merchantName ?? inv.merchant_name,
      billingPeriodStart: inv.billingPeriodStart ?? inv.billing_period_start ?? inv.period_start,
      billingPeriodEnd: inv.billingPeriodEnd ?? inv.billing_period_end ?? inv.period_end,
      totalFaceValue: inv.totalFaceValue ?? inv.total_face_value,
      merchantPayoutAmount: inv.merchantPayoutAmount ?? inv.merchant_payout_amount,
      platformRevenue: inv.platformRevenue ?? inv.platform_revenue_amount,
      consumerDiscount: inv.consumerDiscount ?? inv.consumer_benefit_amount,
      bankFees: inv.bankFees ?? inv.bank_fee_amount,
      netPayable: inv.netPayable ?? inv.net_payable_to_merchant,
    }));
  }, [rawInvoices]);

  const { data: banks = [] } = useQuery({
    queryKey: ['bankSponsors'],
    queryFn: () => Promise.resolve(mockBanks),
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () =>
      usePortalApi ? listPortalMerchants().then((response) => response?.data ?? response?.merchants ?? []) : Promise.resolve(mockMerchants),
  });

  const { data: settlementsResponse } = useQuery({
    queryKey: ['settlements'],
    queryFn: () =>
      usePortalApi && session?.email
        ? listBillingSettlements(session, role)
        : Promise.resolve({ success: true, data: mockSettlements }),
    enabled: useMock || (usePortalApi && Boolean(session?.email)),
  });
  const rawSettlements = settlementsResponse?.data ?? settlementsResponse ?? [];
  const settlements = useMemo(() => {
    return (rawSettlements ?? []).map((row) => ({
      ...row,
      settlementReference: row.settlementReference ?? row.settlement_reference ?? row.reference,
      reconciliationStatus: row.reconciliationStatus ?? row.reconciliation_status,
      initiatedDate: row.initiatedDate ?? row.initiated_at ?? row.created_at,
      confirmedDate: row.confirmedDate ?? row.confirmed_at,
    }));
  }, [rawSettlements]);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () =>
      usePortalApi && session?.email
        ? listBillingEvents(session, role, { limit: 100 }).then((response) => response?.data ?? [])
        : Promise.resolve(mockTransactions),
  });

  const simulateMutation = useMutation({
    mutationFn: async (payload) => {
      if (!usePortalApi) return { success: true, data: { mode: 'mock' } };
      return runBillingSimulation(payload, session, role);
    },
    onSuccess: (result) => {
      const transactionReference =
        result?.data?.transactionReference ||
        result?.data?.webhook?.transactionReference ||
        '';
      if (transactionReference) {
        setLastSimulationRef(transactionReference);
      }
      queryClient.invalidateQueries(['billing-dashboard']);
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['settlements']);
      queryClient.invalidateQueries(['transactions']);
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async ({ merchantId, periodStart, periodEnd }) => {
      if (usePortalApi) {
        return createBillingInvoice({ merchantId, periodStart, periodEnd }, session, role);
      }
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
      return null;
    },
    onSuccess: () => {
      logAuditEvent('invoice.generate', { mode: useMock ? 'mock' : 'portal' });
      queryClient.invalidateQueries(['invoices']);
    }
  });

  const runEngineMutation = useMutation({
    mutationFn: async () => {
      if (!usePortalApi) return { success: true, data: { status: 'mock' } };
      return runBillingEngine(session, role);
    },
    onSuccess: () => {
      logAuditEvent('billing_engine.run', { mode: usePortalApi ? 'portal' : 'mock' });
      queryClient.invalidateQueries(['settlements']);
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (invoiceId) => {
      if (useMock) {
        return { id: invoiceId, status: 'paid' };
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
    }
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.platformRevenue || 0), 0);
  const totalBankFees = invoices.reduce((sum, inv) => sum + Number(inv.bankFees || 0), 0);
  const pendingPayouts = invoices
    .filter((inv) => String(inv.status || '').includes('pending'))
    .reduce((sum, inv) => sum + Number(inv.netPayable || 0), 0);
  const paidOut = invoices
    .filter((inv) => String(inv.status || '').includes('paid'))
    .reduce((sum, inv) => sum + Number(inv.netPayable || 0), 0);

  const kpiTotalVolume =
    dashboardTotals?.totalVoucherVolume ??
    invoices.reduce((sum, inv) => sum + Number(inv.totalFaceValue || 0), 0);
  const kpiPlatformRevenue = dashboardTotals?.platformRevenue ?? totalRevenue;
  const kpiMemberBenefits = dashboardTotals?.memberBenefitsPaid ?? 0;
  const kpiPendingPayouts = dashboardTotals?.pendingMerchantPayouts ?? pendingPayouts;
  const kpiSettled = dashboardTotals?.settledToMerchants ?? paidOut;
  const kpiBankFees = dashboardTotals?.bankProcessingFees ?? totalBankFees;

  const demoVoucherValue = 1000;
  const merchantPayoutPct = Number(dashboardSplit?.merchantPayoutPct ?? 96);
  const memberBenefitPct = Number(dashboardSplit?.memberBenefitPct ?? 2.8);
  const platformRevenuePct = Number(dashboardSplit?.platformRevenuePct ?? 1.2);
  const bankFeePctOfMerchant = Number(dashboardSplit?.bankFeePctOfMerchantPayout ?? 0.5);

  const merchantGross = (demoVoucherValue * merchantPayoutPct) / 100;
  const bankFee = (merchantGross * bankFeePctOfMerchant) / 100;
  const merchantNet = merchantGross - bankFee;
  const memberBenefit = (demoVoucherValue * memberBenefitPct) / 100;
  const platformRevenueDemo = (demoVoucherValue * platformRevenuePct) / 100;

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

  const statusClassMap = {
    pending: 'bg-yellow-100 text-yellow-800',
    picked: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const logisticsKpis = useMemo(() => {
    const totalStock = stockRows.reduce((sum, row) => sum + row.onHand, 0);
    const lowStockCount = stockRows.filter((row) => row.onHand <= row.reorderLevel).length;
    const openOrders = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length;
    const settlementReady = orders.filter((order) => order.settlementGate === 'ready_for_settlement').length;
    return { totalStock, lowStockCount, openOrders, settlementReady };
  }, [stockRows, orders]);

  const markOrderStatus = (orderId, nextStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const settlementGate = nextStatus === 'delivered' ? 'ready_for_settlement' : nextStatus === 'cancelled' ? 'blocked' : 'awaiting_delivery';
        return { ...order, status: nextStatus, settlementGate };
      })
    );
  };

  const receiveStock = (sku, qty) => {
    const amount = Number(qty);
    if (!amount || amount <= 0) return;
    setStockRows((prev) =>
      prev.map((row) => (row.sku === sku ? { ...row, onHand: row.onHand + amount } : row))
    );
  };

  const createOrder = () => {
    const qty = Number(newOrder.qty);
    if (!newOrder.merchant || !newOrder.sku || !qty || qty <= 0) return;

    const orderId = `ORD-${Date.now()}`;
    setOrders((prev) => [
      {
        id: orderId,
        merchant: newOrder.merchant,
        sku: newOrder.sku,
        qty,
        status: 'pending',
        settlementGate: 'awaiting_delivery',
        createdAt: moment().format('YYYY-MM-DD'),
        eta: newOrder.eta || moment().add(1, 'day').format('YYYY-MM-DD'),
      },
      ...prev,
    ]);

    setStockRows((prev) =>
      prev.map((row) => {
        if (row.sku !== newOrder.sku) return row;
        const nextOnHand = Math.max(0, row.onHand - qty);
        return { ...row, onHand: nextOnHand, reserved: row.reserved + qty };
      })
    );
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto space-y-6">
        {useMock ? (
          <div className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-md px-3 py-2">
            Demo mode: showing mock billing data. Set <code className="font-mono">VITE_BILLING_DATA_MODE=portal</code> to use website billing APIs.
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
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-white/50">Settlement Partner</div>
              <div className="text-sm font-semibold text-white">RMB / FNB CIB / VISA</div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              System Operational
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Total Voucher Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#00A89D]">{formatCurrency(kpiTotalVolume)}</p>
                  <p className="text-xs text-white/60 mt-1">Face value transacted</p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#00A89D]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Platform Revenue (1.2%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(kpiPlatformRevenue)}</p>
                  <p className="text-xs text-white/60 mt-1">eVoucher margin earned</p>
                </div>
                <DollarSign className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Member Benefits (2.8%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-300">{formatCurrency(kpiMemberBenefits)}</p>
                  <p className="text-xs text-white/60 mt-1">Credited to wallets</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Pending Merchant Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-300">{formatCurrency(kpiPendingPayouts)}</p>
                  <p className="text-xs text-white/60 mt-1">Awaiting settlement</p>
                </div>
                <Clock className="w-8 h-8 text-orange-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Settled To Merchants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-200">{formatCurrency(kpiSettled)}</p>
                  <p className="text-xs text-white/60 mt-1">Successfully paid</p>
                </div>
                <Banknote className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Bank Processing Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(kpiBankFees)}</p>
                  <p className="text-xs text-white/60 mt-1">FNB/ABSA transaction fees</p>
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
            <TabsTrigger value="logistics">Logistics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="xl:col-span-2 bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#00A89D]" />
                    Benefit Distribution Model — Per R{demoVoucherValue.toLocaleString()} Voucher
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-white/80 font-medium">Consumer Purchases Voucher</div>
                      <div className="text-white/70">100%</div>
                      <div className="text-[#00A89D] font-semibold">{formatCurrency(demoVoucherValue)}</div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-full bg-[#00A89D]" />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-white/80 font-medium">Merchant Receives Settlement</div>
                      <div className="text-white/70">{merchantPayoutPct}%</div>
                      <div className="text-emerald-300 font-semibold">{formatCurrency(merchantGross)}</div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${merchantPayoutPct}%` }} />
                    </div>
                    <div className="mt-2 text-xs text-white/60">
                      Net after bank fee ({bankFeePctOfMerchant}% of merchant payout):{' '}
                      <span className="text-white font-semibold">{formatCurrency(merchantNet)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-white/80 font-medium">Member Benefit Credited</div>
                        <div className="text-white/70">{memberBenefitPct}%</div>
                        <div className="text-purple-300 font-semibold">{formatCurrency(memberBenefit)}</div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-purple-400" style={{ width: `${memberBenefitPct}%` }} />
                      </div>
                      <div className="mt-2 text-xs text-white/60">Credited to member wallets</div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-white/80 font-medium">Platform Revenue</div>
                        <div className="text-white/70">{platformRevenuePct}%</div>
                        <div className="text-[#00A89D] font-semibold">{formatCurrency(platformRevenueDemo)}</div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-[#00A89D]" style={{ width: `${platformRevenuePct}%` }} />
                      </div>
                      <div className="mt-2 text-xs text-white/60">Retained in eVoucher revenue account</div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 pt-2">
                    <GoldButton
                      className="md:w-auto"
                      onClick={() => {
                        if (merchants.length > 0) {
                          const merchant = merchants[0];
                          const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
                          const endDate = moment().format('YYYY-MM-DD');
                          generateInvoiceMutation.mutate({
                            merchantId: merchant.id,
                            periodStart: startDate,
                            periodEnd: endDate,
                          });
                        }
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Monthly Invoice
                    </GoldButton>
                    <GoldButton
                      variant="outline"
                      className="md:w-auto"
                      onClick={() => runEngineMutation.mutate()}
                    >
                      <Banknote className="w-4 h-4 mr-2" />
                      Run Settlement Engine
                    </GoldButton>
                    <Link to={createPageUrl('SettlementPayouts')} className="md:w-auto">
                      <GoldButton variant="outline" className="w-full md:w-auto">
                        <Download className="w-4 h-4 mr-2" />
                        Open Settlements
                      </GoldButton>
                    </Link>
                  </div>
                  {usePortalApi ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3">
                      <GoldButton
                        variant="outline"
                        className="w-full"
                        onClick={() => simulateMutation.mutate({ action: 'purchase', paymentMethod: 'eft', paymentStatus: 'pending' })}
                      >
                        Simulate Purchase
                      </GoldButton>
                      <GoldButton
                        variant="outline"
                        className="w-full"
                        disabled={!lastSimulationRef}
                        onClick={() =>
                          simulateMutation.mutate({
                            action: 'webhook',
                            transactionReference: lastSimulationRef,
                            status: 'completed',
                          })
                        }
                      >
                        Simulate Webhook
                      </GoldButton>
                      <GoldButton
                        variant="outline"
                        className="w-full"
                        disabled={!lastSimulationRef}
                        onClick={() =>
                          simulateMutation.mutate({
                            action: 'failure',
                            transactionReference: lastSimulationRef,
                          })
                        }
                      >
                        Simulate Failure
                      </GoldButton>
                      <GoldButton
                        variant="outline"
                        className="w-full"
                        onClick={() => simulateMutation.mutate({ action: 'settlement' })}
                      >
                        Simulate Settlement
                      </GoldButton>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#00A89D]" />
                    5‑Year Financial Projections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { year: 1, volume: 'R8.34B', profit: 'R101.2M', note: '9M SASSA' },
                    { year: 2, volume: 'R9.45B', profit: 'R117.1M', note: '+10% growth' },
                    { year: 3, volume: 'R10.71B', profit: 'R135.2M', note: '+10% growth' },
                    { year: 4, volume: 'R12.13B', profit: 'R156.7M', note: '+10% growth' },
                    { year: 5, volume: 'R13.75B', profit: 'R181.9M', note: '+10% growth' },
                  ].map((row) => (
                    <div key={row.year} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">Year {row.year}</div>
                          <div className="text-xs text-white/60">{row.note}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#00A89D] font-bold">{row.volume}</div>
                          <div className="text-xs text-white/60">Profit {row.profit}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logistics">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-white/70">Total Stock Units</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold">{logisticsKpis.totalStock}</p></CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-white/70">Low Stock SKUs</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold text-yellow-300">{logisticsKpis.lowStockCount}</p></CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-white/70">Open Orders</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold text-blue-300">{logisticsKpis.openOrders}</p></CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-white/70">Settlement Ready</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold text-emerald-300">{logisticsKpis.settlementReady}</p></CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Create Logistics Order</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm"
                    placeholder="Merchant"
                    value={newOrder.merchant}
                    onChange={(event) => setNewOrder((prev) => ({ ...prev, merchant: event.target.value }))}
                  />
                  <input
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm"
                    placeholder="SKU"
                    value={newOrder.sku}
                    onChange={(event) => setNewOrder((prev) => ({ ...prev, sku: event.target.value }))}
                  />
                  <input
                    type="number"
                    min="1"
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm"
                    placeholder="Qty"
                    value={newOrder.qty}
                    onChange={(event) => setNewOrder((prev) => ({ ...prev, qty: event.target.value }))}
                  />
                  <input
                    type="date"
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm"
                    value={newOrder.eta}
                    onChange={(event) => setNewOrder((prev) => ({ ...prev, eta: event.target.value }))}
                  />
                  <Button className="bg-[#00A89D] hover:bg-[#009488] text-white" onClick={createOrder}>
                    Create Order
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stock Tracker</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2">SKU</th>
                        <th className="py-2">Merchant</th>
                        <th className="py-2">On Hand</th>
                        <th className="py-2">Reserved</th>
                        <th className="py-2">Reorder Level</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockRows.map((row) => {
                        const lowStock = row.onHand <= row.reorderLevel;
                        return (
                          <tr key={row.sku} className="border-b">
                            <td className="py-2 font-medium">{row.sku}</td>
                            <td className="py-2">{row.merchant}</td>
                            <td className="py-2">{row.onHand}</td>
                            <td className="py-2">{row.reserved}</td>
                            <td className="py-2">{row.reorderLevel}</td>
                            <td className="py-2">
                              <Badge className={lowStock ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                                {lowStock ? 'Low stock' : 'Healthy'}
                              </Badge>
                            </td>
                            <td className="py-2">
                              <Button size="sm" variant="outline" onClick={() => receiveStock(row.sku, 10)}>
                                +10 Receive
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Tracking</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2">Order ID</th>
                        <th className="py-2">Merchant</th>
                        <th className="py-2">SKU</th>
                        <th className="py-2">Qty</th>
                        <th className="py-2">ETA</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Settlement Gate</th>
                        <th className="py-2">Next Step</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="py-2 font-medium">{order.id}</td>
                          <td className="py-2">{order.merchant}</td>
                          <td className="py-2">{order.sku}</td>
                          <td className="py-2">{order.qty}</td>
                          <td className="py-2">{order.eta}</td>
                          <td className="py-2">
                            <Badge className={statusClassMap[order.status] || 'bg-gray-100 text-gray-800'}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-2">{order.settlementGate.replaceAll('_', ' ')}</td>
                          <td className="py-2">
                            <div className="flex gap-2 flex-wrap">
                              {order.status === 'pending' && (
                                <Button size="sm" variant="outline" onClick={() => markOrderStatus(order.id, 'picked')}>Mark Picked</Button>
                              )}
                              {order.status === 'picked' && (
                                <Button size="sm" variant="outline" onClick={() => markOrderStatus(order.id, 'in_transit')}>Ship</Button>
                              )}
                              {order.status === 'in_transit' && (
                                <Button size="sm" className="bg-[#00A89D] hover:bg-[#009488] text-white" onClick={() => markOrderStatus(order.id, 'delivered')}>Deliver</Button>
                              )}
                              {!['delivered', 'cancelled'].includes(order.status) && (
                                <Button size="sm" variant="ghost" onClick={() => markOrderStatus(order.id, 'cancelled')}>Cancel</Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
