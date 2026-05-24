import { NextResponse } from 'next/server';
import { buildWhatsappLaunch } from '@/server/services/support/support-routing';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = String(body?.message ?? '').trim();
    const data = buildWhatsappLaunch(message);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to prepare WhatsApp handoff.' },
      { status: 500 }
    );
  }
}
