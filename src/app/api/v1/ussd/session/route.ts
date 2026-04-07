import { NextResponse } from 'next/server';
import { handleUssdRequest } from '@/server/services/ussd/ussd-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await handleUssdRequest({
      sessionId: String(body?.sessionId ?? body?.session_id ?? '').trim(),
      msisdn: String(body?.msisdn ?? body?.phoneNumber ?? '').trim(),
      text: String(body?.text ?? '').trim(),
      networkCode: String(body?.networkCode ?? body?.network_code ?? '').trim() || undefined,
      serviceCode: String(body?.serviceCode ?? body?.service_code ?? '').trim() || undefined,
      provider: String(body?.provider ?? 'simulator').trim(),
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'USSD session request failed.' },
      { status: 400 }
    );
  }
}

