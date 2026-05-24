import { describe, expect, it } from 'vitest';
import {
  buildChatbotReply,
  buildSupportTicketDecision,
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
});
