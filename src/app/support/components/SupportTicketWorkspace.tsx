'use client';

import { FormEvent, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

type TicketResponse = {
  ticketId: string;
  category: string;
  priority: string;
  queue: string;
  assignedPlatform: string;
  workflow: string[];
  slaHours: number;
  slaDueAt: string;
  routingAddress: string;
  escalationRequired: boolean;
  autoReplyMessage: string;
  integrations: {
    jira?: { forwarded: boolean; status?: number };
    serviceNow?: { forwarded: boolean; status?: number };
  };
};

type EmailRoutingResponse = {
  routing: {
    mailbox: string;
    aliases: string[];
    category: string;
    priority: string;
    queue: string;
    routingAddress: string;
    autoReplySubject: string;
    autoReplyMessage: string;
    slaHours: number;
    assignedPlatform: string;
  };
};

const initialForm = {
  name: '',
  email: '',
  requesterType: 'consumer',
  preferredChannel: 'email',
  subject: '',
  description: '',
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : value;
}

export default function SupportTicketWorkspace() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TicketResponse | null>(null);
  const [routingPreview, setRoutingPreview] = useState<EmailRoutingResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Unable to log support ticket.');

      setResult(payload.data as TicketResponse);

      const previewResponse = await fetch('/api/v1/support/email-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromName: form.name,
          fromEmail: form.email,
          subject: form.subject,
          text: form.description,
          requesterType: form.requesterType,
        }),
      });
      const previewPayload = await previewResponse.json();
      if (previewResponse.ok) {
        setRoutingPreview(previewPayload.data as EmailRoutingResponse);
      }
      setForm(initialForm);
    } catch (submitError: any) {
      setError(submitError?.message || 'Unable to log support ticket.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(109,40,217,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-violet-700">
              Tasks 03 & 04
            </p>
            <h3 className="font-headline text-2xl font-bold text-slate-900">
              Helpdesk Routing and Ticket Logging
            </h3>
            <p className="mt-2 font-body text-sm text-slate-600">
              Intake form for support queries with category routing, SLA timing, and handoff hooks
              for Jira or ServiceNow.
            </p>
          </div>
          <div className="rounded-full bg-violet-600 px-4 py-2 font-body text-sm font-semibold text-white">
            Ops Ready
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-body text-sm font-semibold text-slate-700">
                Name
              </span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-body text-sm text-slate-900 outline-none focus:border-violet-400"
                placeholder="Lebo Mpeta"
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-body text-sm font-semibold text-slate-700">
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-body text-sm text-slate-900 outline-none focus:border-violet-400"
                placeholder="support.user@evoucher.co.za"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-body text-sm font-semibold text-slate-700">
                Requester type
              </span>
              <select
                value={form.requesterType}
                onChange={(event) =>
                  setForm((current) => ({ ...current, requesterType: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-body text-sm text-slate-900 outline-none focus:border-violet-400"
              >
                <option value="consumer">Consumer</option>
                <option value="merchant">Merchant</option>
                <option value="technical">Technical / Platform</option>
                <option value="billing">Billing / Finance</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-body text-sm font-semibold text-slate-700">
                Preferred channel
              </span>
              <select
                value={form.preferredChannel}
                onChange={(event) =>
                  setForm((current) => ({ ...current, preferredChannel: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-body text-sm text-slate-900 outline-none focus:border-violet-400"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="chatbot">Chatbot</option>
                <option value="web">Website form</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block font-body text-sm font-semibold text-slate-700">
              Subject
            </span>
            <input
              value={form.subject}
              onChange={(event) =>
                setForm((current) => ({ ...current, subject: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-body text-sm text-slate-900 outline-none focus:border-violet-400"
              placeholder="Voucher payment failed during checkout"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-body text-sm font-semibold text-slate-700">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={6}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-body text-sm text-slate-900 outline-none focus:border-violet-400"
              placeholder="Describe the issue, affected journey, urgency, and any order or voucher reference."
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-body text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-6 py-3 font-headline text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Routing ticket...' : 'Log support ticket'}
          </button>
        </form>
      </div>

      <div className="space-y-5">
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            Helpdesk Email Routing
          </p>
          <ul className="mt-4 space-y-3 font-body text-sm text-slate-700">
            <li className="flex gap-3">
              <Icon
                name="EnvelopeIcon"
                size={18}
                variant="solid"
                className="mt-0.5 text-amber-600"
              />
              <span>`support@evoucher.co.za` routes into categorized queues automatically.</span>
            </li>
            <li className="flex gap-3">
              <Icon
                name="QueueListIcon"
                size={18}
                variant="solid"
                className="mt-0.5 text-amber-600"
              />
              <span>Categories supported: merchant, consumer, technical, and billing.</span>
            </li>
            <li className="flex gap-3">
              <Icon name="ClockIcon" size={18} variant="solid" className="mt-0.5 text-amber-600" />
              <span>
                SLA timer starts immediately on intake with priority-aware response windows.
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-[28px] border border-violet-200 bg-violet-50 p-5">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">
            Jira / ServiceNow Flow
          </p>
          {result ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-white p-4">
                <p className="font-headline text-lg font-semibold text-slate-900">
                  {result.ticketId}
                </p>
                <p className="mt-1 font-body text-sm text-slate-600">
                  {result.category} routed to {result.queue} via {result.assignedPlatform}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Priority
                  </p>
                  <p className="mt-1 font-headline text-lg font-semibold text-slate-900">
                    {result.priority}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    SLA Due
                  </p>
                  <p className="mt-1 font-headline text-lg font-semibold text-slate-900">
                    {formatDate(result.slaDueAt)}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Workflow
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.workflow.map((step) => (
                    <span
                      key={step}
                      className="rounded-full bg-violet-100 px-3 py-1.5 font-body text-xs font-semibold text-violet-800"
                    >
                      {step}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-white p-4">
                <p className="font-body text-sm text-slate-700">{result.autoReplyMessage}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 font-body text-sm text-slate-600">
              Submit a ticket to preview the routing queue, response SLA, and ITSM platform handoff.
            </p>
          )}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Email Routing Preview
          </p>
          {routingPreview ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-headline text-lg font-semibold text-slate-900">
                  {routingPreview.routing.routingAddress}
                </p>
                <p className="mt-1 font-body text-sm text-slate-600">
                  {routingPreview.routing.category} routed to {routingPreview.routing.queue} with{' '}
                  {routingPreview.routing.slaHours}h SLA
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {routingPreview.routing.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="rounded-full bg-slate-100 px-3 py-1.5 font-body text-xs font-medium text-slate-700"
                  >
                    {alias}
                  </span>
                ))}
              </div>
              <p className="font-body text-sm text-slate-700">
                Auto-reply: {routingPreview.routing.autoReplySubject}
              </p>
            </div>
          ) : (
            <p className="mt-4 font-body text-sm text-slate-600">
              Submit a ticket to preview the helpdesk email routing outcome.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
