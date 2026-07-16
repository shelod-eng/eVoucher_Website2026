type SupportCategory = 'consumer' | 'merchant' | 'technical' | 'billing';
type SupportPriority = 'low' | 'medium' | 'high' | 'critical';
type SupportChannel = 'chatbot' | 'whatsapp' | 'email' | 'jira' | 'servicenow' | 'web';
type SupportActionId =
  | 'open_shop'
  | 'open_wallet'
  | 'open_redeem'
  | 'open_merchants'
  | 'open_support'
  | 'open_ussd'
  | 'launch_whatsapp'
  | 'log_ticket'
  | 'email_support'
  | 'view_benefits';

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
  actionIds: SupportActionId[];
  suggestedChannel: SupportChannel;
  escalationRecommended: boolean;
};

export type SupportWhatsappLaunch = {
  phoneNumber: string;
  message: string;
  launchUrl: string;
  intent: string;
  parityJourneys: string[];
};

export type SupportEmailRoutingPreview = {
  mailbox: string;
  aliases: string[];
  category: SupportCategory;
  priority: SupportPriority;
  queue: string;
  routingAddress: string;
  autoReplySubject: string;
  autoReplyMessage: string;
  slaHours: number;
  assignedPlatform: 'jira' | 'servicenow';
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
  actionIds: SupportActionId[];
  suggestedChannel: SupportChannel;
  escalationRecommended?: boolean;
}> = [
  {
    intent: 'platform_overview',
    keywords: ['what is evoucher', 'what do you do', 'platform', 'about evoucher', 'offerings'],
    answer:
      'eVoucher is a digital commerce platform that helps consumers shop with participating merchants, manage wallet value, buy and redeem vouchers, and access support across web, wallet, USSD, and assisted channels.',
    suggestedActions: ['Browse merchants', 'Open wallet', 'Learn about merchants'],
    actionIds: ['open_support', 'open_shop', 'open_merchants'],
    suggestedChannel: 'chatbot',
  },
  {
    intent: 'billing_support',
    keywords: ['refund', 'charged', 'invoice', 'billing', 'payout', 'settlement'],
    answer:
      'Billing issues are routed into the finance support queue, where the SLA starts immediately after intake and escalations can be tracked in the ticketing workflow.',
    suggestedActions: ['Log billing ticket', 'Email support', 'Escalate to finance ops'],
    actionIds: ['log_ticket', 'email_support', 'open_support'],
    suggestedChannel: 'jira',
    escalationRecommended: true,
  },
  {
    intent: 'merchant_shopping',
    keywords: [
      'buy groceries',
      'groceries',
      'grocery',
      'shop',
      'shopping',
      'checkout',
      'buy',
      'purchase',
    ],
    answer:
      'Consumers can shop from participating merchants, add products or voucher-backed offers to checkout, and pay by card, EFT, PayFast, or wallet depending on the flow.',
    suggestedActions: ['Open Shop', 'Open Wallet', 'Talk to support if payment failed'],
    actionIds: ['open_shop', 'view_benefits', 'open_support'],
    suggestedChannel: 'chatbot',
  },
  {
    intent: 'voucher_redemption',
    keywords: ['redeem', 'use voucher', 'voucher code', 'scan'],
    answer:
      'To redeem a voucher, open your voucher in the wallet or redemption view, confirm the code, and present it to the merchant at checkout.',
    suggestedActions: ['Open Wallet', 'Go to Redeem', 'Log a support ticket'],
    actionIds: ['open_wallet', 'open_redeem', 'log_ticket'],
    suggestedChannel: 'chatbot',
  },
  {
    intent: 'merchant_onboarding',
    keywords: ['merchant', 'onboarding', 'documents', 'compliance', 'kyb', 'become a merchant'],
    answer:
      'Merchant onboarding covers business registration, compliance checks, banking details, and product setup before approval.',
    suggestedActions: [
      'Open Merchant page',
      'Prepare required documents',
      'Request onboarding support',
    ],
    actionIds: ['open_merchants', 'email_support', 'open_support'],
    suggestedChannel: 'email',
  },
  {
    intent: 'wallet_topup',
    keywords: [
      'top up',
      'top-up',
      'topup',
      'wallet top up',
      'wallet balance',
      'fund wallet',
      'add money',
    ],
    answer:
      'The wallet can be topped up from the consumer flow, and the balance can then be used for supported purchases while keeping transaction history visible in the wallet view.',
    suggestedActions: ['Open Wallet', 'Open Shop', 'View payment options'],
    actionIds: ['open_wallet', 'open_shop', 'view_benefits'],
    suggestedChannel: 'chatbot',
  },
  {
    intent: 'wallet_benefits',
    keywords: ['wallet', 'benefits', 'rewards', 'save money', 'ewallet'],
    answer:
      'The eVoucher wallet helps customers track stored value, voucher activity, top-ups, purchase history, and savings while moving quickly between shop and redemption journeys.',
    suggestedActions: ['Open Wallet', 'View benefits', 'Browse offers'],
    actionIds: ['open_wallet', 'view_benefits', 'open_shop'],
    suggestedChannel: 'chatbot',
  },
  {
    intent: 'cash_withdrawal_support',
    keywords: ['withdraw cash', 'cash withdrawal', 'withdrawal', 'cash out', 'cash-out'],
    answer:
      'Cash withdrawal is treated as a wallet support journey. The support team can help verify wallet balance, transaction status, and the right next step if a cash-out request is delayed or blocked.',
    suggestedActions: ['Open Wallet', 'Log a support ticket', 'Ask for a human agent'],
    actionIds: ['open_wallet', 'log_ticket', 'open_support'],
    suggestedChannel: 'whatsapp',
    escalationRecommended: true,
  },
  {
    intent: 'ussd_whatsapp',
    keywords: ['ussd', 'whatsapp', 'feature phone', 'phone'],
    answer:
      'eVoucher supports USSD access today, and the WhatsApp demo extends support journeys for merchant shopping, wallet help, voucher redemption, and assisted support requests.',
    suggestedActions: ['Open USSD simulator', 'Launch WhatsApp support', 'Ask for a human agent'],
    actionIds: ['open_ussd', 'launch_whatsapp', 'open_support'],
    suggestedChannel: 'whatsapp',
  },
];

