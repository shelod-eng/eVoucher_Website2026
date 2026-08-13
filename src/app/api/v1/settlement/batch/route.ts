/**
 * Settlement Batch Management API
 * Route: POST /api/v1/settlement/batch - Create settlement batch (canonical path)
 * Route: GET /api/v1/settlement/batch/:id - Get batch details
 *
 * Uses the canonical BankServ settlement path:
 * merchant_payouts → billing_settlement_batches → billing_settlements
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function buildBatchNumber() {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BATCH-${stamp}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient();

    // 1. Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
    } = await admin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile } = await admin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 2. Query pending merchant payouts (canonical path)
    const { data: payouts, error: payoutsError } = await admin
      .from('merchant_payouts')
      .select('id,merchant_id,amount,status')
      .eq('status', 'pending');

    if (payoutsError) throw payoutsError;

    if (!payouts || payouts.length === 0) {
      return NextResponse.json({ error: 'No pending payouts ready for settlement' }, { status: 400 });
    }

    // 3. Resolve merchant banking details
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

    // 4. Create settlement batch
    const batchNumber = buildBatchNumber();
    const totalAmount = Array.from(payoutTotals.values()).reduce((sum, value) => sum + value, 0);

    const { data: batch, error: batchError } = await admin
      .from('billing_settlement_batches')
      .insert({
        batch_number: batchNumber,
        status: 'pending_approval',
        total_amount: Number(totalAmount.toFixed(2)),
        merchant_count: payoutTotals.size,
        transaction_count: payouts.length,
        created_by: user.id,
        notes: 'Created via /api/v1/settlement/batch',
      })
      .select('*')
      .single();

    if (batchError || !batch) throw batchError ?? new Error('Failed to create batch.');

    // 5. Create billing_settlements rows
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

    // 6. Update merchant_payouts status to batched
    const payoutIds = payouts.map((row) => row.id);
    if (payoutIds.length > 0) {
      const { error: payoutUpdateError } = await admin
        .from('merchant_payouts')
        .update({ status: 'batched' })
        .in('id', payoutIds);
      if (payoutUpdateError) throw payoutUpdateError;
    }

    // 7. Update bankserv_adaptor_transactions with batch_id
    const { error: adaptorUpdateError } = await admin
      .from('bankserv_adaptor_transactions')
      .update({ status: 'batched', batch_id: batch.id })
      .in('merchant_id', merchantIds)
      .eq('status', 'queued');
    if (adaptorUpdateError) {
      console.warn('[Settlement Batch] Failed to update adaptor transactions:', adaptorUpdateError.message);
    }

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      batchReference: batch.batch_number,
      settlementsCreated: settlementRows.length,
      payoutsBatched: payouts.length,
      message: 'Settlement batch created via canonical path.',
    });
  } catch (error: any) {
    console.error('[Settlement Batch] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const merchantId = searchParams.get('merchantId');

    const admin = createAdminClient();

    // If merchant ID provided, return merchant summary from canonical path
    if (merchantId) {
      const { data: payouts } = await admin
        .from('merchant_payouts')
        .select('amount,status,created_at')
        .eq('merchant_id', merchantId);

      const summary = {
        pendingAmount: 0,
        processingAmount: 0,
        paidAmount: 0,
        nextSettlementDate: null as string | null,
      };

      if (payouts) {
        payouts.forEach((entry) => {
          if (entry.status === 'pending') summary.pendingAmount += Number(entry.amount ?? 0);
          if (entry.status === 'batched' || entry.status === 'approved') summary.processingAmount += Number(entry.amount ?? 0);
          if (entry.status === 'settled') summary.paidAmount += Number(entry.amount ?? 0);
        });
      }

      const { data: nextBatch } = await admin
        .from('billing_settlement_batches')
        .select('created_at')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        ...summary,
        nextSettlementDate: nextBatch?.created_at || null,
      });
    }

    // If batch ID provided, return batch details (canonical path)
    if (batchId) {
      let batchQuery = admin
        .from('billing_settlement_batches')
        .select('*');

      if (batchId) {
        batchQuery = batchQuery.eq('id', batchId);
      }

      const { data: batch, error } = await batchQuery.single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const { data: settlements } = await admin
        .from('billing_settlements')
        .select('*')
        .eq('batch_id', batch.id);

      return NextResponse.json({
        ...batch,
        settlements: settlements ?? [],
      });
    }

    // Otherwise return all recent batches
    const { data: batches, error } = await admin
      .from('billing_settlement_batches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ batches });
  } catch (error: any) {
    console.error('[Settlement Batch] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
