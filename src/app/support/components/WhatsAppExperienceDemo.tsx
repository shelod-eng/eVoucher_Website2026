'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

type ChatReply = {
  intent: string;
  answer: string;
  suggestedActions: string[];
  actionIds: string[];
  suggestedChannel: string;
  escalationRecommended: boolean;
};

type TicketResponse = {
  ticketId: string;
  category: string;
  priority: string;
  queue: string;
  assignedPlatform: string;
  slaHours: number;
  autoReplyMessage: string;
};

type DemoMessage = {
  id: string;
  from: 'assistant' | 'user' | 'system';
  text: string;
  time: string;
  delivery?: 'sent' | 'delivered' | 'read';
};

type DemoScenario = {
  id: string;
  label: string;
  userMessage: string;
  requesterType: 'consumer' | 'merchant' | 'billing' | 'technical';
  supportEmail: string;
};

const scenarios: DemoScenario[] = [
  {
    id: 'merchant_shopping',
    label: 'Grocery shopping',
    userMessage:
      'Hi eVoucher, I want to buy groceries from a participating merchant and check out today.',
    requesterType: 'consumer',
    supportEmail: 'consumer.demo@evoucher.co.za',
  },
  {
    id: 'wallet_topup',
    label: 'Wallet top-up',
    userMessage: 'I need to top up my eWallet and use that balance for shopping.',
    requesterType: 'consumer',
    supportEmail: 'wallet.demo@evoucher.co.za',
  },
  {
    id: 'voucher_redemption',
    label: 'Voucher redemption',
    userMessage: 'I am at the till and need help redeeming my voucher code.',
    requesterType: 'consumer',
    supportEmail: 'redeem.demo@evoucher.co.za',
  },
  {
    id: 'cash_withdrawal',
    label: 'Cash withdrawal',
    userMessage:
      'My cash withdrawal is delayed and I need help checking my wallet transaction status.',
    requesterType: 'consumer',
    supportEmail: 'cashout.demo@evoucher.co.za',
  },
  {
    id: 'billing_support',
    label: 'Billing issue',
    userMessage: 'Urgent failed payment at checkout. I was charged but no voucher arrived.',
    requesterType: 'billing',
    supportEmail: 'billing.demo@evoucher.co.za',
  },
  {
    id: 'merchant_onboarding',
    label: 'Merchant onboarding',
    userMessage: 'Hello, I need help with merchant onboarding documents and compliance.',
    requesterType: 'merchant',
    supportEmail: 'merchant.demo@evoucher.co.za',
  },
];

