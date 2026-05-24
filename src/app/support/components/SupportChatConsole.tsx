'use client';

import { FormEvent, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

type ChatMessage = {
  id: string;
  from: 'assistant' | 'user';
  text: string;
};

type ChatReply = {
  intent: string;
  answer: string;
  suggestedActions: string[];
  suggestedChannel: string;
  escalationRecommended: boolean;
};

const quickPrompts = [
  'How do I buy a voucher?',
  'How do I redeem a voucher?',
  'How does WhatsApp support work?',
  'I have a billing problem.',
];

export default function SupportChatConsole() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-welcome',
      from: 'assistant',
      text: 'Hi, I am the eVoucher support assistant. I can help with voucher purchase, redemption, merchant onboarding, billing, USSD, and WhatsApp support.',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestReply, setLatestReply] = useState<ChatReply | null>(null);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      from: 'user',
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Support assistant is unavailable.');

      const data = payload.data as ChatReply;
      setLatestReply(data);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          from: 'assistant',
          text: data.answer,
        },
      ]);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          from: 'assistant',
          text: error?.message || 'Support assistant is temporarily unavailable.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  return (
    <div className="rounded-[28px] border border-sky-200 bg-white/95 shadow-[0_24px_80px_-40px_rgba(14,116,144,0.45)]">
      <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
              Task 01
            </p>
            <h3 className="font-headline text-2xl font-bold text-slate-900">
              Website Chatbot Integration
            </h3>
            <p className="mt-1 max-w-2xl font-body text-sm text-slate-600">
              Lightweight guided support for voucher purchase, redemption, support triage, and
              escalation to a human agent when needed.
            </p>
          </div>
          <div className="rounded-full bg-sky-600 px-4 py-2 font-body text-sm font-semibold text-white">
            Live Sprint Slice
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-4 text-white">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20">
              <Icon name="CpuChipIcon" size={24} variant="solid" className="text-sky-300" />
            </div>
            <div>
              <p className="font-headline text-lg font-semibold">eVoucher Assistant</p>
              <p className="font-body text-sm text-slate-400">Support and shopping guidance</p>
            </div>
          </div>

          <div className="h-[340px] space-y-3 overflow-y-auto rounded-2xl bg-slate-900/80 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-2xl px-4 py-3 font-body text-sm leading-6 ${
                  message.from === 'assistant'
                    ? 'bg-slate-800 text-slate-100'
                    : 'ml-auto bg-sky-500 text-white'
                }`}
              >
                {message.text}
              </div>
            ))}
            {loading && (
              <div className="max-w-[88%] rounded-2xl bg-slate-800 px-4 py-3 font-body text-sm text-slate-300">
                Thinking through your support path...
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-2 font-body text-xs font-semibold text-sky-100 transition hover:bg-sky-400/20"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about buying, redeeming, merchant onboarding, billing..."
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 font-body text-sm text-white outline-none ring-0 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 font-headline text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Conversation Coverage
            </p>
            <ul className="mt-4 space-y-3 font-body text-sm text-slate-700">
              <li className="flex gap-3">
                <Icon name="CheckCircleIcon" size={18} variant="solid" className="mt-0.5 text-sky-600" />
                <span>Voucher purchase guidance for first-time checkout journeys.</span>
              </li>
              <li className="flex gap-3">
                <Icon name="CheckCircleIcon" size={18} variant="solid" className="mt-0.5 text-sky-600" />
                <span>Voucher redemption support and wallet lookup prompts.</span>
              </li>
              <li className="flex gap-3">
                <Icon name="CheckCircleIcon" size={18} variant="solid" className="mt-0.5 text-sky-600" />
                <span>Escalation cues when a billing or outage case needs a human path.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Latest Routing Decision
            </p>
            {latestReply ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-headline text-lg font-semibold text-slate-900">
                    {latestReply.intent.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-1 font-body text-sm text-slate-600">
                    Preferred channel: {latestReply.suggestedChannel}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Suggested actions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {latestReply.suggestedActions.map((action) => (
                      <span
                        key={action}
                        className="rounded-full bg-slate-100 px-3 py-1.5 font-body text-xs font-medium text-slate-700"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
                {latestReply.escalationRecommended && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="font-headline text-sm font-semibold text-amber-900">
                      Human escalation recommended
                    </p>
                    <p className="mt-1 font-body text-sm text-amber-800">
                      This journey should route into the ticket logging flow so the SLA starts
                      immediately.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 font-body text-sm text-slate-600">
                Start a conversation to preview chatbot routing and escalation behavior.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
