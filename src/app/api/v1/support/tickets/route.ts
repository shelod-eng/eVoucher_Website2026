import { NextResponse } from 'next/server';
import { buildSupportTicketDecision } from '@/server/services/support/support-routing';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function tryForwardToPlatform(url: string | undefined, payload: unknown) {
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
    const name = String(body?.name ?? '').trim();
    const email = String(body?.email ?? '').trim();
    const subject = String(body?.subject ?? '').trim();
    const description = String(body?.description ?? '').trim();

    if (!name || !email || !subject || !description) {
      return NextResponse.json(
        { error: 'Name, email, subject, and description are required.' },
        { status: 400 }
      );
    }

    const decision = buildSupportTicketDecision(body);

    const integrationPayload = {
      ...decision,
      requester: {
        name,
        email,
        requesterType: body?.requesterType ?? 'consumer',
        preferredChannel: body?.preferredChannel ?? 'web',
      },
      issue: {
        subject,
        description,
      },
    };

    const jira = await tryForwardToPlatform(process.env.SUPPORT_JIRA_WEBHOOK_URL, integrationPayload);
    const serviceNow = await tryForwardToPlatform(
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
      { error: error?.message || 'Failed to log support ticket.' },
      { status: 500 }
    );
  }
}
