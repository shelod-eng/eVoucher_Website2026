/**
 * BankServ Webhook Handler
 * Receives ACK/NCK responses from BankServ Africa
 * Route: POST /api/v1/settlement/bankserv-webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { processBankServResponse } from '@/lib/bankserv-adaptor';

const BANKSERV_WEBHOOK_SECRET = process.env.BANKSERV_WEBHOOK_SECRET || 'dev-secret-key';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature
    const signature = request.headers.get('x-bankserv-signature');
    if (!signature || signature !== BANKSERV_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // 2. Parse webhook payload
    const payload = await request.json();

    // 3. Validate required fields
    if (!payload.reference || !payload.status) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    // 4. Process response
    await processBankServResponse({
      reference: payload.reference,
      status: payload.status,
      code: payload.code,
      message: payload.message,
      timestamp: payload.timestamp || new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('[BankServ Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'BankServ Webhook Handler',
    timestamp: new Date().toISOString(),
  });
}
