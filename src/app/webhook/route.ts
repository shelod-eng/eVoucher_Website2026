import { NextResponse } from 'next/server';
import { handleUssdRequest } from '@/server/services/ussd/ussd-service';
import { sendOutboundMessage } from '@/server/services/support/whatsapp-sender';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type WebhookPayload = Record<string, any>;

type MediaItem = { url: string; contentType?: string };

interface WhatsAppWebhookInfo {
  provider: 'twilio' | 'meta' | 'unknown';
  from?: string;
  to?: string;
  body?: string;
  profileName?: string;
  messageId?: string;
  numMedia?: number;
  media?: MediaItem[];
  raw: WebhookPayload;
}

async function parsePayload(request: Request): Promise<WebhookPayload> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return await request.json().catch(() => ({}));
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }

  try {
    return await request.json();
  } catch {
    return {};
  }
}

function parseTwilioPayload(payload: WebhookPayload): WhatsAppWebhookInfo | null {
  const hasTwilioFields = typeof payload.From === 'string' && typeof payload.Body === 'string';
  if (!hasTwilioFields) return null;

  const mediaCount = Number(payload.NumMedia ?? 0);
  const media: MediaItem[] = [];

  for (let index = 0; index < mediaCount; index += 1) {
    const url = String(payload[`MediaUrl${index}`] ?? '').trim();
    const contentType = String(payload[`MediaContentType${index}`] ?? '').trim();
    if (url) {
      media.push({ url, contentType: contentType || undefined });
    }
  }

  return {
    provider: 'twilio',
    from: String(payload.From),
    to: String(payload.To ?? ''),
    body: String(payload.Body ?? ''),
    profileName: String(payload.ProfileName ?? ''),
    messageId: String(payload.MessageSid ?? payload.SmsSid ?? ''),
    numMedia: mediaCount,
    media,
    raw: payload,
  };
}

function parseMetaWhatsAppPayload(payload: WebhookPayload): WhatsAppWebhookInfo | null {
  if (!Array.isArray(payload.entry) || payload.entry.length === 0) return null;

  const change = payload.entry[0]?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];
  if (!message) return null;

  const from = String(message.from ?? '');
  const to = String(value.metadata?.phone_number_id ?? '');
  const body = String(message.text?.body ?? '');
  const profileName = String(message.profile?.name ?? '');
  const messageId = String(message.id ?? '');

  const media: MediaItem[] = [];
  if (Array.isArray(message?.image ? [message.image] : []) && message.image?.mime_type) {
    media.push({
      url: String(message.image?.url ?? ''),
      contentType: String(message.image?.mime_type ?? ''),
    });
  }

  return {
    provider: 'meta',
    from,
    to,
    body,
    profileName,
    messageId,
    numMedia: media.length,
    media,
    raw: payload,
  };
}

function normalizeWhatsAppWebhook(payload: WebhookPayload): WhatsAppWebhookInfo {
  return (
    parseTwilioPayload(payload) ??
    parseMetaWhatsAppPayload(payload) ?? {
      provider: 'unknown',
      raw: payload,
    }
  );
}

export async function POST(request: Request) {
  try {
    const payload = await parsePayload(request);
    const whatsapp = normalizeWhatsAppWebhook(payload);

    console.log(
      '[Webhook] provider=%s from=%s to=%s messageId=%s numMedia=%s',
      whatsapp.provider,
      whatsapp.from ?? 'unknown',
      whatsapp.to ?? 'unknown',
      whatsapp.messageId ?? 'unknown',
      whatsapp.numMedia ?? 0
    );

    console.log('[Webhook] WhatsApp payload:', JSON.stringify(whatsapp, null, 2));

    // Map inbound WhatsApp webhook into USSD request payload and forward to USSD service
    let ussdResult: Record<string, any> | null = null;
    try {
      const rawFrom = String(whatsapp.from ?? '').trim();
      const msisdn = rawFrom.replace(/[^0-9]/g, '');
      const sessionId = msisdn ? `wa-${msisdn}` : String(whatsapp.messageId ?? `wa-${Date.now()}`);

      if (msisdn) {
        const ussdPayload = {
          sessionId,
          msisdn,
          text: String(whatsapp.body ?? '').trim(),
          provider: 'whatsapp',
        };

        console.log('[Webhook] forwarding to USSD backend:', JSON.stringify(ussdPayload));
        ussdResult = await handleUssdRequest(ussdPayload as any);
        console.log('[Webhook] USSD result:', JSON.stringify(ussdResult));
        // If the USSD flow returns a message to send back, use the central support number
        try {
          const textToSend = String(ussdResult?.message ?? '').trim();
          if (textToSend) {
            const sendRes = await sendOutboundMessage({
              to: msisdn,
              message: textToSend,
              via: 'whatsapp',
            });
            console.log('[Webhook] outbound send result:', JSON.stringify(sendRes));
          }
        } catch (err) {
          console.error('[Webhook] error sending outbound message:', err);
        }
      } else {
        console.log('[Webhook] could not derive msisdn from webhook, skipping USSD forwarding.');
      }
    } catch (err) {
      console.error('[Webhook] error forwarding to USSD:', err);
    }

    return NextResponse.json(
      { success: true, provider: whatsapp.provider, webhook: whatsapp, ussd: ussdResult },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('[Webhook] error:', error?.message ?? error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Webhook handling failed.' },
      { status: 400 }
    );
  }
}
