import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the USSD service and outbound sender before importing the route
vi.mock('@/server/services/ussd/ussd-service', () => ({
  handleUssdRequest: vi.fn(),
}));
vi.mock('@/server/services/support/whatsapp-sender', () => ({
  sendOutboundMessage: vi.fn(),
}));

import { POST } from '@/app/webhook/route';
import { handleUssdRequest } from '@/server/services/ussd/ussd-service';
import { sendOutboundMessage } from '@/server/services/support/whatsapp-sender';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Webhook route', () => {
  it('forwards Twilio-style webhook to USSD and sends outbound reply', async () => {
    const twilioPayload = {
      From: 'whatsapp:+27785555555',
      Body: 'Hello USSD',
      NumMedia: '0',
      MessageSid: 'SM123',
    };

    // Mock USSD response
    (handleUssdRequest as any).mockResolvedValue({ message: 'Reply from USSD', action: 'CON' });
    (sendOutboundMessage as any).mockResolvedValue({ ok: true, provider: 'twilio' });

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(twilioPayload as any).toString(),
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(handleUssdRequest).toHaveBeenCalled();
    expect(sendOutboundMessage).toHaveBeenCalledWith(expect.objectContaining({ to: expect.any(String), message: 'Reply from USSD' }));
  });

  it('skips forwarding when msisdn cannot be derived', async () => {
    const payload = { unexpected: 'payload' };
    (handleUssdRequest as any).mockResolvedValue(null);
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const res = await POST(req as any);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(handleUssdRequest).not.toHaveBeenCalled();
  });
});
