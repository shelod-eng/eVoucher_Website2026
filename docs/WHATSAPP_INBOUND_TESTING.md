# WhatsApp Inbound & USSD Integration — Testing Guide

This document shows how to test inbound WhatsApp webhooks (Twilio and Meta) and verify the USSD processing flow in local development using ngrok or a public webhook tunnel.

## Requirements

- Dev server running: `npm run dev` (Next.js App Router)
- Optionally: `ngrok` installed for public webhook testing
- Env vars (set in `.env.local`):
  - `NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER` — canonical support number (digits only), e.g. `0695831160`
  - For Twilio outbound: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_PHONE`
  - For Meta Graph API: `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_ID`

## Start dev server

```bash
npm run dev
```

## Expose local server with ngrok (optional but useful)

```bash
ngrok http 3000
```

Copy the `https://<your-ngrok-id>.ngrok.io` URL.

## Twilio-style webhook test (form-encoded)

This simulates the Twilio inbound webhook format (typical when using Twilio's WhatsApp sandbox). Replace `<ngrok>` with your tunnel host or use `http://localhost:3000` for local testing if your webhook provider can reach it.

Curl example:

```bash
curl -X POST "https://<ngrok>/webhook" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'From=whatsapp:+27785921160' \
  -d 'To=whatsapp:+0695831160' \
  -d 'Body=Hello from Twilio test' \
  -d 'MessageSid=SM_TEST'
```

Expected behavior:
- Server console logs show the normalized webhook and a forwarding log: `[Webhook] forwarding to USSD backend: ...`
- `handleUssdRequest` is invoked with `{ sessionId: 'wa-27785921160', msisdn: '27785921160', text: 'Hello from Twilio test', provider: 'whatsapp' }`
- If the USSD handler returns `message` text, the app will attempt to send it back using the configured outbound provider (Twilio or Meta). If none configured, it will log the outbound intent.

## Meta-style webhook test (JSON)

This simulates Meta's webhook 'entry/changes' format.

```bash
curl -X POST "https://<ngrok>/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "metadata": { "phone_number_id": "0695831160" },
          "messages": [{ "from": "27785921160", "id": "wamid.TEST", "text": { "body": "Hi from Meta test" } }]
        }
      }]
    }]
  }'
```

Expected behavior is analogous to Twilio-style: normalized webhook, forwarded to USSD, outbound reply attempted.

## Observing logs

- Look for logs in the terminal running Next:
  - `[Webhook] WhatsApp payload:` — shows normalized payload
  - `[Webhook] forwarding to USSD backend:` — shows USSD payload
  - `[Webhook] USSD result:` — shows response from `handleUssdRequest`
  - `[Webhook] outbound send result:` — shows send attempt outcome

## If outbound provider not configured

- The code will log the outbound intent and return `{ ok: false, reason: 'no-provider-configured' }`.
- To enable Twilio sending, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_PHONE`.
- To enable Meta sending, set `META_WHATSAPP_TOKEN` and `META_WHATSAPP_PHONE_ID`.

## Simulating multiple providers

- The outbound sender prefers Twilio, then Meta. To test fallback behavior, configure only one provider or configure invalid credentials to observe retries and fallbacks.

## Testing the registered number behavior

- The central support number is `NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER`. Ensure this number is the one registered on your WhatsApp Business / Twilio account.
- When inbound messages arrive from any MSISDN, the system derives `sessionId = wa-<msisdn>` and uses the USSD service for stateful processing.

## Troubleshooting: Supabase / network errors (offline UAT)

If your local environment cannot reach Supabase or you want offline testing, set the persistence mode (in your other KYC project) to memory. In that project's `.env.local` set:

```env
KYC_PERSISTENCE=memory
```

This will cause the local code path to use an in-memory store instead of Supabase, avoiding `fetch failed` errors during local development.

If you prefer to run against Supabase, ensure `.env.local` contains valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` and that your machine can reach the internet.

## Expected HTTP responses

- Successful webhook handling returns 200 JSON: `{ success: true, provider: 'twilio'|'meta'|'unknown', webhook: {...}, ussd: {...} }`
- If parsing fails, the route returns a 400 with `{ success: false, error: 'Webhook handling failed.' }`.

## Next steps

- Add more synthetic tests for multi-media messages and edge cases.
- If you want, I can add an integration test script that sends test webhooks via ngrok automatically.
