type OutboundParams = {
  to: string; // E.164 digits
  message: string;
  via?: 'twilio' | 'meta' | string;
};

function cleanNumber(n: string) {
  return String(n ?? '')
    .replace(/[^0-9]/g, '')
    .trim();
}

async function tryTwilio(to: string, message: string, attempts = 3) {
  const twilioSid = String(process.env.TWILIO_ACCOUNT_SID ?? '').trim();
  const twilioToken = String(process.env.TWILIO_AUTH_TOKEN ?? '').trim();
  const twilioFrom = String(process.env.TWILIO_FROM_PHONE ?? '')
    .replace(/\D/g, '')
    .trim();
  if (!twilioSid || !twilioToken || !twilioFrom) return null;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const body = new URLSearchParams();
  body.set('From', `whatsapp:+${twilioFrom}`);
  body.set('To', `whatsapp:+${to}`);
  body.set('Body', message);

  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) return { ok: true, provider: 'twilio', status: res.status, result: json };
      console.warn('[WhatsAppSender] Twilio non-ok response', res.status, json);
    } catch (err) {
      console.error('[WhatsAppSender] Twilio send attempt error', err);
    }
    await new Promise((r) => setTimeout(r, 200 * (i + 1)));
  }
  return null;
}

async function tryMeta(to: string, message: string, attempts = 3) {
  const metaToken = String(process.env.META_WHATSAPP_TOKEN ?? '').trim();
  const metaPhoneId = String(process.env.META_WHATSAPP_PHONE_ID ?? '').trim();
  if (!metaToken || !metaPhoneId) return null;

  const url = `https://graph.facebook.com/v17.0/${metaPhoneId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: `+${to}`,
    type: 'text',
    text: { body: message },
  };

  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${metaToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) return { ok: true, provider: 'meta', status: res.status, result: json };
      console.warn('[WhatsAppSender] Meta non-ok response', res.status, json);
    } catch (err) {
      console.error('[WhatsAppSender] Meta send attempt error', err);
    }
    await new Promise((r) => setTimeout(r, 200 * (i + 1)));
  }
  return null;
}

export async function sendOutboundMessage(params: OutboundParams) {
  const to = cleanNumber(params.to);
  const message = String(params.message ?? '').trim();
  const supportNumber = String(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER ?? '0695831160')
    .replace(/\D/g, '')
    .trim();

  if (!to || !message) {
    console.warn('[WhatsAppSender] missing to or message', { to, message });
    return { ok: false, reason: 'missing to or message' };
  }

  const tw = await tryTwilio(to, message);
  if (tw) return tw;

  const me = await tryMeta(to, message);
  if (me) return me;

  console.log('[WhatsAppSender] No provider configured, would send', {
    from: supportNumber,
    to,
    message,
  });
  return { ok: false, reason: 'no-provider-configured' };
}

export default sendOutboundMessage;
