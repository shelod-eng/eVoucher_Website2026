import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listBillingEvents } from '@/api/portal-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';

function formatCurrency(value) {
  const num = Number(value ?? 0);
  return `R${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Billing Events tab — shows REAL billing_events data from the website
 * transaction pipeline via /api/billing/events. When a transactionReference
 * is provided, filters to exactly that canonical identifier so the acceptance
 * test can verify: purchase → billing_event → ledger → payout → invoice →
 * settlement → BankServ queue → reconciliation → audit.
 */
export default function BillingEventsTab({ session, role, transactionSearch, merchantNames = {}, customerNames = {} }) {
  const searchTerm = String(transactionSearch ?? '').trim();

  const { data: searchResponse, isLoading: searchLoading, error: searchError, refetch: refetchSearch } = useQuery({
    queryKey: ['billing-events-search', searchTerm],
    queryFn: () =>
      listBillingEvents(session, role, {
        limit: 100,
        transactionRef: searchTerm || undefined,
      }).then((response) => response?.data ?? []),
    enabled: Boolean(session?.email && searchTerm),
    staleTime: 5000,
  });

  const { data: recentResponse, isLoading: recentLoading, error: recentError } = useQuery({
    queryKey: ['billing-events-recent'],
    queryFn: () =>
      listBillingEvents(session, role, { limit: 50 }).then((response) => response?.data ?? []),
    enabled: Boolean(session?.email && !searchTerm),
    refetchInterval: 10000,
  });

  const events = searchTerm ? (searchResponse ?? []) : (recentResponse ?? []);
  const isLoading = searchTerm ? searchLoading : recentLoading;
  const error = searchTerm ? searchError : recentError;

  const rows = useMemo(() => {
    return (events ?? []).map((event) => {
      const metadata = event.metadata ?? {};
      const transactionRef =
        event.event_key ??
        metadata.transactionReference ??
        metadata.transaction_reference ??
        null;
      const voucherCode = metadata.voucherCode ?? metadata.voucher_code ?? null;
      const consumerPrice = Number(metadata.consumerPrice ?? metadata.consumer_price ?? 0);
      const platformRevenue = Number(metadata.platformRevenue ?? metadata.platform_revenue ?? 0);
      const merchantName = merchantNames[event.merchant_id] ?? event.merchant_id ?? 'N/A';
      const customerName = customerNames[event.customer_id] ?? event.customer_id ?? 'N/A';

      return {
        id: event.id,
        eventKey: event.event_key ?? null,
        transactionRef,
        eventType: event.event_type ?? 'unknown',
        merchantId: event.merchant_id ?? null,
        merchantName,
        customerId: event.customer_id ?? null,
        customerName,
        voucherCode,
        grossAmount: Number(event.gross_amount ?? 0),
        merchantPayoutAmount: Number(event.merchant_payout_amount ?? 0),
        totalDiscountPct: Number(event.total_discount_pct ?? 0),
        totalDiscountAmount: Number(event.total_discount_amount ?? 0),
        consumerPrice,
        platformRevenue,
        occurredAt: event.occurred_at ?? event.created_at ?? null,
        metadata,
      };
    });
  }, [events, merchantNames, customerNames]);

  const isSearching = Boolean(searchTerm);
  const matched = isSearching && rows.length > 0;
  const notFound = isSearching && !isLoading && !error && rows.length === 0;

  return (
    <div className="space-y-4">
      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className="bg-[#00A89D]/20 text-[#00A89D] border-[#00A89D]/30">
              {isSearching ? `Searching: ${searchTerm}` : 'Recent billing events (live from billing_events table)'}
            </Badge>
            <span className="text-xs text-white/40 font-normal">
              Source: /api/billing/events → billing_events (canonical transaction_reference = event_key)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              <p className="font-semibold">Billing events API error — real data unavailable.</p>
              <p className="mt-1 text-xs text-red-300/80">{String(error?.message ?? error)}</p>
              <p className="mt-2 text-xs text-red-300/60">
                This is NOT mock data. The portal is in portal mode and could not reach the live
                billing events endpoint. Check that VITE_BILLING_DATA_MODE=portal and that
                VITE_PORTAL_API_BASE_URL points at https://www.evoucher.co.za.
              </p>
            </div>
          ) : notFound ? (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
              <p className="font-semibold">
                No billing event found for transaction_reference: {searchTerm}
              </p>
              <p className="mt-1 text-xs text-yellow-300/80">
                The billing event is created only after a completed payment webhook or platform
                event is processed. Verify the transaction was paid and that the website published
                a VOUCHER_PURCHASED platform event.
              </p>
              <button
                type="button"
                className="mt-3 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md px-3 py-1.5"
                onClick={() => refetchSearch()}
              >
                Refresh
              </button>
            </div>
          ) : isLoading ? (
            <div className="py-12 text-center text-white/40 text-sm">
              {isSearching ? `Searching for ${searchTerm}…` : 'Loading billing events…'}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-sm">
              No billing events recorded yet. Complete a consumer purchase on www.evoucher.co.za
              and it will appear here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr className="text-left text-white/60">
                    <th className="px-3 py-2">Transaction Reference</th>
                    <th className="px-3 py-2">Event Type</th>
                    <th className="px-3 py-2">Merchant</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Voucher</th>
                    <th className="px-3 py-2 text-right">Face Value</th>
                    <th className="px-3 py-2 text-right">Consumer Price</th>
                    <th className="px-3 py-2 text-right">Discount</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isMatch = isSearching && row.transactionRef === searchTerm;
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-white/5 hover:bg-white/5 ${
                          isMatch ? 'bg-emerald-500/10' : ''
                        }`}
                      >
                        <td className="px-3 py-2">
                          <span className="font-mono text-xs text-white">{(row.transactionRef ?? row.eventKey ?? '—').slice(0, 32)}</span>
                          {isMatch && (
                            <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                              MATCH
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Badge className="bg-white/10 text-white border-white/10 text-[10px]">
                            {row.eventType}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-white/80">{row.merchantName}</td>
                        <td className="px-3 py-2 text-white/60 text-xs">{row.customerName}</td>
                        <td className="px-3 py-2 text-white/60 text-xs">
                          {row.voucherCode ? (
                            <span className="font-mono">{String(row.voucherCode).slice(0, 16)}…</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-[#00A89D]">
                          {formatCurrency(row.grossAmount)}
                        </td>
                        <td className="px-3 py-2 text-right text-white/80">
                          {row.consumerPrice > 0 ? formatCurrency(row.consumerPrice) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-white/60">
                          {row.totalDiscountAmount > 0
                            ? `-${formatCurrency(row.totalDiscountAmount)}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2 text-white/40 text-xs">
                          {row.occurredAt
                            ? moment(row.occurredAt).format('YYYY-MM-DD HH:mm')
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

      {isSearching && matched && (
        <Card className="bg-white/5 border-emerald-500/30 text-white">
          <CardHeader>
            <CardTitle className="text-sm text-emerald-300">
              ✓ Transaction found: {searchTerm}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/70 space-y-1">
            <p className="text-xs text-white/50">
              The transaction_reference above is the canonical identifier shared by
              payment_transactions, customer_vouchers, billing_events, billing_ledger_entries,
              merchant_payouts, billing_invoices, billing_settlements,
              bankserv_adaptor_transactions, platform_events, platform_event_outbox and
              audit_events. Financial amounts shown above are the real database values.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}