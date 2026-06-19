import { NextResponse } from 'next/server';
import { handleUssdRequest } from '@/server/services/ussd/ussd-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'USSD simulator endpoint is ready.',
    usage: {
      method: 'POST',
      path: '/api/v1/ussd/simulator',
      body: {
        sessionId: 'sim-001',
        msisdn: '+27710000000',
        text: '1',
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await handleUssdRequest({
      sessionId: String(body?.sessionId ?? 'sim-session'),
      msisdn: String(body?.msisdn ?? '+27710000000'),
      text: String(body?.text ?? ''),
      provider: 'simulator',
    });
    return NextResponse.json(
      { success: true, ...result },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'USSD simulation failed.' },
      { status: 400 }
    );
  }
}
