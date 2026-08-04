import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateServiceJWT } from '@/lib/platform-events';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = String(process.env.CRON_SECRET ?? '').trim();
    const hasValidCronBearer = !!cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isVercelCron = String(request.headers.get('user-agent') ?? '')
      .toLowerCase()
      .includes('vercel-cron');

    if (!hasValidCronBearer && !(isVercelCron && !cronSecret)) {
      // Allow bypass in local development if no secret is configured
      const passcode = request.nextUrl.searchParams.get('passcode');
      if (process.env.NODE_ENV !== 'development' && passcode !== process.env.PORTAL_ADMIN_PASSCODE) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const admin = createAdminClient();

    // 2. Fetch pending or failed outbox events (limit to 20 per batch to prevent timeouts)
    const { data: events, error: fetchError } = await admin
      .from('platform_event_outbox')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lt('retries', 5)
      .order('created_at', { ascending: true })
      .limit(20);

    if (fetchError) throw fetchError;

    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No pending events in outbox.' });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const gatewayUrl = `${appUrl.replace(/\/$/, '')}/api/billing/events`;
    const jwt = generateServiceJWT();

    let processedCount = 0;
    let failedCount = 0;

    for (const event of events) {
      try {
        // Mark as processing
        await admin
          .from('platform_event_outbox')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', event.id);

        const response = await fetch(gatewayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
          },
          body: JSON.stringify(event.payload),
        });

        if (response.ok || response.status === 202 || response.status === 200) {
          // Success! Mark as sent
          await admin
            .from('platform_event_outbox')
            .update({ 
              status: 'sent', 
              error_message: null, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', event.id);

          await admin
            .from('platform_events')
            .update({ 
              status: 'processed', 
              processed_at: new Date().toISOString(),
              error_message: null
            })
            .eq('event_id', event.event_id);

          processedCount++;
        } else {
          const errText = await response.text().catch(() => 'gateway HTTP error');
          throw new Error(`Gateway returned HTTP ${response.status}: ${errText}`);
        }
      } catch (err: any) {
        console.error(`[Outbox Worker] Failed to process event ${event.event_id}:`, err.message);
        
        const nextRetries = event.retries + 1;
        const nextStatus = nextRetries >= 5 ? 'dead_letter' : 'failed';

        await admin
          .from('platform_event_outbox')
          .update({
            status: nextStatus,
            retries: nextRetries,
            error_message: err.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', event.id);

        await admin
          .from('platform_events')
          .update({
            status: nextStatus === 'dead_letter' ? 'failed' : 'processing',
            error_message: `[Outbox retry failed] ${err.message}`
          })
          .eq('event_id', event.event_id);

        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      failed: failedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Outbox Worker] Job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Outbox processing failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
