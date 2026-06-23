/**
 * Settlement Batch Management API
 * Route: POST /api/v1/settlement/batch - Create settlement batch
 * Route: GET /api/v1/settlement/batch/:id - Get batch details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  createSettlementBatch,
  generateBankServBatchFile,
  getMerchantSettlementSummary,
} from '@/lib/bankserv-adaptor';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 2. Create settlement batch
    const result = await createSettlementBatch();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // 3. Generate BankServ batch file
    const fileResult = await generateBankServBatchFile(result.batchId!);

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      batchReference: result.batchReference,
      batchFile: fileResult.filePath,
      message: 'Settlement batch created successfully',
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If merchant ID provided, return merchant summary
    if (merchantId) {
      const summary = await getMerchantSettlementSummary(merchantId);
      return NextResponse.json(summary);
    }

    // If batch ID provided, return batch details
    if (batchId) {
      const { data: batch, error } = await supabase
        .from('settlement_batches')
        .select(
          `
          *,
          settlement_batch_items (
            *,
            user_profiles!merchant_id (
              business_name,
              email
            )
          )
        `
        )
        .eq('id', batchId)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(batch);
    }

    // Otherwise return all recent batches
    const { data: batches, error } = await supabase
      .from('settlement_batches')
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
