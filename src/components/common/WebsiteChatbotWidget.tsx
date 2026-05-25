'use client';

import { FormEvent, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

type ChatbotMessage = {
  id: string;
  from: 'assistant' | 'user';
  text: string;
};

type ChatbotReply = {
  intent: string;
  answer: string;
  suggestedActions: string[];
  actionIds: string[];
  suggestedChannel: string;
  escalationRecommended: boolean;
};

const quickPrompts = [
  'How do I shop with merchants?',
  'How do I top up my wallet?',
  'How do I contact support?',
];

const hiddenPrefixes = ['/portal', '/merchant', '/api'];

function buildAssistantMessage(text: string): ChatbotMessage {
  return {
    id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    from: 'assistant',
    text,
  };
}

function buildUserMessage(text: string): ChatbotMessage {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    from: 'user',
    text,
  };
}

export default function WebsiteChatbotWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestReply, setLatestReply] = useState<ChatbotReply | null>(null);
  const [messages, setMessages] = useState<ChatbotMessage[]>([
    buildAssistantMessage(
      'Hi, I am the eVoucher assistant. I can help you shop with merchants, top up your wallet, redeem vouchers, find support, and guide you to the right next step.'
    ),
  ]);

  const shouldHide = useMemo(() => {
    const current = String(pathname ?? '');
    return hiddenPrefixes.some((prefix) => current.startsWith(prefix));
  }, [pathname]);

  if (shouldHide) return null;

  async function handleAction(actionId: string) {
    if (actionId === 'open_shop') return router.push('/shop');
    if (actionId === 'open_wallet') return router.push('/wallet');
    if (actionId === 'open_redeem') return router.push('/redeem');
    if (actionId === 'open_merchants') return router.push('/merchants');
    if (actionId === 'open_support' || actionId === 'log_ticket') return router.push('/support');
    if (actionId === 'open_ussd') return router.push('/ussd-console');
    if (actionId === 'view_benefits') return router.push('/benefits');
    if (actionId === 'email_support') {
      if (typeof window !== 'undefined') {
        window.location.href = 'mailto:support@evoucher.co.za';
      }
      return;
    }
    if (actionId === 'launch_whatsapp') {
      try {
        const response = await fetch('/api/v1/support/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message:
              latestReply?.intent === 'merchant_onboarding'
                ? 'merchant onboarding'
                : latestReply?.intent === 'cash_withdrawal_support'
                  ? 'cash withdrawal support'
                  : 'whatsapp support',
          }),
        });
        const payload = await response.json();
        const url = String(payload?.data?.launchUrl ?? '').trim();
        if (url && typeof window !== 'undefined') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = 'https://wa.me/27712345678';
        }
      }
    }
  }

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    setMessages((current) => [...current, buildUserMessage(trimmed)]);
    setDraft('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Chatbot is unavailable right now.');

      const data = payload.data as ChatbotReply;
      setLatestReply(data);
      setMessages((current) => [...current, buildAssistantMessage(data.answer)]);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        buildAssistantMessage(
          error?.message || 'I could not answer that right now. Please try again in a moment.'
        ),
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
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden rounded-[28px] border border-sky-200 bg-white shadow-[0_30px_90px_-35px_rgba(14,116,144,0.48)]">
          <div className="bg-[linear-gradient(135deg,#0f766e,#0f172a)] px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-100/80">
                  eVoucher Assistant
                </p>
                <h3 className="mt-2 font-headline text-xl font-bold">Need help right now?</h3>
                <p className="mt-1 font-body text-sm text-sky-50/80">
                  Ask about shopping, wallet support, redeeming, or getting support.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-white/15 p-2 text-white/90 transition hover:bg-white/10"
                aria-label="Close chatbot"
              >
                <Icon name="XMarkIcon" size={18} variant="outline" />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4">
            <div className="h-[320px] space-y-3 overflow-y-auto rounded-2xl bg-white p-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[88%] rounded-2xl px-4 py-3 font-body text-sm leading-6 ${
                    message.from === 'assistant'
                      ? 'bg-slate-100 text-slate-800'
                      : 'ml-auto bg-sky-600 text-white'
                  }`}
                >
                  {message.text}
                </div>
              ))}
              {loading && (
                <div className="max-w-[88%] rounded-2xl bg-slate-100 px-4 py-3 font-body text-sm text-slate-600">
                  Working on that...
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 font-body text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {latestReply?.escalationRecommended && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Escalation available
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => router.push('/support')}
                    className="rounded-full bg-amber-500 px-3 py-2 font-body text-xs font-semibold text-white transition hover:bg-amber-600"
                  >
                    Open support page
                  </button>
                  <a
                    href="mailto:support@evoucher.co.za"
                    className="rounded-full border border-amber-300 px-3 py-2 font-body text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    Email support
                  </a>
                </div>
              </div>
            )}

            {latestReply?.suggestedActions?.length ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Suggested next steps
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {latestReply.suggestedActions.map((action, index) => (
                    <button
                      key={`${action}-${index}`}
                      type="button"
                      onClick={() => void handleAction(latestReply.actionIds?.[index] ?? '')}
                      className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 font-body text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about shopping, wallet support, redemption..."
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-body text-sm text-slate-900 outline-none focus:border-sky-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-sky-600 px-4 py-3 font-headline text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group flex items-center gap-3 rounded-full bg-[linear-gradient(135deg,#0f766e,#0284c7)] px-5 py-4 text-white shadow-[0_24px_70px_-30px_rgba(2,132,199,0.72)] transition hover:scale-[1.02]"
        aria-label="Open eVoucher chatbot"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12">
          <Icon name="ChatBubbleBottomCenterTextIcon" size={24} variant="solid" className="text-white" />
        </div>
        <div className="text-left">
          <p className="font-headline text-sm font-semibold">Chat with eVoucher</p>
          <p className="font-body text-xs text-sky-100/80">Purchase, redeem, support</p>
        </div>
      </button>
    </div>
  );
}
