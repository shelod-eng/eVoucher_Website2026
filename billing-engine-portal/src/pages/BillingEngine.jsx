import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockBanks, mockInvoices, mockMerchants, mockTransactions } from '@/api/billing-mock-data';
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
  Banknote,
  Zap,
  RefreshCw,
  ShieldCheck,
  Scale,
  Landmark,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';
import { logAuditEvent } from '@/audit/audit-log';
import { useAdminAuth } from '@/auth/admin-auth';
import {
  createBillingInvoice,
  getTransactionLifecycle,
  getBillingDashboard,
  listBillingEvents,
  listBillingInvoices,
  listMerchantPayouts,
  listReconciliationRuns,
  listPortalMerchants,
  resolveEntityNames,
  runBillingEngine,
  triggerReconciliationRun,
  listAuditEvents,
  listReconciliationExceptions,
  resolveReconciliationException,
  replayPlatformEvents,
} from '@/api/portal-api';
import { usePlatformEvents } from '@/hooks/usePlatformEvents';
import BillingEventsTab from '@/components/BillingEventsTab';

export default function BillingEngine() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [transactionSearch, setTransactionSearch] = useState('');
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

  const { events: liveEvents, connected: realtimeConnected } = usePlatformEvents({ limit: 25 });

  // Production MUST default to portal mode. Using 'mock' as the default here
  // caused the Billing Engine to silently display fake financial data when the
  // VITE_BILLING_DATA_MODE env var was missing at build time.
  // Explicit 'mock' is still supported for local development only.
  const dataMode = (import.meta.env.VITE_BILLING_DATA_MODE || 'portal').toLowerCase();
  const useMock = dataMode === 'mock';
  const usePortalApi = dataMode === 'portal';
  const portalModeError =
    !usePortalApi && !useMock
      ? `Invalid VITE_BILLING_DATA_MODE="${dataMode}". Expected "portal" (or "mock" for local dev).`
      : null;

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
  const invoices = useMemo(() => {
    const rawInvoices = invoicesResponse?.data ?? invoicesResponse ?? [];

    return rawInvoices.map((inv) => ({
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
  }, [invoicesResponse]);

  const { data: banks = [] } = useQuery({
    queryKey: ['bankSponsors'],
    queryFn: () => Promise.resolve(mockBanks),
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () =>
      usePortalApi
        ? listPortalMerchants().then((response) => response?.data ?? response?.merchants ?? [])
        : Promise.resolve(mockMerchants),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () =>
      usePortalApi && session?.email
        ? listBillingEvents(session, role, { limit: 100 }).then((response) => response?.data ?? [])
        : Promise.resolve(mockTransactions),
  });
  const { data: payoutsResponse } = useQuery({
    queryKey: ['merchant-payouts'],
    queryFn: () =>
      usePortalApi && session?.email
        ? listMerchantPayouts(session, role, { limit: 200 })
        : Promise.resolve({ data: [] }),
    enabled: useMock || (usePortalApi && Boolean(session?.email)),
    refetchInterval: 10000,
  });
  const payouts = payoutsResponse?.data ?? [];

  const { data: reconciliationResponse, refetch: refetchReconciliation } = useQuery({
    queryKey: ['reconciliation-runs'],
    queryFn: () =>
      usePortalApi && session?.email
        ? listReconciliationRuns(session, role)
        : Promise.resolve({ data: [] }),
    enabled: usePortalApi && Boolean(session?.email),
  });
  const reconciliationRuns = reconciliationResponse?.data ?? [];

  const { data: auditResponse } = useQuery({
    queryKey: ['audit-events-billing'],
    queryFn: () =>
      usePortalApi && session?.email
        ? listAuditEvents(session, role, { limit: 100 })
        : Promise.resolve({ data: [] }),
    enabled: usePortalApi && Boolean(session?.email),
    refetchInterval: 15000,
  });
  const auditEvents = auditResponse?.data ?? [];

  const lifecycleSearchTerm = transactionSearch.trim();
  const {
    data: lifecycleResponse,
    isLoading: lifecycleLoading,
    error: lifecycleError,
    refetch: refetchLifecycle,
  } = useQuery({
    queryKey: ['transaction-lifecycle', lifecycleSearchTerm],
    queryFn: () => getTransactionLifecycle(session, role, lifecycleSearchTerm),
    enabled: usePortalApi && Boolean(session?.email && lifecycleSearchTerm),
    staleTime: 5000,
  });

  // Resolve merchant + customer names for all events
  const { data: nameMap } = useQuery({
    queryKey: ['entity-names', transactions.map((t) => t.merchant_id + t.customer_id).join(',')],
    queryFn: () => {
      const merchantIds = [...new Set(transactions.map((t) => t.merchant_id).filter(Boolean))];
      const customerIds = [...new Set(transactions.map((t) => t.customer_id).filter(Boolean))];
      if (!merchantIds.length && !customerIds.length) return { merchants: {}, customers: {} };
      return resolveEntityNames(merchantIds, customerIds, session, role);
    },
    enabled: usePortalApi && transactions.length > 0,
    staleTime: 60000,
  });
  const merchantNames = nameMap?.merchants ?? {};
  const customerNames = nameMap?.customers ?? {};

  const triggerReconciliationMutation = useMutation({
    mutationFn: () => triggerReconciliationRun(session, role),
    onSuccess: () => {
      logAuditEvent('reconciliation.manual_run', { triggeredBy: session?.email });
      refetchReconciliation();
      refetchExceptions();
    },
  });

  const [exceptionFilter, setExceptionFilter] = useState('open');
  const [resolutionNotes, setResolutionNotes] = useState({});
  const { data: exceptionsResponse, refetch: refetchExceptions } = useQuery({
    queryKey: ['reconciliation-exceptions', exceptionFilter],
    queryFn: () =>
      usePortalApi && session?.email
        ? listReconciliationExceptions(session, role, { status: exceptionFilter })
        : Promise.resolve({ data: [] }),
    enabled: usePortalApi && Boolean(session?.email),
  });
  const exceptions = exceptionsResponse?.data ?? [];

  const resolveExceptionMutation = useMutation({
    mutationFn: ({ exceptionId, notes }) =>
      resolveReconciliationException(exceptionId, notes, session, role),
    onSuccess: () => {
      logAuditEvent('reconciliation.exception_resolved', { triggeredBy: session?.email });
      refetchExceptions();
      refetchReconciliation();
    },
  });

  const [replayPayload, setReplayPayload] = useState({
    eventIds: '',
    fromDate: '',
    toDate: '',
    eventType: '',
    forceLedgerRepost: false,
  });

  const replayMutation = useMutation({
    mutationFn: (payload) => replayPlatformEvents(payload, session, role),
    onSuccess: (res) => {
      logAuditEvent('compliance.event_replay', {
        triggeredBy: session?.email,
        replayRunId: res.replayRunId,
      });
      alert(
        `Event replay submitted successfully!\nReplayed: ${res.replayedCount} events\nRun ID: ${res.replayRunId}`
      );
      refetchReconciliation();
      refetchExceptions();
      queryClient.invalidateQueries(['transactions']);
    },
  });

  // Real-time synchronization: invalidate cached queries on new live events to update other tabs instantly
  useEffect(() => {
    if (liveEvents && liveEvents.length > 0) {
      queryClient.invalidateQueries(['billing-dashboard']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['merchant-payouts']);
      queryClient.invalidateQueries(['reconciliation-runs']);
      queryClient.invalidateQueries(['reconciliation-exceptions']);
    }
  }, [liveEvents, queryClient]);

  const recentWebsiteTransactions = useMemo(() => {
    return (transactions ?? [])
      .map((event) => {
        const metadata = event.metadata ?? {};
        const transactionType =
          metadata.transactionType ??
          metadata.transaction_type ??
          (event.event_type === 'payment_transaction'
            ? 'purchase'
            : event.event_type === 'manual_adjustment'
              ? 'adjustment'
              : event.event_type);

        return {
          id: event.id,
          eventType: event.event_type ?? 'payment_transaction',
          transactionType: String(transactionType ?? 'transaction'),
          merchantId: event.merchant_id ?? null,
          customerId: event.customer_id ?? null,
          voucherCode: metadata.voucherCode ?? metadata.voucher_code ?? null,
          grossAmount: Number(event.gross_amount ?? 0),
          occurredAt: event.occurred_at ?? event.created_at ?? null,
          source:
            metadata.source ??
            metadata.flow ??
            (usePortalApi ? 'www.evoucher.co.za -> website billing' : 'mock'),
        };
      })
      .sort((a, b) => new Date(b.occurredAt ?? 0).getTime() - new Date(a.occurredAt ?? 0).getTime())
      .slice(0, 8);
  }, [transactions, usePortalApi]);

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
    },
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
    },
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
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
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
    const openOrders = orders.filter(
      (order) => !['delivered', 'cancelled'].includes(order.status)
    ).length;
    const settlementReady = orders.filter(
      (order) => order.settlementGate === 'ready_for_settlement'
    ).length;
    return { totalStock, lowStockCount, openOrders, settlementReady };
  }, [stockRows, orders]);

  const markOrderStatus = (orderId, nextStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const settlementGate =
          nextStatus === 'delivered'
            ? 'ready_for_settlement'
            : nextStatus === 'cancelled'
              ? 'blocked'
              : 'awaiting_delivery';
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

  const lifecycleStageTone = (status) => {
    if (status === 'found') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (status === 'error') return 'bg-red-500/20 text-red-300 border-red-500/30';
    return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
  };

  const lifecycleStageLabel = (status) => {
    if (status === 'found') return 'FOUND';
    if (status === 'error') return 'ERROR';
    return 'MISSING';
  };

  const stageTitles = {
    payment: 'Payment',
    voucher: 'Voucher',
    billingEvent: 'Billing Event',
    ledger: 'Ledger',
    merchantPayout: 'Merchant Payout',
    invoice: 'Invoice',
    settlement: 'Settlement',
    bankservQueue: 'BankServ Queue',
    audit: 'Audit Trail',
    reconciliationExceptions: 'Reconciliation',
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto space-y-6">
        {portalModeError ? (
          <div className="text-xs bg-red-50 border border-red-300 text-red-900 rounded-md px-3 py-2">
            {portalModeError}
          </div>
        ) : null}
        {useMock ? (
          <div className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-md px-3 py-2">
            Demo mode: showing mock billing data. Set{' '}
            <code className="font-mono">VITE_BILLING_DATA_MODE=portal</code> to use website billing
            APIs.
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

        {/* Transaction Reference Search */}
        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="flex flex-col md:flex-row gap-3 items-stretch md:items-center py-4">
            <div className="flex-1">
              <label className="block text-xs text-white/60 mb-1">
                Search Transaction Reference (canonical identifier)
              </label>
              <input
                type="text"
                placeholder="e.g. TXN-20260812-XXXXXX or E2E-TEST-..."
                className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00A89D]"
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
              />
            </div>
            <Button
              className="h-10 bg-[#00A89D] hover:bg-[#009488] text-white shrink-0"
              onClick={() => {
                if (transactionSearch.trim()) {
                  setActiveTab('lifecycle');
                }
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">
                Total Voucher Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#00A89D]">
                    {formatCurrency(kpiTotalVolume)}
                  </p>
                  <p className="text-xs text-white/60 mt-1">Face value transacted</p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#00A89D]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">
                Platform Revenue (1.2%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(kpiPlatformRevenue)}
                  </p>
                  <p className="text-xs text-white/60 mt-1">eVoucher margin earned</p>
                </div>
                <DollarSign className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">
                Member Benefits (2.8%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-300">
                    {formatCurrency(kpiMemberBenefits)}
                  </p>
                  <p className="text-xs text-white/60 mt-1">Credited to wallets</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">
                Pending Merchant Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-300">
                    {formatCurrency(kpiPendingPayouts)}
                  </p>
                  <p className="text-xs text-white/60 mt-1">Awaiting settlement</p>
                </div>
                <Clock className="w-8 h-8 text-orange-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">
                Settled To Merchants
              </CardTitle>
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
              <CardTitle className="text-sm font-medium text-white/60">
                Bank Processing Fees
              </CardTitle>
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
          <TabsList className="mb-4 bg-white/5 border border-white/10 flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lifecycle" className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Lifecycle
            </TabsTrigger>
            <TabsTrigger value="billing-events" className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Billing Events
            </TabsTrigger>
            <TabsTrigger value="live-events" className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Live Events
              {realtimeConnected && (
                <span className="ml-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="settlements" className="flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" />
              Settlements
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              Reconciliation
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Audit Log
            </TabsTrigger>
            <TabsTrigger value="banks">Bank Sponsors</TabsTrigger>
            <TabsTrigger value="logistics">Logistics</TabsTrigger>
          </TabsList>

          <TabsContent value="lifecycle">
            <div className="space-y-4">
              <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#00A89D]" />
                    Transaction Control View
                  </CardTitle>
                  <p className="text-sm text-white/50">
                    Enter a transaction_reference above to trace the same transaction through the
                    internal financial lifecycle.
                  </p>
                </CardHeader>
                <CardContent>
                  {!lifecycleSearchTerm ? (
                    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
                      Search an E2E-TEST or TXN reference to load the complete lifecycle.
                    </div>
                  ) : lifecycleError ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                      <p className="font-semibold">Lifecycle API error</p>
                      <p className="mt-1 text-xs">{String(lifecycleError?.message ?? lifecycleError)}</p>
                    </div>
                  ) : lifecycleLoading ? (
                    <div className="py-12 text-center text-white/40 text-sm">
                      Loading lifecycle for {lifecycleSearchTerm}...
                    </div>
                  ) : lifecycleResponse ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-yellow-200">
                              {lifecycleResponse.modeLabel}
                            </p>
                            <p className="text-xs text-white/50 mt-1">
                              External payment provider and live BankServ connectivity are pending
                              sponsor/legal/vendor approval.
                            </p>
                          </div>
                          <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-500/30">
                            {lifecycleResponse.externalDependencyBoundary?.provider ?? 'mock_sandbox'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                        {(lifecycleResponse.lifecycle ?? []).map((stage) => (
                          <div
                            key={stage.key}
                            className="rounded-xl border border-white/10 bg-white/5 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold">
                                {stageTitles[stage.key] ?? stage.key}
                              </p>
                              <Badge className={lifecycleStageTone(stage.status)}>
                                {lifecycleStageLabel(stage.status)}
                              </Badge>
                            </div>
                            <p className="mt-2 text-xs text-white/40 font-mono">{stage.table}</p>
                            <p className="mt-1 text-xs text-white/50">Records: {stage.count}</p>
                            {stage.error ? (
                              <p className="mt-2 text-xs text-red-300">{stage.error}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="bg-white/5 border-white/10 text-white">
                          <CardHeader>
                            <CardTitle className="text-sm">Financial Consistency</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(lifecycleResponse.financial?.values ?? {}).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="rounded-lg border border-white/10 bg-white/5 p-2"
                                  >
                                    <p className="text-white/40">{key}</p>
                                    <p className="font-bold text-white">{formatCurrency(value)}</p>
                                  </div>
                                )
                              )}
                            </div>
                            <div className="space-y-2">
                              {(lifecycleResponse.financial?.checks ?? []).map((check) => (
                                <div
                                  key={check.name}
                                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"
                                >
                                  <span className="text-white/70">{check.name}</span>
                                  <Badge
                                    className={
                                      check.ok
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                                    }
                                  >
                                    {check.ok ? 'OK/PENDING' : 'MISMATCH'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10 text-white">
                          <CardHeader>
                            <CardTitle className="text-sm">Raw Stage Evidence</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <pre className="max-h-96 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/70">
                              {JSON.stringify(lifecycleResponse.stages, null, 2)}
                            </pre>
                            <Button
                              className="mt-3 h-8 bg-white/10 hover:bg-white/20 text-white"
                              onClick={() => refetchLifecycle()}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Refresh Lifecycle
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-white/40 text-sm">
                      No lifecycle data loaded.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
                      <div className="text-[#00A89D] font-semibold">
                        {formatCurrency(demoVoucherValue)}
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-full bg-[#00A89D]" />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-white/80 font-medium">Merchant Receives Settlement</div>
                      <div className="text-white/70">{merchantPayoutPct}%</div>
                      <div className="text-emerald-300 font-semibold">
                        {formatCurrency(merchantGross)}
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400"
                        style={{ width: `${merchantPayoutPct}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-white/60">
                      Net after bank fee ({bankFeePctOfMerchant}% of merchant payout):{' '}
                      <span className="text-white font-semibold">
                        {formatCurrency(merchantNet)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-white/80 font-medium">Member Benefit Credited</div>
                        <div className="text-white/70">{memberBenefitPct}%</div>
                        <div className="text-purple-300 font-semibold">
                          {formatCurrency(memberBenefit)}
                        </div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-purple-400"
                          style={{ width: `${memberBenefitPct}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-white/60">Credited to member wallets</div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-white/80 font-medium">Platform Revenue</div>
                        <div className="text-white/70">{platformRevenuePct}%</div>
                        <div className="text-[#00A89D] font-semibold">
                          {formatCurrency(platformRevenueDemo)}
                        </div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-[#00A89D]"
                          style={{ width: `${platformRevenuePct}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-white/60">
                        Retained in eVoucher revenue account
                      </div>
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
                    <div
                      key={row.year}
                      className="p-4 rounded-xl bg-white/5 border border-white/10"
                    >
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
              <Card className="xl:col-span-2 bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#00A89D]" />
                    Recent Website Transactions
                  </CardTitle>
                  <div className="text-sm text-white/60">
                    Consumer transactions from `www.evoucher.co.za` recorded into the website
                    billing tables.
                  </div>
                </CardHeader>
                <CardContent>
                  {recentWebsiteTransactions.length === 0 ? (
                    <div className="text-sm text-white/60">
                      No website transactions recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentWebsiteTransactions.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-white/10 border-white/10 text-white">
                                  {event.transactionType}
                                </Badge>
                                <span className="text-xs text-white/60">{event.eventType}</span>
                              </div>
                              <div className="mt-2 text-sm text-white/80">
                                Merchant:{' '}
                                <span className="font-semibold text-white">
                                  {merchantNames[event.merchantId] ?? event.merchantId ?? 'N/A'}
                                </span>
                              </div>
                              <div className="text-sm text-white/80">
                                Customer:{' '}
                                <span className="font-semibold text-white">
                                  {customerNames[event.customerId] ?? event.customerId ?? 'N/A'}
                                </span>
                              </div>
                              <div className="text-sm text-white/80">
                                Voucher:{' '}
                                <span className="font-semibold text-white">
                                  {event.voucherCode ?? 'N/A'}
                                </span>
                              </div>
                              <div className="text-xs text-white/50 mt-1">
                                Source: {event.source}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-[#00A89D]">
                                {formatCurrency(event.grossAmount)}
                              </div>
                              <div className="text-xs text-white/60">
                                {event.occurredAt
                                  ? moment(event.occurredAt).format('YYYY-MM-DD HH:mm')
                                  : 'No timestamp'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-[#00A89D]" />
                    Accounting Path
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-white/70">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    1. Consumer transacts on `www.evoucher.co.za`.
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    2. Website writes payment, voucher, wallet, and billing event records.
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    3. Finance generates invoices from uninvoiced website events for each merchant
                    period.
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    4. Approved invoices feed settlement batches, BankServ export, and final
                    merchant payout confirmation.
                  </div>
                  <div className="rounded-xl border border-[#00A89D]/30 bg-[#00A89D]/10 p-3 text-white">
                    FNB sponsor account accounting happens through the settlement and BankServ
                    workflow after invoice approval.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing-events">
            <BillingEventsTab
              session={session}
              role={role}
              transactionSearch={transactionSearch}
              merchantNames={merchantNames}
              customerNames={customerNames}
            />
          </TabsContent>

          <TabsContent value="logistics">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white/70">Total Stock Units</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{logisticsKpis.totalStock}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white/70">Low Stock SKUs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-yellow-300">
                      {logisticsKpis.lowStockCount}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white/70">Open Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-300">{logisticsKpis.openOrders}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white/70">Settlement Ready</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-emerald-300">
                      {logisticsKpis.settlementReady}
                    </p>
                  </CardContent>
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
                    onChange={(event) =>
                      setNewOrder((prev) => ({ ...prev, merchant: event.target.value }))
                    }
                  />
                  <input
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm"
                    placeholder="SKU"
                    value={newOrder.sku}
                    onChange={(event) =>
                      setNewOrder((prev) => ({ ...prev, sku: event.target.value }))
                    }
                  />
                  <input
                    type="number"
                    min="1"
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm"
                    placeholder="Qty"
                    value={newOrder.qty}
                    onChange={(event) =>
                      setNewOrder((prev) => ({ ...prev, qty: event.target.value }))
                    }
                  />
                  <input
                    type="date"
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm"
                    value={newOrder.eta}
                    onChange={(event) =>
                      setNewOrder((prev) => ({ ...prev, eta: event.target.value }))
                    }
                  />
                  <Button
                    className="bg-[#00A89D] hover:bg-[#009488] text-white"
                    onClick={createOrder}
                  >
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
                              <Badge
                                className={
                                  lowStock
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }
                              >
                                {lowStock ? 'Low stock' : 'Healthy'}
                              </Badge>
                            </td>
                            <td className="py-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => receiveStock(row.sku, 10)}
                              >
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
                            <Badge
                              className={
                                statusClassMap[order.status] || 'bg-gray-100 text-gray-800'
                              }
                            >
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-2">{order.settlementGate.replaceAll('_', ' ')}</td>
                          <td className="py-2">
                            <div className="flex gap-2 flex-wrap">
                              {order.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markOrderStatus(order.id, 'picked')}
                                >
                                  Mark Picked
                                </Button>
                              )}
                              {order.status === 'picked' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markOrderStatus(order.id, 'in_transit')}
                                >
                                  Ship
                                </Button>
                              )}
                              {order.status === 'in_transit' && (
                                <Button
                                  size="sm"
                                  className="bg-[#00A89D] hover:bg-[#009488] text-white"
                                  onClick={() => markOrderStatus(order.id, 'delivered')}
                                >
                                  Deliver
                                </Button>
                              )}
                              {!['delivered', 'cancelled'].includes(order.status) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => markOrderStatus(order.id, 'cancelled')}
                                >
                                  Cancel
                                </Button>
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

          <TabsContent value="live-events">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  Real-Time Event Feed
                  <Badge
                    className={
                      realtimeConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                    }
                  >
                    {realtimeConnected ? 'Connected' : 'Connecting…'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-white/50">
                  Every WS1 action (purchase, redemption, settlement) appears here instantly via
                  Supabase Realtime.
                </p>
              </CardHeader>
              <CardContent>
                {liveEvents.length === 0 ? (
                  <div className="py-12 text-center text-white/40">
                    <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Waiting for events from www.evoucher.co.za…</p>
                    <p className="text-xs mt-1">
                      Trigger a voucher purchase or redemption to see it appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {liveEvents.map((ev) => {
                      const isPurchase = ev.event_type === 'VOUCHER_PURCHASED';
                      const isRedemption = ev.event_type === 'VOUCHER_REDEEMED';
                      const isFinancial = isPurchase || isRedemption;
                      return (
                        <div
                          key={ev.id}
                          className={`rounded-xl border px-4 py-3 ${
                            isFinancial
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : 'border-white/10 bg-white/5'
                          }`}
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">
                                {isPurchase ? '🛒' : isRedemption ? '✅' : '📡'}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={`text-[10px] ${
                                      isPurchase
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : isRedemption
                                          ? 'bg-emerald-500/20 text-emerald-300'
                                          : 'bg-white/10 text-white/60'
                                    }`}
                                  >
                                    {ev.event_type}
                                  </Badge>
                                  <Badge
                                    className={`text-[10px] ${
                                      ev.status === 'processed'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : ev.status === 'failed'
                                          ? 'bg-red-500/20 text-red-300'
                                          : 'bg-yellow-500/20 text-yellow-300'
                                    }`}
                                  >
                                    {ev.status}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-xs text-white/50">
                                  {ev.correlation_id
                                    ? `ref: ${ev.correlation_id.slice(0, 16)}…`
                                    : ev.event_id?.slice(0, 16)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {ev.amount ? (
                                <p className="font-headline text-lg font-bold text-[#00A89D]">
                                  {formatCurrency(ev.amount)}
                                </p>
                              ) : null}
                              <p className="text-xs text-white/40">
                                {ev.occurred_at
                                  ? moment(ev.occurred_at).format('YYYY-MM-DD HH:mm:ss')
                                  : '—'}
                              </p>
                            </div>
                          </div>
                          {isFinancial && (
                            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-xs text-white/50 sm:grid-cols-4">
                              <span>
                                Merchant:{' '}
                                <span className="text-white/70">
                                  {ev.merchant_id?.slice(0, 8) ?? '—'}
                                </span>
                              </span>
                              <span>
                                Customer:{' '}
                                <span className="text-white/70">
                                  {ev.customer_id?.slice(0, 8) ?? '—'}
                                </span>
                              </span>
                              <span>
                                Voucher:{' '}
                                <span className="text-white/70">
                                  {ev.voucher_id?.slice(0, 8) ?? '—'}
                                </span>
                              </span>
                              <span>
                                Face value:{' '}
                                <span className="text-white/70">
                                  {ev.face_value ? formatCurrency(ev.face_value) : '—'}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settlements">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-[#00A89D]" />
                  Merchant Payouts
                </CardTitle>
                <p className="text-sm text-white/50">
                  Live from merchant_payouts table — queued → pending → paid
                </p>
              </CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <p className="text-white/50 text-sm py-8 text-center">No payouts recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white/5 border-b border-white/10">
                        <tr className="text-left text-white/60">
                          <th className="px-3 py-2">Merchant</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((p) => {
                          const merchantName =
                            p.merchants?.business_name ??
                            merchantNames[p.merchant_id] ??
                            p.merchant_id?.slice(0, 8);
                          const statusColor =
                            p.status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : p.status === 'pending'
                                ? 'bg-orange-500/20 text-orange-300'
                                : 'bg-white/10 text-white/60';
                          return (
                            <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="px-3 py-2 font-medium">{merchantName}</td>
                              <td className="px-3 py-2 text-right font-bold text-[#00A89D]">
                                {formatCurrency(p.amount)}
                              </td>
                              <td className="px-3 py-2">
                                <Badge className={statusColor}>{p.status}</Badge>
                              </td>
                              <td className="px-3 py-2 text-white/50 text-xs">
                                {p.created_at
                                  ? moment(p.created_at).format('DD MMM YYYY HH:mm')
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reconciliation">
            <div className="space-y-4">
              <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-[#00A89D]" />
                      Reconciliation Runs
                    </CardTitle>
                    <GoldButton
                      size="sm"
                      onClick={() => triggerReconciliationMutation.mutate()}
                      disabled={triggerReconciliationMutation.isPending}
                      className="bg-[#00A89D] hover:bg-[#00A89D]/90 text-white"
                    >
                      {triggerReconciliationMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Run Now
                        </>
                      )}
                    </GoldButton>
                  </div>
                  <p className="text-sm text-white/50">
                    Compares billing_events vs billing_ledger_entries and flags variances
                  </p>
                </CardHeader>
                <CardContent>
                  {reconciliationRuns.length === 0 ? (
                    <p className="text-white/50 text-sm py-8 text-center">
                      No reconciliation runs yet. Click Run Now to start.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {reconciliationRuns.map((run) => {
                        const statusColor =
                          run.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : run.status === 'exceptions'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-yellow-500/20 text-yellow-300';
                        return (
                          <div
                            key={run.id}
                            className="rounded-xl border border-white/10 bg-white/5 p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="font-semibold">{run.run_date}</div>
                                <div className="text-xs text-white/50">
                                  {run.completed_at
                                    ? moment(run.completed_at).format('HH:mm:ss')
                                    : '—'}
                                </div>
                              </div>
                              <Badge className={statusColor}>{run.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div className="bg-white/5 rounded-lg p-2">
                                <div className="text-white/50 text-xs">WS1 Events</div>
                                <div className="font-bold">{run.ws1_tx_count ?? 0}</div>
                              </div>
                              <div className="bg-white/5 rounded-lg p-2">
                                <div className="text-white/50 text-xs">Ledger Entries</div>
                                <div className="font-bold">{run.ledger_count ?? 0}</div>
                              </div>
                              <div className="bg-white/5 rounded-lg p-2">
                                <div className="text-white/50 text-xs">Matched</div>
                                <div className="font-bold text-emerald-300">
                                  {run.matched_count ?? 0}
                                </div>
                              </div>
                              <div className="bg-white/5 rounded-lg p-2">
                                <div className="text-white/50 text-xs">Exceptions</div>
                                <div
                                  className={`font-bold ${run.exception_count > 0 ? 'text-red-300' : 'text-emerald-300'}`}
                                >
                                  {run.exception_count ?? 0}
                                </div>
                              </div>
                            </div>
                            {run.variance > 0 && (
                              <div className="mt-3 text-xs text-red-300 bg-red-500/10 rounded-lg p-2">
                                Variance: {formatCurrency(run.variance)} — WS1:{' '}
                                {formatCurrency(run.total_ws1_value)} vs Ledger:{' '}
                                {formatCurrency(run.total_ledger_value)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exceptions Section */}
              <Card className="mt-6 bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      Reconciliation Exceptions
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant={exceptionFilter === 'open' ? 'solid' : 'outline'}
                        className={
                          exceptionFilter === 'open'
                            ? 'bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1'
                            : 'text-white border-white/10 text-xs px-2 py-1'
                        }
                        onClick={() => setExceptionFilter('open')}
                      >
                        Open Exceptions
                      </Button>
                      <Button
                        size="xs"
                        variant={exceptionFilter === 'resolved' ? 'solid' : 'outline'}
                        className={
                          exceptionFilter === 'resolved'
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-2 py-1'
                            : 'text-white border-white/10 text-xs px-2 py-1'
                        }
                        onClick={() => setExceptionFilter('resolved')}
                      >
                        Resolved
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-white/50">
                    Discrepancies identified during ledger audits that require manual review or
                    waivers.
                  </p>
                </CardHeader>
                <CardContent>
                  {exceptions.length === 0 ? (
                    <p className="text-white/50 text-sm py-4 text-center">
                      No {exceptionFilter} exceptions found.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {exceptions.map((ex) => (
                        <div
                          key={ex.id}
                          className="rounded-xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px] capitalize">
                                  {ex.exception_type.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-white/50">
                                  Ref: {ex.transaction_ref || 'N/A'}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-semibold">{ex.notes}</p>
                              <div className="mt-1 text-xs text-white/40">
                                Detected on: {moment(ex.created_at).format('DD MMM YYYY HH:mm')}
                              </div>
                              {ex.status === 'resolved' && (
                                <div className="mt-2 text-xs text-emerald-300 bg-emerald-500/10 rounded-lg p-2">
                                  Resolved by: {ex.resolved_by || 'Auditor'} on{' '}
                                  {moment(ex.resolved_at).format('DD MMM HH:mm')}. Notes: {ex.notes}
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-md font-bold text-red-300">
                                Variance: {formatCurrency(ex.variance)}
                              </div>
                              <div className="text-xs text-white/50">
                                WS1: {formatCurrency(ex.ws1_amount)} • Ledger:{' '}
                                {formatCurrency(ex.ledger_amount)}
                              </div>
                            </div>
                          </div>
                          {ex.status === 'open' && (
                            <div className="mt-3 flex gap-2 border-t border-white/5 pt-3">
                              <input
                                type="text"
                                placeholder="Resolution / waiver notes..."
                                className="h-8 flex-1 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00A89D]"
                                value={resolutionNotes[ex.id] || ''}
                                onChange={(e) =>
                                  setResolutionNotes({
                                    ...resolutionNotes,
                                    [ex.id]: e.target.value,
                                  })
                                }
                              />
                              <Button
                                size="sm"
                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3"
                                disabled={resolveExceptionMutation.isPending}
                                onClick={() => {
                                  const notes = resolutionNotes[ex.id]?.trim();
                                  if (!notes)
                                    return alert('Please enter resolution notes before waiving.');
                                  resolveExceptionMutation.mutate({ exceptionId: ex.id, notes });
                                }}
                              >
                                Resolve / Waive
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Replay Console Section */}
              <Card className="mt-6 bg-white/5 border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Event Replay Console
                  </CardTitle>
                  <p className="text-sm text-white/50">
                    Re-route or re-audit historical transaction events to reconstruct and correct
                    ledger postings.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">
                        Event IDs (Comma-separated, optional)
                      </label>
                      <textarea
                        placeholder="e.g. 5d5a7dbe-9b37-4d7a-ba92-f045bb627b40"
                        className="w-full h-20 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00A89D]"
                        value={replayPayload.eventIds}
                        onChange={(e) =>
                          setReplayPayload({ ...replayPayload, eventIds: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-white/60 mb-1">
                          Event Type Filter (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. VOUCHER_PURCHASED"
                          className="w-full h-8 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-white focus:outline-none"
                          value={replayPayload.eventType}
                          onChange={(e) =>
                            setReplayPayload({ ...replayPayload, eventType: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-white/60 mb-1">
                            From Date (optional)
                          </label>
                          <input
                            type="date"
                            className="w-full h-8 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-white focus:outline-none"
                            value={replayPayload.fromDate}
                            onChange={(e) =>
                              setReplayPayload({ ...replayPayload, fromDate: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/60 mb-1">
                            To Date (optional)
                          </label>
                          <input
                            type="date"
                            className="w-full h-8 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-white focus:outline-none"
                            value={replayPayload.toDate}
                            onChange={(e) =>
                              setReplayPayload({ ...replayPayload, toDate: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                    <input
                      type="checkbox"
                      id="forceLedgerRepost"
                      checked={replayPayload.forceLedgerRepost}
                      onChange={(e) =>
                        setReplayPayload({ ...replayPayload, forceLedgerRepost: e.target.checked })
                      }
                      className="rounded border-white/10 bg-white/5 text-[#00A89D] focus:ring-[#00A89D]"
                    />
                    <label htmlFor="forceLedgerRepost" className="text-xs text-white/70">
                      Force Ledger Repost (Warning: Deletes and recalculates existing ledger entries
                      for matching keys!)
                    </label>
                  </div>

                  <GoldButton
                    className="bg-[#00A89D] hover:bg-[#00A89D]/90 text-white w-full md:w-auto"
                    disabled={replayMutation.isPending}
                    onClick={() => {
                      const payload = {
                        eventIds: replayPayload.eventIds
                          ? replayPayload.eventIds
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : undefined,
                        fromDate: replayPayload.fromDate || undefined,
                        toDate: replayPayload.toDate || undefined,
                        eventType: replayPayload.eventType || undefined,
                        forceLedgerRepost: replayPayload.forceLedgerRepost,
                      };
                      if (!payload.eventIds && !payload.fromDate && !payload.eventType) {
                        return alert(
                          'Please enter at least one Event ID, a From Date, or an Event Type to replay.'
                        );
                      }
                      replayMutation.mutate(payload);
                    }}
                  >
                    {replayMutation.isPending ? 'Replaying...' : 'Trigger Event Replay & Re-audit'}
                  </GoldButton>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#00A89D]" />
                  Audit Log
                </CardTitle>
                <p className="text-sm text-white/50">
                  Immutable compliance trail from pasa_audit_log
                </p>
              </CardHeader>
              <CardContent>
                {auditEvents.length === 0 ? (
                  <p className="text-white/50 text-sm py-8 text-center">
                    No audit events recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {auditEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-white/10 text-white border-white/10 text-xs">
                              {evt.action}
                            </Badge>
                            <span className="text-xs text-white/50">
                              {evt.actor_role ?? evt.actorRole ?? 'system'}
                            </span>
                            {evt.entity_type && (
                              <span className="text-xs text-white/40">{evt.entity_type}</span>
                            )}
                          </div>
                          <span className="text-xs text-white/40 shrink-0">
                            {evt.created_at
                              ? moment(evt.created_at).format('DD MMM HH:mm:ss')
                              : '—'}
                          </span>
                        </div>
                        {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                          <pre className="mt-2 text-xs text-white/50 whitespace-pre-wrap">
                            {JSON.stringify(evt.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{invoice.merchantName}</h4>
                            <p className="text-sm text-gray-500">
                              {invoice.invoiceNumber} •{' '}
                              {moment(invoice.billingPeriodStart).format('MMM D')} -{' '}
                              {moment(invoice.billingPeriodEnd).format('MMM D, YYYY')}
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
                      <p className="text-2xl font-bold text-[#00A89D]">
                        R{bank.sponsorshipAmount?.toLocaleString()}
                      </p>
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
                      <p className="text-lg font-semibold">
                        R{bank.totalFeesCollected?.toLocaleString()}
                      </p>
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
