import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Portal-Passcode, X-Portal-User, X-Portal-Role',
};

type StageStatus = 'found' | 'missing' | 'error';

type StageResult = {
  status: StageStatus;
  table: string;
  count: number;
  data: any[];
  error?: string;
};

function toArray(data: any) {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

function first(rows: any[]) {
  return rows.length > 0 ? rows[0] : null;
}

function safeNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function round2(value: number) {
  return Number(value.toFixed(2));
}

function stage(table: string, data: any, error?: any): StageResult {
  const rows = toArray(data);
  if (error) {
    return {
      status: 'error',
      table,
      count: 0,
      data: [],
      error: String(error?.message ?? error),
    };
  }

  return {
    status: rows.length > 0 ? 'found' : 'missing',
    table,
    count: rows.length,
    data: rows,
  };
}

async function maybeQuery(label: string, query: any): Promise<StageResult> {
  try {
    const { data, error } = await query;
    return stage(label, data, error);
  } catch (error: any) {
    return stage(label, null, error);
  }
}

function pickPaymentBoundary(...rows: any[]) {
  for (const row of rows) {
    const metadata = row?.metadata ?? row?.payload ?? {};
    const boundary = metadata?.paymentBoundary ?? metadata?.payment_boundary;
    if (boundary) return boundary;
  }
  return {
    mode: 'controlled_mock',
    provider: 'mock_sandbox',
    label: 'MOCK / SANDBOX - EXTERNAL PAYMENT PROVIDER PENDING',
    liveProviderConnected: false,
  };
}

function buildFinancialCheck(stages: Record<string, StageResult>) {
  const payment = first(stages.payment.data);
  const billingEvent = first(stages.billingEvent.data);
  const payout = first(stages.merchantPayout.data);
  const invoice = first(stages.invoice.data);
  const settlement = first(stages.settlement.data);
  const bankserv = first(stages.bankservQueue.data);
  const ledgerRows = stages.ledger.data;

  const customerPayment = round2(
    safeNumber(payment?.consumer_price ?? payment?.amount ?? billingEvent?.metadata?.consumerPrice)
  );
  const faceValue = round2(
    safeNumber(payment?.face_value ?? billingEvent?.gross_amount ?? invoice?.face_value)
  );
  const billingFaceValue = round2(safeNumber(billingEvent?.gross_amount));
  const merchantPayout = round2(safeNumber(payout?.amount ?? invoice?.net_payable_to_merchant));
  const invoiceAmount = round2(safeNumber(invoice?.net_payable_to_merchant ?? invoice?.amount));
  const settlementAmount = round2(safeNumber(settlement?.amount));
  const bankservAmount = round2(safeNumber(bankserv?.settlement_amount));
  const ledgerCash = round2(
    ledgerRows
      .filter((row) => row.debit_account === 'asset:cash')
      .reduce((sum, row) => sum + safeNumber(row.amount), 0)
  );

  const checks = [
    {
      name: 'payment_vs_billing_face_value',
      expected: faceValue,
      actual: billingFaceValue,
      ok: !faceValue || !billingFaceValue || faceValue === billingFaceValue,
    },
    {
      name: 'payment_vs_ledger_cash',
      expected: faceValue,
      actual: ledgerCash,
      ok: !faceValue || !ledgerCash || faceValue === ledgerCash,
    },
    {
      name: 'payout_vs_invoice',
      expected: merchantPayout,
      actual: invoiceAmount,
      ok: !merchantPayout || !invoiceAmount || merchantPayout === invoiceAmount,
    },
    {
      name: 'invoice_vs_settlement',
      expected: invoiceAmount,
      actual: settlementAmount,
      ok: !invoiceAmount || !settlementAmount || invoiceAmount === settlementAmount,
    },
    {
      name: 'settlement_vs_bankserv_queue',
      expected: settlementAmount,
      actual: bankservAmount,
      ok: !settlementAmount || !bankservAmount || settlementAmount === bankservAmount,
    },
  ];

  return {
    values: {
      customerPayment,
      faceValue,
      billingFaceValue,
      ledgerCash,
      merchantPayout,
      invoiceAmount,
      settlementAmount,
      bankservAmount,
    },
    status: checks.every((check) => check.ok) ? 'consistent_or_pending' : 'mismatch',
    checks,
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const passcode = request.headers.get('X-Portal-Passcode') ?? '';
  const envPasscode = process.env.PORTAL_ADMIN_PASSCODE ?? process.env.VITE_ADMIN_PASSCODE ?? '';
  const passcodeValid = envPasscode && passcode === envPasscode;
  if (!passcodeValid) {
    const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
    if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403, headers: CORS });
  }

  const { searchParams } = new URL(request.url);
  const transactionReference = String(
    searchParams.get('transactionReference') ?? searchParams.get('transactionRef') ?? ''
  ).trim();

  if (!transactionReference) {
    return jsonNoStore(
      { error: 'transactionReference is required.' },
      { status: 400, headers: CORS }
    );
  }

  const admin = createAdminClient();

  const payment = await maybeQuery(
    'payment_transactions',
    admin.from('payment_transactions').select('*').eq('transaction_reference', transactionReference)
  );
  const paymentRow = first(payment.data);
  const voucherCode = String(paymentRow?.voucher_code ?? '').trim();

  const stages: Record<string, StageResult> = {
    payment,
    voucher: voucherCode
      ? await maybeQuery(
          'customer_vouchers',
          admin.from('customer_vouchers').select('*').eq('voucher_code', voucherCode)
        )
      : stage('customer_vouchers', null),
    platformEvent: await maybeQuery(
      'platform_events',
      admin
        .from('platform_events')
        .select('*')
        .or(`transaction_ref.eq.${transactionReference},correlation_id.eq.${transactionReference}`)
    ),
    billingEvent: await maybeQuery(
      'billing_events',
      admin.from('billing_events').select('*').eq('event_key', transactionReference)
    ),
    ledger: await maybeQuery(
      'billing_ledger_entries',
      admin.from('billing_ledger_entries').select('*').eq('source_id', transactionReference)
    ),
    merchantPayout: await maybeQuery(
      'merchant_payouts',
      admin.from('merchant_payouts').select('*').eq('source_id', transactionReference)
    ),
    invoice: await maybeQuery(
      'billing_invoices',
      admin.from('billing_invoices').select('*').eq('source_id', transactionReference)
    ),
    settlement: await maybeQuery(
      'billing_settlements',
      admin.from('billing_settlements').select('*').eq('source_id', transactionReference)
    ),
    bankservQueue: await maybeQuery(
      'bankserv_adaptor_transactions',
      admin
        .from('bankserv_adaptor_transactions')
        .select('*')
        .eq('transaction_reference', transactionReference)
    ),
    audit: await maybeQuery(
      'audit_events',
      admin
        .from('audit_events')
        .select('*')
        .or(`request_id.eq.${transactionReference},entity_id.eq.${transactionReference}`)
    ),
    reconciliationExceptions: await maybeQuery(
      'reconciliation_exceptions',
      admin
        .from('reconciliation_exceptions')
        .select('*')
        .eq('transaction_ref', transactionReference)
    ),
  };

  const billingEventRow = first(stages.billingEvent.data);
  const bankservRow = first(stages.bankservQueue.data);
  const boundary = pickPaymentBoundary(paymentRow, billingEventRow, bankservRow);
  const financial = buildFinancialCheck(stages);

  const lifecycleOrder = [
    'payment',
    'voucher',
    'billingEvent',
    'ledger',
    'merchantPayout',
    'invoice',
    'settlement',
    'bankservQueue',
    'audit',
    'reconciliationExceptions',
  ];

  return jsonNoStore(
    {
      success: true,
      transactionReference,
      externalDependencyBoundary: boundary,
      modeLabel: 'MOCK / SANDBOX - EXTERNAL PAYMENT PROVIDER PENDING',
      stages,
      lifecycle: lifecycleOrder.map((key) => ({
        key,
        status: stages[key].status,
        table: stages[key].table,
        count: stages[key].count,
        error: stages[key].error ?? null,
      })),
      financial,
    },
    { headers: CORS }
  );
}