function normalizeText(...values: Array<string | undefined>) {
  return values
    .map((value) =>
      String(value ?? '')
        .trim()
        .toLowerCase()
    )
    .filter(Boolean)
    .join(' ');
}

export function classifySupportCategory(input: SupportTicketInput): SupportCategory {
  const normalized = normalizeText(
    input.category,
    input.requesterType,
    input.subject,
    input.description
  );

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

export function buildWhatsappLaunch(message?: string) {
  const reply = buildChatbotReply(message || 'whatsapp support');
  const phoneNumber = String(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER ?? '0695831160')
    .replace(/\D/g, '')
    .trim();
  const fallbackMessage =
    'Hi eVoucher, I need help with shopping, wallet support, or voucher redemption.';
  const launchMessage =
    reply.intent === 'merchant_onboarding'
      ? 'Hi eVoucher, I need help with merchant onboarding on the website.'
      : reply.intent === 'billing_support'
        ? 'Hi eVoucher, I need help with a billing or payment issue.'
        : reply.intent === 'cash_withdrawal_support'
          ? 'Hi eVoucher, I need help with a wallet cash withdrawal request.'
          : fallbackMessage;

  return {
    phoneNumber,
    message: launchMessage,
    launchUrl: `https://wa.me/${phoneNumber}?text=${encodeURIComponent(launchMessage)}`,
    intent: reply.intent,
    parityJourneys: [
      'merchant shopping and checkout assistance',
      'wallet top-up and balance support',
      'voucher redemption and support follow-up',
      'cash withdrawal support guidance',
      'merchant and consumer query handoff',
      'channel parity with website and USSD support flows',
    ],
  } satisfies SupportWhatsappLaunch;
}

export function buildEmailRoutingPreview(input: SupportTicketInput) {
  const decision = buildSupportTicketDecision(input);
  return {
    mailbox: 'support@evoucher.co.za',
    aliases: [
      'support+consumer@evoucher.co.za',
      'support+merchant@evoucher.co.za',
      'support+technical@evoucher.co.za',
      'support+billing@evoucher.co.za',
    ],
    category: decision.category,
    priority: decision.priority,
    queue: decision.queue,
    routingAddress: decision.routingAddress,
    autoReplySubject: decision.autoReplySubject,
    autoReplyMessage: decision.autoReplyMessage,
    slaHours: decision.slaHours,
    assignedPlatform: decision.assignedPlatform,
  } satisfies SupportEmailRoutingPreview;
}

export function buildChatbotReply(message: string): SupportChatReply {
  const normalized = normalizeText(message);

  for (const entry of CHATBOT_KNOWLEDGE) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return {
        intent: entry.intent,
        answer: entry.answer,
        suggestedActions: entry.suggestedActions,
        actionIds: entry.actionIds,
        suggestedChannel: entry.suggestedChannel,
        escalationRecommended: Boolean(entry.escalationRecommended),
      };
    }
  }

  return {
    intent: 'general_support',
    answer:
      'I can help with merchant shopping, wallet top-ups, voucher redemption, cash withdrawal support, merchant onboarding, billing, USSD, and WhatsApp journeys. If the issue is urgent, I can route you to a human support path.',
    suggestedActions: [
      'Ask about merchant shopping',
      'Ask about wallet support',
      'Log a support ticket',
    ],
    actionIds: ['open_shop', 'open_wallet', 'log_ticket'],
    suggestedChannel: 'chatbot',
    escalationRecommended: false,
  };
}
