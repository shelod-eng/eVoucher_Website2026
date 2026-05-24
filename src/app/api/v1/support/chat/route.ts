import { NextResponse } from 'next/server';
import { buildChatbotReply } from '@/server/services/support/support-routing';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = String(body?.message ?? '').trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const reply = buildChatbotReply(message);
    return NextResponse.json({
      success: true,
      data: reply,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process chatbot message.' },
      { status: 500 }
    );
  }
}
