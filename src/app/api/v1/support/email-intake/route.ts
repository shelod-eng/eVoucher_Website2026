import { NextResponse } from 'next/server';
import {
  buildEmailRoutingPreview,
  buildSupportTicketDecision,
} from '@/server/services/support/support-routing';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function tryForward(url: string | undefined, payload: unknown) {
  const target = String(url ?? '').trim();
  if (!target) return { forwarded: false };

  const response = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return {
    forwarded: response.ok,
    status: response.status,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const fromEmail = String(body?.fromEmail ?? body?.email ?? '').trim();
    const fromName = String(body?.fromName ?? body?.name ?? '').trim();
    const subject = String(body?.subject ?? '').trim();
    const description = String(body?.text ?? body?.description ?? '').trim();

    if (!fromEmail || !subject || !description) {
      return NextResponse.json(
        { error: 'fromEmail, subject, and text are required.' },
        { status: 400 }
      );
    }

    const routing = buildEmailRoutingPreview({
      name: fromName,
      email: fromEmail,
      subject,
      description,
      requesterType: body?.requesterType,
      preferredChannel: 'email',
      category: body?.category,
    });

    const decision = buildSupportTicketDecision({
      name: fromName,
      email: fromEmail,
      subject,
      description,
      requesterType: body?.requesterType,
      preferredChannel: 'email',
      category: body?.category,
    });

    const integrationPayload = {
      source: 'support_email',
      routing,
      decision,
      requester: {
        name: fromName || null,
        email: fromEmail,
      },
      issue: {
        subject,
        description,
      },
    };

    const jira = await tryForward(process.env.SUPPORT_JIRA_WEBHOOK_URL, integrationPayload);
    const serviceNow = await tryForward(
      process.env.SUPPORT_SERVICENOW_WEBHOOK_URL,
      integrationPayload
    );

    return NextResponse.json({
      success: true,
      data: {
        ...integrationPayload,
        integrations: {
          jira,
          serviceNow,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process support email intake.' },
      { status: 500 }
    );
  }
}
