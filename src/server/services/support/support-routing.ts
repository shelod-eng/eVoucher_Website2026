type SupportCategory = 'consumer' | 'merchant' | 'technical' | 'billing';
type SupportPriority = 'low' | 'medium' | 'high' | 'critical';
type SupportChannel = 'chatbot' | 'whatsapp' | 'email' | 'jira' | 'servicenow' | 'web';

export type SupportTicketInput = {
  name?: string;
  email?: string;
  requesterType?: string;
  preferredChannel?: string;
  subject?: string;
  description?: string;
  category?: string;
};

export type SupportTicketDecision = {
  ticketId: string;
  category: SupportCategory;
  priority: SupportPriority;
  queue: string;
  assignedPlatform: 'jira' | 'servicenow';
  workflow: ['Open', 'In Progress', 'Resolved', 'Closed'];
  autoReplySubject: string;
  autoReplyMessage: string;
  slaHours: number;
  slaDueAt: string;
  routingAddress: string;
  escalationRequired: boolean;
  summary: string;
};

export type SupportChatReply = {
  intent: string;
  answer: string;
  suggestedActions: string[];
  suggestedChannel: SupportChannel;
  escalationRecommended: boolean;
};

const CATEGORY_KEYWORDS: Array<{ category: SupportCategory; keywords: string[] }> = [
  {
    category: 'billing',
    keywords: ['payment', 'refund', 'billing', 'invoice', 'payout', 'charge', 'settlement'],
  },
  {
    category: 'technical',
    keywords: ['error', 'bug', 'website', 'down', 'login', 'otp', 'password', 'api', 'technical'],
  },
  {
    category: 'merchant',
    keywords: ['merchant', 'onboarding', 'product', 'branch', 'compliance', 'kyb', 'catalog'],
  },
  {
    category: 'consumer',
    keywords: ['voucher', 'purchase', 'redeem', 'wallet', 'customer', 'consumer', 'ussd'],
  },
];

const PRIORITY_KEYWORDS: Array<{ priority: SupportPriority; keywords: string[] }> = [
  { priority: 'critical', keywords: ['fraud', 'breach', 'down', 'outage', 'unavailable'] },
  { priority: 'high', keywords: ['urgent', 'failed payment', 'cannot pay', 'cannot redeem'] },
  { priority: 'medium', keywords: ['delay', 'issue', 'problem', 'error'] },
];

const CHATBOT_KNOWLEDGE: Array<{
  intent: string;
  keywords: string[];
  answer: string;
  suggestedActions: string[];
  suggestedChannel: SupportChannel;
  escalationRecommended?: boolean;
}> = [
  {
    intent: 'billing_support',
    keywords: ['refund', 'charged', 'invoice', 'billing', 'payout', 'settlement'],
    answer:
      'Billing issues are routed into the finance support queue, where the SLA starts immediately after intake and escalations can be tracked in the ticketing workflow.',
    suggestedActions: ['Log billing ticket', 'Email support', 'Escalate to finance ops'],
    suggestedChannel: 'jira',
    escalationRecommended: true,
  },
  {
    intent: 'voucher_purchase',
    keywords: ['buy', 'purchase', 'checkout', 'pay', 'voucher'],
    answer:
      'You can buy a voucher from the Shop flow, pay by card, EFT, PayFast, or wallet, and receive the voucher immediately after successful payment.',
    suggestedActions: ['Open Shop', 'View payment options', 'Talk to support if payment failed'],
    suggestedChannel: 'chatbot',
  },
  {
    intent: 'voucher_redemption',
    keywords: ['redeem', 'use voucher', 'voucher code', 'scan'],
    answer:
      'To redeem a voucher, open your voucher in the wallet or redemption view, confirm the code, and present it to the merchant at checkout.',
    suggestedActions: ['Open Wallet', 'Go to Redeem', 'Log a support ticket'],
    suggestedChannel: 'chatbot',
  },
  {
    intent: 'merchant_onboarding',
    keywords: ['merchant', 'onboarding', 'documents', 'compliance', 'kyb'],
    answer:
      'Merchant onboarding covers business registration, compliance checks, banking details, and product setup before approval.',
    suggestedActions: ['Open Merchant page', 'Prepare required documents', 'Request onboarding support'],
    suggestedChannel: 'email',
  },
  {
    intent: 'ussd_whatsapp',
    keywords: ['ussd', 'whatsapp', 'feature phone', 'phone'],
    answer:
      'eVoucher supports USSD access today, and the weekend sprint expands support journeys through WhatsApp for voucher lookup, purchase guidance, and help requests.',
    suggestedActions: ['Open USSD simulator', 'Launch WhatsApp support', 'Ask for a human agent'],
    suggestedChannel: 'whatsapp',
  },
];

