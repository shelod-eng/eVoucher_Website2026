import { describe, expect, it } from 'vitest';
import {
  buildChatbotReply,
  buildEmailRoutingPreview,
  buildSupportTicketDecision,
  buildWhatsappLaunch,
  classifySupportCategory,
  classifySupportPriority,
} from '@/server/services/support/support-routing';

describe('support routing', () => {
  it('classifies merchant onboarding queries into merchant support', () => {
    expect(
      classifySupportCategory({
        subject: 'Merchant onboarding documents missing',
        description: 'I need help with KYB and product setup.',
      })
    ).toBe('merchant');
  });

  it('classifies billing incidents with elevated priority', () => {
    expect(
      classifySupportPriority({
        subject: 'Urgent failed payment at checkout',
        description: 'Customer was charged but voucher was not issued.',
      })
    ).toBe('high');
  });

  it('builds routing decision with jira or servicenow handoff metadata', () => {
    const decision = buildSupportTicketDecision({
      name: 'Lebo',
      subject: 'Website outage affecting voucher redemption',
      description: 'The website is down and customers cannot redeem vouchers.',
    });

    expect(decision.ticketId).toContain('EVR-');
    expect(decision.priority).toBe('critical');
    expect(decision.queue).toBe('platform-ops');
    expect(decision.assignedPlatform).toBe('jira');
    expect(decision.workflow).toEqual(['Open', 'In Progress', 'Resolved', 'Closed']);
  });

  it('responds to chatbot billing queries with escalation guidance', () => {
    const reply = buildChatbotReply('I have a billing issue with payout settlement');

    expect(reply.intent).toBe('billing_support');
    expect(reply.escalationRecommended).toBe(true);
    expect(reply.suggestedChannel).toBe('jira');
  });

  it('responds to merchant shopping queries without narrowing the product to vouchers only', () => {
    const reply = buildChatbotReply('How do I shop for groceries from participating merchants?');

    expect(reply.intent).toBe('merchant_shopping');
    expect(reply.suggestedChannel).toBe('chatbot');
    expect(reply.suggestedActions).toContain('Open Shop');
  });

  it('escalates cash withdrawal support requests through the support path', () => {
    const reply = buildChatbotReply('My cash withdrawal is delayed and I need help');

    expect(reply.intent).toBe('cash_withdrawal_support');
    expect(reply.escalationRecommended).toBe(true);
    expect(reply.suggestedChannel).toBe('whatsapp');
  });

  it('builds a WhatsApp launch payload for website handoff', () => {
    const launch = buildWhatsappLaunch('How do I use WhatsApp for support?');

    expect(launch.phoneNumber).toBeTruthy();
    expect(launch.launchUrl).toContain('https://wa.me/');
    expect(launch.parityJourneys.length).toBeGreaterThanOrEqual(4);
  });

  it('builds email routing preview with category alias and SLA', () => {
    const routing = buildEmailRoutingPreview({
      name: 'Lebo',
      email: 'lebo@evoucher.co.za',
      subject: 'Merchant onboarding support needed',
      description: 'Need help with compliance documents and onboarding steps.',
      requesterType: 'merchant',
    });

    expect(routing.mailbox).toBe('support@evoucher.co.za');
    expect(routing.routingAddress).toContain('support+merchant@');
    expect(routing.slaHours).toBeGreaterThan(0);
  });
});
