import { UssdRequestPayload } from '../types';

type TwilioWebhookLikePayload = {
  SessionSid?: string;
  CallSid?: string;
  From?: string;
  Body?: string;
  Digits?: string;
};

export function mapTwilioWebhookToUssdPayload(
  payload: TwilioWebhookLikePayload
): UssdRequestPayload {
  const sessionId = String(payload.SessionSid ?? payload.CallSid ?? '').trim();
  const msisdn = String(payload.From ?? '').trim();
  const text = String(payload.Body ?? payload.Digits ?? '').trim();

  return {
    sessionId,
    msisdn,
    text,
    provider: 'twilio',
  };
}

export function formatUssdResponseForTwilio(input: { action: 'CON' | 'END'; message: string }) {
  // Twilio is not the final USSD rail for MTN/Vodacom, but this gives us a
  // consistent webhook adapter shape for quick simulator/SMS-style integration.
  return {
    response: `${input.action} ${input.message}`,
  };
}

