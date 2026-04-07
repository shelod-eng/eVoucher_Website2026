import { NextResponse } from 'next/server';
import { handleUssdRequest } from '@/server/services/ussd/ussd-service';
import {
  formatUssdResponseForTwilio,
  mapTwilioWebhookToUssdPayload,
} from '@/server/services/ussd/providers/twilio-adapter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let payload: Record<string, any> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      payload = await request.json().catch(() => ({}));
    }

    const mapped = mapTwilioWebhookToUssdPayload(payload);
    const result = await handleUssdRequest(mapped);
    const twilio = formatUssdResponseForTwilio({
      action: result.action,
      message: result.message,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
        twilio,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Twilio USSD adapter failed.' },
      { status: 400 }
    );
  }
}

