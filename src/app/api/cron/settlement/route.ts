/**
 * Daily Settlement Batch Cron Job
 * Route: GET /api/cron/settlement
 * Runs daily at 23:00 to create settlement batches and submit to BankServ
 * 
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/settlement",
 *     "schedule": "0 23 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSettlementBatch, generateBankServBatchFile } from '@/lib/bankserv-adaptor';

const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Settlement Cron] Starting daily settlement batch job...');

    // 2. Create settlement batch
    const batchResult = await createSettlementBatch();

    if (!batchResult.success) {
      console.log('[Settlement Cron] No transactions ready for settlement');
      return NextResponse.json({
        success: true,
        message: 'No transactions ready for settlement',
        timestamp: new Date().toISOString(),
      });
    }

    console.log('[Settlement Cron] Batch created:', batchResult.batchReference);

    // 3. Generate BankServ file
    const fileResult = await generateBankServBatchFile(batchResult.batchId!);

    if (!fileResult.success) {
      console.error('[Settlement Cron] Batch file generation failed:', fileResult.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Batch file generation failed',
          batchId: batchResult.batchId,
        },
        { status: 500 }
      );
    }

    console.log('[Settlement Cron] Batch file generated successfully');

    // 4. In production: Submit file to BankServ SFTP/API
    // For now: Log success and return file reference
    
    return NextResponse.json({
      success: true,
      message: 'Settlement batch created and submitted',
      batchId: batchResult.batchId,
      batchReference: batchResult.batchReference,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Settlement Cron] Job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Settlement batch job failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint (for testing)
export async function POST(request: NextRequest) {
  return GET(request);
}
