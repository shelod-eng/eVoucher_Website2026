import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function safeDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function round2(n: number) {
  return Number(n.toFixed(2));
}

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);

    const from = safeDate(searchParams.get('from'));
    const to = safeDate(searchParams.get('to'));

    // Pull events as the source of truth for "voucher volume".
    let eventsQuery = admin
      .from('billing_events')
      .select('gross_amount,total_discount_amount,occurred_at')
      .order('occurred_at', { ascending: false })
      .limit(10000);

    if (from) eventsQuery = eventsQuery.gte('occurred_at', from.toISOString());
    if (to) eventsQuery = eventsQuery.lte('occurred_at', to.toISOString());

    const { data: events, error: eventsError } = await eventsQuery;
    if (eventsError) throw eventsError;

    const totalVoucherVolume = round2(
      (events ?? []).reduce((sum: number, e: any) => sum + Number(e.gross_amount ?? 0), 0)
    );

    // Current billing model in this repo:
    // discount pool split = 70% consumer benefit, 30% platform revenue.
    const discountPool = round2(
      (events ?? []).reduce((sum: number, e: any) => sum + Number(e.total_discount_amount ?? 0), 0)
    );
    const memberBenefitsPaid = round2(discountPool * 0.7);
    const platformRevenue = round2(discountPool - memberBenefitsPaid);

    // Invoice-driven payout totals.
    const { data: invoices, error: invoiceError } = await admin
      .from('billing_invoices')
      .select('status,net_payable_to_merchant,bank_fee_amount,created_at,settlement_batch_id')
      .order('created_at', { ascending: false })
      .limit(10000);
    if (invoiceError) throw invoiceError;

    const pendingMerchantPayouts = round2(
      (invoices ?? [])
        .filter((inv: any) => inv.status === 'approved' && !inv.settlement_batch_id)
        .reduce((sum: number, inv: any) => sum + Number(inv.net_payable_to_merchant ?? 0), 0)
    );

    const bankProcessingFees = round2(
      (invoices ?? []).reduce((sum: number, inv: any) => sum + Number(inv.bank_fee_amount ?? 0), 0)
    );

    const { data: settlements, error: settlementsError } = await admin
      .from('billing_settlements')
      .select('status,amount')
      .order('created_at', { ascending: false })
      .limit(10000);
    if (settlementsError) throw settlementsError;

    const settledToMerchants = round2(
      (settlements ?? [])
        .filter((s: any) => s.status === 'confirmed')
        .reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0)
    );

    const totals = {
      totalVoucherVolume,
      platformRevenue,
      memberBenefitsPaid,
      pendingMerchantPayouts,
      settledToMerchants,
      bankProcessingFees,
    };

    return jsonNoStore({
      success: true,
      data: {
        totals,
        splitModel: {
          merchantPayoutPct: 96,
          memberBenefitPct: 2.8,
          platformRevenuePct: 1.2,
          // TRD: bank fee is 0.5% of merchant payout (gross payout before bank fee).
          bankFeePctOfMerchantPayout: 0.5,
        },
        meta: {
          from: from?.toISOString() ?? null,
          to: to?.toISOString() ?? null,
          eventsCount: (events ?? []).length,
        },
      },
    });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to load billing dashboard.' },
      { status: 500 }
    );
  }
}

