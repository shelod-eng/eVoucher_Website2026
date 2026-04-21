import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '');
  return message.includes(`relation "${relationName}" does not exist`);
}

function buildInvoiceNumber(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${y}${m}-${suffix}`;
}

type BranchBreakdownInput = {
  branchCode?: string | null;
  transactionCount?: number | null;
  totalFaceValue?: number | null;
  totalConsumerPrice?: number | null;
  totalMerchantPayout?: number | null;
  totalDiscountAmount?: number | null;
};

function toRoundedNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Number(parsed.toFixed(2));
}

function normalizeBranchBreakdown(
  branchBreakdown: BranchBreakdownInput[] | null | undefined,
  purchases: Array<Record<string, unknown>> | null | undefined
) {
  if (Array.isArray(branchBreakdown) && branchBreakdown.length > 0) {
    return branchBreakdown.map((row) => {
      const totalFaceValue = toRoundedNumber(row.totalFaceValue);
      const totalConsumerPrice = toRoundedNumber(row.totalConsumerPrice);
      const totalDiscountAmount = toRoundedNumber(
        row.totalDiscountAmount ?? Math.max(totalFaceValue - totalConsumerPrice, 0)
      );
      const totalMerchantPayout = toRoundedNumber(
        row.totalMerchantPayout ?? Math.max(totalConsumerPrice, 0)
      );
      return {
        branchCode: String(row.branchCode ?? 'UNKNOWN').trim() || 'UNKNOWN',
        transactionCount: Math.max(0, Number(row.transactionCount ?? 0)),
        totalFaceValue,
        totalConsumerPrice,
        totalMerchantPayout,
        totalDiscountAmount,
      };
    });
  }

  if (!Array.isArray(purchases) || purchases.length === 0) return [];

  const buckets = new Map<
    string,
    {
      transactionCount: number;
      totalFaceValue: number;
      totalConsumerPrice: number;
      totalMerchantPayout: number;
      totalDiscountAmount: number;
    }
  >();

  purchases.forEach((purchase) => {
    const branchCode =
      String(purchase.branchCode ?? purchase.branch_code ?? 'UNKNOWN').trim() || 'UNKNOWN';
    const faceValue = toRoundedNumber(purchase.faceValue ?? purchase.face_value);
    const consumerPrice = toRoundedNumber(purchase.consumerPrice ?? purchase.consumer_price);
    const merchantPayout = toRoundedNumber(
      purchase.merchantPayout ?? purchase.merchant_payout_amount ?? consumerPrice
    );
    const discountAmount = toRoundedNumber(
      purchase.totalDiscountAmount ??
        purchase.total_discount_amount ??
        Math.max(faceValue - consumerPrice, 0)
    );

    const current = buckets.get(branchCode) ?? {
      transactionCount: 0,
      totalFaceValue: 0,
      totalConsumerPrice: 0,
      totalMerchantPayout: 0,
      totalDiscountAmount: 0,
    };
    current.transactionCount += 1;
    current.totalFaceValue = toRoundedNumber(current.totalFaceValue + faceValue);
    current.totalConsumerPrice = toRoundedNumber(current.totalConsumerPrice + consumerPrice);
    current.totalMerchantPayout = toRoundedNumber(current.totalMerchantPayout + merchantPayout);
    current.totalDiscountAmount = toRoundedNumber(current.totalDiscountAmount + discountAmount);
    buckets.set(branchCode, current);
  });

  return Array.from(buckets.entries()).map(([branchCode, totals]) => ({
    branchCode,
    ...totals,
  }));
}

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const status = String(searchParams.get('status') ?? '').trim();
    const merchantId = String(searchParams.get('merchantId') ?? '').trim();
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') ?? 50)));
    const offset = (page - 1) * limit;

    const admin = createAdminClient();
    let query = admin
      .from('billing_invoices')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (merchantId) query = query.eq('merchant_id', merchantId);

    const { data, error, count } = await query;
    if (error) {
      if (isMissingRelation(error, 'public.billing_invoices')) {
        return jsonNoStore(
          {
            error:
              'Missing billing tables. Apply Supabase migrations (billing engine phase2/phase3).',
            code: 'billing_schema_missing',
          },
          { status: 500 }
        );
      }
      throw error;
    }

    const total = Number(count ?? 0);
    const hasMore = offset + limit < total;
    return jsonNoStore({
      success: true,
      data: data ?? [],
      meta: { page, limit, total, hasMore },
    });
  } catch (error: any) {
    return jsonNoStore({ error: error?.message || 'Failed to list invoices.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { allowed, user, role } = await requirePortalUser(request, ['admin', 'finance_approver']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const merchantId = String(body?.merchantId ?? '').trim();
    const merchantName = String(body?.merchantName ?? '').trim();
    const periodStart = String(body?.periodStart ?? '').trim();
    const periodEnd = String(body?.periodEnd ?? '').trim();
    if (!merchantId || !periodStart || !periodEnd) {
      return jsonNoStore(
        { error: 'merchantId, periodStart, and periodEnd are required.' },
        { status: 400 }
      );
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end) {
      return jsonNoStore({ error: 'Invalid periodStart/periodEnd.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const providedBranchBreakdown = normalizeBranchBreakdown(
      Array.isArray(body?.branchBreakdown) ? body.branchBreakdown : null,
      Array.isArray(body?.purchases) ? body.purchases : null
    );
    const hasContractPayload =
      providedBranchBreakdown.length > 0 ||
      Array.isArray(body?.purchases) ||
      typeof body?.totals === 'object';

    if (hasContractPayload) {
      const totalFaceValue = toRoundedNumber(
        body?.totals?.totalFaceValue ??
          providedBranchBreakdown.reduce(
            (sum: number, row: any) => sum + Number(row.totalFaceValue ?? 0),
            0
          )
      );
      const totalConsumerPrice = toRoundedNumber(
        body?.totals?.totalConsumerPrice ??
          providedBranchBreakdown.reduce(
            (sum: number, row: any) => sum + Number(row.totalConsumerPrice ?? 0),
            0
          )
      );
      const totalMerchantPayout = toRoundedNumber(
        body?.totals?.totalMerchantPayout ??
          providedBranchBreakdown.reduce(
            (sum: number, row: any) => sum + Number(row.totalMerchantPayout ?? 0),
            0
          ) ??
          totalConsumerPrice
      );
      const totalDiscountAmount = toRoundedNumber(
        body?.totals?.totalDiscountAmount ??
          providedBranchBreakdown.reduce(
            (sum: number, row: any) => sum + Number(row.totalDiscountAmount ?? 0),
            0
          ) ??
          Math.max(totalFaceValue - totalConsumerPrice, 0)
      );

      const consumerBenefitAmount = toRoundedNumber(totalDiscountAmount * 0.7);
      const platformRevenueAmount = toRoundedNumber(totalDiscountAmount - consumerBenefitAmount);
      const bankFeeAmount = toRoundedNumber(body?.totals?.bankFeeAmount ?? 0);
      const netPayable = toRoundedNumber(totalMerchantPayout - bankFeeAmount);

      const invoiceNumber = buildInvoiceNumber();
      const dueDate = new Date(end.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data: invoice, error: invoiceError } = await admin
        .from('billing_invoices')
        .insert({
          invoice_number: invoiceNumber,
          merchant_id: merchantId,
          period_start: start.toISOString().slice(0, 10),
          period_end: end.toISOString().slice(0, 10),
          status: 'pending_approval',
          total_face_value: totalFaceValue,
          total_consumer_paid: totalConsumerPrice,
          merchant_payout_amount: totalMerchantPayout,
          platform_revenue_amount: platformRevenueAmount,
          consumer_benefit_amount: consumerBenefitAmount,
          bank_fee_amount: bankFeeAmount,
          net_payable_to_merchant: netPayable,
          due_date: dueDate.toISOString().slice(0, 10),
          created_by: user?.id ?? null,
          metadata: {
            createdByRole: role ?? null,
            source: 'contract_branch_breakdown',
            merchantName: merchantName || null,
            branchCount: Number(body?.branchCount ?? providedBranchBreakdown.length ?? 0),
            lineItemCount: Number(
              body?.lineItemCount ??
                (Array.isArray(body?.purchases) ? Number(body.purchases.length) : 0)
            ),
            branchBreakdown: providedBranchBreakdown,
            contractVersion: 'kalapeng-v1',
            ...(typeof body?.metadata === 'object' && body?.metadata ? body.metadata : {}),
          },
        })
        .select('*')
        .single();

      if (invoiceError) {
        if (isMissingRelation(invoiceError, 'public.billing_invoices')) {
          return jsonNoStore(
            {
              error:
                'Missing billing tables. Apply Supabase migrations (billing engine phase2/phase3).',
              code: 'billing_schema_missing',
            },
            { status: 500 }
          );
        }
        throw invoiceError;
      }

      if (providedBranchBreakdown.length > 0) {
        await admin.from('billing_invoice_lines').insert(
          providedBranchBreakdown.map((line) => ({
            invoice_id: invoice.id,
            event_id: null,
            occurred_at: end.toISOString(),
            gross_amount: Number(line.totalFaceValue ?? 0),
            merchant_payout_amount: Number(line.totalMerchantPayout ?? 0),
            total_discount_amount: Number(line.totalDiscountAmount ?? 0),
            metadata: {
              lineType: 'branch_breakdown',
              branchCode: line.branchCode,
              transactionCount: line.transactionCount,
              totalConsumerPrice: line.totalConsumerPrice,
            },
          }))
        );
      }

      return jsonNoStore({
        success: true,
        data: invoice,
        meta: {
          contractHook: 'branch_breakdown',
          branchLineCount: providedBranchBreakdown.length,
        },
      });
    }

    // Finance-grade source of truth: billing_events + billing_ledger_entries.
    // We build invoices from events not yet invoiced for this merchant + period.
    const { data: events, error: eventsError } = await admin
      .from('billing_events')
      .select('id,gross_amount,merchant_payout_amount,total_discount_amount,occurred_at')
      .eq('merchant_id', merchantId)
      .is('invoice_id', null)
      .gte('occurred_at', start.toISOString())
      .lte('occurred_at', end.toISOString())
      .order('occurred_at', { ascending: true })
      .limit(5000);

    if (eventsError) {
      if (isMissingRelation(eventsError, 'public.billing_events')) {
        return jsonNoStore(
          {
            error:
              'Missing billing events table. Apply Supabase migrations (billing engine phase4).',
            code: 'billing_schema_missing',
          },
          { status: 500 }
        );
      }
      throw eventsError;
    }

    if (!events || events.length === 0) {
      return jsonNoStore(
        { error: 'No billable events found for this merchant + period.' },
        { status: 422 }
      );
    }

    const grossTotal = Number(
      (events ?? [])
        .reduce((sum: number, e: any) => sum + Number(e.gross_amount ?? 0), 0)
        .toFixed(2)
    );
    const merchantPayoutAmount = Number(
      (events ?? [])
        .reduce((sum: number, e: any) => sum + Number(e.merchant_payout_amount ?? 0), 0)
        .toFixed(2)
    );
    const totalDiscountAmount = Number(
      (events ?? [])
        .reduce((sum: number, e: any) => sum + Number(e.total_discount_amount ?? 0), 0)
        .toFixed(2)
    );

    // 70/30 split for reporting (consumer benefit vs platform benefit).
    const consumerBenefitAmount = Number((totalDiscountAmount * 0.7).toFixed(2));
    const platformRevenueAmount = Number((totalDiscountAmount - consumerBenefitAmount).toFixed(2));

    // Bank fees are introduced in P1 (BankServ integration). Keep 0 for P0.
    const bankFeeAmount = 0;
    const netPayable = Number((merchantPayoutAmount - bankFeeAmount).toFixed(2));

    const invoiceNumber = buildInvoiceNumber();
    const dueDate = new Date(end.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: invoice, error: invoiceError } = await admin
      .from('billing_invoices')
      .insert({
        invoice_number: invoiceNumber,
        merchant_id: merchantId,
        period_start: start.toISOString().slice(0, 10),
        period_end: end.toISOString().slice(0, 10),
        status: 'pending_approval',
        total_face_value: grossTotal,
        total_consumer_paid: grossTotal,
        merchant_payout_amount: merchantPayoutAmount,
        platform_revenue_amount: platformRevenueAmount,
        consumer_benefit_amount: consumerBenefitAmount,
        bank_fee_amount: bankFeeAmount,
        net_payable_to_merchant: netPayable,
        due_date: dueDate.toISOString().slice(0, 10),
        created_by: user?.id ?? null,
        metadata: {
          createdByRole: role ?? null,
          billingEventsCount: (events ?? []).length,
          source: 'billing_events',
          splitModel: '70_30',
        },
      })
      .select('*')
      .single();

    if (invoiceError) {
      if (isMissingRelation(invoiceError, 'public.billing_invoices')) {
        return jsonNoStore(
          {
            error:
              'Missing billing tables. Apply Supabase migrations (billing engine phase2/phase3).',
            code: 'billing_schema_missing',
          },
          { status: 500 }
        );
      }
      throw invoiceError;
    }

    // Tie events to the invoice + store line items for traceability.
    const eventIds = (events ?? []).map((e: any) => e.id);
    if (eventIds.length > 0) {
      await admin.from('billing_invoice_lines').insert(
        (events ?? []).map((e: any) => ({
          invoice_id: invoice.id,
          event_id: e.id,
          occurred_at: e.occurred_at,
          gross_amount: Number(e.gross_amount ?? 0),
          merchant_payout_amount: Number(e.merchant_payout_amount ?? 0),
          total_discount_amount: Number(e.total_discount_amount ?? 0),
          metadata: {},
        }))
      );

      await admin
        .from('billing_events')
        .update({ invoice_id: invoice.id, updated_at: new Date().toISOString() })
        .in('id', eventIds);
    }

    return jsonNoStore({ success: true, data: invoice });
  } catch (error: any) {
    return jsonNoStore({ error: error?.message || 'Failed to create invoice.' }, { status: 500 });
  }
}
