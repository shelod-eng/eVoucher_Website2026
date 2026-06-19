import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { getPortalUserFromHeaders, requirePortalRole } from '@/server/utils/portal-auth';
import { writeAuditEvent } from '@/server/utils/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function buildBatchNumber() {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BATCH-${stamp}-${suffix}`;
}

export async function GET(request: Request) {
  try {
    const { user: sessionUser } = await getAuthenticatedUser();
    const user = sessionUser ?? (await getPortalUserFromHeaders(request));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allowed } = await requirePortalRole(user, ['admin', 'finance_approver', 'auditor']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(Number(searchParams.get('limit') ?? 25), 200);
    const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0);

    const admin = createAdminClient();
    let query = admin
      .from('billing_settlement_batches')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ batches: data ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load settlement batches.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user: sessionUser } = await getAuthenticatedUser();
    const user = sessionUser ?? (await getPortalUserFromHeaders(request));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allowed, role } = await requirePortalRole(user, ['admin', 'finance_approver']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as {
      periodStart?: string;
      periodEnd?: string;
      notes?: string;
      merchantIds?: string[];
    };

    const admin = createAdminClient();
    let payoutsQuery = admin
      .from('merchant_payouts')
      .select('id,merchant_id,amount,status')
      .eq('status', 'pending');

    if (Array.isArray(body.merchantIds) && body.merchantIds.length > 0) {
      payoutsQuery = payoutsQuery.in('merchant_id', body.merchantIds);
    }

    const { data: payouts, error: payoutsError } = await payoutsQuery;
    if (payoutsError) throw payoutsError;
    if (!payouts || payouts.length === 0) {
      return NextResponse.json({ error: 'No pending payouts to batch.' }, { status: 400 });
    }

    const merchantIds = Array.from(new Set(payouts.map((p) => p.merchant_id)));
    const { data: merchants, error: merchantsError } = await admin
      .from('merchants')
      .select('id,business_name,bank_name,branch_code,account_number,contact_name')
      .in('id', merchantIds);

    if (merchantsError) throw merchantsError;
    const merchantMap = new Map((merchants ?? []).map((m) => [m.id, m]));

    const payoutTotals = new Map<string, number>();
    payouts.forEach((row) => {
      const merchantId = String(row.merchant_id);
      const next = Number(row.amount ?? 0);
      payoutTotals.set(merchantId, (payoutTotals.get(merchantId) ?? 0) + next);
    });

    const batchNumber = buildBatchNumber();
    const totalAmount = Array.from(payoutTotals.values()).reduce((sum, value) => sum + value, 0);

    const { data: batch, error: batchError } = await admin
      .from('billing_settlement_batches')
      .insert({
        batch_number: batchNumber,
        period_start: body.periodStart ?? null,
        period_end: body.periodEnd ?? null,
        status: 'pending_approval',
        total_amount: Number(totalAmount.toFixed(2)),
        merchant_count: payoutTotals.size,
        created_by: user.id,
        notes: body.notes ? String(body.notes).slice(0, 500) : null,
      })
      .select('*')
      .single();

    if (batchError || !batch) throw batchError ?? new Error('Failed to create batch.');

    const settlementRows = Array.from(payoutTotals.entries()).map(([merchantId, amount]) => {
      const merchant = merchantMap.get(merchantId);
      return {
        batch_id: batch.id,
        merchant_id: merchantId,
        amount: Number(amount.toFixed(2)),
        bank_name: merchant?.bank_name ?? null,
        branch_code: merchant?.branch_code ?? null,
        account_number: merchant?.account_number ?? null,
        account_holder: merchant?.contact_name ?? merchant?.business_name ?? null,
        reference: `${batch.batch_number}-${merchant?.business_name ?? merchantId}`.slice(0, 64),
        status: 'pending',
      };
    });

    if (settlementRows.length > 0) {
      const { error: settlementError } = await admin
        .from('billing_settlements')
        .insert(settlementRows);
      if (settlementError) throw settlementError;
    }

    const payoutIds = payouts.map((row) => row.id);
    if (payoutIds.length > 0) {
      const { error: payoutUpdateError } = await admin
        .from('merchant_payouts')
        .update({ status: 'batched' })
        .in('id', payoutIds);
      if (payoutUpdateError) throw payoutUpdateError;
    }

    try {
      await writeAuditEvent(admin, {
        actorId: user.id,
        actorRole: role ?? 'admin',
        entityType: 'billing_settlement_batch',
        entityId: batch.id,
        action: 'settlement_batch_created',
        metadata: {
          batchNumber: batch.batch_number,
          totalAmount: batch.total_amount,
          merchantCount: batch.merchant_count,
          payoutCount: payouts.length,
        },
        requestId: batch.batch_number,
      });
    } catch (auditError: any) {
      console.warn('[settlement][audit][warn]', auditError?.message || auditError);
    }

    return NextResponse.json({
      message: 'Settlement batch created.',
      batch,
      settlementsCreated: settlementRows.length,
      payoutsBatched: payouts.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create settlement batch.' },
      { status: 500 }
    );
  }
}