function createMessage(
  from: DemoMessage['from'],
  text: string,
  delivery: DemoMessage['delivery'] = 'read'
): DemoMessage {
  return {
    id: `${from}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    from,
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    delivery,
  };
}

function deliveryIcon(delivery: DemoMessage['delivery']) {
  if (delivery === 'read') return 'CheckBadgeIcon';
  if (delivery === 'delivered') return 'CheckCircleIcon';
  return 'CheckIcon';
}

export default function WhatsAppExperienceDemo() {
  const timeoutIds = useRef<number[]>([]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [messages, setMessages] = useState<DemoMessage[]>([
    createMessage(
      'system',
      'Demo mode active. This browser experience simulates WhatsApp support journeys, delivery states, and helpdesk escalation.'
    ),
    createMessage(
      'assistant',
      'Hi, this is the eVoucher WhatsApp demo line. Ask about merchant shopping, wallet top-ups, cash withdrawal support, redemption, billing, or merchant onboarding.'
    ),
  ]);
  const [lastReply, setLastReply] = useState<ChatReply | null>(null);
  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(null);

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  function queueTimeout(callback: () => void, delay: number) {
    const timeoutId = window.setTimeout(callback, delay);
    timeoutIds.current.push(timeoutId);
  }

  function resetConversation(nextScenario?: DemoScenario) {
    setTicket(null);
    setLastReply(null);
    setMessages([
      createMessage(
        'system',
        nextScenario
          ? `Scenario loaded: ${nextScenario.label}. The simulator will mimic a live WhatsApp support exchange.`
          : 'Demo mode active. This browser experience simulates WhatsApp support journeys, delivery states, and helpdesk escalation.'
      ),
      createMessage(
        'assistant',
        nextScenario
          ? 'Welcome back. Send your message and I will route it as if it arrived through the WhatsApp support queue.'
          : 'Hi, this is the eVoucher WhatsApp demo line. Ask about merchant shopping, wallet top-ups, cash withdrawal support, redemption, billing, or merchant onboarding.'
      ),
    ]);
  }

  async function requestSupportReply(message: string) {
    const response = await fetch('/api/v1/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || 'Support assistant is unavailable.');
    }
    return payload.data as ChatReply;
  }

  async function maybeCreateTicket(
    reply: ChatReply,
    scenario: DemoScenario | null,
    message: string
  ) {
    if (!reply.escalationRecommended) {
      setTicket(null);
      return;
    }

    const response = await fetch('/api/v1/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'WhatsApp Demo User',
        email: scenario?.supportEmail ?? 'demo.user@evoucher.co.za',
        requesterType: scenario?.requesterType ?? 'consumer',
        preferredChannel: 'whatsapp',
        subject: `WhatsApp support: ${reply.intent.replace(/_/g, ' ')}`,
        description: message,
      }),
    });

    const payload = await response.json();
    if (response.ok) {
      setTicket(payload.data as TicketResponse);
      queueTimeout(() => {
        setMessages((current) => [
          ...current,
          createMessage(
            'system',
            `Case ${payload.data.ticketId} created with ${payload.data.priority} priority in ${payload.data.assignedPlatform}.`
          ),
        ]);
      }, 250);
    }
  }

  async function runConversation(message: string, scenario: DemoScenario | null = activeScenario) {
    const trimmed = message.trim();
    if (!trimmed || typing) return;

    setMessages((current) => [...current, createMessage('user', trimmed, 'read')]);
    setDraft('');
    setTyping(true);

    try {
      const reply = await requestSupportReply(trimmed);
      setLastReply(reply);

      queueTimeout(() => {
        setMessages((current) => [...current, createMessage('assistant', reply.answer)]);
        setTyping(false);
      }, 900);

      queueTimeout(() => {
        setMessages((current) => [
          ...current,
          createMessage(
            'system',
            `Routing outcome: ${reply.intent.replace(/_/g, ' ')} via ${reply.suggestedChannel}.`
          ),
        ]);
      }, 1250);

      await maybeCreateTicket(reply, scenario, trimmed);
    } catch (error: any) {
      setTyping(false);
      setMessages((current) => [
        ...current,
        createMessage(
          'assistant',
          error?.message || 'The demo support assistant is temporarily unavailable.'
        ),
      ]);
    }
  }

  async function loadScenario(scenario: DemoScenario) {
    setLoadingScenario(scenario.id);
    setActiveScenario(scenario);
    resetConversation(scenario);
    try {
      await runConversation(scenario.userMessage, scenario);
    } finally {
      setLoadingScenario(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runConversation(draft);
  }

  return (
    <div className="rounded-[32px] border border-emerald-200 bg-white p-6 shadow-[0_24px_80px_-50px_rgba(5,150,105,0.4)] lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
            Task 02
          </p>
          <h2 className="mt-3 font-headline text-3xl font-bold text-slate-950">
            WhatsApp Experience Demo
          </h2>
          <p className="mt-4 font-body text-base leading-8 text-slate-600">
            This is a sponsor demo of how eVoucher support can behave inside a WhatsApp-style
            conversation: merchant shopping help, wallet support, voucher redemption, escalation,
            and helpdesk case creation.
          </p>
        </div>
        <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-emerald-900">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Honest Framing
          </p>
          <p className="mt-2 font-body text-sm leading-6">
            Browser simulation only. No live Meta transport is required for the demo.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[30px] border border-slate-200 bg-[#e5ddd5] p-4 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.65)]">
          <div className="mx-auto max-w-[420px] overflow-hidden rounded-[34px] border-[10px] border-slate-950 bg-[#111b21] shadow-2xl">
            <div className="bg-[#075e54] px-4 py-3 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                    <Icon
                      name="ChatBubbleLeftRightIcon"
                      size={22}
                      variant="solid"
                      className="text-emerald-100"
                    />
                  </div>
                  <div>
                    <p className="font-headline text-lg font-semibold">eVoucher Support</p>
                    <p className="font-body text-xs text-emerald-100">Demo line online now</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-emerald-50/90">
                  <Icon name="VideoCameraIcon" size={18} variant="solid" />
                  <Icon name="PhoneIcon" size={18} variant="solid" />
                  <Icon name="EllipsisVerticalIcon" size={18} variant="solid" />
                </div>
              </div>
            </div>

            <div className="h-[560px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_24%),linear-gradient(180deg,#efeae2_0%,#e8dfd4_100%)] px-3 py-4">
              <div className="h-full overflow-y-auto rounded-[24px] bg-[rgba(255,255,255,0.18)] p-3">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={message.from === 'system' ? 'text-center' : ''}
                    >
                      {message.from === 'system' ? (
                        <div className="mx-auto max-w-[88%] rounded-2xl bg-[#d9fdd3] px-4 py-2 text-left shadow-sm">
                          <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                            Demo Event
                          </p>
                          <p className="mt-1 font-body text-sm leading-6 text-slate-700">
                            {message.text}
                          </p>
                        </div>
                      ) : (
                        <div
                          className={`max-w-[86%] rounded-[20px] px-4 py-3 shadow-sm ${
                            message.from === 'user'
                              ? 'ml-auto bg-[#dcf8c6]'
                              : 'bg-white text-slate-800'
                          }`}
                        >
                          <p className="font-body text-sm leading-6">{message.text}</p>
                          <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-slate-500">
                            <span>{message.time}</span>
                            {message.from === 'user' && message.delivery && (
                              <Icon
                                name={deliveryIcon(message.delivery)}
                                size={14}
                                variant="solid"
                                className={
                                  message.delivery === 'read' ? 'text-sky-500' : 'text-slate-400'
                                }
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {typing && (
                    <div className="max-w-[50%] rounded-[20px] bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-300" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#f0f2f5] px-3 py-3">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200"
                  aria-label="Attach file"
                >
                  <Icon name="PaperClipIcon" size={20} variant="solid" />
                </button>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type a demo support message"
                  className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 font-body text-sm text-slate-900 outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={typing}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send message"
                >
                  <Icon name="PaperAirplaneIcon" size={18} variant="solid" className="-rotate-12" />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Demo Journeys
                </p>
                <p className="mt-2 font-body text-sm leading-6 text-slate-700">
                  Load a sponsor-friendly scenario to show the flow from first message to support
                  outcome.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveScenario(null);
                  resetConversation();
                }}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 font-body text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                Reset demo
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  disabled={typing}
                  onClick={() => void loadScenario(scenario)}
                  className={`rounded-full px-4 py-2 font-body text-xs font-semibold transition ${
                    activeScenario?.id === scenario.id
                      ? 'bg-emerald-700 text-white'
                      : 'border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-100'
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {loadingScenario === scenario.id ? 'Loading...' : scenario.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              WhatsApp-Like Features Simulated
            </p>
            <ul className="mt-4 space-y-3 font-body text-sm text-slate-700">
              <li className="flex gap-3">
                <Icon
                  name="CheckCircleIcon"
                  size={18}
                  variant="solid"
                  className="mt-0.5 text-emerald-600"
                />
                <span>
                  Message bubbles, timestamps, and delivery states for outbound user messages.
                </span>
              </li>
              <li className="flex gap-3">
                <Icon
                  name="CheckCircleIcon"
                  size={18}
                  variant="solid"
                  className="mt-0.5 text-emerald-600"
                />
                <span>
                  Typing indicator and support-routing replies based on the existing eVoucher
                  assistant logic.
                </span>
              </li>
              <li className="flex gap-3">
                <Icon
                  name="CheckCircleIcon"
                  size={18}
                  variant="solid"
                  className="mt-0.5 text-emerald-600"
                />
                <span>
                  Journeys for merchant shopping, wallet top-up, voucher redemption, billing, and
                  assisted cash withdrawal support.
                </span>
              </li>
              <li className="flex gap-3">
                <Icon
                  name="CheckCircleIcon"
                  size={18}
                  variant="solid"
                  className="mt-0.5 text-emerald-600"
                />
                <span>
                  Escalation events that create a ticket in the demo support backend when the case
                  is urgent.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Latest Routing
            </p>
            {lastReply ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-headline text-lg font-semibold text-slate-900">
                    {lastReply.intent.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-1 font-body text-sm text-slate-600">
                    Preferred downstream channel: {lastReply.suggestedChannel}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lastReply.suggestedActions.map((action) => (
                    <span
                      key={action}
                      className="rounded-full bg-slate-100 px-3 py-1.5 font-body text-xs font-medium text-slate-700"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 font-body text-sm text-slate-600">
                Start a scenario to preview routing and conversational outcomes.
              </p>
            )}
          </div>

          <div className="rounded-[28px] border border-violet-200 bg-violet-50 p-5">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">
              Escalation Snapshot
            </p>
            {ticket ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="font-headline text-lg font-semibold text-slate-900">
                    {ticket.ticketId}
                  </p>
                  <p className="mt-1 font-body text-sm text-slate-600">
                    {ticket.category} queue, {ticket.priority} priority, {ticket.assignedPlatform}{' '}
                    handoff
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Queue
                    </p>
                    <p className="mt-1 font-body text-sm text-slate-800">{ticket.queue}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      SLA
                    </p>
                    <p className="mt-1 font-body text-sm text-slate-800">
                      {ticket.slaHours} hour(s)
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-violet-100 bg-white p-4 font-body text-sm text-slate-700">
                  {ticket.autoReplyMessage}
                </div>
              </div>
            ) : (
              <p className="mt-4 font-body text-sm text-slate-600">
                Billing and outage-style scenarios will create a demo support case here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