function normalizeText(...values: Array<string | undefined>) {
  return values
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ');
}

export function classifySupportCategory(input: SupportTicketInput): SupportCategory {
  const normalized = normalizeText(input.category, input.requesterType, input.subject, input.description);

  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.category;
    }
  }

  if (normalized.includes('merchant')) return 'merchant';
  return 'consumer';
}

export function classifySupportPriority(input: SupportTicketInput): SupportPriority {
  const normalized = normalizeText(input.subject, input.description);

  for (const entry of PRIORITY_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.priority;
    }
  }

  return 'low';
}

export function slaHoursForPriority(priority: SupportPriority) {
  if (priority === 'critical') return 1;
  if (priority === 'high') return 4;
  if (priority === 'medium') return 12;
  return 24;
}

function queueForCategory(category: SupportCategory) {
  if (category === 'merchant') return 'merchant-support';
  if (category === 'technical') return 'platform-ops';
  if (category === 'billing') return 'finance-ops';
  return 'consumer-support';
}

function platformForCategory(category: SupportCategory): 'jira' | 'servicenow' {
  return category === 'technical' || category === 'billing' ? 'jira' : 'servicenow';
}

function routingAddressForCategory(category: SupportCategory) {
  return `support+${category}@evoucher.co.za`;
}

function buildTicketId(category: SupportCategory) {
  const prefix = category.slice(0, 3).toUpperCase();
  const stamp = Date.now().toString().slice(-8);
  return `EVR-${prefix}-${stamp}`;
}

export function buildSupportTicketDecision(input: SupportTicketInput): SupportTicketDecision {
  const category = classifySupportCategory(input);
  const priority = classifySupportPriority(input);
  const slaHours = slaHoursForPriority(priority);
  const slaDueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();
  const ticketId = buildTicketId(category);
  const queue = queueForCategory(category);
  const assignedPlatform = platformForCategory(category);
  const routingAddress = routingAddressForCategory(category);
  const requester = String(input.name ?? 'there').trim() || 'there';
  const subject = String(input.subject ?? 'Support request').trim() || 'Support request';
  const escalationRequired = priority === 'critical' || priority === 'high';

  return {
    ticketId,
    category,
    priority,
    queue,
    assignedPlatform,
    workflow: ['Open', 'In Progress', 'Resolved', 'Closed'],
    autoReplySubject: `eVoucher support ticket ${ticketId} received`,
    autoReplyMessage: `Hi ${requester}, we have logged "${subject}" under the ${queue} queue. Your current SLA target is ${slaHours} hour(s).`,
    slaHours,
    slaDueAt,
    routingAddress,
    escalationRequired,
    summary: `${category} request routed to ${assignedPlatform} with ${priority} priority.`,
  };
}

export function buildChatbotReply(message: string): SupportChatReply {
  const normalized = normalizeText(message);

  for (const entry of CHATBOT_KNOWLEDGE) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return {
        intent: entry.intent,
        answer: entry.answer,
        suggestedActions: entry.suggestedActions,
        suggestedChannel: entry.suggestedChannel,
        escalationRecommended: Boolean(entry.escalationRecommended),
      };
    }
  }

  return {
    intent: 'general_support',
    answer:
      'I can help with voucher purchase, redemption, merchant onboarding, billing, USSD, and WhatsApp support journeys. If the issue is urgent, I can route you to a human support path.',
    suggestedActions: ['Ask about voucher purchase', 'Ask about redemption', 'Log a support ticket'],
    suggestedChannel: 'chatbot',
    escalationRecommended: false,
  };
}
