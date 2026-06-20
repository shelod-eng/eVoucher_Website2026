import { NextRequest, NextResponse } from 'next/server';
import {
  registerWebhook,
  validateAPIKey,
  generateAPIKey,
  type WebhookEvent,
} from '@/server/services/public-api';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const validKey = await validateAPIKey(apiKey);
    if (!validKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const { url, events } = body;

    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'url and events array required' }, { status: 400 });
    }

    const webhook = await registerWebhook(validKey.merchantId, url, events as WebhookEvent[]);

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Webhook registration failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const validKey = await validateAPIKey(apiKey);
    if (!validKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      webhooks: [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}
