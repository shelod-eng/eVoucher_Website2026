import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<{ id: string }>(admin, user, 'id');
    if (!merchant) return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)));
    const offset = (page - 1) * limit;

    // Pull billing_settlements as the ledger source of truth
    const { data: settlements, error: settlementsError, count } = await admin
      .from('billing_settlements')
      .select('id,amount,gross_amount,bank_fee_amount,platform_revenue_amount,consumer_benefit_amount,settlement_target,status,created_at,updated_at,batch_id', { count: 'exact' })
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (settlementsError && String(settlementsError.message ?? '').includes('does not exist')) {
      return NextResponse.json({ entries: [], meta: { page, limit, total: 0, hasMore: false } });
    }
    if (settlementsError) throw settlementsError;

    // Enrich with batch numbers and ACK/NCK status
    const batchIds = Array.from(
      new Set((settlements ?? []).map((s: any) => String(s.batch_id ?? '')).filter(Boolean))
    );
    const batchMap = new Map<string, string>();
    const ackMap = new Map<string, string>();

    if (batchIds.length > 0) {
      const { data: batches } = await admin
        .from('billing_settlement_batches')
        .select('id,batch_number')
        .in('id', batchIds);
      (batches ?? []).forEach((b: any) => batchMap.set(b.id, b.batch_number));

      const { data: ackRows } = await admin
        .from('bankserv_ack_nck_tracking')
        .select('entity_id,status')
        .in('entity_id', batchIds)
        .order('created_at', { ascending: false });
      for (const row of ackRows ?? []) {
        if (!ackMap.has(row.entity_id)) ackMap.set(row.entity_id, row.status);
      }
    }

    const entries = (settlements ?? []).map((s: any) => ({
      id: s.id,
      type: 'settlement',
      amount: Number(s.amount ?? 0),
      grossAmount: Number(s.gross_amount ?? s.amount ?? 0),
      bankFee: Number(s.bank_fee_amount ?? 0),
      platformRevenue: Number(s.platform_revenue_amount ?? 0),
      consumerBenefit: Number(s.consumer_benefit_amount ?? 0),
      settlementTarget: s.settlement_target ?? 'sponsor_bank',
      status: s.status,
      batchId: s.batch_id ?? null,
      batchNumber: s.batch_id ? (batchMap.get(s.batch_id) ?? null) : null,
      ackNckStatus: s.batch_id ? (ackMap.get(s.batch_id) ?? null) : null,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    const total = Number(count ?? 0);
    return NextResponse.json(
      {
        entries,
        meta: { page, limit, total, hasMore: offset + limit < total },
        settlementTarget: String(process.env.SETTLEMENT_TARGET ?? 'sponsor_bank'),
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load merchant ledger.' },
      { status: 500 }
    );
  }
}
